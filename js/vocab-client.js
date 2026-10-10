import { supabase, getSession } from './supabase-client.js';

const INTERVAL_DAYS = [0, 1, 3, 7, 16, 35]; // box 0..5
const MAX_BOX = INTERVAL_DAYS.length - 1;

export async function addVocabWord(unitId, word, meaning) {
  const session = await getSession();
  if (!session) return;
  const { error } = await supabase.from('vocab_words').upsert({
    user_id: session.user.id,
    word,
    meaning,
    unit_id: unitId,
    box: 0,
    due_at: new Date().toISOString(),
  }, { onConflict: 'user_id,word', ignoreDuplicates: true });
  if (error) throw error;
}

export async function removeVocabWord(word) {
  const session = await getSession();
  if (!session) return;
  await supabase.from('vocab_words').delete().eq('user_id', session.user.id).eq('word', word);
}

export async function getSavedWordSet() {
  const session = await getSession();
  if (!session) return new Set();
  const { data, error } = await supabase.from('vocab_words').select('word').eq('user_id', session.user.id);
  if (error) throw error;
  return new Set(data.map(r => r.word));
}

export async function getAllWords() {
  const session = await getSession();
  if (!session) return [];
  const { data, error } = await supabase
    .from('vocab_words').select('id, word, meaning, unit_id, box, due_at')
    .eq('user_id', session.user.id)
    .order('due_at', { ascending: true });
  if (error) throw error;
  return data;
}

const DAILY_TARGET = 25; // 약 5분 분량

export async function getTodaySession() {
  const all = await getAllWords();
  const now = Date.now();
  const due = all.filter(w => new Date(w.due_at).getTime() <= now)
    .sort((a, b) => a.box - b.box || new Date(a.due_at) - new Date(b.due_at));
  if (due.length >= DAILY_TARGET) return due.slice(0, DAILY_TARGET);
  // 오늘 복습할 단어가 목표보다 적으면, 아직 때가 안 된 단어를 당겨와서 분량을 채운다
  const notDue = all.filter(w => new Date(w.due_at).getTime() > now)
    .sort((a, b) => new Date(a.due_at) - new Date(b.due_at));
  return due.concat(notDue.slice(0, DAILY_TARGET - due.length));
}

export async function reviewKnow(id, box) {
  const session = await getSession();
  if (!session) return;
  const newBox = Math.min(box + 1, MAX_BOX);
  const due = new Date(Date.now() + INTERVAL_DAYS[newBox] * 86400000).toISOString();
  await supabase.from('vocab_words').update({ box: newBox, due_at: due })
    .eq('user_id', session.user.id).eq('id', id);
}

export async function reviewDontKnow(id) {
  const session = await getSession();
  if (!session) return;
  await supabase.from('vocab_words').update({ box: 0, due_at: new Date().toISOString() })
    .eq('user_id', session.user.id).eq('id', id);
}

export async function reviewUnsure(id) {
  const session = await getSession();
  if (!session) return;
  const due = new Date(Date.now() + 86400000).toISOString(); // 박스는 유지, 내일 다시
  await supabase.from('vocab_words').update({ due_at: due })
    .eq('user_id', session.user.id).eq('id', id);
}

export async function deleteVocabWord(id) {
  const session = await getSession();
  if (!session) return;
  await supabase.from('vocab_words').delete().eq('user_id', session.user.id).eq('id', id);
}

function todayDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function logWordReviewed() {
  const session = await getSession();
  if (!session) return;
  const date = todayDate();
  const { data } = await supabase
    .from('vocab_daily_log').select('id, words_reviewed')
    .eq('user_id', session.user.id).eq('log_date', date).maybeSingle();
  const now = new Date().toISOString();
  if (data) {
    await supabase.from('vocab_daily_log')
      .update({ words_reviewed: data.words_reviewed + 1, updated_at: now }).eq('id', data.id);
  } else {
    await supabase.from('vocab_daily_log')
      .insert({ user_id: session.user.id, log_date: date, words_reviewed: 1 });
  }
}

export async function getVocabDailyLog() {
  const session = await getSession();
  if (!session) return [];
  const { data, error } = await supabase
    .from('vocab_daily_log').select('log_date, words_reviewed')
    .eq('user_id', session.user.id)
    .order('log_date', { ascending: false });
  if (error) throw error;
  return data;
}
