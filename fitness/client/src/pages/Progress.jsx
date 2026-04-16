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
      <h1 className="text-3xl font-bold">Progress</h1>

      {exerciseList.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold mb-2">No Data Yet</h2>
          <p className="text-gray-500">Log your workouts to see your progress over time.</p>
        </div>
      ) : (
        <>
          {/* Exercise selector */}
          <div>
            <label className="block text-sm font-medium mb-2">Select Exercise</label>
            <select
              value={selectedExercise}
              onChange={e => setSelectedExercise(e.target.value)}
              className="w-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg"
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

          {/* PRs */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow p-6 text-center">
              <div className="text-sm text-gray-500 mb-1">Best Weight</div>
              <div className="text-3xl font-bold">{prs.weight} {user.unit}</div>
              <div className="text-sm text-gray-500 mt-1">{prs.reps} reps</div>
            </div>
            <div className="bg-white rounded-xl shadow p-6 text-center">
              <div className="text-sm text-gray-500 mb-1">Est. 1RM</div>
              <div className="text-3xl font-bold text-blue-600">{prs.estimated1RM} {user.unit}</div>
              <div className="text-sm text-gray-500 mt-1">Epley formula</div>
            </div>
            <div className="bg-white rounded-xl shadow p-6 text-center">
              <div className="text-sm text-gray-500 mb-1">Total Workouts Logged</div>
              <div className="text-3xl font-bold">{weightLog.length}</div>
              <div className="text-sm text-gray-500 mt-1">entries</div>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Weight Progress Over Time</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="weight" stroke="#2563eb" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* History table */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Recent History</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 bg-gray-50">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Exercise</th>
                  <th className="px-6 py-3">Weight</th>
                  <th className="px-6 py-3">Reps</th>
                  <th className="px-6 py-3">RPE</th>
                  <th className="px-6 py-3">Est. 1RM</th>
                </tr>
              </thead>
              <tbody>
                {chartData.slice(-10).reverse().map((entry, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-6 py-3">{entry.date}</td>
                    <td className="px-6 py-3">{selectedExercise}</td>
                    <td className="px-6 py-3 font-medium">{entry.weight} {user.unit}</td>
                    <td className="px-6 py-3">{entry.reps}</td>
                    <td className="px-6 py-3">{entry.rpe}/10</td>
                    <td className="px-6 py-3 text-blue-600">{entry.estimated1RM} {user.unit}</td>
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
