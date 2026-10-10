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

export async function getDueWords() {
  const all = await getAllWords();
  const now = Date.now();
  return all.filter(w => new Date(w.due_at).getTime() <= now)
    .sort((a, b) => a.box - b.box || new Date(a.due_at) - new Date(b.due_at));
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

export async function deleteVocabWord(id) {
  const session = await getSession();
  if (!session) return;
  await supabase.from('vocab_words').delete().eq('user_id', session.user.id).eq('id', id);
}
