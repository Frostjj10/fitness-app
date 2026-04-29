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
        <div
          className="text-xl font-extrabold tracking-tight"
          style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-dim)' }}
        >
          Loading...
        </div>
      </div>
    );
  }

  if (!schedule || !schedule.schedule) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div
          className="text-5xl font-extrabold mb-4"
          style={{ fontFamily: 'Syne, sans-serif', color: 'var(--border)' }}
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1
            className="text-4xl font-extrabold text-white tracking-tight"
            style={{ fontFamily: 'Syne, sans-serif' }}
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
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.2em' }}
        >
          {schedule.schedule.length} Week Block
        </div>
      </div>

      {/* Week selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible">
        {schedule.schedule.map((week, i) => (
          <button
            key={i}
            onClick={() => setSelectedWeek(i)}
            className="px-5 py-2.5 font-bold text-sm transition-all shrink-0"
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              background: selectedWeek === i ? 'var(--accent)' : 'var(--surface-2)',
              color: selectedWeek === i ? '#000' : 'var(--text-dim)',
              border: selectedWeek === i ? '2px solid var(--accent)' : '1px solid var(--border)',
            }}
          >
            Wk {week.weekNum}
          </button>
        ))}
      </div>

      {/* 7-day grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(dayName => {
          const day = currentWeek.days?.find(d => d.dayOfWeek === dayName);
          if (!day) return null;
          if (day.type === 'rest') return (
            <RestDayCard
              key={dayName}
              day={day}
              onAddExercise={(pplType) => handleAddExercise(day.dayOfWeek, pplType)}
              onRemoveExercise={(exerciseId) => handleRemoveExercise(day.dayOfWeek, exerciseId)}
            />
          );
          if (day.type === 'cardio') {
            return (
              <CardioDayCard
                key={dayName}
                day={day}
                onAddExercise={() => handleAddExercise(day.dayOfWeek)}
                onRemoveExercise={(exerciseId) => handleRemoveExercise(day.dayOfWeek, exerciseId)}
                onUpdateExercise={(exerciseId, updates) => handleUpdateExercise(day.dayOfWeek, exerciseId, updates)}
              />
            );
          }
          return (
            <WorkoutDayCard
              key={dayName}
              day={day}
              onAddExercise={() => handleAddExercise(day.dayOfWeek)}
              onRemoveExercise={(exerciseId) => handleRemoveExercise(day.dayOfWeek, exerciseId)}
              onUpdateExercise={(exerciseId, updates) => handleUpdateExercise(day.dayOfWeek, exerciseId, updates)}
            />
          );
        })}
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
