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
const accessToken = process.env.SUPABASE_ACCESS_TOKEN; // optional

(async () => {
  const supabase = createClient(url, anon, {
    auth: { persistSession: false },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });

  const { count: generalThreads, error } = await supabase
    .from('forum_threads')
    .select('id', { count: 'exact', head: true })
    .eq('section_id', 'general');

  console.log('token?', !!accessToken);
  console.log('general threads count:', generalThreads, 'err:', error?.message);
})();
