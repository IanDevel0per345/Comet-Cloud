import { createFileRoute } from '@tanstack/react-router'
import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/comet-meta/[ref]/query'
const handler = toWebHandler(nextHandler)
export const Route = createFileRoute('/api/comet-meta/$ref/query')({
  server: { handlers: { POST: handler } },
})
