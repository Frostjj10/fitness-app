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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Progress</h1>
        <p className="text-slate-500 mt-1 text-sm">Track your strength gains over time</p>
      </div>

      {exerciseList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 sm:p-16 text-center">
          <div className="text-slate-200 text-5xl mb-4 font-thin">—</div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">No Data Yet</h2>
          <p className="text-slate-500 text-sm">Log your workouts to see your progress here.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Select Exercise</label>
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-slate-100 p-5 text-center">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Best Weight</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{prs.weight}</div>
              <div className="text-sm text-slate-500 font-medium">{user.unit} × {prs.reps} reps</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-5 text-center">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Est. 1RM</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-orange-500">{prs.estimated1RM}</div>
              <div className="text-sm text-slate-500 font-medium">{user.unit} · Epley</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-5 text-center">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Entries</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{weightLog.length}</div>
              <div className="text-sm text-slate-500 font-medium">logged sets</div>
            </div>
          </div>

          {chartData.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 p-6">
              <h2 className="text-base font-bold text-slate-900 mb-4">Weight Progress</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="weight" stroke="#f97316" strokeWidth={2.5} dot={{ fill: '#f97316', strokeWidth: 0, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-100 overflow-x-auto">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100 min-w-[600px]">
              <h2 className="text-base font-bold text-slate-900">Recent History</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Exercise</th>
                  <th className="px-6 py-3">Weight</th>
                  <th className="px-6 py-3">Reps</th>
                  <th className="px-6 py-3">RPE</th>
                  <th className="px-6 py-3">Est. 1RM</th>
                  <th className="px-6 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {chartData.slice(-10).reverse().map((entry, i) => (
                  <tr key={i} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-sm text-slate-600 font-medium">{entry.date}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{selectedExercise}</td>
                    <td className="px-6 py-3 text-sm font-bold text-slate-900">{entry.weight} {user.unit}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{entry.reps}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{entry.rpe}/10</td>
                    <td className="px-6 py-3 text-sm font-bold text-orange-500">{entry.estimated1RM} {user.unit}</td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => deleteLogEntry(entry.date, selectedExercise)}
                        className="text-slate-300 hover:text-red-500 text-sm transition-colors"
                        title="Delete entry"
                      >
                        ✕
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
