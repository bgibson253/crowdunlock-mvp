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

  const { data: sectionsRaw, error: sectionsErr } = await supabase
    .from('forum_sections')
    .select('id,name,sort_order')
    .order('sort_order', { ascending: true });
  if (sectionsErr) throw sectionsErr;

  const { data: threads } = await supabase.from('forum_threads').select('id,section_id');
  const { data: replies } = await supabase.from('forum_replies').select('thread_id');

  const threadIdToSection = new Map();
  for (const t of threads ?? []) threadIdToSection.set(t.id, t.section_id);

  const threadsPerSection = new Map();
  for (const t of threads ?? [])
    threadsPerSection.set(t.section_id, (threadsPerSection.get(t.section_id) ?? 0) + 1);

  const repliesPerSection = new Map();
  for (const r of replies ?? []) {
    const sid = threadIdToSection.get(r.thread_id);
    if (!sid) continue;
    repliesPerSection.set(sid, (repliesPerSection.get(sid) ?? 0) + 1);
  }

  const out = (sectionsRaw ?? []).map((s) => ({
    id: s.id,
    threads: threadsPerSection.get(s.id) ?? 0,
    replies: repliesPerSection.get(s.id) ?? 0,
  }));

  console.table(out);
})();
