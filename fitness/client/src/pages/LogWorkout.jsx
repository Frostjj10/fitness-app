import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getProgressiveOverloadRecommendation } from '../utils/progressiveOverload';

const RPE_LABELS = ['', 'Very Easy', 'Easy', 'Light', 'Moderate', 'Medium', 'Somewhat Hard', 'Hard', 'Very Hard', 'Extremely Hard', 'Max'];

export default function LogWorkout({ user }) {
  const [schedule, setSchedule] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [logEntries, setLogEntries] = useState({});
  const [lastLoggedWeights, setLastLoggedWeights] = useState({});
  const [weightLogHistory, setWeightLogHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedule();
  }, []);

  async function loadSchedule() {
    const { data } = await supabase
      .from('schedules')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    if (data) {
      const fullSchedule = await loadFullSchedule(data.id);
      setSchedule(fullSchedule);

      const today = new Date().toLocaleDateString('en-CA');
      const workoutDays = [];
      for (const week of fullSchedule.schedule || []) {
        for (const day of week.days || []) {
          if (day.type === 'workout' && day.workout) {
            const alreadyAdded = workoutDays.find(w => w.dayOfWeek === day.dayOfWeek);
            if (!alreadyAdded) workoutDays.push({ dayOfWeek: day.dayOfWeek, date: day.date, workout: day.workout });
          }
        }
      }
      const todayWorkout = workoutDays.find(w => w.date === today);
      setSelectedDay(todayWorkout ? todayWorkout.dayOfWeek : (workoutDays[0]?.dayOfWeek || null));
    }
    await loadWeightHistory();
    setLoading(false);
  }

  async function loadWeightHistory() {
    const { data: logs } = await supabase
      .from('weight_logs')
      .select('exercise_id, weight, reps, rpe, date, muscle_group')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (!logs) return [];

    // Build map: exerciseId -> [all entries]
    const historyMap = {};
    for (const log of logs) {
      if (!historyMap[log.exercise_id]) historyMap[log.exercise_id] = [];
      historyMap[log.exercise_id].push(log);
    }

    setWeightLogHistory(logs || []);
    return historyMap;
  }

  async function loadFullSchedule(scheduleId) {
    const { data: weeks } = await supabase
      .from('schedule_weeks')
      .select('*')
      .eq('schedule_id', scheduleId)
      .order('week_num');

    if (!weeks) return { id: scheduleId };

    const scheduleWithWeeks = await Promise.all(weeks.map(async (week) => {
      const { data: days } = await supabase
        .from('schedule_days')
        .select('*')
        .eq('schedule_week_id', week.id)
        .order('day_of_week');

      const daysWithWorkouts = await Promise.all(days.map(async (day) => {
        if (day.type === 'workout' && day.id) {
          const { data: exercises } = await supabase
            .from('workout_exercises')
            .select('*')
            .eq('schedule_day_id', day.id)
            .order('sort_order');

          // Normalize exercises from snake_case (DB) to camelCase (code)
          const normalizedExercises = (exercises || []).map(ex => ({
            exerciseId: ex.exercise_id,
            name: ex.name,
            muscleGroup: ex.muscle_group,
            sets: ex.sets,
            reps: ex.reps,
            targetWeight: ex.target_weight,
            restSeconds: ex.rest_seconds,
            isCompound: ex.is_compound,
            unit: ex.unit || 'reps',
            sortOrder: ex.sort_order,
          }));

          return {
            dayOfWeek: day.day_of_week,
            date: day.date,
            type: day.type,
            workout: {
              dayOfWeek: day.workout_label,
              muscleGroups: day.muscle_groups,
              exercises: normalizedExercises,
            },
          };
        }
        return { dayOfWeek: day.day_of_week, date: day.date, type: day.type, workout: null };
      }));

      return {
        weekNum: week.week_num,
        startDate: week.start_date,
        days: daysWithWorkouts,
      };
    }));

    return { id: scheduleId, schedule: scheduleWithWeeks };
  }

  function updateEntry(exerciseId, field, value) {
    setLogEntries(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [field]: value,
      },
    }));
    setSaved(false);
  }

  async function saveWorkout() {
    const workout = getCurrentWorkout();
    if (!workout || !workout.exercises?.length) return;
    setSaving(true);

    const today = new Date().toLocaleDateString('en-CA');
    const date = today;

    try {
      const entries = workout.exercises.map(ex => {
        const entry = logEntries[ex.exerciseId] || {};
        const isCardio = ex.unit === 'min';
        return {
          user_id: user.id,
          date,
          exercise_id: ex.exerciseId,
          exercise_name: ex.name,
          muscle_group: ex.muscleGroup,
          weight: isCardio ? 0 : (parseFloat(entry.weight) || ex.targetWeight),
          reps: isCardio ? (parseInt(entry.duration) || ex.reps) : (parseInt(entry.reps) || ex.reps),
          rpe: parseInt(entry.rpe) || 7,
          notes: entry.notes || '',
        };
      });

      await supabase.from('weight_logs').insert(entries);

      await supabase.from('workout_logs').insert([{
        user_id: user.id,
        schedule_id: schedule.id,
        date,
        day_of_week: workout.dayOfWeek,
        muscle_groups: workout.muscleGroups,
        completed: true,
      }]);

      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  function getWorkoutDays() {
    if (!schedule) return [];
    const seen = new Set();
    const days = [];
    for (const week of schedule.schedule || []) {
      for (const day of week.days || []) {
        if (day.type === 'workout' && day.workout && !seen.has(day.dayOfWeek)) {
          seen.add(day.dayOfWeek);
          days.push({ dayOfWeek: day.dayOfWeek, date: day.date, workout: day.workout });
        }
      }
    }
    return days;
  }

  function getCurrentWorkout() {
    if (!schedule || !selectedDay) return null;
    for (const week of schedule.schedule || []) {
      for (const day of week.days || []) {
        if (day.dayOfWeek === selectedDay && day.type === 'workout' && day.workout) {
          return day.workout;
        }
      }
    }
    return null;
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Loading...</div>;
  }

  if (!schedule) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">No active schedule. Create one from the Dashboard first.</p>
      </div>
    );
  }

  const workoutDays = getWorkoutDays();
  const currentWorkout = getCurrentWorkout();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Log Workout</h1>
          <p className="text-gray-500">Select a day and log your progress</p>
        </div>
        {saved && (
          <div className="text-green-600 font-medium">✓ Saved!</div>
        )}
      </div>

      {/* Day selector */}
      <div className="bg-white rounded-xl shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Which day are you logging?</label>
        <div className="flex flex-wrap gap-2">
          {workoutDays.map(w => (
            <button
              key={w.dayOfWeek}
              onClick={() => { setSelectedDay(w.dayOfWeek); setSaved(false); }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedDay === w.dayOfWeek
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {w.dayOfWeek}
            </button>
          ))}
        </div>
      </div>

      {/* Selected workout info */}
      {currentWorkout && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="bg-blue-700 text-white px-6 py-3">
            <div className="font-medium">{currentWorkout.dayOfWeek}</div>
            <div className="text-sm opacity-80">{currentWorkout.muscleGroups}</div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-sm text-gray-500">
                <th className="px-6 py-3">Exercise</th>
                <th className="px-6 py-3">Target</th>
                <th className="px-6 py-3">{user.unit}</th>
                <th className="px-6 py-3">{currentWorkout.exercises[0]?.unit === 'min' ? 'Duration (min)' : 'Reps'}</th>
                <th className="px-6 py-3">RPE</th>
                <th className="px-6 py-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {currentWorkout.exercises.map((ex, i) => {
                const entry = logEntries[ex.exerciseId] || {};
                const isCardio = ex.unit === 'min';

                // Progressive overload recommendation
                const rec = getProgressiveOverloadRecommendation(
                  ex.exerciseId,
                  ex.muscleGroup,
                  user.unit,
                  ex.reps,
                  weightLogHistory
                );
                const useProgressive = user.progressive_overload !== false; // default true
                const suggestedWeight = rec.suggestedWeight || ex.targetWeight;
                const defaultWeight = useProgressive && rec.suggestedWeight
                  ? rec.suggestedWeight
                  : (entry.weight || lastLoggedWeights[ex.exerciseId]?.weight || ex.targetWeight);
                const weightChanged = useProgressive && rec.suggestedWeight && rec.suggestedWeight !== rec.lastWeight;

                return (
                  <tr key={i} className="border-t">
                    <td className="px-6 py-4">
                      <div className="font-medium">{ex.name}</div>
                      <div className="text-sm text-gray-500">{ex.muscleGroup}</div>
                      {weightChanged && (
                        <div className="text-xs text-blue-600 mt-0.5 font-medium">Goal: {suggestedWeight}{user.unit}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {isCardio
                        ? `${ex.reps} min`
                        : `${ex.sets}×${ex.reps} @ ${ex.targetWeight}${user.unit}`}
                    </td>
                    <td className="px-6 py-4">
                      {isCardio ? (
                        <span className="text-gray-400 text-sm">—</span>
                      ) : (
                        <div className="relative">
                          <input
                            type="number"
                            defaultValue={defaultWeight}
                            onChange={e => updateEntry(ex.exerciseId, 'weight', e.target.value)}
                            className={`w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${weightChanged ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}`}
                          />
                          {weightChanged && (
                            <div className="text-xs text-blue-500 mt-0.5">+{rec.increment}{user.unit}</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        defaultValue={entry.reps || lastLoggedWeights[ex.exerciseId]?.reps || ex.reps}
                        onChange={e => updateEntry(ex.exerciseId, isCardio ? 'duration' : 'reps', e.target.value)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder={isCardio ? 'min' : ''}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <select
                        defaultValue={entry.rpe || 7}
                        onChange={e => updateEntry(ex.exerciseId, 'rpe', e.target.value)}
                        className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        {[1,2,3,4,5,6,7,8,9,10].map(v => (
                          <option key={v} value={v}>{v} — {RPE_LABELS[v]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        placeholder="Notes..."
                        defaultValue={entry.notes}
                        onChange={e => updateEntry(ex.exerciseId, 'notes', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {currentWorkout && (
        <div className="flex justify-end gap-3">
          <button
            onClick={saveWorkout}
            disabled={saving || saved}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-lg font-medium"
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Complete Workout'}
          </button>
        </div>
      )}

      {!currentWorkout && workoutDays.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🏖️</div>
          <h2 className="text-2xl font-bold mb-2">No Workouts Scheduled</h2>
          <p className="text-gray-500">Go to Dashboard to create a schedule first.</p>
        </div>
      )}
    </div>
  );
}
