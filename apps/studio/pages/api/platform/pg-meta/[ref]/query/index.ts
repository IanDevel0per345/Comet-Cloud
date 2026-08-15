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
  // count_estimate & pg_class lookups reference auth.users regclass — fall back to a safe constant.
  out = out.replace(/'auth\.users'::regclass/gi, 'NULL::regclass')
  out = out.replace(/pg_temp\.count_estimate/gi, 'pg_temp.count_estimate_safe')
  return out
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
    if (/auth\.(users|identities)/i.test(query) || /auth\."user"/i.test(query)) {
      query = rewriteAuthQuery(query)
      rewritten = true
    }
    const neon = await getSql()
    const sql = neon(url, { fullResults: true })
    const result = await sql.query(query, [])
    // Users-list shape: the UI expects { result: User[] } for some callers.
    // execute-sql-mutation returns result.data directly (array). Paginated callers
    // wrap via data.auth.users list — keep array shape, consistent with the rest.
    res.status(200).json(result.rows ?? [])
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
