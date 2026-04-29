import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatDateLong } from '../utils/format';
import RestDayCard from '../components/RestDayCard';
import WorkoutDayCard from '../components/WorkoutDayCard';
import CardioDayCard from '../components/CardioDayCard';
import ExercisePicker from '../components/ExercisePicker';

export default function SchedulePage({ user }) {
  const [schedule, setSchedule] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerDay, setPickerDay] = useState(null);
  const [pickerPplType, setPickerPplType] = useState('push');
  const [currentExerciseIds, setCurrentExerciseIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedule();
  }, []);

  async function loadSchedule() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('schedules')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (data) {
        const fullSchedule = await loadFullSchedule(data.id);
        setSchedule(fullSchedule);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
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

      const DAY_ORDER = { monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6 };
      days.sort((a, b) => (DAY_ORDER[a.day_of_week] ?? 7) - (DAY_ORDER[b.day_of_week] ?? 7));

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

    const { data: scheduleMeta } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', scheduleId)
      .single();

    return {
      id: scheduleId,
      start_date: scheduleMeta?.start_date,
      end_date: scheduleMeta?.end_date,
      workout_days: scheduleMeta?.workout_days || [],
      schedule: scheduleWithWeeks,
    };
  }

  function getPplType(workoutLabel) {
    const map = { Push: 'push', Pull: 'pull', Legs: 'legs', Cardio: 'cardio', Core: 'core' };
    return map[workoutLabel] || 'push';
  }

  async function handleAddExercise(dayOfWeek, pplTypeOverride = null) {
    const week = schedule.schedule[selectedWeek];
    const day = week.days.find(d => d.dayOfWeek === dayOfWeek);
    if (!day) return;

    let pplType = 'push';
    if (day.type === 'rest') {
      pplType = pplTypeOverride || 'core';
    } else if (day.type === 'workout') {
      pplType = getPplType(day.workout.dayOfWeek);
    } else if (day.type === 'cardio') {
      pplType = 'cardio';
    }

    setPickerPplType(pplType);
    setPickerDay(dayOfWeek);
    setCurrentExerciseIds(day.workout?.exercises?.map(e => e.exerciseId) || []);
    setPickerOpen(true);
  }

  async function handleExerciseSelect(exercise) {
    if (!pickerDay) return;

    const week = schedule.schedule[selectedWeek];
    const day = week.days.find(d => d.dayOfWeek === pickerDay);
    if (!day?.id) return;

    await supabase.from('workout_exercises').insert([{
      schedule_day_id: day.id,
      exercise_id: exercise.exerciseId,
      name: exercise.name,
      muscle_group: exercise.muscleGroup,
      sets: exercise.sets || 3,
      reps: exercise.reps || 10,
      target_weight: exercise.targetWeight || 0,
      rest_seconds: exercise.restSeconds || 60,
      is_compound: exercise.isCompound || false,
      unit: exercise.unit || 'reps',
      sort_order: day.workout?.exercises?.length || 0,
    }]);

    const fullSchedule = await loadFullSchedule(schedule.id);
    setSchedule(fullSchedule);
    setPickerOpen(false);
    setPickerDay(null);
  }

  async function handleRemoveExercise(dayOfWeek, exerciseId) {
    if (!exerciseId) return;
    const week = schedule.schedule[selectedWeek];
    const day = week.days.find(d => d.dayOfWeek === dayOfWeek);
    if (!day?.id) return;

    await supabase
      .from('workout_exercises')
      .delete()
      .eq('schedule_day_id', day.id)
      .eq('exercise_id', exerciseId);

    const fullSchedule = await loadFullSchedule(schedule.id);
    setSchedule(fullSchedule);
  }

  async function handleUpdateExercise(dayOfWeek, exerciseId, updates) {
    const week = schedule.schedule[selectedWeek];
    const day = week.days.find(d => d.dayOfWeek === dayOfWeek);
    if (!day?.id) return;

    const ex = day.workout?.exercises?.find(e => e.exerciseId === exerciseId);
    const isCardio = ex?.unit === 'min';

    const dbUpdates = isCardio
      ? { reps: updates.reps }
      : {
          sets: updates.sets,
          reps: updates.reps,
          target_weight: updates.targetWeight,
          rest_seconds: updates.restSeconds,
        };

    await supabase
      .from('workout_exercises')
      .update(dbUpdates)
      .eq('schedule_day_id', day.id)
      .eq('exercise_id', exerciseId);

    const fullSchedule = await loadFullSchedule(schedule.id);
    setSchedule(fullSchedule);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-xl font-extrabold tracking-tight" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-dim)' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!schedule || !schedule.schedule) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div
          className="text-7xl font-extrabold mb-4"
          style={{ fontFamily: 'Syne, sans-serif', color: 'var(--border)', letterSpacing: '-0.04em' }}
        >
          NO SCHEDULE
        </div>
        <p
          className="text-sm font-medium"
          style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}
        >
          Create one from the Dashboard first.
        </p>
      </div>
    );
  }

  const currentWeek = schedule.schedule[selectedWeek] || { weekNum: 1, days: [] };

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-5xl font-extrabold text-white tracking-tighter"
            style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.04em' }}
          >
            Schedule
          </h1>
          <p
            className="text-sm font-medium mt-2"
            style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}
          >
            {formatDateLong(schedule.start_date)} — {formatDateLong(schedule.end_date)}
          </p>
        </div>
        <div
          className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5"
          style={{ background: 'var(--surface)', color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.2em', border: '1px solid var(--border)' }}
        >
          {schedule.schedule.length} Week Block
        </div>
      </div>

      {/* Week selector — full width horizontal strip */}
      <div className="mb-8 flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {schedule.schedule.map((week, i) => (
          <button
            key={i}
            onClick={() => setSelectedWeek(i)}
            className="py-3 px-6 font-bold text-sm transition-all shrink-0"
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              background: selectedWeek === i ? 'var(--accent)' : 'var(--surface)',
              color: selectedWeek === i ? '#000' : 'var(--text-dim)',
              border: selectedWeek === i ? '2px solid var(--accent)' : '1px solid var(--border)',
            }}
          >
            Week {week.weekNum}
            <div
              className="text-[10px] font-medium mt-0.5 text-center"
              style={{ color: selectedWeek === i ? '#000' : 'var(--text-dim)', opacity: selectedWeek === i ? 0.7 : 0.5 }}
            >
              {formatDateLong(week.startDate)}
            </div>
          </button>
        ))}
      </div>

      {/* 7-day vertical timeline — left aligned with accent line */}
      <div className="relative">
        {/* Vertical accent line */}
        <div
          className="absolute left-[29px] top-0 bottom-0 w-px hidden sm:block"
          style={{ background: 'var(--border)' }}
        />

        <div className="space-y-3">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((dayName, idx) => {
            const day = currentWeek.days?.find(d => d.dayOfWeek === dayName);
            if (!day) return null;

            const isWorkout = day.type === 'workout';
            const isCardio = day.type === 'cardio';
            const isRest = day.type === 'rest';
            const exCount = day.workout?.exercises?.length || 0;

            return (
              <div key={dayName} className="flex items-start gap-4">
                {/* Day column — narrow label */}
                <div
                  className="w-14 shrink-0 pt-4 flex flex-col items-center"
                  style={{ paddingTop: '1rem' }}
                >
                  <div
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}
                  >
                    {dayName.slice(0, 3)}
                  </div>
                  <div
                    className="w-2 h-2 mt-2"
                    style={{
                      background: isWorkout ? 'var(--accent)' : isCardio ? 'rgba(202,255,0,0.4)' : 'var(--surface-3)',
                      border: isWorkout ? '2px solid var(--accent)' : '1px solid var(--border)',
                    }}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div
                    className="px-5 py-4 flex items-center justify-between gap-4"
                    style={{
                      background: 'var(--surface)',
                      border: `1px solid ${isWorkout ? 'var(--accent)' : isCardio ? 'rgba(202,255,0,0.3)' : 'var(--border)'}`,
                      borderLeft: `3px solid ${isWorkout ? 'var(--accent)' : isCardio ? 'rgba(202,255,0,0.5)' : 'var(--border)'}`,
                    }}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span
                          className="text-sm font-extrabold text-white"
                          style={{ fontFamily: 'Syne, sans-serif' }}
                        >
                          {isRest ? 'Rest Day' : day.workout?.dayOfWeek || dayName}
                        </span>
                        <span
                          className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5"
                          style={{
                            background: isWorkout ? 'var(--accent)' : isCardio ? 'rgba(202,255,0,0.15)' : 'var(--surface-3)',
                            color: isWorkout ? '#000' : isCardio ? 'var(--accent)' : 'var(--text-dim)',
                            fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em',
                          }}
                        >
                          {isWorkout ? 'Workout' : isCardio ? 'Cardio' : 'Rest'}
                        </span>
                      </div>
                      {!isRest && (
                        <p
                          className="text-xs font-medium truncate"
                          style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.03em' }}
                        >
                          {day.workout?.muscleGroups} · {exCount} exercise{exCount !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddExercise(day.dayOfWeek)}
                      className="text-[10px] font-bold uppercase tracking-widest px-3 py-2 shrink-0 transition-all hover:opacity-80"
                      style={{
                        fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em',
                        background: 'var(--surface-2)',
                        color: 'var(--text-dim)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {exCount === 0 ? '+ Add' : '+ Add Exercise'}
                    </button>
                  </div>

                  {/* Expanded exercise list */}
                  {exCount > 0 && (
                    <div className="mt-2 ml-0 space-y-2">
                      {day.workout.exercises.map((ex, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 px-4 py-2.5"
                          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                        >
                          <div
                            className="w-1.5 h-1.5 shrink-0"
                            style={{ background: isCardio ? 'rgba(202,255,0,0.5)' : 'var(--accent)' }}
                          />
                          <div className="flex-1 min-w-0">
                            <div
                              className="text-sm font-semibold text-white truncate"
                              style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.8rem' }}
                            >
                              {ex.name}
                            </div>
                            <div
                              className="text-[10px] font-medium"
                              style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}
                            >
                              {isCardio ? `${ex.reps} min` : `${ex.sets}×${ex.reps} @ ${ex.targetWeight}${user.unit}`}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => {
                                if (isWorkout) {
                                  // inline edit would go here
                                } else if (isCardio) {
                                  // cardio edit
                                }
                              }}
                              className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 transition-all"
                              style={{
                                color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif',
                                letterSpacing: '0.1em', border: '1px solid var(--border)',
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleRemoveExercise(day.dayOfWeek, ex.exerciseId)}
                              className="text-lg font-bold transition-all hover:opacity-60"
                              style={{ color: 'var(--border)', padding: '0 4px' }}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ExercisePicker
        isOpen={pickerOpen}
        onClose={() => { setPickerOpen(false); setPickerDay(null); }}
        onSelect={handleExerciseSelect}
        currentExerciseIds={currentExerciseIds}
        pplType={pickerPplType}
        unit={user.unit || 'lbs'}
      />
    </div>
  );
}
