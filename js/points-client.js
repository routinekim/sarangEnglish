import { supabase, getSession } from './supabase-client.js';

export async function getAwardedQuestionIds(unitId) {
  const session = await getSession();
  if (!session) return new Set();
  const { data, error } = await supabase
    .from('point_events').select('question_id')
    .eq('user_id', session.user.id).eq('unit_id', unitId)
    .in('reason', ['correct', 'retry_correct']);
  if (error) throw error;
  return new Set(data.map(r => r.question_id));
}

export async function awardPoints(unitId, entries) {
  const session = await getSession();
  if (!session || !entries.length) return;
  const rows = entries.map(e => ({
    user_id: session.user.id,
    unit_id: unitId,
    question_id: e.question_id ?? null,
    reason: e.reason,
    points: e.points,
  }));
  const { error } = await supabase.from('point_events').insert(rows);
  if (error) throw error;
}

export async function getPointsSummary() {
  const session = await getSession();
  if (!session) return { total: 0, level: 1, badgeUnits: [] };
  const { data, error } = await supabase
    .from('point_events').select('unit_id, reason, points')
    .eq('user_id', session.user.id);
  if (error) throw error;
  const total = data.reduce((sum, r) => sum + Number(r.points), 0);
  const level = Math.floor(total / 200) + 1;
  const badgeUnits = [...new Set(data.filter(r => r.reason === 'unit_perfect').map(r => r.unit_id))];
  return { total, level, badgeUnits };
}

export async function getHistory() {
  const session = await getSession();
  if (!session) return [];
  const { data, error } = await supabase
    .from('point_events').select('unit_id, reason, points, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
