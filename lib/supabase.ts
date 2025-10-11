import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://amfarsmjfmvnpbyseljy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtZmFyc21qZm12bnBieXNlbGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzcyNzEsImV4cCI6MjA3NTcxMzI3MX0.8mdOVR5rNrig4AlEoltMnKPKXsFbamU3qCbMBLWnvm0'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
