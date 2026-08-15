import { NextApiRequest, NextApiResponse } from 'next'
import { apiWrapper } from '@/lib/api/apiWrapper'

/**
 * Comet Cloud Meta API — query endpoint.
 *
 * Replaces the pg-meta `/query` endpoint on Vercel. Executes arbitrary SQL
 * against the platform Postgres database (Neon) using the service role
 * connection string provided via NEON_SERVICE_URL.
 *
 * The Studio client encrypts the connection string with AES using
 * PG_META_CRYPTO_KEY and passes it via `x-connection-encrypted`. We accept
 * that header for compatibility but ignore it (the server uses its own
 * trusted connection string).
 */
let neonModule: any = null
async function getSql() {
  if (!neonModule) {
    // Lazy-load so the module graph stays clean when the env is unset.
    neonModule = await import('@neondatabase/serverless')
  }
  return neonModule.neon
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const url = process.env.NEON_SERVICE_URL
  if (!url) {
    return res.status(503).json({ message: 'Platform database not configured' })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
  }

  const { query } = req.body ?? {}
  if (typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ message: 'Missing query' })
  }

  try {
    const neon = await getSql()
    // fullResults mirrors pg-meta's response shape: array of row objects.
    const sql = neon(url, { fullResults: true })
    const result = await sql.query(query, [])
    const rows = result.rows ?? []
    return res.status(200).json(rows)
  } catch (e: any) {
    const message = e?.message ?? 'Query failed'
    const code = e?.code ?? '500'
    return res.status(code === '500' ? 500 : 400).json({
      message,
      formattedError: message,
    })
  }
}
