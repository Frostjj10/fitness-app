import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { buildMesocycle } from '../utils/scheduler';
import { DEFAULT_TEMPLATES } from '../utils/ppl';
import { formatDateLong } from '../utils/format';
import TemplateEditor from '../components/TemplateEditor';
import { generateTemplate } from '../utils/templateBuilder';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Dashboard({ user }) {
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [workoutDays, setWorkoutDays] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('ppl');
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [generatedFlash, setGeneratedFlash] = useState(null); // id of most recently generated template
  const [generatorParams, setGeneratorParams] = useState({
    daysPerWeek: 4,
    splitType: 'auto',
    equipment: ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'],
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
        // If dayTypes is empty/invalid, mark template as invalid
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

      // Only use DB templates that have valid dayTypes
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

  const nextWorkout = getNextWorkout();
  const activeDaysPerWeek = currentSchedule?.workoutDays?.length || 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">Welcome back, {user.name}</p>
        </div>
      </div>

      {!currentSchedule ? (
        <div className="bg-white rounded-2xl shadow-shadow-xl border border-slate-100 p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">Build Your Program</h2>
            <p className="text-slate-500 text-xs sm:text-sm">Choose your training days and a template to generate your 4-week block.</p>
          </div>

          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Select Training Days</p>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                    workoutDays.includes(day)
                      ? 'bg-slate-900 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Template</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setGeneratorOpen(true)}
                  className="text-xs text-orange-500 hover:text-orange-600 font-semibold"
                >
                  Smart Generate
                </button>
                <button
                  onClick={() => setEditorOpen(true)}
                  className="text-xs text-orange-500 hover:text-orange-600 font-semibold"
                >
                  Edit
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {templates.map(t => {
                const isGenerated = t.id.startsWith('generated-');
                const isFlash = generatedFlash === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`p-4 sm:p-5 rounded-xl border-2 text-left transition-all ${
                      selectedTemplate === t.id
                        ? isGenerated
                          ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                          : 'border-slate-900 bg-slate-900 text-white'
                        : isFlash
                        ? 'border-orange-300 bg-orange-50'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-sm flex-1">{t.name}</div>
                      {isGenerated && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${selectedTemplate === t.id ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'}`}>
                          Generated
                        </span>
                      )}
                    </div>
                    <div className={`text-xs mt-1 ${selectedTemplate === t.id ? (isGenerated ? 'text-orange-400' : 'text-slate-400') : 'text-slate-500'}`}>
                      {(() => {
                        const dt = Array.isArray(t.dayTypes) ? t.dayTypes : Array.isArray(t.day_types) ? t.day_types : [];
                        return `${dt.length} days`;
                      })()}
                    </div>
                    {isFlash && (
                      <div className="text-xs text-orange-500 font-semibold mt-1">✓ Template created!</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={generateSchedule}
            disabled={workoutDays.length === 0 || generating}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] transition-all shadow-lg shadow-orange-500/25 text-sm"
          >
            {generating ? 'Building...' : 'Generate 4-Week Block'}
          </button>
        </div>
      ) : (
        <div>
          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-slate-100 p-4 sm:p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Current Block</p>
              <p className="text-xs sm:text-sm font-bold text-slate-900">{formatDateLong(currentSchedule.startDate)}</p>
              <p className="text-xs text-slate-500">to {formatDateLong(currentSchedule.endDate)}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-4 sm:p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Week</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" style={{ width: `${getWeekProgress()}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-700">{Math.round(getWeekProgress())}%</span>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-4 sm:p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Days</p>
              <p className="text-xs sm:text-sm font-bold text-slate-900">{currentSchedule.workoutDays?.join(', ') || 'None'}</p>
            </div>
          </div>

          {/* Next workout */}
          {nextWorkout && (
            <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6 mt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M14.5 4l-5 6-3 5 6.5 6L20 10l-5.5-6z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-orange-500 uppercase tracking-wider">Next Workout</p>
                    <p className="text-base sm:text-lg font-bold text-slate-900">{nextWorkout.dayOfWeek}</p>
                    <p className="text-xs sm:text-sm text-slate-500">{nextWorkout.muscleGroups} · {nextWorkout.exercises?.length || 0} exercises</p>
                  </div>
                </div>
                <Link to="/log" className="w-full sm:w-auto text-center px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 active:scale-[0.98] transition-all text-sm">
                  Start
                </Link>
              </div>
            </div>
          )}

          {/* Quick stats */}
          <div className="bg-white rounded-xl border border-slate-100 p-4 sm:p-6 mt-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Block Overview</h2>
              <Link to="/schedule" className="text-xs text-orange-500 font-semibold hover:text-orange-600">View Schedule →</Link>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="text-center p-3 sm:p-4 bg-slate-50 rounded-xl">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{currentSchedule.schedule?.length || 0}</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">Weeks</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-slate-50 rounded-xl">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{activeDaysPerWeek}</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">Days/Wk</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-slate-50 rounded-xl">
                <div className="text-sm sm:text-xl font-extrabold text-orange-500 truncate">
                  {currentSchedule.templateId ? templates.find(t => t.id === currentSchedule.templateId)?.name || 'Custom' : '—'}
                </div>
                <div className="text-xs text-slate-500 mt-1 font-medium">Template</div>
              </div>
            </div>
          </div>

          <button
            onClick={clearSchedule}
            className="w-full mt-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-slate-300 hover:text-slate-600 font-medium text-sm transition-all"
          >
            + New Block
          </button>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-slate-900">Smart Generate</h2>
              <button onClick={() => setGeneratorOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
            </div>

            <div className="space-y-5">
              {/* Days per week */}
              <div>
                <label className="label">Training Days per Week</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="2"
                    max="6"
                    value={generatorParams.daysPerWeek}
                    onChange={e => setGeneratorParams(p => ({ ...p, daysPerWeek: parseInt(e.target.value) }))}
                    className="flex-1 accent-orange-500"
                  />
                  <span className="w-8 text-center font-bold text-slate-900">{generatorParams.daysPerWeek}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {generatorParams.daysPerWeek <= 3 ? 'Full Body split recommended' :
                   generatorParams.daysPerWeek === 4 ? 'Upper/Lower split recommended' : 'Push/Pull/Legs split recommended'}
                </p>
              </div>

              {/* Split type */}
              <div>
                <label className="label">Training Split</label>
                <select
                  value={generatorParams.splitType}
                  onChange={e => setGeneratorParams(p => ({ ...p, splitType: e.target.value }))}
                  className="input"
                >
                  <option value="auto">Auto (recommended)</option>
                  <option value="full-body">Full Body</option>
                  <option value="upper-lower">Upper / Lower</option>
                  <option value="ppl">Push / Pull / Legs</option>
                </select>
              </div>

              {/* Equipment */}
              <div>
                <label className="label">Available Equipment</label>
                <div className="grid grid-cols-2 gap-2">
                  {['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'].map(eq => (
                    <label key={eq} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={generatorParams.equipment.includes(eq)}
                        onChange={e => {
                          setGeneratorParams(p => ({
                            ...p,
                            equipment: e.target.checked
                              ? [...p.equipment, eq]
                              : p.equipment.filter(x => x !== eq),
                          }));
                        }}
                        className="rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                      />
                      <span className="capitalize">{eq}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* User profile summary */}
              <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 space-y-1">
                <div className="font-semibold text-slate-700 mb-2">Your Profile</div>
                <div>Goal: <span className="text-slate-700 capitalize">{user.goal}</span></div>
                <div>Experience: <span className="text-slate-700 capitalize">{user.experience}</span></div>
                <div>Weight: <span className="text-slate-700">{user.weight} {user.unit}</span></div>
              </div>

              <button
                onClick={() => {
                  const template = generateTemplate({
                    user,
                    daysPerWeek: generatorParams.daysPerWeek,
                    availableEquipment: generatorParams.equipment,
                    splitType: generatorParams.splitType,
                  });
                  setTemplates(prev => {
                    const filtered = prev.filter(t => !t.id.startsWith('generated-'));
                    return [...filtered, template];
                  });
                  setSelectedTemplate(template.id);
                  setGeneratedFlash(template.id);
                  setGeneratorOpen(false);
                  setTimeout(() => setGeneratedFlash(null), 3000);
                }}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] transition-all shadow-lg shadow-orange-500/25"
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
