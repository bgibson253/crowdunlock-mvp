const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.vercel.prod', 'utf8');
const get = (k) => {
  const re = new RegExp(`${k}="([^"]*)"`);
  const m = env.match(re);
  return m ? m[1].replace(/\\n/g, '').trim() : '';
};

const url = get('NEXT_PUBLIC_SUPABASE_URL');
const anon = get('NEXT_PUBLIC_SUPABASE_ANON_KEY');

(async () => {
  const supabase = createClient(url, anon, { auth: { persistSession: false } });

  const { count: generalThreads, error: err1 } = await supabase
    .from('forum_threads')
    .select('id', { count: 'exact', head: true })
    .eq('section_id', 'general');

  const { data: threads, error: err2 } = await supabase
    .from('forum_threads')
    .select('id, title, created_at')
    .eq('section_id', 'general')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('general threads count:', generalThreads, 'err:', err1?.message);
  console.log('sample threads:', threads);
  if (err2) console.log('sample err:', err2.message);
})();
