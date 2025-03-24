import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://dcitsfjssvlgtqfqrriq.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjaXRzZmpzc3ZsZ3RxZnFycmlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjEyMDE1MSwiZXhwIjoyMDU3Njk2MTUxfQ.PtHlriHLSyrfxdvSvprlL4S5OulQBlv-XKOJmoB659o"

export const supabase = createClient(supabaseUrl, supabaseKey)
