import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { buildMesocycle } from '../utils/scheduler';
import { DEFAULT_TEMPLATES } from '../utils/ppl';
import TemplateEditor from '../components/TemplateEditor';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Dashboard({ user }) {
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [workoutDays, setWorkoutDays] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('ppl');
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
      // Fetch full schedule data from schedule_weeks → schedule_days → workout_exercises
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

          // Normalize day from snake_case to camelCase and structure workout
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

      // Normalize week from snake_case to camelCase
      return {
        weekNum: week.week_num,
        startDate: week.start_date,
        days: daysWithWorkouts,
      };
    }));

    // Fetch the schedule metadata (without nested data)
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

    if (data?.length) {
      // Normalize templates from Supabase (snake_case) to internal format (camelCase)
      const normalized = data.map(t => {
        let dayTypes = t.dayTypes || t.day_types;
        // Handle stringified JSON
        if (typeof dayTypes === 'string') {
          try { dayTypes = JSON.parse(dayTypes); } catch { dayTypes = []; }
        }
        // Normalize each dayType's exercises from snake_case to camelCase
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
      setTemplates(normalized);
    } else {
      setTemplates([...DEFAULT_TEMPLATES]);
    }
  }

  function toggleDay(day) {
    setWorkoutDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  }

  function handleTemplateSave(savedTemplate) {
    if (savedTemplate) {
      // Normalize savedTemplate from Supabase (snake_case) to internal format (camelCase)
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

      // Save to Supabase
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

      // Deactivate old schedules
      await supabase
        .from('schedules')
        .update({ is_active: false })
        .neq('id', schedule.id)
        .eq('user_id', user.id);

      // Save schedule structure
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
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="text-gray-500">Welcome, {user.name}</div>
      </div>

      {!currentSchedule ? (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Create Your Workout Block</h2>
          <p className="text-gray-600 mb-6">
            Pick your workout days, choose a template, and I'll build a personalized 4-week plan.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-3 text-blue-700">Workout Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    workoutDays.includes(day)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-green-700">Template</label>
              <button
                onClick={() => setEditorOpen(true)}
                className="text-sm text-green-600 hover:text-green-800 font-medium"
              >
                Customize Template
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedTemplate === t.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
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
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-lg font-medium"
          >
            {generating ? 'Generating...' : 'Generate 4-Week Plan'}
          </button>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-3 gap-6 mb-4">
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Current Block</h3>
              <p className="text-2xl font-bold">{currentSchedule.startDate} — {currentSchedule.endDate}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">This Week</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${getWeekProgress()}%` }} />
                </div>
                <span className="text-sm font-medium">{Math.round(getWeekProgress())}%</span>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Schedule</h3>
              <p className="text-lg font-medium">
                {currentSchedule.workoutDays?.join(', ') || 'None'}
              </p>
            </div>
          </div>
          <button
            onClick={clearSchedule}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 font-medium"
          >
            + Create New Block
          </button>
        </div>
      )}

      {nextWorkout && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Next Workout</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">{nextWorkout.dayOfWeek}</div>
              <div className="text-xl font-bold">{nextWorkout.muscleGroups}</div>
              <div className="text-gray-600 mt-1">{nextWorkout.exercises?.length || 0} exercises</div>
            </div>
            <Link to="/log" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Start Workout
            </Link>
          </div>
        </div>
      )}

      {currentSchedule && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Quick Stats</h2>
            <Link to="/schedule" className="text-blue-600 hover:underline text-sm">View Full Schedule</Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{currentSchedule.schedule?.length || 0}</div>
              <div className="text-sm text-gray-500">Weeks</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{activeDaysPerWeek}</div>
              <div className="text-sm text-gray-500">Workout Days</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {currentSchedule.templateId ? templates.find(t => t.id === currentSchedule.templateId)?.name || 'Custom' : '—'}
              </div>
              <div className="text-sm text-gray-500">Template</div>
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
