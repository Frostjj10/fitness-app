import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getProgressiveOverloadRecommendation } from '../utils/progressiveOverload';

const RPE_LABELS = ['', 'Very Easy', 'Easy', 'Light', 'Moderate', 'Medium', 'Somewhat Hard', 'Hard', 'Very Hard', 'Extremely Hard', 'Max'];

export default function LogWorkout({ user }) {
  const [schedule, setSchedule] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [logEntries, setLogEntries] = useState({});
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

    try {
      const entries = workout.exercises.map(ex => {
        const entry = logEntries[ex.exerciseId] || {};
        const isCardio = ex.unit === 'min';
        return {
          user_id: user.id,
          date: today,
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
        date: today,
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
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-xl font-extrabold" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-dim)' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="text-5xl font-extrabold mb-4" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--border)' }}>
          NO ACTIVE SCHEDULE
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Create one from the Dashboard first.
        </p>
      </div>
    );
  }

  const workoutDays = getWorkoutDays();
  const currentWorkout = getCurrentWorkout();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-4xl font-extrabold text-white tracking-tight"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            Log Workout
          </h1>
          <p
            className="text-sm font-medium mt-2"
            style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}
          >
            Select a day and log your progress
          </p>
        </div>
        {saved && (
          <div
            className="text-sm font-bold flex items-center gap-2"
            style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
              <path d="M5 13l4 4L19 7"/>
            </svg>
            Saved!
          </div>
        )}
      </div>

      {/* Day selector */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} className="p-5">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4"
          style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}
        >
          Which Day?
        </p>
        <div className="flex flex-wrap gap-2">
          {workoutDays.map(w => (
            <button
              key={w.dayOfWeek}
              onClick={() => { setSelectedDay(w.dayOfWeek); setSaved(false); }}
              className="px-4 py-2.5 font-bold text-sm transition-all"
              style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                background: selectedDay === w.dayOfWeek ? 'var(--accent)' : 'var(--surface-2)',
                color: selectedDay === w.dayOfWeek ? '#000' : 'var(--text-dim)',
                border: selectedDay === w.dayOfWeek ? '2px solid var(--accent)' : '1px solid var(--border)',
              }}
            >
              {w.dayOfWeek}
            </button>
          ))}
        </div>
      </div>

      {currentWorkout && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {/* Workout header */}
          <div
            className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}
          >
            <div>
              <div
                className="text-xl font-extrabold text-white"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                {currentWorkout.dayOfWeek}
              </div>
              <div
                className="text-sm font-medium"
                style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.03em' }}
              >
                {currentWorkout.muscleGroups}
              </div>
            </div>
            <div
              className="text-[10px] font-bold uppercase tracking-widest px-2 py-1"
              style={{ background: 'var(--accent)', color: '#000', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}
            >
              {currentWorkout.exercises.length} Exercises
            </div>
          </div>

          {/* Exercise list */}
          <div className="p-4 sm:p-6 space-y-3">
            {currentWorkout.exercises.map((ex, i) => {
              const entry = logEntries[ex.exerciseId] || {};
              const isCardio = ex.unit === 'min';
              const rec = getProgressiveOverloadRecommendation(ex.exerciseId, ex.muscleGroup, user.unit, ex.reps, weightLogHistory);
              const useProgressive = user.progressive_overload !== false;
              const defaultWeight = useProgressive && rec.suggestedWeight ? rec.suggestedWeight : (entry.weight || ex.targetWeight);
              const weightChanged = useProgressive && rec.suggestedWeight && rec.suggestedWeight !== rec.lastWeight;

              return (
                <div
                  key={i}
                  className="p-4"
                  style={{
                    background: 'var(--surface-2)',
                    border: `1px solid ${weightChanged ? 'var(--accent)' : 'var(--border)'}`,
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div
                        className="font-bold text-white"
                        style={{ fontFamily: 'Syne, sans-serif' }}
                      >
                        {ex.name}
                      </div>
                      <div
                        className="text-xs font-medium mt-0.5"
                        style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}
                      >
                        {ex.muscleGroup}
                      </div>
                      {weightChanged && (
                        <div
                          className="text-xs font-bold mt-1"
                          style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif' }}
                        >
                          Suggested: {rec.suggestedWeight}{user.unit} (+{rec.increment})
                        </div>
                      )}
                    </div>
                    <div
                      className="text-xs font-medium text-right"
                      style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}
                    >
                      Target: {isCardio ? `${ex.reps} min` : `${ex.sets}×${ex.reps}`}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {!isCardio && (
                      <div>
                        <label
                          className="text-[10px] font-bold uppercase tracking-widest block mb-1"
                          style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}
                        >
                          {user.unit}
                        </label>
                        <input
                          type="number"
                          defaultValue={defaultWeight}
                          onChange={e => updateEntry(ex.exerciseId, 'weight', e.target.value)}
                          className="input w-full text-center"
                          style={{ padding: '10px' }}
                        />
                      </div>
                    )}
                    <div>
                      <label
                        className="text-[10px] font-bold uppercase tracking-widest block mb-1"
                        style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}
                      >
                        {isCardio ? 'Duration' : 'Reps'}
                      </label>
                      <input
                        type="number"
                        defaultValue={entry.reps || ex.reps}
                        onChange={e => updateEntry(ex.exerciseId, isCardio ? 'duration' : 'reps', e.target.value)}
                        className="input w-full text-center"
                        style={{ padding: '10px' }}
                      />
                    </div>
                    <div>
                      <label
                        className="text-[10px] font-bold uppercase tracking-widest block mb-1"
                        style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}
                      >
                        RPE
                      </label>
                      <select
                        defaultValue={entry.rpe || 7}
                        onChange={e => updateEntry(ex.exerciseId, 'rpe', e.target.value)}
                        className="input w-full text-center"
                        style={{ padding: '10px' }}
                      >
                        {[1,2,3,4,5,6,7,8,9,10].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Notes..."
                      defaultValue={entry.notes}
                      onChange={e => updateEntry(ex.exerciseId, 'notes', e.target.value)}
                      className="input w-full"
                      style={{ padding: '10px' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Save button */}
          <div className="px-6 pb-6">
            <button
              onClick={saveWorkout}
              disabled={saving || saved}
              className="btn-primary w-full"
              style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 800,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                fontSize: '1rem',
                padding: '16px 24px',
                opacity: (saving || saved) ? 0.5 : 1,
                cursor: (saving || saved) ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : saved ? '✓ Workout Complete!' : 'Complete Workout'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}