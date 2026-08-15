import { NextApiRequest, NextApiResponse } from 'next'

import { constructHeaders } from '@/lib/api/apiHelpers'
import { apiWrapper } from '@/lib/api/apiWrapper'
import { executeQuery } from '@/lib/api/self-hosted/query'
import { PgMetaDatabaseError } from '@/lib/api/self-hosted/types'

// Comet Cloud: when NEON_SERVICE_URL is set, SQL queries are executed
// directly against the platform Postgres (Neon) instead of the pg-meta
// service, which is unavailable on Vercel.
let neonModule: any = null
async function getSql() {
  if (!neonModule) {
    neonModule = await import('@neondatabase/serverless')
  }
  return neonModule.neon
}

// Comet Cloud: map Supabase GoTrue-style auth queries to Neon Auth (neon_auth schema).
// Neon Auth stores users in neon_auth."user" and identities in neon_auth.account.
function rewriteAuthQuery(q: string): string {
  // Users list / user detail queries reference auth.users and auth.identities.
  // Replace qualified refs and bare refs (search_path includes public, not auth).
  // IMPORTANT: column mappings run BEFORE the table rename so the qualified
  // prefixes (auth.users.*) still match and get replaced as whole tokens.
  let out = q
  out = out.replace(/auth\.users\.banned_until/gi, 'neon_auth."user"."banExpires"')
  out = out.replace(/auth\.users\.created_at/gi, 'neon_auth."user"."createdAt"')
  out = out.replace(/auth\.users\.updated_at/gi, 'neon_auth."user"."updatedAt"')
  out = out.replace(/auth\.users\.last_sign_in_at/gi, 'neon_auth."user"."updatedAt"')
  out = out.replace(/auth\.users\.confirmed_at/gi, 'NULL::timestamptz AS confirmed_at')
  out = out.replace(/auth\.users\.confirmation_sent_at/gi, 'NULL::timestamptz AS confirmation_sent_at')
  out = out.replace(/auth\.users\.is_anonymous/gi, 'false AS is_anonymous')
  out = out.replace(/auth\.users\.is_sso_user/gi, 'false AS is_sso_user')
  out = out.replace(/auth\.users\.invited_at/gi, 'NULL::timestamptz AS invited_at')
  out = out.replace(/auth\.users\.phone/gi, "''::varchar(15) AS phone")
  out = out.replace(/auth\.users\.raw_app_meta_data/gi, "'{\"providers\": []}'::jsonb AS raw_app_meta_data")
  out = out.replace(/auth\.users\.raw_user_meta_data/gi, "'{}'::jsonb AS raw_user_meta_data")
  out = out.replace(/raw_user_meta_data->>'full_name'/gi, 'neon_auth."user".name')
  out = out.replace(/raw_user_meta_data->>'display_name'/gi, 'neon_auth."user".name')
  out = out.replace(/raw_user_meta_data->>'first_name'/gi, 'neon_auth."user".name')
  out = out.replace(/raw_user_meta_data->>'last_name'/gi, 'neon_auth."user".name')
  out = out.replace(/auth\.users/gi, 'neon_auth."user"')
  out = out.replace(/auth\.identities/gi, 'neon_auth.account')
  // Users detail panel and list join on auth.identities i WHERE i.user_id = u.id.
  // neon_auth.account uses "userId", not user_id — fix the join column.
  out = out.replace(/i\.user_id/gi, 'i."userId"')
  // neon_auth.account columns: providerId (not provider), no identity_data.
  out = out.replace(/i\.provider/gi, 'i."providerId"')
  // getUserSQL subquery uses the bare table alias "users" (FROM auth.users without alias).
  // Must run AFTER the table rename and only match unqualified "users.".
  out = out.replace(/(?<!auth\.)(?<!neon_auth\.)\busers\.(id|email|banned_until|created_at|confirmed_at|confirmation_sent_at|is_anonymous|is_sso_user|invited_at|last_sign_in_at|phone|raw_app_meta_data|raw_user_meta_data|updated_at)\b/gi, 'neon_auth."user".$1')
  out = out.replace(/users_data\.id/gi, 'users_data.id')
  // Unqualified GoTrue column tokens (e.g. `order by created_at desc`,
  // `where email_confirmed_at is not null`). neon_auth columns are camelCase
  // and MUST stay quoted, otherwise Postgres lowercases them and errors.
  const unqCols: [RegExp, string][] = [
    [/\bcreated_at\b/gi, '"createdAt"'],
    [/\bupdated_at\b/gi, '"updatedAt"'],
    [/\blast_sign_in_at\b/gi, '"updatedAt"'],
    [/\bbanned_until\b/gi, '"banExpires"'],
    [/\bemail_confirmed_at\b/gi, '"emailConfirmed"'],
    [/\bphone_confirmed_at\b/gi, '"phoneConfirmed"'],
    [/\bconfirmation_sent_at\b/gi, '"confirmationSentAt"'],
    [/\bis_anonymous\b/gi, '"isAnonymous"'],
    [/\bis_sso_user\b/gi, '"isSsoUser"'],
    [/\binvited_at\b/gi, '"invitedAt"'],
    [/\braw_app_meta_data\b/gi, '"rawAppMetadata"'],
    [/\braw_user_meta_data\b/gi, '"rawUserMetadata"'],
  ]
  for (const [re, rep] of unqCols) {
    out = out.replace(re, rep)
  }
  // WHERE-context comparisons against the synthetic columns above would fail,
  // since neon_auth has no such columns. Translate common verified/unverified
  // filter patterns to always-match/never-match booleans.
  out = out.replace(/"emailConfirmed"\s+IS\s+NOT\s+NULL/gi, 'true')
  out = out.replace(/"phoneConfirmed"\s+IS\s+NOT\s+NULL/gi, 'true')
  out = out.replace(/"emailConfirmed"\s+IS\s+NULL/gi, 'false')
  out = out.replace(/"phoneConfirmed"\s+IS\s+NULL/gi, 'false')
  out = out.replace(/"isAnonymous"\s*(=|is)\s*true/gi, 'false')
  out = out.replace(/"emailConfirmed"\s*(=|is)\s*true/gi, 'true')
  out = out.replace(/"phoneConfirmed"\s*(=|is)\s*true/gi, 'true')
  // count_estimate & pg_class lookups reference auth.users regclass — fall back to a safe constant.
  out = out.replace(/'auth\.users'::regclass/gi, 'NULL::regclass')
  out = out.replace(/pg_temp\.count_estimate/gi, 'pg_temp.count_estimate_safe')
  // The count_estimate body EXECUTEs 'EXPLAIN ... select * from auth.users'.
  // Inside that dynamic string our column rewrites won't apply, so rewrite the
  // inner table reference too.
  out = out.replace(/select \* from auth\.users/gi, 'select * from neon_auth."user"')
  return out
}

// Comet Cloud: the users-count SQL generated by @supabase/pg-meta creates a
// pg_temp.count_estimate helper then runs an approximation query. Neon's
// serverless driver rejects multiple statements, so when we detect that exact
// shape we return a plain exact count instead.
const COUNT_SQL_SIGNATURE = /count_estimate\(/i
function isUsersCountQuery(q: string): boolean {
  return COUNT_SQL_SIGNATURE.test(q)
}
function rewriteCountQuery(q: string): string {
  // Simplest robust replacement: exact count of neon_auth users.
  return `select count(*)::int as count, false as is_estimate from neon_auth."user"`
}

// Split SQL on top-level semicolons (ignoring semicolons inside single-quoted
// strings) so multi-command queries like the users-count SQL can be executed
// sequentially against Neon.
function splitStatements(sql: string): string[] {
  const parts: string[] = []
  let buf = ''
  let inStr = false
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i]
    if (inStr) {
      buf += ch
      if (ch === "'") {
        let j = i
        while (j + 1 < sql.length && sql[j + 1] === "'") j++
        if (j !== i) {
          buf += "'".repeat(j - i)
          i = j
        } else {
          inStr = false
        }
      }
    } else {
      if (ch === "'") {
        inStr = true
        buf += ch
      } else {
        buf += ch
        if (ch === ';') {
          parts.push(buf)
          buf = ''
        }
      }
    }
  }
  if (buf.trim()) parts.push(buf)
  return parts
}

async function handleNeonQuery(req: NextApiRequest, res: NextApiResponse) {
  const url = process.env.NEON_SERVICE_URL
  if (!url) return false
  let { query } = req.body
  if (typeof query !== 'string' || !query.trim()) {
    res.status(400).json({ message: 'Missing query' })
    return true
  }
  try {
    let rewritten = false
    if (isUsersCountQuery(query)) {
      // users-count SQL (CREATE FUNCTION + approximation SELECT) — replace
      // with a plain exact count that Neon can run in one statement.
      query = rewriteCountQuery(query)
      rewritten = true
    }
    if (/auth\.(users|identities)/i.test(query) || /auth\."user"/i.test(query)) {
      query = rewriteAuthQuery(query)
      rewritten = true
    }
    // Neon serverless driver rejects multiple statements in a prepared
    // statement (e.g. the users-count SQL defines pg_temp helpers before the
    // SELECT). Split on top-level semicolons and run each part in plain-text
    // mode (params: 'disable'), returning the rows of the last statement that
    // produced rows.
    const neon = await getSql()
    const parts = splitStatements(query).filter((p) => p.trim())
    const sql = neon(url, { fullResults: true, params: 'disable' })
    let finalRows: any[] = []
    for (const part of parts) {
      const result = await sql.query(part, [])
      if (result.rows && result.rows.length > 0) finalRows = result.rows
    }
    res.status(200).json(finalRows)
    return true
  } catch (e: any) {
    const message = e?.message ?? 'Query failed'
    const code = e?.code ?? '500'
    res.status(code === '500' ? 500 : 400).json({ message, formattedError: message })
    return true
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).json({ error: { message: `Method ${method} Not Allowed` } })
  }
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  // Comet Cloud Neon path: execute SQL directly on the platform Postgres.
  if ((await handleNeonQuery(req, res)) === true) return

  const { query } = req.body
  const headers = constructHeaders(req.headers)
  const { data, error } = await executeQuery({ query, headers })

  if (error) {
    if (error instanceof PgMetaDatabaseError) {
      const { statusCode, message, formattedError } = error
      return res.status(statusCode).json({ message, formattedError })
    }
    const { message } = error
    return res.status(500).json({ message, formattedError: message })
  } else {
    return res.status(200).json(data)
  }
}
