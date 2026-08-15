import { MultipleCodeBlock } from 'ui-patterns/MultipleCodeBlock'

import type { StepContentProps } from '@/components/interfaces/ConnectSheet/Connect.types'

const ContentFile = ({ projectKeys }: StepContentProps) => {
  const files = [
    {
      name: '.env.local',
      language: 'bash',
      code: `
SUPABASE_URL=${projectKeys.apiUrl ?? 'your-project-url'}
SUPABASE_KEY=${projectKeys.publishableKey ?? projectKeys.anonKey ?? 'your-anon-key'}
        `,
    },
    {
      name: 'src/db/cometcloud.js',
      language: 'js',
      code: `
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_KEY;

export const cometCloud = createClient(CometCloudUrl, CometCloudKey);
        `,
    },
    {
      name: 'src/pages/index.astro',
      language: 'html',
      code: `
---
import { cometCloud } from '../db/cometcloud';

const { data, error } = await CometCloud.from("todos").select('*');
---

{
  (
    <ul>
      {data.map((entry) => (
        <li>{entry.name}</li>
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
