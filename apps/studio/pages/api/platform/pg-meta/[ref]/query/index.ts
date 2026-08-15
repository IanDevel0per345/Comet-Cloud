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

async function handleNeonQuery(req: NextApiRequest, res: NextApiResponse) {
  const url = process.env.NEON_SERVICE_URL
  if (!url) return false
  const { query } = req.body
  if (typeof query !== 'string' || !query.trim()) {
    res.status(400).json({ message: 'Missing query' })
    return true
  }
  try {
    const neon = await getSql()
    const sql = neon(url, { fullResults: true })
    const result = await sql.query(query, [])
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
