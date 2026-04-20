import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getExercisePickerData, DEFAULT_TEMPLATES } from '../utils/ppl';
import { generateTemplate, GENERATOR_OPTIONS } from '../utils/templateBuilder';
import ExercisePicker from './ExercisePicker';

export default function TemplateEditor({ isOpen, onClose, onSave, templates = [], userId, user }) {
  const [view, setView] = useState('select'); // 'select' | 'edit'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editedTemplate, setEditedTemplate] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerDayIndex, setPickerDayIndex] = useState(null);
  const [allExercises, setAllExercises] = useState([]);
  const [aiGenOpen, setAiGenOpen] = useState(false);
  const [aiGenParams, setAiGenParams] = useState({
    daysPerWeek: 4,
    splitType: 'auto',
    equipment: ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'],
    sessionLength: 'medium',
    cardioLevel: 'moderate',
    includeMobility: false,
    priorityMuscles: [],
  });

  useEffect(() => {
    if (!isOpen) return;
    const data = getExercisePickerData();
    setAllExercises(data.all || []);
  }, [isOpen]);

  function resolveExercises(exercises) {
    if (!allExercises.length) return exercises;
    const exMap = {};
    for (const ex of allExercises) exMap[ex.id] = ex;
    return exercises.map(ex => {
      const def = exMap[ex.exerciseId];
      if (def) {
        return {
          ...ex,
          name: ex.name || def.name,
          muscleGroup: ex.muscleGroup || def.muscleGroup,
          primaryMuscle: ex.primaryMuscle || def.primary,
          equipment: ex.equipment || def.equipment,
        };
      }
      return ex;
    });
  }

  function handleClose() {
    setView('select');
    setSelectedTemplate(null);
    setEditedTemplate(null);
    onClose();
  }

  function startEdit(tpl) {
      setSelectedTemplate(tpl);
      // Deep clone to avoid mutating the original
      const normalized = JSON.parse(JSON.stringify(tpl));

      // Handle top-level day_types (JSONB string or object)
      if (normalized.day_types) {
        if (typeof normalized.day_types === 'string') {
          try { normalized.day_types = JSON.parse(normalized.day_types); } catch { normalized.day_types = []; }
        }
        // Promote to dayTypes if not already set
        if (!normalized.dayTypes) {
          normalized.dayTypes = normalized.day_types;
        }
        delete normalized.day_types;
      }

      // Normalize each dayType: ensure exercises have camelCase keys
      if (normalized.dayTypes && Array.isArray(normalized.dayTypes)) {
        normalized.dayTypes = normalized.dayTypes.map(dt => {
          // Parse stringified inner day_types if needed
          let innerExercises = dt.exercises || dt.day_types || [];
          if (typeof innerExercises === 'string') {
            try { innerExercises = JSON.parse(innerExercises); } catch { innerExercises = []; }
          }

          // Normalize each exercise: snake_case DB fields → camelCase
          const normalizedExercises = innerExercises.map(ex => ({
            exerciseId: ex.exercise_id || ex.exerciseId,
            name: ex.name || '',
            muscleGroup: ex.muscle_group || ex.muscleGroup || '',
            primaryMuscle: ex.primary || ex.primaryMuscle || '',
            equipment: ex.equipment || '',
            sets: ex.sets || 3,
            reps: ex.reps || 10,
            targetWeight: ex.target_weight || ex.targetWeight || 0,
            restSeconds: ex.rest_seconds || ex.restSeconds || 60,
            isCompound: ex.is_compound ?? ex.isCompound ?? false,
            unit: ex.unit || 'reps',
          }));

          return {
            label: dt.label || '',
            muscleGroups: dt.muscle_groups || dt.muscleGroups || '',
            exercises: normalizedExercises,
          };
        });
      }

      setEditedTemplate(normalized);
      setView('edit');
    }

  function createNew() {
    const newTpl = {
      id: `custom-${Date.now()}`,
      name: 'My Custom Template',
      is_default: false,
      isDefault: false,
      dayTypes: [
        { label: 'Day 1', muscleGroups: 'custom', exercises: [] },
      ],
    };
    setSelectedTemplate(null);
    setEditedTemplate(newTpl);
    setView('edit');
  }

  function updateTemplate(updates) {
    setEditedTemplate(prev => ({ ...prev, ...updates }));
  }

  function updateDayType(index, updates) {
    setEditedTemplate(prev => {
      const dayTypes = [...prev.dayTypes];
      dayTypes[index] = { ...dayTypes[index], ...updates };
      return { ...prev, dayTypes };
    });
  }

  function addDayType() {
    setEditedTemplate(prev => ({
      ...prev,
      dayTypes: [...prev.dayTypes, { label: `Day ${prev.dayTypes.length + 1}`, muscleGroups: 'custom', exercises: [] }],
    }));
  }

  function removeDayType(index) {
    setEditedTemplate(prev => ({
      ...prev,
      dayTypes: prev.dayTypes.filter((_, i) => i !== index),
    }));
  }

  function openPicker(dayIndex) {
    setPickerDayIndex(dayIndex);
    setPickerOpen(true);
  }

  function handleExerciseSelect(ex) {
    if (pickerDayIndex === null) return;
    // Ensure exercise has required identity fields
    if (!ex.id && !ex.name) {
      console.error('handleExerciseSelect called with invalid exercise:', ex);
      return;
    }
    // Use id if available, otherwise generate a temporary id based on name
    const exerciseId = ex.id || `custom-${ex.name?.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const exerciseEntry = {
      exerciseId: exerciseId,
      name: ex.name || 'Unknown Exercise',
      muscleGroup: ex.muscleGroup || 'custom',
      primaryMuscle: ex.primary || ex.muscleGroup || 'custom',
      equipment: ex.equipment || 'other',
      sets: 3,
      reps: 10,
      restSeconds: 60,
    };
    setEditedTemplate(prev => {
      const dayTypes = [...prev.dayTypes];
      dayTypes[pickerDayIndex] = {
        ...dayTypes[pickerDayIndex],
        exercises: [...(dayTypes[pickerDayIndex].exercises || []), exerciseEntry],
      };
      return { ...prev, dayTypes };
    });
    setPickerOpen(false);
    setPickerDayIndex(null);
  }

  function removeExercise(dayIndex, exerciseId) {
    setEditedTemplate(prev => {
      const dayTypes = [...prev.dayTypes];
      dayTypes[dayIndex] = {
        ...dayTypes[dayIndex],
        exercises: dayTypes[dayIndex].exercises.filter(e => e.exerciseId !== exerciseId),
      };
      return { ...prev, dayTypes };
    });
  }

  function updateExercise(dayIndex, exerciseId, updates) {
    setEditedTemplate(prev => {
      const dayTypes = [...prev.dayTypes];
      dayTypes[dayIndex] = {
        ...dayTypes[dayIndex],
        exercises: dayTypes[dayIndex].exercises.map(e =>
          e.exerciseId === exerciseId ? { ...e, ...updates } : e
        ),
      };
      return { ...prev, dayTypes };
    });
  }

  async function handleSave() {
    if (!editedTemplate) return;

    // Debug: verify exercises have required fields before saving
    const dayTypesSource = editedTemplate.dayTypes || editedTemplate.day_types || [];
    for (const dt of dayTypesSource) {
      for (const ex of (dt.exercises || [])) {
        if (!ex.exerciseId) {
          console.error('Exercise missing exerciseId before save:', ex, 'in dayType:', dt);
        }
      }
    }

    // Convert camelCase to snake_case for API
    const templateToSave = {
      id: editedTemplate.id,
      name: editedTemplate.name,
      is_default: editedTemplate.is_default || editedTemplate.isDefault || false,
      day_types: (editedTemplate.dayTypes || editedTemplate.day_types || []).map(dt => ({
        label: dt.label,
        muscle_groups: dt.muscleGroups,
        exercises: (dt.exercises || []).map((ex, exIdx) => {
          // Ensure exercise_id is always set
          const exerciseId = ex.exerciseId || `missing-id-${exIdx}-${Date.now()}`;
          return {
            exercise_id: exerciseId,
            name: ex.name || 'Unknown',
            sets: ex.sets,
            reps: ex.reps,
            rest_seconds: ex.restSeconds,
            target_weight: ex.targetWeight || 0,
            is_compound: ex.isCompound || false,
            unit: ex.unit || 'reps',
          };
        }),
      })),
    };

    // Generated templates (prefix 'generated-') never exist in Supabase, always INSERT them
    const isGenerated = (editedTemplate.id || '').startsWith('generated-');
    const isNew = isGenerated || !selectedTemplate || !templates.find(t => t.id === editedTemplate.id);

    let saved;
    if (isNew) {
      const { data } = await supabase
        .from('templates')
        .insert([{ ...templateToSave, created_by: userId }])
        .select()
        .single();
      saved = data;
    } else {
      const { data } = await supabase
        .from('templates')
        .update(templateToSave)
        .eq('id', editedTemplate.id)
        .select()
        .single();
      saved = data;
    }

    onSave(saved);
    handleClose();
  }

  async function handleDelete() {
    if (!selectedTemplate || selectedTemplate.is_default || selectedTemplate.isDefault) return;
    if (!confirm(`Delete "${selectedTemplate.name}"?`)) return;

    await supabase.from('templates').delete().eq('id', selectedTemplate.id);
    onSave(null);
    handleClose();
  }

  function handleRestoreDefault() {
    if (!selectedTemplate) return;
    const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.id === selectedTemplate.id);
    if (!defaultTemplate) return;
    if (!confirm(`Restore "${selectedTemplate.name}" to its default exercises? This cannot be undone.`)) return;
    // Deep clone the default template
    const restored = JSON.parse(JSON.stringify(defaultTemplate));
    setEditedTemplate(restored);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-bold">
              {view === 'select' ? 'Workout Templates' : `Edit: ${editedTemplate?.name}`}
            </h2>
            <p className="text-sm text-gray-500">
              {view === 'select' ? 'Choose a template to customize or create your own' : (editedTemplate?.id || '').startsWith('generated-') ? 'Generated template — click Save to keep it' : 'Edit day types and exercises'}
            </p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {view === 'select' ? (
            <div className="space-y-4">
              {/* Template cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templates.map(t => {
                  const isGenerated = (t.id || '').startsWith('generated-');
                  return (
                  <div
                    key={t.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      t.is_default || t.isDefault ? 'border-blue-200 bg-blue-50' : isGenerated ? 'border-orange-200 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => startEdit(t)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{t.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {(() => {
                            const dt = Array.isArray(t.dayTypes) ? t.dayTypes : Array.isArray(t.day_types) ? t.day_types : [];
                            return `${dt.length} day${dt.length !== 1 ? 's' : ''}`;
                          })()}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {(() => {
                            const dt = Array.isArray(t.dayTypes) ? t.dayTypes : Array.isArray(t.day_types) ? t.day_types : [];
                            return dt.map(d => d.label).join(', ');
                          })()}
                        </div>
                      </div>
                      {t.is_default || t.isDefault ? (
                        <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded">Default</span>
                      ) : isGenerated ? (
                        <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded">Generated</span>
                      ) : null}
                    </div>
                  </div>
                  );
                })}
              </div>

              {/* Create new */}
              <button
                onClick={createNew}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 font-medium"
              >
                + Create New Template
              </button>

              {/* AI Generate */}
              {user && (
                <button
                  onClick={() => setAiGenOpen(true)}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-lg hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25"
                >
                  AI Generate Template
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Template name */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">Template Name</label>
                  {selectedTemplate && (selectedTemplate.is_default || selectedTemplate.isDefault) && (
                    <button
                      onClick={handleRestoreDefault}
                      className="text-xs text-orange-600 hover:text-orange-800 font-medium"
                    >
                      Restore to Default
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={editedTemplate?.name || ''}
                  onChange={e => updateTemplate({ name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Day types */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Day Types</label>
                  <button
                    onClick={addDayType}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Day
                  </button>
                </div>

                {(editedTemplate?.dayTypes || editedTemplate?.day_types || []).map((dayType, di) => (
                  <div key={di} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="text"
                        value={dayType.label}
                        onChange={e => updateDayType(di, { label: e.target.value })}
                        className="flex-1 px-3 py-1.5 border rounded-lg text-sm font-medium"
                        placeholder="Day label (e.g. Push A)"
                      />
                      <span className="text-xs text-gray-500">{dayType.muscleGroups || dayType.muscle_groups}</span>
                      {(editedTemplate.dayTypes || editedTemplate.day_types || []).length > 1 && (
                        <button
                          onClick={() => removeDayType(di)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {/* Exercise list */}
                    <div className="space-y-2">
                      {(dayType.exercises || []).map((ex, ei) => {
                        const resolved = resolveExercises([ex])[0];
                        return (
                        <div key={ei} className="flex items-center gap-2 bg-white rounded-lg p-2">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{resolved?.name || ex.name || 'Unknown'}</div>
                            <div className="text-xs text-gray-400">{(resolved?.muscleGroup || ex.muscleGroup || '—')} · {(resolved?.equipment || ex.equipment || '—')}</div>
                          </div>
                          <input
                            type="number"
                            value={ex.sets}
                            onChange={e => updateExercise(di, ex.exerciseId, { sets: parseInt(e.target.value) || 1 })}
                            className="w-12 px-1 py-1 border rounded text-sm text-center"
                            min="1"
                            title="Sets"
                          />
                          <span className="text-xs text-gray-400">×</span>
                          <input
                            type="number"
                            value={ex.reps}
                            onChange={e => updateExercise(di, ex.exerciseId, { reps: parseInt(e.target.value) || 1 })}
                            className="w-12 px-1 py-1 border rounded text-sm text-center"
                            min="1"
                            title="Reps"
                          />
                          <span className="text-xs text-gray-400">@</span>
                          <input
                            type="number"
                            value={ex.targetWeight || ''}
                            onChange={e => updateExercise(di, ex.exerciseId, { targetWeight: parseFloat(e.target.value) || 0 })}
                            className="w-16 px-1 py-1 border rounded text-sm text-center"
                            placeholder="Auto"
                            title="Weight"
                          />
                          <span className="text-xs text-gray-400">·</span>
                          <input
                            type="number"
                            value={ex.restSeconds}
                            onChange={e => updateExercise(di, ex.exerciseId, { restSeconds: parseInt(e.target.value) || 0 })}
                            className="w-14 px-1 py-1 border rounded text-sm text-center"
                            title="Rest (s)"
                          />
                          <button
                            onClick={() => removeExercise(di, ex.exerciseId)}
                            className="text-red-400 hover:text-red-600 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                    </div>

                    <button
                      onClick={() => openPicker(di)}
                      className="mt-2 w-full py-1.5 border border-dashed border-gray-300 rounded text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600"
                    >
                      + Add Exercise
                    </button>
                  </div>
                ))}
              </div>

              {/* Delete (for custom templates) */}
              {selectedTemplate && !selectedTemplate.is_default && !selectedTemplate.isDefault && (
                <button
                  onClick={handleDelete}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Delete Template
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {view === 'edit' && (
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
            <button
              onClick={() => setView('select')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Save Template
            </button>
          </div>
        )}

        {/* Exercise picker */}
        <ExercisePicker
          isOpen={pickerOpen}
          onClose={() => { setPickerOpen(false); setPickerDayIndex(null); }}
          onSelect={handleExerciseSelect}
          currentExerciseIds={pickerDayIndex !== null ? ((editedTemplate?.dayTypes?.[pickerDayIndex] || editedTemplate?.day_types?.[pickerDayIndex])?.exercises?.map(e => e.exerciseId) || []) : []}
          pplType="all"
          unit="lbs"
        />

        {/* AI Generator Modal */}
        {aiGenOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" style={{ maxHeight: '92vh' }}>

              {/* Hero header */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-7 pt-7 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/40">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <button onClick={() => setAiGenOpen(false)} className="text-slate-500 hover:text-white text-2xl leading-none transition-colors">×</button>
                </div>
                <h2 className="text-xl font-black text-white tracking-tight">Smart Generate</h2>
                <p className="text-slate-400 text-sm mt-1">Build a custom training template tailored to your goals</p>
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto px-7 py-5 space-y-3" style={{ maxHeight: 'calc(92vh - 180px)' }}>

                {/* Training Days */}
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-5 text-white shadow-xl shadow-orange-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-100">Training Days per Week</span>
                    <span className="text-5xl font-black text-white leading-none">{aiGenParams.daysPerWeek}</span>
                  </div>
                  <input
                    type="range" min="2" max="6"
                    value={aiGenParams.daysPerWeek}
                    onChange={e => setAiGenParams(p => ({ ...p, daysPerWeek: parseInt(e.target.value) }))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-white bg-white/30"
                  />
                  <p className="text-xs text-orange-100 mt-2 font-semibold">
                    {aiGenParams.daysPerWeek <= 3 ? '→ Full Body split' :
                     aiGenParams.daysPerWeek === 4 ? '→ Upper / Lower split' : '→ Push / Pull / Legs split'}
                  </p>
                </div>

                {/* Split type */}
                <div className="bg-slate-900 rounded-2xl p-5 shadow-inner">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-3">Training Split</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'auto', label: 'Auto' },
                      { value: 'full-body', label: 'Full Body' },
                      { value: 'upper-lower', label: 'Upper/Lower' },
                      { value: 'ppl', label: 'Push Pull Legs' },
                    ].map(opt => {
                      const active = aiGenParams.splitType === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setAiGenParams(p => ({ ...p, splitType: opt.value }))}
                          className={`py-2.5 rounded-xl text-sm font-black text-center transition-all ${active
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Session length */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-3">Session Length</label>
                  <div className="grid grid-cols-3 gap-2">
                    {GENERATOR_OPTIONS.sessionLength.map(opt => {
                      const active = aiGenParams.sessionLength === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setAiGenParams(p => ({ ...p, sessionLength: opt.value }))}
                          className={`py-3 px-2 rounded-2xl text-center transition-all border-2 ${active
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-transparent text-white shadow-lg shadow-orange-500/30'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-orange-400 hover:bg-orange-50'
                          }`}
                        >
                          <div className={`text-sm font-black ${active ? 'text-white' : 'text-slate-700'}`}>{opt.label}</div>
                          <div className={`text-[10px] mt-0.5 ${active ? 'text-orange-200' : 'text-slate-400'}`}>{opt.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cardio */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-3">Cardio</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {GENERATOR_OPTIONS.cardioLevel.map(opt => {
                      const active = aiGenParams.cardioLevel === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setAiGenParams(p => ({ ...p, cardioLevel: opt.value }))}
                          className={`py-2.5 rounded-xl text-center transition-all ${active
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30'
                            : 'bg-slate-100 text-slate-500 hover:bg-orange-100 hover:text-orange-600'
                          }`}
                        >
                          <div className="text-xs font-black capitalize">{opt.label}</div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-400 mt-2 font-semibold">
                    {aiGenParams.cardioLevel === 'none' ? 'No cardio finisher added' :
                     aiGenParams.cardioLevel === 'light' ? '1 LISS session per week' :
                     aiGenParams.cardioLevel === 'moderate' ? 'HIIT + LISS mixed weekly' : 'High frequency cardio'}
                  </p>
                </div>

                {/* Priority muscles */}
                <div className="bg-slate-900 rounded-2xl p-5 shadow-inner">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Priority Muscles</label>
                  <p className="text-xs text-slate-600 mb-3">Add extra isolation volume to lagging muscle groups</p>
                  <div className="flex flex-wrap gap-2">
                    {GENERATOR_OPTIONS.priorityMuscles.map(opt => {
                      const isSelected = aiGenParams.priorityMuscles.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setAiGenParams(p => ({
                            ...p,
                            priorityMuscles: isSelected
                              ? p.priorityMuscles.filter(m => m !== opt.value)
                              : [...p.priorityMuscles, opt.value],
                          }))}
                          className={`py-1.5 px-3 rounded-full text-xs font-black transition-all ${isSelected
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mobility */}
                <div className="flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl px-5 py-4 shadow-inner">
                  <div>
                    <div className="text-sm font-black text-white">Mobility Warm-Up</div>
                    <div className="text-xs text-slate-400">Dynamic stretching &amp; activation circuit</div>
                  </div>
                  <button
                    onClick={() => setAiGenParams(p => ({ ...p, includeMobility: !p.includeMobility }))}
                    className={`w-12 h-7 rounded-full transition-all relative ${aiGenParams.includeMobility ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-slate-600'}`}
                  >
                    <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${aiGenParams.includeMobility ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>

                {/* Equipment */}
                <div className="bg-slate-900 rounded-2xl p-5 shadow-inner">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Equipment</label>
                    {aiGenParams.equipment.length <= 2 && (
                      <span className="text-[10px] font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full uppercase">Limited</span>
                    )}
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'].map(eq => (
                      <button
                        key={eq}
                        onClick={() => setAiGenParams(p => ({
                          ...p,
                          equipment: aiGenParams.equipment.includes(eq)
                            ? aiGenParams.equipment.filter(x => x !== eq)
                            : [...aiGenParams.equipment, eq],
                        }))}
                        className={`py-2.5 rounded-xl text-[10px] font-black capitalize transition-all ${aiGenParams.equipment.includes(eq)
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20'
                          : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {eq}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Profile strip */}
                {user && (
                  <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl px-5 py-4 shadow-inner">
                    <div className="flex gap-6">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Goal</p>
                        <p className="text-sm font-black text-white capitalize">{user.goal}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Experience</p>
                        <p className="text-sm font-black text-white capitalize">{user.experience}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Intensity</p>
                        <p className="text-sm font-black text-white">{user.intensity}/10</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer CTA */}
              <div className="px-7 pb-7 pt-4 bg-white">
                <button
                  onClick={() => {
                    if (aiGenParams.equipment.length === 0) {
                      alert('Please select at least one equipment option.');
                      return;
                    }
                    try {
                      const template = generateTemplate({
                        user,
                        daysPerWeek: aiGenParams.daysPerWeek,
                        availableEquipment: aiGenParams.equipment,
                        splitType: aiGenParams.splitType,
                        sessionLength: aiGenParams.sessionLength,
                        cardioLevel: aiGenParams.cardioLevel,
                        includeMobility: aiGenParams.includeMobility,
                        priorityMuscles: aiGenParams.priorityMuscles,
                      });
                      setAiGenOpen(false);
                      startEdit(template);
                    } catch (err) {
                      console.error('Template generation failed:', err);
                      alert(err.message || 'Template generation failed. Try selecting more equipment.');
                    }
                  }}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 bg-[length:200%_100%] text-white text-sm font-black rounded-2xl hover:shadow-xl hover:shadow-orange-500/40 active:scale-[0.98] transition-all"
                >
                  Generate &amp; Edit
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
