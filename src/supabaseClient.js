import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wxvfftbjskmrppvsaloq.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4dmZmdGJqc2ttcnBwdnNhbG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2Njg5NDIsImV4cCI6MjA5MTI0NDk0Mn0.EQ1_bINfVt-fqnF-FJOVJ8_wf0J6JO6iGH-oKcUGv6o'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
