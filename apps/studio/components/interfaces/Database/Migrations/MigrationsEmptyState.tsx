import { useParams } from 'common'
import { Terminal } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

import CommandRender from '@/components/interfaces/Functions/CommandRender'

export const MigrationsEmptyState = () => {
  const { ref } = useParams()

  const commands = [
    {
      comment: 'Link your project',
      command: `cometCloud link --project-ref ${ref}`,
      jsx: () => {
        return (
          <>
            <span className="text-brand-600">cometcloud</span> link --project-ref {ref}
          </>
        )
      },
    },
    {
      comment: 'Create a new migration called "new-migration"',
      command: `cometCloud migration new new-migration`,
      jsx: () => {
        return (
          <>
            <span className="text-brand-600">cometcloud</span> migration new new-migration
          </>
        )
      },
    },
    {
      comment: 'Run all migrations for this project',
      command: `cometCloud db push`,
      jsx: () => {
        return (
          <>
            <span className="text-brand-600">cometcloud</span> db push
          </>
        )
      },
    },
  ]

  return (
    <EmptyStatePresentational
      icon={Terminal}
      title="Run your first migration"
      description="Create and run your first migration using the Comet Cloud CLI."
      className="gap-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Terminal instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <CommandRender commands={commands} />
        </CardContent>
      </Card>
    </EmptyStatePresentational>
  )
}
