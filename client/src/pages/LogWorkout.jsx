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
    setWeightLogHistory(logs || []);
    return logs;
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
    return <div className="text-center py-20 text-slate-500">Loading...</div>;
  }

  if (!schedule) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M14.5 4l-5 6-3 5 6.5 6L20 10l-5.5-6z"/>
          </svg>
        </div>
        <p className="text-slate-500 font-medium">No active schedule. Create one from the Dashboard first.</p>
      </div>
    );
  }

  const workoutDays = getWorkoutDays();
  const currentWorkout = getCurrentWorkout();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Log Workout</h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">Select a day and log your progress</p>
        </div>
        {saved && (
          <div className="text-orange-500 font-bold flex items-center gap-1 text-xs sm:text-sm">
            ✓ Saved!
          </div>
        )}
      </div>

      <div className="card p-4 sm:p-5">
        <label className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Which day?</label>
        <div className="flex flex-wrap gap-2">
          {workoutDays.map(w => (
            <button
              key={w.dayOfWeek}
              onClick={() => { setSelectedDay(w.dayOfWeek); setSaved(false); }}
              className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                selectedDay === w.dayOfWeek
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {w.dayOfWeek}
            </button>
          ))}
        </div>
      </div>

      {currentWorkout && (
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-4 sm:px-6 py-3 sm:py-4">
            <div className="font-bold text-base sm:text-lg">{currentWorkout.dayOfWeek}</div>
            <div className="text-xs sm:text-sm text-slate-300">{currentWorkout.muscleGroups}</div>
          </div>

          {/* Mobile-first: card-based layout */}
          <div className="p-4 space-y-4 sm:hidden">
            {currentWorkout.exercises.map((ex, i) => {
              const entry = logEntries[ex.exerciseId] || {};
              const isCardio = ex.unit === 'min';
              const rec = getProgressiveOverloadRecommendation(ex.exerciseId, ex.muscleGroup, user.unit, ex.reps, weightLogHistory);
              const useProgressive = user.progressive_overload !== false;
              const suggestedWeight = rec.suggestedWeight || ex.targetWeight;
              const defaultWeight = useProgressive && rec.suggestedWeight ? rec.suggestedWeight : (entry.weight || lastLoggedWeights[ex.exerciseId]?.weight || ex.targetWeight);
              const weightChanged = useProgressive && rec.suggestedWeight && rec.suggestedWeight !== rec.lastWeight;

              return (
                <div key={i} className="border border-slate-100 rounded-xl p-4 bg-white">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-slate-900">{ex.name}</div>
                      <div className="text-xs text-slate-500">{ex.muscleGroup}</div>
                      {weightChanged && (
                        <div className="text-xs text-orange-500 font-bold mt-1">Goal: {suggestedWeight}{user.unit} (+{rec.increment})</div>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 text-right">
                      Target: {isCardio ? `${ex.reps} min` : `${ex.sets}×${ex.reps} @ ${ex.targetWeight}`}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {!isCardio && (
                      <div>
                        <label className="text-xs text-slate-500 font-medium block mb-1">{user.unit}</label>
                        <input type="number" defaultValue={defaultWeight} onChange={e => updateEntry(ex.exerciseId, 'weight', e.target.value)} className={`w-full px-3 py-2 border rounded-xl text-sm ${weightChanged ? 'border-orange-400 bg-orange-50' : 'border-slate-200'}`} />
                      </div>
                    )}
                    <div>
                      <label className="text-xs text-slate-500 font-medium block mb-1">{isCardio ? 'Duration' : 'Reps'}</label>
                      <input type="number" defaultValue={entry.reps || lastLoggedWeights[ex.exerciseId]?.reps || ex.reps} onChange={e => updateEntry(ex.exerciseId, isCardio ? 'duration' : 'reps', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-medium block mb-1">RPE</label>
                      <select defaultValue={entry.rpe || 7} onChange={e => updateEntry(ex.exerciseId, 'rpe', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                        {[1,2,3,4,5,6,7,8,9,10].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="mt-2">
                    <input type="text" placeholder="Notes..." defaultValue={entry.notes} onChange={e => updateEntry(ex.exerciseId, 'notes', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Exercise</th>
                  <th className="px-6 py-3">Target</th>
                  <th className="px-6 py-3">{user.unit}</th>
                  <th className="px-6 py-3">{currentWorkout.exercises[0]?.unit === 'min' ? 'Duration' : 'Reps'}</th>
                  <th className="px-6 py-3">RPE</th>
                  <th className="px-6 py-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {currentWorkout.exercises.map((ex, i) => {
                  const entry = logEntries[ex.exerciseId] || {};
                  const isCardio = ex.unit === 'min';
                  const rec = getProgressiveOverloadRecommendation(ex.exerciseId, ex.muscleGroup, user.unit, ex.reps, weightLogHistory);
                  const useProgressive = user.progressive_overload !== false;
                  const suggestedWeight = rec.suggestedWeight || ex.targetWeight;
                  const defaultWeight = useProgressive && rec.suggestedWeight ? rec.suggestedWeight : (entry.weight || lastLoggedWeights[ex.exerciseId]?.weight || ex.targetWeight);
                  const weightChanged = useProgressive && rec.suggestedWeight && rec.suggestedWeight !== rec.lastWeight;

                  return (
                    <tr key={i} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{ex.name}</div>
                        <div className="text-xs text-slate-500">{ex.muscleGroup}</div>
                        {weightChanged && (
                          <div className="text-xs text-orange-500 font-bold mt-0.5">Goal: {suggestedWeight}{user.unit} (+{rec.increment})</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {isCardio ? `${ex.reps} min` : `${ex.sets}×${ex.reps} @ ${ex.targetWeight}${user.unit}`}
                      </td>
                      <td className="px-6 py-4">
                        {isCardio ? <span className="text-slate-300 text-sm">—</span> : (
                          <input type="number" defaultValue={defaultWeight} onChange={e => updateEntry(ex.exerciseId, 'weight', e.target.value)} className={`w-24 px-3 py-2 border rounded-xl text-sm ${weightChanged ? 'border-orange-400 bg-orange-50' : 'border-slate-200'}`} />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <input type="number" defaultValue={entry.reps || lastLoggedWeights[ex.exerciseId]?.reps || ex.reps} onChange={e => updateEntry(ex.exerciseId, isCardio ? 'duration' : 'reps', e.target.value)} className="w-20 px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                      </td>
                      <td className="px-6 py-4">
                        <select defaultValue={entry.rpe || 7} onChange={e => updateEntry(ex.exerciseId, 'rpe', e.target.value)} className="w-24 px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                          {[1,2,3,4,5,6,7,8,9,10].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <input type="text" placeholder="..." defaultValue={entry.notes} onChange={e => updateEntry(ex.exerciseId, 'notes', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {currentWorkout && (
        <div className="flex justify-end">
          <button
            onClick={saveWorkout}
            disabled={saving || saved}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] transition-all shadow-lg shadow-orange-500/25 text-sm"
          >
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Complete Workout'}
          </button>
        </div>
      )}

      {!currentWorkout && workoutDays.length === 0 && (
        <div className="text-center py-16 sm:py-20 card p-8 sm:p-16">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">No Workouts Scheduled</h2>
          <p className="text-slate-500 text-xs sm:text-sm">Go to Dashboard to create a schedule first.</p>
        </div>
      )}
    </div>
  );
}
