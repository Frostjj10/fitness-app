import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function calculate1RM(weight, reps) {
  if (reps === 1) return weight;
  if (reps <= 0 || weight <= 0) return 0;
  return weight * (1 + reps / 30);
}

export default function Progress({ user }) {
  const [weightLog, setWeightLog] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [exerciseList, setExerciseList] = useState([]);

  useEffect(() => {
    fetchWeightLog();
  }, []);

  async function fetchWeightLog() {
    const { data } = await supabase
      .from('weight_logs')
      .select('*')
      .order('date', { ascending: true });

    if (data?.length) {
      setWeightLog(data);
      const exercises = [...new Set(data.map(e => e.exercise_id))];
      setExerciseList(exercises);
      if (exercises.length > 0 && !selectedExercise) {
        setSelectedExercise(exercises[0]);
      }
    }
  }

  function getChartData() {
    if (!selectedExercise) return [];
    const filtered = weightLog
      .filter(e => e.exercise_id === selectedExercise)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return filtered.map(entry => ({
      date: entry.date,
      weight: entry.weight,
      reps: entry.reps,
      rpe: entry.rpe,
      estimated1RM: Math.round(calculate1RM(entry.weight, entry.reps)),
    }));
  }

  async function deleteLogEntry(date, exerciseId) {
    if (!confirm(`Delete ${exerciseId} entry for ${date}?`)) return;
    await supabase
      .from('weight_logs')
      .delete()
      .eq('user_id', user.id)
      .eq('date', date)
      .eq('exercise_id', exerciseId);
    fetchWeightLog();
  }

  function getPRs() {
    const filtered = weightLog.filter(e => e.exercise_id === selectedExercise);
    if (filtered.length === 0) return { weight: 0, reps: 0, estimated1RM: 0 };

    const maxWeight = Math.max(...filtered.map(e => e.weight));
    const maxReps = Math.max(...filtered.filter(e => e.weight === maxWeight).map(e => e.reps));
    const entries = filtered.filter(e => e.weight === maxWeight && e.reps === maxReps);
    const best1RM = Math.max(...filtered.map(e => calculate1RM(e.weight, e.reps)));

    return {
      weight: maxWeight,
      reps: maxReps,
      estimated1RM: Math.round(best1RM),
      date: entries[0]?.date,
    };
  }

  const chartData = getChartData();
  const prs = getPRs();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Progress</h1>
        <p
          className="text-sm font-medium mt-2"
          style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}
        >
          Track your strength gains over time
        </p>
      </div>

      {exerciseList.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-32 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div
            className="text-6xl font-extrabold mb-4"
            style={{ fontFamily: 'Syne, sans-serif', color: 'var(--border)' }}
          >
            — —
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>No Data Yet</h2>
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}
          >
            Log your workouts to see your progress here.
          </p>
        </div>
      ) : (
        <>
          {/* Exercise selector */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} className="p-5">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3"
              style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}
            >
              Select Exercise
            </p>
            <select
              value={selectedExercise}
              onChange={e => setSelectedExercise(e.target.value)}
              className="input max-w-sm"
            >
              {exerciseList.map(id => {
                const entry = weightLog.find(e => e.exercise_id === id);
                return (
                  <option key={id} value={id}>
                    {entry?.exercise_name || id}
                  </option>
                );
              })}
            </select>
          </div>

          {/* PR stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-5 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2"
                style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}
              >
                Best Weight
              </p>
              <div className="stat-number">{prs.weight}</div>
              <div
                className="text-sm font-medium mt-1"
                style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}
              >
                {user.unit} × {prs.reps} reps
              </div>
            </div>
            <div className="p-5 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2"
                style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}
              >
                Est. 1RM
              </p>
              <div className="stat-number">{prs.estimated1RM}</div>
              <div
                className="text-sm font-medium mt-1"
                style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}
              >
                {user.unit} · Epley
              </div>
            </div>
            <div className="p-5 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2"
                style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}
              >
                Total Entries
              </p>
              <div className="stat-number">{weightLog.length}</div>
              <div
                className="text-sm font-medium mt-1"
                style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}
              >
                logged sets
              </div>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} className="p-6">
              <h2
                className="text-base font-extrabold text-white mb-4 tracking-tight"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                Weight Progress
              </h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--text-dim)' }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--text-dim)' }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 0,
                        color: 'var(--text)',
                        fontFamily: 'Barlow Condensed, sans-serif',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        fontSize: '12px',
                      }}
                    />
                    <Line type="monotone" dataKey="weight" stroke="var(--accent)" strokeWidth={2.5} dot={{ fill: 'var(--accent)', strokeWidth: 0, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* History table */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', overflowX: 'auto' }}>
            <div
              className="px-6 py-4"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <h2 className="text-base font-extrabold text-white tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>Recent History</h2>
            </div>
            <table className="w-full" style={{ minWidth: '600px' }}>
              <thead>
                <tr
                  className="text-left"
                  style={{ background: 'var(--surface-2)' }}
                >
                  {['Date', 'Exercise', 'Weight', 'Reps', 'RPE', 'Est. 1RM', ''].map(h => (
                    <th
                      key={h}
                      className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chartData.slice(-10).reverse().map((entry, i) => (
                  <tr
                    key={i}
                    className="transition-colors"
                    style={{ borderTop: '1px solid var(--border)' }}
                  >
                    <td
                      className="px-6 py-3 text-sm font-medium"
                      style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}
                    >
                      {entry.date}
                    </td>
                    <td
                      className="px-6 py-3 text-sm font-medium"
                      style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}
                    >
                      {selectedExercise}
                    </td>
                    <td
                      className="px-6 py-3 text-sm font-bold text-white"
                      style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                    >
                      {entry.weight} {user.unit}
                    </td>
                    <td
                      className="px-6 py-3 text-sm font-medium"
                      style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}
                    >
                      {entry.reps}
                    </td>
                    <td
                      className="px-6 py-3 text-sm font-medium"
                      style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}
                    >
                      {entry.rpe}/10
                    </td>
                    <td
                      className="px-6 py-3 text-sm font-bold"
                      style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      {entry.estimated1RM} {user.unit}
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => deleteLogEntry(entry.date, selectedExercise)}
                        className="text-lg transition-all hover:opacity-60"
                        style={{ color: 'var(--border)' }}
                        title="Delete entry"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}