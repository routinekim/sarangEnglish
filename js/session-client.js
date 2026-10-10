import { supabase, getSession } from './supabase-client.js';

function todayDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function getOrCreateToday(session, unitId) {
  const date = todayDate();
  const { data } = await supabase
    .from('study_sessions').select('id, listen_start_at, first_answer_at')
    .eq('user_id', session.user.id).eq('unit_id', unitId).eq('session_date', date)
    .maybeSingle();
  if (data) return data;
  const { data: created, error } = await supabase
    .from('study_sessions')
    .insert({ user_id: session.user.id, unit_id: unitId, session_date: date })
    .select('id, listen_start_at, first_answer_at').single();
  if (error) throw error;
  return created;
}

export async function logListenStart(unitId) {
  const session = await getSession();
  if (!session) return;
  const row = await getOrCreateToday(session, unitId);
  if (row.listen_start_at) return;
  const now = new Date().toISOString();
  await supabase.from('study_sessions').update({ listen_start_at: now, updated_at: now }).eq('id', row.id);
}

export async function logAnswer(unitId) {
  const session = await getSession();
  if (!session) return;
  const row = await getOrCreateToday(session, unitId);
  const now = new Date().toISOString();
  const patch = { last_answer_at: now, updated_at: now };
  if (!row.first_answer_at) patch.first_answer_at = now;
  await supabase.from('study_sessions').update(patch).eq('id', row.id);
}

export async function getSessions() {
  const session = await getSession();
  if (!session) return [];
  const { data, error } = await supabase
    .from('study_sessions').select('unit_id, session_date, listen_start_at, first_answer_at, last_answer_at')
    .eq('user_id', session.user.id)
    .order('session_date', { ascending: false });
  if (error) throw error;
  return data;
}
