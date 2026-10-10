import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://lfanccksfgatugddhznu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_I4SYRuARRGnUw33nOXQ9mQ_7YdTnRkp';
const EMAIL_DOMAIN = '@sarangenglish.local';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function login(id, password) {
  const trimmed = id.trim().toLowerCase();
  const email = trimmed.includes('@') ? trimmed : trimmed + EMAIL_DOMAIN;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function logout() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function loadUnitContent(unitId) {
  const { data, error } = await supabase.from('units').select('content').eq('id', unitId).single();
  if (error) throw error;
  return data.content;
}

export async function loadProgress(unitId) {
  const session = await getSession();
  if (!session) return null;
  const { data, error } = await supabase
    .from('progress').select('data')
    .eq('unit_id', unitId).eq('user_id', session.user.id)
    .maybeSingle();
  if (error) throw error;
  return data ? data.data : null;
}

export async function saveProgress(unitId, payload) {
  const session = await getSession();
  if (!session) return;
  const { error } = await supabase.from('progress').upsert({
    user_id: session.user.id,
    unit_id: unitId,
    data: payload,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,unit_id' });
  if (error) console.error('saveProgress failed', error);
}

export async function clearProgress(unitId) {
  const session = await getSession();
  if (!session) return;
  await supabase.from('progress').delete().eq('unit_id', unitId).eq('user_id', session.user.id);
}

export async function addInterest(text) {
  const session = await getSession();
  if (!session) return;
  const { error } = await supabase.from('interests').insert({ user_id: session.user.id, text });
  if (error) throw error;
}

export async function loadInterests() {
  const session = await getSession();
  if (!session) return [];
  const { data, error } = await supabase
    .from('interests').select('id, text, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function deleteInterest(id) {
  const session = await getSession();
  if (!session) return;
  await supabase.from('interests').delete().eq('id', id).eq('user_id', session.user.id);
}

export async function loadAllProgressSummary() {
  const session = await getSession();
  if (!session) return {};
  const { data, error } = await supabase.from('progress').select('unit_id, data').eq('user_id', session.user.id);
  if (error) { console.error(error); return {}; }
  const out = {};
  data.forEach(row => { out[row.unit_id] = row.data; });
  return out;
}
