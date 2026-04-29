import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { buildMesocycle } from '../utils/scheduler';
import { DEFAULT_TEMPLATES } from '../utils/ppl';
import { formatDateLong } from '../utils/format';
import TemplateEditor from '../components/TemplateEditor';
import { generateTemplate, GENERATOR_OPTIONS } from '../utils/templateBuilder';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Dashboard({ user }) {
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [workoutDays, setWorkoutDays] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('ppl');
  const [generating, setGenerating] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [generatedFlash, setGeneratedFlash] = useState(null);
  const [generatorParams, setGeneratorParams] = useState({
    daysPerWeek: 4,
    splitType: 'auto',
    equipment: ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'],
    sessionLength: 'medium',
    cardioLevel: 'moderate',
    includeMobility: false,
    priorityMuscles: [],
  });

  useEffect(() => {
    fetchCurrentSchedule();
    fetchTemplates();
  }, []);

  async function fetchCurrentSchedule() {
    const { data } = await supabase
      .from('schedules')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    if (data) {
      const fullSchedule = await loadFullSchedule(data.id);
      setCurrentSchedule(fullSchedule);
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
      startDate: scheduleMeta?.start_date,
      endDate: scheduleMeta?.end_date,
      workoutDays: scheduleMeta?.workout_days || [],
      templateId: scheduleMeta?.template_id,
      schedule: scheduleWithWeeks,
    };
  }

  async function fetchTemplates() {
    const { data } = await supabase
      .from('templates')
      .select('*')
      .or(`is_default.eq.true,created_by.eq.${user.id}`);

    const defaultTemplates = [...DEFAULT_TEMPLATES];

    if (data?.length) {
      const normalized = data.map(t => {
        let dayTypes = t.dayTypes || t.day_types;
        if (typeof dayTypes === 'string') {
          try { dayTypes = JSON.parse(dayTypes); } catch { dayTypes = []; }
        }
        if (!dayTypes || !Array.isArray(dayTypes) || dayTypes.length < 2) {
          return { ...t, dayTypes: [], _invalid: true };
        }
        const normalizedDayTypes = dayTypes.map(dt => {
          const exercises = (dt.exercises || dt.day_types || []).map(ex => ({
            exerciseId: ex.exercise_id || ex.exerciseId,
            name: ex.name,
            muscleGroup: ex.muscle_group || ex.muscleGroup,
            sets: ex.sets,
            reps: ex.reps,
            targetWeight: ex.target_weight || ex.targetWeight,
            restSeconds: ex.rest_seconds || ex.restSeconds,
            isCompound: ex.is_compound ?? ex.isCompound,
            unit: ex.unit || 'reps',
          }));
          return {
            label: dt.label,
            muscleGroups: dt.muscle_groups || dt.muscleGroups,
            exercises,
          };
        });
        return { ...t, dayTypes: normalizedDayTypes };
      });

      const validDbTemplates = normalized.filter(t => !t._invalid);
      const fetchedIds = new Set(validDbTemplates.map(t => t.id));
      const missingDefaults = defaultTemplates.filter(t => !fetchedIds.has(t.id));
      setTemplates([...missingDefaults, ...validDbTemplates]);
    } else {
      setTemplates(defaultTemplates);
    }
  }

  function toggleDay(day) {
    setWorkoutDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  }

  function handleTemplateSave(savedTemplate) {
    if (savedTemplate) {
      let dayTypes = savedTemplate.dayTypes || savedTemplate.day_types;
      if (typeof dayTypes === 'string') {
        try { dayTypes = JSON.parse(dayTypes); } catch { dayTypes = []; }
      }
      const normalizedDayTypes = (Array.isArray(dayTypes) ? dayTypes : []).map(dt => {
        const exercises = (dt.exercises || dt.day_types || []).map(ex => ({
          exerciseId: ex.exercise_id || ex.exerciseId,
          name: ex.name,
          muscleGroup: ex.muscle_group || ex.muscleGroup,
          sets: ex.sets,
          reps: ex.reps,
          targetWeight: ex.target_weight || ex.targetWeight,
          restSeconds: ex.rest_seconds || ex.restSeconds,
          isCompound: ex.is_compound ?? ex.isCompound,
          unit: ex.unit || 'reps',
        }));
        return {
          label: dt.label,
          muscleGroups: dt.muscle_groups || dt.muscleGroups,
          exercises,
        };
      });
      const normalized = { ...savedTemplate, dayTypes: normalizedDayTypes };

      setTemplates(prev => {
        const idx = prev.findIndex(t => t.id === normalized.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = normalized;
          return updated;
        }
        return [...prev, normalized];
      });
      setSelectedTemplate(savedTemplate.id);
    } else {
      fetchTemplates();
    }
  }

  async function generateSchedule() {
    if (workoutDays.length === 0) return;
    setGenerating(true);

    try {
      const schedule = buildMesocycle(
        user,
        workoutDays,
        new Date().toISOString().split('T')[0],
        selectedTemplate,
        null,
        templates
      );

      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedules')
        .insert([{
          id: schedule.id,
          user_id: user.id,
          start_date: schedule.startDate,
          end_date: schedule.endDate,
          goal: schedule.goal,
          workout_days: schedule.workoutDays,
          template_id: schedule.templateId,
          is_active: true,
        }])
        .select()
        .single();

      if (scheduleError) throw scheduleError;

      await supabase
        .from('schedules')
        .update({ is_active: false })
        .neq('id', schedule.id)
        .eq('user_id', user.id);

      for (const week of schedule.schedule) {
        const { data: weekData } = await supabase
          .from('schedule_weeks')
          .insert([{
            schedule_id: schedule.id,
            week_num: week.weekNum,
            start_date: week.startDate,
          }])
          .select()
          .single();

        if (weekData) {
          for (const day of week.days) {
            const { data: dayData } = await supabase
              .from('schedule_days')
              .insert([{
                schedule_week_id: weekData.id,
                day_of_week: day.dayOfWeek,
                date: day.date,
                type: day.type,
                workout_label: day.workout?.dayOfWeek,
                muscle_groups: day.workout?.muscleGroups,
              }])
              .select()
              .single();

            if (dayData && day.workout?.exercises?.length) {
              await supabase.from('workout_exercises').insert(
                day.workout.exercises.map((ex, i) => ({
                  schedule_day_id: dayData.id,
                  exercise_id: ex.exerciseId,
                  name: ex.name,
                  muscle_group: ex.muscleGroup,
                  sets: ex.sets,
                  reps: ex.reps,
                  target_weight: ex.targetWeight || 0,
                  rest_seconds: ex.restSeconds || 60,
                  is_compound: ex.isCompound || false,
                  unit: ex.unit || 'reps',
                  sort_order: i,
                }))
              );
            }
          }
        }
      }

      const fullSchedule = await loadFullSchedule(schedule.id);
      setCurrentSchedule(fullSchedule);
    } finally {
      setGenerating(false);
    }
  }

  async function clearSchedule() {
    if (!currentSchedule) return;
    if (!confirm('Start a new block? Your current schedule will be archived.')) return;

    await supabase
      .from('schedules')
      .update({ is_active: false })
      .eq('id', currentSchedule.id);

    setCurrentSchedule(null);
    setWorkoutDays([]);
  }

  function getNextWorkout() {
    if (!currentSchedule) return null;
    const today = new Date().toLocaleDateString('en-CA');
    for (const week of currentSchedule.schedule || []) {
      for (const day of week.days || []) {
        if (day.date >= today && day.type === 'workout' && day.workout) return day.workout;
      }
    }
    return null;
  }

  function getWeekProgress() {
    if (!currentSchedule) return 0;
    const today = new Date();
    const weekNum = Math.floor(today.getDate() / 7);
    return Math.min((weekNum / 4) * 100, 100);
  }

  function getScheduledDays() {
    if (!currentSchedule) return [];
    const seen = new Set();
    const days = [];
    for (const week of currentSchedule.schedule || []) {
      for (const day of week.days || []) {
        if (day.type === 'workout' && day.workout && !seen.has(day.dayOfWeek)) {
          seen.add(day.dayOfWeek);
          days.push({ dayOfWeek: day.dayOfWeek, date: day.date, workout: day.workout });
        }
      }
    }
    return days;
  }

  const nextWorkout = getNextWorkout();
  const activeDaysPerWeek = currentSchedule?.workoutDays?.length || 0;
  const scheduledDays = getScheduledDays();

  return (
    <div>
      {/* Page header — full width accent bar */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1
            className="text-6xl font-extrabold text-white tracking-tighter"
            style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.04em' }}
          >
            {currentSchedule ? 'Your Block' : 'Build a Program'}
          </h1>
          <p
            className="text-base font-medium mt-3"
            style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}
          >
            {currentSchedule ? `Week ${currentSchedule.schedule?.[0]?.weekNum || 1} · ${currentSchedule.workoutDays?.length || 0} days/week` : `Hey ${user.name}, let's set up your training`}
          </p>
        </div>
        {currentSchedule && (
          <Link
            to="/log"
            className="btn-primary shrink-0"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.875rem', padding: '16px 32px' }}
          >
            Start Workout →
          </Link>
        )}
      </div>

      {/* 2-col asymmetric layout when schedule exists */}
      {currentSchedule ? (
        <div className="grid grid-cols-12 gap-6">
          {/* Left col — main content (8 cols) */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Next workout highlight */}
            {nextWorkout && (
              <div
                className="p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
                style={{ background: 'var(--surface)', borderLeft: '4px solid var(--accent)' }}
              >
                <div className="flex items-center gap-5">
                  <div
                    className="w-14 h-14 flex items-center justify-center shrink-0"
                    style={{ background: 'var(--accent)' }}
                  >
                    <svg className="w-7 h-7 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                      <path d="M14.5 4l-5 6-3 5 6.5 6L20 10l-5.5-6z"/>
                    </svg>
                  </div>
                  <div>
                    <p
                      className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1"
                      style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}
                    >
                      Up Next
                    </p>
                    <p
                      className="text-2xl font-extrabold text-white"
                      style={{ fontFamily: 'Syne, sans-serif' }}
                    >
                      {nextWorkout.dayOfWeek}
                    </p>
                    <p
                      className="text-xs font-medium mt-0.5"
                      style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}
                    >
                      {nextWorkout.muscleGroups} · {nextWorkout.exercises?.length || 0} exercises
                    </p>
                  </div>
                </div>
                <Link
                  to="/log"
                  className="btn-primary text-center"
                  style={{
                    fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800,
                    letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.875rem',
                    padding: '12px 24px', flexShrink: 0,
                  }}
                >
                  Log Workout
                </Link>
              </div>
            )}

            {/* This week's days — horizontal scroll strip */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 className="text-base font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                  This Week
                </h2>
                <Link
                  to="/schedule"
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}
                >
                  Full Schedule →
                </Link>
              </div>
              <div className="flex overflow-x-auto scrollbar-hide">
                {scheduledDays.map(w => {
                  const isNext = nextWorkout?.dayOfWeek === w.dayOfWeek;
                  return (
                    <Link
                      key={w.dayOfWeek}
                      to="/log"
                      className="min-w-[140px] p-5 flex flex-col items-center gap-3 text-center transition-all hover:opacity-80"
                      style={{
                        background: isNext ? 'rgba(202,255,0,0.08)' : 'transparent',
                        borderRight: '1px solid var(--border)',
                      }}
                    >
                      <div
                        className="text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: isNext ? 'var(--accent)' : 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}
                      >
                        {w.dayOfWeek.slice(0, 3)}
                      </div>
                      <div
                        className="w-10 h-10 flex items-center justify-center"
                        style={{ background: isNext ? 'var(--accent)' : 'var(--surface-2)' }}
                      >
                        <svg className="w-4 h-4" style={{ color: isNext ? '#000' : 'var(--text-dim)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                          <path d="M14.5 4l-5 6-3 5 6.5 6L20 10l-5.5-6z"/>
                        </svg>
                      </div>
                      <div className="text-[10px] font-medium capitalize" style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                        {w.workout.muscleGroups.split(',')[0]}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Block stats */}
            <div className="grid grid-cols-3 gap-5">
              <div className="p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="stat-number text-4xl">{currentSchedule.schedule?.length || 0}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}>
                  Weeks
                </div>
              </div>
              <div className="p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="stat-number text-3xl">{activeDaysPerWeek}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}>
                  Days/Wk
                </div>
              </div>
              <div className="p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="text-sm font-bold truncate" style={{ color: 'var(--accent)', fontFamily: 'Syne, sans-serif' }}>
                  {currentSchedule.templateId ? templates.find(t => t.id === currentSchedule.templateId)?.name || 'Custom' : '—'}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}>
                  Template
                </div>
              </div>
            </div>

            {/* Date range */}
            <div className="px-5 py-4 flex items-center justify-between" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}>
                  Current Block
                </div>
                <div className="text-sm font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {formatDateLong(currentSchedule.startDate)} — {formatDateLong(currentSchedule.endDate)}
                </div>
              </div>
              <button
                onClick={clearSchedule}
                className="text-[10px] font-bold uppercase tracking-wider transition-all hover:opacity-70"
                style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}
              >
                + New Block
              </button>
            </div>
          </div>

          {/* Right col — sidebar (4 cols) */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Week progress */}
            <div className="p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}>
                Block Progress
              </div>
              <div className="text-5xl font-extrabold leading-none mb-4" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)' }}>
                {Math.round(getWeekProgress())}%
              </div>
              <div className="h-2" style={{ background: 'var(--surface-3)' }}>
                <div className="h-full transition-all" style={{ width: `${getWeekProgress()}%`, background: 'var(--accent)' }} />
              </div>
              <div className="mt-2 text-xs font-medium" style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                Week {Math.ceil((getWeekProgress() / 100) * (currentSchedule.schedule?.length || 4))} of {currentSchedule.schedule?.length || 4}
              </div>
            </div>

            {/* Quick actions */}
            <div className="p-5 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}>
                Quick Actions
              </div>
              <Link
                to="/schedule"
                className="flex items-center justify-between py-2 text-sm font-bold transition-all hover:opacity-80"
                style={{ color: 'var(--text)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}
              >
                Edit Schedule <span style={{ color: 'var(--text-dim)' }}>→</span>
              </Link>
              <Link
                to="/progress"
                className="flex items-center justify-between py-2 text-sm font-bold transition-all hover:opacity-80"
                style={{ color: 'var(--text)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}
              >
                View Progress <span style={{ color: 'var(--text-dim)' }}>→</span>
              </Link>
              <button
                onClick={() => setEditorOpen(true)}
                className="flex items-center justify-between py-2 text-sm font-bold transition-all hover:opacity-80 w-full"
                style={{ color: 'var(--text)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}
              >
                Edit Templates <span style={{ color: 'var(--text-dim)' }}>→</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* NO SCHEDULE — full-width program builder */
        <div>
          {/* Training days selector — full width visual strip */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}>
                Select Training Days
              </p>
              <button
                onClick={() => setGeneratorOpen(true)}
                className="text-[10px] font-bold uppercase tracking-wider transition-all hover:opacity-80"
                style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}
              >
                ✦ Smart Generate
              </button>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {DAYS.map(day => {
                const active = workoutDays.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className="py-4 font-bold text-xs transition-all flex flex-col items-center gap-2"
                    style={{
                      fontFamily: 'Barlow Condensed, sans-serif',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      background: active ? 'var(--accent)' : 'var(--surface-2)',
                      color: active ? '#000' : 'var(--text-dim)',
                      border: active ? '2px solid var(--accent)' : '1px solid var(--border)',
                    }}
                  >
                    <div
                      className="w-2 h-2 transition-all"
                      style={{ background: active ? '#000' : 'var(--border)', borderRadius: 0 }}
                    />
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Template + Generate — 2-col */}
          <div className="grid grid-cols-12 gap-6">
            {/* Template list — 8 cols */}
            <div className="col-span-12 lg:col-span-8">
              <div className="p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-extrabold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                    Choose Template
                  </h2>
                  <button
                    onClick={() => setEditorOpen(true)}
                    className="text-[10px] font-bold uppercase tracking-wider transition-all hover:opacity-80"
                    style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}
                  >
                    Edit / Create
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {templates.map(t => {
                    const isGenerated = t.id.startsWith('generated-');
                    const isFlash = generatedFlash === t.id;
                    const isSelected = selectedTemplate === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTemplate(t.id)}
                        className="p-4 text-left transition-all"
                        style={{
                          border: `2px solid ${isSelected ? (isGenerated ? 'var(--accent)' : 'var(--text)') : 'var(--border)'}`,
                          background: isSelected
                            ? (isGenerated ? 'rgba(202,255,0,0.12)' : 'var(--text)')
                            : isFlash
                            ? 'rgba(202,255,0,0.08)'
                            : 'var(--surface-2)',
                        }}
                      >
                        <div
                          className="font-bold text-sm flex-1"
                          style={{
                            fontFamily: 'Syne, sans-serif',
                            color: isSelected ? (isGenerated ? '#000' : '#000') : 'var(--text)',
                          }}
                        >
                          {t.name}
                        </div>
                        <div
                          className="text-xs mt-1 font-medium"
                          style={{
                            color: isSelected ? (isGenerated ? '#000' : 'var(--text-dim)') : 'var(--text-dim)',
                            fontFamily: 'Barlow Condensed, sans-serif',
                          }}
                        >
                          {(() => {
                            const dt = Array.isArray(t.dayTypes) ? t.dayTypes : Array.isArray(t.day_types) ? t.day_types : [];
                            return `${dt.length} days`;
                          })()}
                        </div>
                        {isFlash && (
                          <div className="text-xs font-bold mt-1" style={{ color: 'var(--accent)' }}>
                            Just generated!
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Generate CTA — 4 cols */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
              <div className="p-6 flex-1" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}>
                  Ready to Train?
                </div>
                <div className="text-3xl font-extrabold text-white leading-tight mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Generate<br/>
                  <span style={{ color: 'var(--accent)' }}>4-Week</span><br/>
                  Block
                </div>
                <button
                  onClick={generateSchedule}
                  disabled={workoutDays.length === 0 || generating}
                  className="btn-primary w-full"
                  style={{
                    fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800,
                    letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '1rem',
                    padding: '16px 24px',
                    opacity: (workoutDays.length === 0 || generating) ? 0.4 : 1,
                    cursor: (workoutDays.length === 0 || generating) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {generating ? 'Building...' : 'Generate Block'}
                </button>
                {workoutDays.length === 0 && (
                  <p className="text-xs font-medium mt-3 text-center" style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.03em' }}>
                    Select training days above to continue
                  </p>
                )}
              </div>

              {/* Profile snapshot */}
              <div className="p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}>
                  Your Profile
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Goal', value: user.goal },
                    { label: 'Experience', value: user.experience },
                    { label: 'Intensity', value: `${user.intensity}/10` },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        {item.label}
                      </span>
                      <span className="text-sm font-bold text-white capitalize" style={{ fontFamily: 'Syne, sans-serif' }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <TemplateEditor
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleTemplateSave}
        templates={templates}
        userId={user.id}
        user={user}
      />

      {/* Smart Generator Modal */}
      {generatorOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(8,8,12,0.92)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className="w-full max-w-md overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="px-7 pt-7 pb-6" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                  <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="square">
                    <path strokeLinecap="square" strokeLinejoin="miter" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <button onClick={() => setGeneratorOpen(false)} className="text-3xl leading-none" style={{ color: 'var(--text-dim)' }}>×</button>
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
                Smart Generate
              </h2>
              <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.03em' }}>
                Build a custom training template
              </p>
            </div>

            <div className="overflow-y-auto px-7 py-5 space-y-3" style={{ maxHeight: 'calc(92vh - 180px)', flex: 1 }}>
              {/* Training Days */}
              <div className="p-5" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}>
                    Training Days / Week
                  </span>
                  <span className="text-5xl font-extrabold leading-none" style={{ color: 'var(--accent)', fontFamily: 'Syne, sans-serif' }}>
                    {generatorParams.daysPerWeek}
                  </span>
                </div>
                <input
                  type="range" min="2" max="6"
                  value={generatorParams.daysPerWeek}
                  onChange={e => setGeneratorParams(p => ({ ...p, daysPerWeek: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <p className="text-xs font-bold mt-3" style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>
                  {generatorParams.daysPerWeek <= 3 ? '→ Full Body split' :
                   generatorParams.daysPerWeek === 4 ? '→ Upper / Lower split' : '→ Push / Pull / Legs split'}
                </p>
              </div>

              {/* Split type */}
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }} className="p-5">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-3" style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}>
                  Training Split
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'auto', label: 'Auto' },
                    { value: 'full-body', label: 'Full Body' },
                    { value: 'upper-lower', label: 'Upper/Lower' },
                    { value: 'ppl', label: 'Push Pull Legs' },
                  ].map(opt => {
                    const active = generatorParams.splitType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setGeneratorParams(p => ({ ...p, splitType: opt.value }))}
                        className="py-2.5 text-sm font-bold text-center transition-all"
                        style={{
                          fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          background: active ? 'var(--accent)' : 'var(--surface-3)',
                          color: active ? '#000' : 'var(--text-dim)',
                          border: active ? '2px solid var(--accent)' : '1px solid var(--border)',
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Session length */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-3" style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}>
                  Session Length
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {GENERATOR_OPTIONS.sessionLength.map(opt => {
                    const active = generatorParams.sessionLength === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setGeneratorParams(p => ({ ...p, sessionLength: opt.value }))}
                        className="py-3 px-2 text-center transition-all border-2 font-bold text-sm"
                        style={{
                          fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          background: active ? 'var(--accent)' : 'var(--surface-2)',
                          color: active ? '#000' : 'var(--text-dim)',
                          borderColor: active ? 'var(--accent)' : 'var(--border)',
                        }}
                      >
                        {opt.label}
                        <div className="text-[10px] mt-0.5 font-medium" style={{ color: active ? '#000' : 'var(--text-dim)' }}>
                          {opt.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cardio */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-3" style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}>
                  Cardio
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {GENERATOR_OPTIONS.cardioLevel.map(opt => {
                    const active = generatorParams.cardioLevel === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setGeneratorParams(p => ({ ...p, cardioLevel: opt.value }))}
                        className="py-2.5 text-center transition-all font-bold text-sm border-2"
                        style={{
                          fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          background: active ? 'var(--accent)' : 'var(--surface-2)',
                          color: active ? '#000' : 'var(--text-dim)',
                          borderColor: active ? 'var(--accent)' : 'var(--border)',
                        }}
                      >
                        <span className="text-xs capitalize">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Equipment */}
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }} className="p-5">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-3" style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}>
                  Equipment
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'].map(eq => (
                    <button
                      key={eq}
                      onClick={() => setGeneratorParams(p => ({
                        ...p,
                        equipment: generatorParams.equipment.includes(eq)
                          ? generatorParams.equipment.filter(x => x !== eq)
                          : [...generatorParams.equipment, eq],
                      }))}
                      className="py-2.5 text-[10px] font-bold capitalize transition-all"
                      style={{
                        fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        background: generatorParams.equipment.includes(eq) ? 'var(--accent)' : 'var(--surface-3)',
                        color: generatorParams.equipment.includes(eq) ? '#000' : 'var(--text-dim)',
                        border: generatorParams.equipment.includes(eq) ? '2px solid var(--accent)' : '1px solid var(--border)',
                      }}
                    >
                      {eq}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-7 pb-7 pt-4" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => {
                  if (generatorParams.equipment.length === 0) {
                    alert('Please select at least one equipment option.');
                    return;
                  }
                  try {
                    const template = generateTemplate({
                      user,
                      daysPerWeek: generatorParams.daysPerWeek,
                      availableEquipment: generatorParams.equipment,
                      splitType: generatorParams.splitType,
                      sessionLength: generatorParams.sessionLength,
                      cardioLevel: generatorParams.cardioLevel,
                      includeMobility: generatorParams.includeMobility,
                      priorityMuscles: generatorParams.priorityMuscles,
                    });
                    setTemplates(prev => {
                      const filtered = prev.filter(t => !t.id.startsWith('generated-'));
                      return [...filtered, template];
                    });
                    setSelectedTemplate(template.id);
                    setGeneratedFlash(template.id);
                    setGeneratorOpen(false);
                    setTimeout(() => setGeneratedFlash(null), 3000);
                  } catch (err) {
                    console.error('Template generation failed:', err);
                    alert(err.message || 'Template generation failed. Try selecting more equipment.');
                  }
                }}
                className="btn-primary w-full"
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800,
                  letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '1rem',
                  padding: '16px 24px', background: 'var(--accent)', color: '#000',
                }}
              >
                Generate Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
