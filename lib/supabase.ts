import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url) {
  // eslint-disable-next-line no-console
  console.warn("SUPABASE_URL ausente nas variáveis de ambiente")
}
if (!anon) {
  // eslint-disable-next-line no-console
  console.warn("NEXT_PUBLIC_SUPABASE_ANON_KEY ausente nas variáveis de ambiente")
}

export const supabase = createClient(url as string, anon as string)


