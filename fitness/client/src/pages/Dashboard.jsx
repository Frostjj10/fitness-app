import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { buildMesocycle } from '../utils/scheduler';
import { DEFAULT_TEMPLATES } from '../utils/ppl';
import { formatDateLong } from '../utils/format';
import TemplateEditor from '../components/TemplateEditor';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Dashboard({ user }) {
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [workoutDays, setWorkoutDays] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('ppl');
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

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
        return { ...t, dayTypes: normalizedDayTypes };
      });

      const fetchedIds = new Set(normalized.map(t => t.id));
      const missingDefaults = defaultTemplates.filter(t => !fetchedIds.has(t.id));
      setTemplates([...missingDefaults, ...normalized]);
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

  const nextWorkout = getNextWorkout();
  const activeDaysPerWeek = currentSchedule?.workoutDays?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, {user.name}</p>
        </div>
        {currentSchedule && (
          <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-xl shadow-card">
            Week {selectedWeek + 1} of {currentSchedule.schedule?.length || 4}
          </div>
        )}
      </div>

      {!currentSchedule ? (
        <div className="card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
              <span className="text-xl">🎯</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Create Your Workout Block</h2>
              <p className="text-slate-500 text-sm">Pick your workout days and template — I'll build a personalized 4-week plan.</p>
            </div>
          </div>

          <div className="mb-8">
            <label className="section-title">Workout Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    workoutDays.includes(day)
                      ? 'bg-brand-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <label className="section-title">Template</label>
              <button
                onClick={() => setEditorOpen(true)}
                className="text-sm text-brand-600 hover:text-brand-800 font-semibold"
              >
                Customize Template
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedTemplate === t.id
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-semibold text-slate-900">{t.name}</div>
                  <div className="text-xs text-slate-500 mt-1">
                      {(() => {
                        const dt = Array.isArray(t.dayTypes) ? t.dayTypes : Array.isArray(t.day_types) ? t.day_types : [];
                        return `${dt.length} day${dt.length !== 1 ? 's' : ''} · ${dt.map(d => d.label).join(', ')}`;
                      })()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generateSchedule}
            disabled={workoutDays.length === 0 || generating}
            className="btn-primary text-lg"
          >
            {generating ? '⏳ Generating...' : '🚀 Generate 4-Week Plan'}
          </button>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-5">
              <div className="text-xs section-title mb-1">Current Block</div>
              <p className="text-sm font-bold text-slate-900">{formatDateLong(currentSchedule.startDate)}</p>
              <p className="text-xs text-slate-400">to {formatDateLong(currentSchedule.endDate)}</p>
            </div>
            <div className="card p-5">
              <div className="text-xs section-title mb-1">Week Progress</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-600 rounded-full transition-all" style={{ width: `${getWeekProgress()}%` }} />
                </div>
                <span className="text-xs font-bold text-brand-600">{Math.round(getWeekProgress())}%</span>
              </div>
            </div>
            <div className="card p-5">
              <div className="text-xs section-title mb-1">Schedule</div>
              <p className="text-sm font-bold text-slate-900">{currentSchedule.workoutDays?.join(', ') || 'None'}</p>
              <p className="text-xs text-slate-400 capitalize">{user.goal} · {user.experience}</p>
            </div>
          </div>

          <button
            onClick={clearSchedule}
            className="w-full mt-4 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-slate-400 hover:text-slate-600 font-semibold text-sm"
          >
            + Create New Block
          </button>
        </div>
      )}

      {nextWorkout && (
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-lift-100 flex items-center justify-center text-2xl">💪</div>
              <div>
                <div className="text-xs section-title mb-0.5">Next Workout</div>
                <div className="text-lg font-bold text-slate-900">{nextWorkout.dayOfWeek}</div>
                <div className="text-sm text-brand-600 font-medium">{nextWorkout.muscleGroups}</div>
              </div>
            </div>
            <Link to="/log" className="btn-primary">
              Start Workout →
            </Link>
          </div>
        </div>
      )}

      {currentSchedule && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900">Quick Stats</h2>
            <Link to="/schedule" className="text-sm text-brand-600 hover:text-brand-800 font-semibold">View Schedule →</Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <div className="text-3xl font-extrabold text-brand-600">{currentSchedule.schedule?.length || 0}</div>
              <div className="text-xs text-slate-500 mt-1 font-semibold">Weeks</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <div className="text-3xl font-extrabold text-brand-600">{activeDaysPerWeek}</div>
              <div className="text-xs text-slate-500 mt-1 font-semibold">Workout Days</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <div className="text-xl font-extrabold text-lift-600 truncate">
                {currentSchedule.templateId ? templates.find(t => t.id === currentSchedule.templateId)?.name || 'Custom' : '—'}
              </div>
              <div className="text-xs text-slate-500 mt-1 font-semibold">Template</div>
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
      />
    </div>
  );
}
