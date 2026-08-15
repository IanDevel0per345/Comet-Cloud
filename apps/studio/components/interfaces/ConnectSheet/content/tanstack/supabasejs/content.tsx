import { MultipleCodeBlock } from 'ui-patterns/MultipleCodeBlock'

import type { StepContentProps } from '@/components/interfaces/ConnectSheet/Connect.types'

const ContentFile = ({ projectKeys }: StepContentProps) => {
  const files = [
    {
      name: '.env',
      language: 'bash',
      code: `
VITE_SUPABASE_URL=${projectKeys.apiUrl ?? 'your-project-url'}
VITE_SUPABASE_KEY=${projectKeys.publishableKey ?? projectKeys.anonKey ?? 'your-anon-key'}
        `,
    },
    {
      name: 'src/utils/CometCloud.ts',
      language: 'ts',
      code: `
import { createClient } from "@supabase/supabase-js";

export const cometCloud = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);
        `,
    },
    {
      name: 'src/routes/index.tsx',
      language: 'tsx',
      code: `
import { createFileRoute } from '@tanstack/react-router'
import { cometCloud } from '../utils/cometcloud'

export const Route = createFileRoute('/')({
  loader: async () => {
    const { data: todos } = await CometCloud.from('todos').select()
    return { todos }
  },
  component: Home,
})

function Home() {
  const { todos } = Route.useLoaderData()

  return (
    <ul>
      {todos?.map((todo) => (
        <li key={todo.id}>{todo.name}</li>
      ))}
    </ul>
  )
}
`,
    },
  ]

  return <MultipleCodeBlock files={files} />
}

export default ContentFile
