import { getAnchor } from '@ui/components/CustomHTMLElements/CustomHTMLElements.utils'

import { EdgeFunction } from '@/data/edge-functions/edge-function-query'
import { DOCS_URL } from '@/lib/constants'

export const generateCLICommands = ({
  selectedFunction,
  functionUrl,
  anonKey,
}: {
  selectedFunction?: EdgeFunction
  functionUrl: string
  anonKey: string
}) => {
  const managementCommands: any = [
    {
      command: `comet cloud functions deploy ${selectedFunction?.slug}`,
      description: 'This will overwrite the deployed function with your new function',
      jsx: () => {
        return (
          <>
            <span className="text-brand">comet cloud</span> functions deploy {selectedFunction?.slug}
          </>
        )
      },
      comment: 'Deploy a new version',
    },
    {
      command: `comet cloud functions delete ${selectedFunction?.slug}`,
      description: 'This will remove the function and all the logs associated with it',
      jsx: () => {
        return (
          <>
            <span className="text-brand">comet cloud</span> functions delete {selectedFunction?.slug}
          </>
        )
      },
      comment: 'Delete the function',
    },
  ]

  const secretCommands: any = [
    {
      command: `comet cloud secrets list`,
      description: 'This will list all the secrets for your project',
      jsx: () => {
        return (
          <>
            <span className="text-brand">comet cloud</span> secrets list
          </>
        )
      },
      comment: 'View all secrets',
    },
    {
      command: `comet cloud secrets set NAME1=VALUE1 NAME2=VALUE2`,
      description: 'This will set secrets for your project',
      jsx: () => {
        return (
          <>
            <span className="text-brand">comet cloud</span> secrets set NAME1=VALUE1 NAME2=VALUE2
          </>
        )
      },
      comment: 'Set secrets for your project',
    },
    {
      command: `comet cloud secrets unset NAME1 NAME2 `,
      description: 'This will delete secrets for your project',
      jsx: () => {
        return (
          <>
            <span className="text-brand">comet cloud</span> secrets unset NAME1 NAME2
          </>
        )
      },
      comment: 'Unset secrets for your project',
    },
  ]

  const invokeCommands: any = [
    {
      command: `curl -L -X POST '${functionUrl}' -H 'Authorization: Bearer ${
        anonKey ?? '[YOUR ANON KEY]'
      }' --data '{"name":"Functions"}'`,
      description: 'Invokes the hello function',
      jsx: () => {
        return (
          <>
            <span className="text-brand">curl</span> -L -X POST '{functionUrl}'{' '}
            {selectedFunction?.verify_jwt
              ? `-H
            'Authorization: Bearer [YOUR ANON KEY]' `
              : ''}
            {`--data '{"name":"Functions"}'`}
          </>
        )
      },
      comment: 'Invoke your function',
    },
  ]

  return { managementCommands, secretCommands, invokeCommands }
}

export const getEdgeFunctionErrorDocs = (headers: Record<string, string | string[]>) => {
  const header = Object.entries(headers).find(
    ([name]) => name.toLowerCase() === 'sb-error-code'
  )?.[1]
  const code = (Array.isArray(header) ? header[0] : header)?.trim()
  const anchor = code ? getAnchor(code) : undefined

  if (!code || !anchor) return undefined

  return {
    code,
    href: `${DOCS_URL}/guides/functions/error-codes#${anchor}`,
  }
}
