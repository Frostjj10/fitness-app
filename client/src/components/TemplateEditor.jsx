import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getExercisePickerData, DEFAULT_TEMPLATES } from '../utils/ppl';
import { generateTemplate, GENERATOR_OPTIONS } from '../utils/templateBuilder';
import ExercisePicker from './ExercisePicker';

export default function TemplateEditor({ isOpen, onClose, onSave, templates = [], userId, user }) {
  const [view, setView] = useState('select');
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
    const normalized = JSON.parse(JSON.stringify(tpl));

    if (normalized.day_types) {
      if (typeof normalized.day_types === 'string') {
        try { normalized.day_types = JSON.parse(normalized.day_types); } catch { normalized.day_types = []; }
      }
      if (!normalized.dayTypes) {
        normalized.dayTypes = normalized.day_types;
      }
      delete normalized.day_types;
    }

    if (normalized.dayTypes && Array.isArray(normalized.dayTypes)) {
      normalized.dayTypes = normalized.dayTypes.map(dt => {
        let innerExercises = dt.exercises || dt.day_types || [];
        if (typeof innerExercises === 'string') {
          try { innerExercises = JSON.parse(innerExercises); } catch { innerExercises = []; }
        }

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
    if (!ex.id && !ex.name) {
      console.error('handleExerciseSelect called with invalid exercise:', ex);
      return;
    }
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

    const dayTypesSource = editedTemplate.dayTypes || editedTemplate.day_types || [];
    for (const dt of dayTypesSource) {
      for (const ex of (dt.exercises || [])) {
        if (!ex.exerciseId) {
          console.error('Exercise missing exerciseId before save:', ex, 'in dayType:', dt);
        }
      }
    }

    const templateToSave = {
      id: editedTemplate.id,
      name: editedTemplate.name,
      is_default: editedTemplate.is_default || editedTemplate.isDefault || false,
      day_types: (editedTemplate.dayTypes || editedTemplate.day_types || []).map(dt => ({
        label: dt.label,
        muscle_groups: dt.muscleGroups,
        exercises: (dt.exercises || []).map((ex, exIdx) => {
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
    const restored = JSON.parse(JSON.stringify(defaultTemplate));
    setEditedTemplate(restored);
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(8,8,12,0.9)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}
        >
          <div>
            <h2
              className="text-xl font-extrabold text-white tracking-tight"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              {view === 'select' ? 'Workout Templates' : `Edit: ${editedTemplate?.name}`}
            </h2>
            <p
              className="text-sm font-medium mt-0.5"
              style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.03em' }}
            >
              {view === 'select' ? 'Choose a template to customize or create your own' : (editedTemplate?.id || '').startsWith('generated-') ? 'Generated template — click Save to keep it' : 'Edit day types and exercises'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-3xl leading-none transition-colors font-light"
            style={{ color: 'var(--text-dim)' }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-5">
          {view === 'select' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {templates.map(t => {
                  const isGenerated = (t.id || '').startsWith('generated-');
                  return (
                    <div
                      key={t.id}
                      className="p-5 cursor-pointer transition-all"
                      style={{
                        border: `2px solid ${t.is_default || t.isDefault ? 'var(--text)' : isGenerated ? 'var(--accent)' : 'var(--border)'}`,
                        background: t.is_default || t.isDefault ? 'var(--text)' : isGenerated ? 'rgba(202,255,0,0.06)' : 'var(--surface-2)',
                      }}
                      onClick={() => startEdit(t)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div
                            className="font-bold text-sm"
                            style={{ fontFamily: 'Syne, sans-serif', color: t.is_default || t.isDefault ? '#000' : 'var(--text)' }}
                          >
                            {t.name}
                          </div>
                          <div
                            className="text-xs mt-1 font-medium"
                            style={{
                              color: t.is_default || t.isDefault ? '#000' : 'var(--text-dim)',
                              fontFamily: 'Barlow Condensed, sans-serif',
                            }}
                          >
                            {(() => {
                              const dt = Array.isArray(t.dayTypes) ? t.dayTypes : Array.isArray(t.day_types) ? t.day_types : [];
                              return `${dt.length} days`;
                            })()}
                          </div>
                          <div
                            className="text-xs mt-1"
                            style={{
                              color: t.is_default || t.isDefault ? '#000' : 'var(--text-dim)',
                              fontFamily: 'Barlow Condensed, sans-serif',
                            }}
                          >
                            {(() => {
                              const dt = Array.isArray(t.dayTypes) ? t.dayTypes : Array.isArray(t.day_types) ? t.day_types : [];
                              return dt.map(d => d.label).join(', ');
                            })()}
                          </div>
                        </div>
                        {t.is_default || t.isDefault ? (
                          <span
                            className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5"
                            style={{ background: t.is_default || t.isDefault ? 'var(--accent)' : 'var(--accent)', color: '#000', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}
                          >
                            Default
                          </span>
                        ) : isGenerated ? (
                          <span
                            className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5"
                            style={{ background: 'var(--accent)', color: '#000', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}
                          >
                            Generated
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Create new */}
              <button
                onClick={createNew}
                className="w-full py-3 font-bold text-sm uppercase tracking-widest transition-all"
                style={{
                  border: '2px dashed var(--border)',
                  color: 'var(--text-dim)',
                  background: 'transparent',
                  fontFamily: 'Barlow Condensed, sans-serif',
                  letterSpacing: '0.1em',
                }}
              >
                + Create New Template
              </button>

              {/* Smart Generate */}
              {user && (
                <button
                  onClick={() => setAiGenOpen(true)}
                  className="w-full py-4 font-bold text-sm uppercase tracking-widest transition-all"
                  style={{
                    background: 'var(--accent)',
                    color: '#000',
                    fontFamily: 'Barlow Condensed, sans-serif',
                    letterSpacing: '0.1em',
                  }}
                >
                  Smart Generate Template
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Template name */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}
                  >
                    Template Name
                  </label>
                  {selectedTemplate && (selectedTemplate.is_default || selectedTemplate.isDefault) && (
                    <button
                      onClick={handleRestoreDefault}
                      className="text-[10px] font-bold uppercase tracking-wider transition-all hover:opacity-80"
                      style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}
                    >
                      Restore to Default
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={editedTemplate?.name || ''}
                  onChange={e => updateTemplate({ name: e.target.value })}
                  className="input"
                />
              </div>

              {/* Day types */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}
                  >
                    Day Types
                  </label>
                  <button
                    onClick={addDayType}
                    className="text-[10px] font-bold uppercase tracking-wider transition-all hover:opacity-80"
                    style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}
                  >
                    + Add Day
                  </button>
                </div>

                {(editedTemplate?.dayTypes || editedTemplate?.day_types || []).map((dayType, di) => (
                  <div
                    key={di}
                    className="p-4"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="text"
                        value={dayType.label}
                        onChange={e => updateDayType(di, { label: e.target.value })}
                        className="input flex-1"
                        placeholder="Day label (e.g. Push A)"
                        style={{ fontFamily: 'Syne, sans-serif' }}
                      />
                      <span
                        className="text-xs font-medium shrink-0"
                        style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}
                      >
                        {dayType.muscleGroups || dayType.muscle_groups}
                      </span>
                      {(editedTemplate.dayTypes || editedTemplate.day_types || []).length > 1 && (
                        <button
                          onClick={() => removeDayType(di)}
                          className="text-xs font-bold uppercase tracking-wider shrink-0 transition-all hover:opacity-80"
                          style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}
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
                          <div
                            key={ei}
                            className="flex items-center gap-2 p-2"
                            style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}
                          >
                            <div className="flex-1 min-w-0">
                              <div
                                className="text-sm font-bold text-white"
                                style={{ fontFamily: 'Syne, sans-serif' }}
                              >
                                {resolved?.name || ex.name || 'Unknown'}
                              </div>
                              <div
                                className="text-xs font-medium mt-0.5"
                                style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}
                              >
                                {(resolved?.muscleGroup || ex.muscleGroup || '—')} · {(resolved?.equipment || ex.equipment || '—')}
                              </div>
                            </div>
                            <input
                              type="number"
                              value={ex.sets}
                              onChange={e => updateExercise(di, ex.exerciseId, { sets: parseInt(e.target.value) || 1 })}
                              className="input w-12 text-center py-2"
                              min="1"
                              title="Sets"
                            />
                            <span className="text-xs font-bold" style={{ color: 'var(--text-dim)' }}>×</span>
                            <input
                              type="number"
                              value={ex.reps}
                              onChange={e => updateExercise(di, ex.exerciseId, { reps: parseInt(e.target.value) || 1 })}
                              className="input w-12 text-center py-2"
                              min="1"
                              title="Reps"
                            />
                            <span className="text-xs font-bold" style={{ color: 'var(--text-dim)' }}>@</span>
                            <input
                              type="number"
                              value={ex.targetWeight || ''}
                              onChange={e => updateExercise(di, ex.exerciseId, { targetWeight: parseFloat(e.target.value) || 0 })}
                              className="input w-16 text-center py-2"
                              placeholder="Auto"
                              title="Weight"
                            />
                            <span className="text-xs font-bold" style={{ color: 'var(--text-dim)' }}>·</span>
                            <input
                              type="number"
                              value={ex.restSeconds}
                              onChange={e => updateExercise(di, ex.exerciseId, { restSeconds: parseInt(e.target.value) || 0 })}
                              className="input w-14 text-center py-2"
                              title="Rest (s)"
                            />
                            <button
                              onClick={() => removeExercise(di, ex.exerciseId)}
                              className="text-lg font-bold transition-all hover:opacity-60"
                              style={{ color: 'var(--border)' }}
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => openPicker(di)}
                      className="mt-2 w-full py-2 font-bold text-xs uppercase tracking-widest transition-all"
                      style={{
                        border: '2px dashed var(--border)',
                        color: 'var(--text-dim)',
                        background: 'transparent',
                        fontFamily: 'Barlow Condensed, sans-serif',
                        letterSpacing: '0.1em',
                      }}
                    >
                      + Add Exercise
                    </button>
                  </div>
                ))}
              </div>

              {/* Delete */}
              {selectedTemplate && !selectedTemplate.is_default && !selectedTemplate.isDefault && (
                <button
                  onClick={handleDelete}
                  className="text-sm font-bold uppercase tracking-wider transition-all hover:opacity-80"
                  style={{ color: '#FF6B6B', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}
                >
                  Delete Template
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {view === 'edit' && (
          <div
            className="px-6 py-4 flex justify-end gap-3"
            style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}
          >
            <button
              onClick={() => setView('select')}
              className="px-6 py-3 font-bold text-sm uppercase tracking-widest transition-all"
              style={{
                border: '2px solid var(--border)',
                color: 'var(--text-dim)',
                background: 'transparent',
                fontFamily: 'Barlow Condensed, sans-serif',
                letterSpacing: '0.1em',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 font-bold text-sm uppercase tracking-widest transition-all"
              style={{
                background: 'var(--accent)',
                color: '#000',
                fontFamily: 'Barlow Condensed, sans-serif',
                letterSpacing: '0.1em',
                border: 'none',
              }}
            >
              Save Template
            </button>
          </div>
        )}

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
          <div
            className="fixed inset-0 flex items-center justify-center z-[60] p-4"
            style={{ background: 'rgba(8,8,12,0.9)', backdropFilter: 'blur(8px)' }}
          >
            <div
              className="w-full max-w-md overflow-hidden"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
            >
              {/* Header */}
              <div
                className="px-7 pt-7 pb-6"
                style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                    <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="square">
                      <path strokeLinecap="square" strokeLinejoin="miter" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <button
                    onClick={() => setAiGenOpen(false)}
                    className="text-3xl leading-none transition-colors font-light"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    ×
                  </button>
                </div>
                <h2
                  className="text-xl font-extrabold text-white tracking-tight"
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  Smart Generate
                </h2>
                <p
                  className="text-sm font-medium mt-1"
                  style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.03em' }}
                >
                  Build a custom training template
                </p>
              </div>

              {/* Scrollable body */}
              <div
                className="overflow-y-auto px-7 py-5 space-y-3"
                style={{ maxHeight: 'calc(92vh - 180px)', flex: 1 }}
              >
                {/* Training Days */}
                <div className="p-5" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="text-[10px] font-bold uppercase tracking-[0.2em]"
                      style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}
                    >
                      Training Days / Week
                    </span>
                    <span
                      className="text-5xl font-extrabold leading-none"
                      style={{ color: 'var(--accent)', fontFamily: 'Syne, sans-serif' }}
                    >
                      {aiGenParams.daysPerWeek}
                    </span>
                  </div>
                  <input
                    type="range" min="2" max="6"
                    value={aiGenParams.daysPerWeek}
                    onChange={e => setAiGenParams(p => ({ ...p, daysPerWeek: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <p
                    className="text-xs font-bold mt-3"
                    style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}
                  >
                    {aiGenParams.daysPerWeek <= 3 ? '→ Full Body split' :
                     aiGenParams.daysPerWeek === 4 ? '→ Upper / Lower split' : '→ Push / Pull / Legs split'}
                  </p>
                </div>

                {/* Split type */}
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }} className="p-5">
                  <label
                    className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-3"
                    style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}
                  >
                    Training Split
                  </label>
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
                          className="py-2.5 text-sm font-bold text-center transition-all"
                          style={{
                            fontFamily: 'Barlow Condensed, sans-serif',
                            letterSpacing: '0.05em',
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
                  <label
                    className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-3"
                    style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}
                  >
                    Session Length
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {GENERATOR_OPTIONS.sessionLength.map(opt => {
                      const active = aiGenParams.sessionLength === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setAiGenParams(p => ({ ...p, sessionLength: opt.value }))}
                          className="py-3 px-2 text-center transition-all border-2 font-bold text-sm"
                          style={{
                            fontFamily: 'Barlow Condensed, sans-serif',
                            letterSpacing: '0.05em',
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
                  <label
                    className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-3"
                    style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}
                  >
                    Cardio
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {GENERATOR_OPTIONS.cardioLevel.map(opt => {
                      const active = aiGenParams.cardioLevel === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setAiGenParams(p => ({ ...p, cardioLevel: opt.value }))}
                          className="py-2.5 text-center transition-all font-bold text-sm border-2"
                          style={{
                            fontFamily: 'Barlow Condensed, sans-serif',
                            letterSpacing: '0.05em',
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
                  <p
                    className="text-xs font-bold mt-2"
                    style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}
                  >
                    {aiGenParams.cardioLevel === 'none' ? 'No cardio finisher added' :
                     aiGenParams.cardioLevel === 'light' ? '1 LISS session per week' :
                     aiGenParams.cardioLevel === 'moderate' ? 'HIIT + LISS mixed weekly' : 'High frequency cardio'}
                  </p>
                </div>

                {/* Priority muscles */}
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }} className="p-5">
                  <label
                    className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-1"
                    style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}
                  >
                    Priority Muscles
                  </label>
                  <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    Add extra isolation volume to lagging muscle groups
                  </p>
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
                          className="py-1.5 px-3 text-xs font-bold transition-all"
                          style={{
                            fontFamily: 'Barlow Condensed, sans-serif',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            background: isSelected ? 'var(--accent)' : 'var(--surface-3)',
                            color: isSelected ? '#000' : 'var(--text-dim)',
                            border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mobility toggle */}
                <div
                  className="flex items-center justify-between px-5 py-4"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                >
                  <div>
                    <div className="text-sm font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                      Mobility Warm-Up
                    </div>
                    <div className="text-xs font-medium" style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                      Dynamic stretching &amp; activation circuit
                    </div>
                  </div>
                  <button
                    onClick={() => setAiGenParams(p => ({ ...p, includeMobility: !p.includeMobility }))}
                    className="w-12 h-7 transition-all relative"
                    style={{ background: aiGenParams.includeMobility ? 'var(--accent)' : 'var(--surface-3)', border: `1px solid ${aiGenParams.includeMobility ? 'var(--accent)' : 'var(--border)'}` }}
                  >
                    <div
                      className="absolute top-0.5 w-6 h-6 transition-all"
                      style={{
                        background: '#fff',
                        left: aiGenParams.includeMobility ? '22px' : '0.5px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      }}
                    />
                  </button>
                </div>

                {/* Equipment */}
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }} className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <label
                      className="text-[10px] font-bold uppercase tracking-[0.2em]"
                      style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}
                    >
                      Equipment
                    </label>
                    {aiGenParams.equipment.length <= 2 && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider"
                        style={{ background: 'rgba(202,255,0,0.15)', color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}
                      >
                        Limited
                      </span>
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
                        className="py-2.5 text-[10px] font-bold capitalize transition-all"
                        style={{
                          fontFamily: 'Barlow Condensed, sans-serif',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          background: aiGenParams.equipment.includes(eq) ? 'var(--accent)' : 'var(--surface-3)',
                          color: aiGenParams.equipment.includes(eq) ? '#000' : 'var(--text-dim)',
                          border: aiGenParams.equipment.includes(eq) ? '2px solid var(--accent)' : '1px solid var(--border)',
                        }}
                      >
                        {eq}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Profile strip */}
                {user && (
                  <div
                    className="px-5 py-4"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex gap-6">
                      <div>
                        <p
                          className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1"
                          style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}
                        >
                          Goal
                        </p>
                        <p className="text-sm font-bold text-white capitalize" style={{ fontFamily: 'Syne, sans-serif' }}>
                          {user.goal}
                        </p>
                      </div>
                      <div>
                        <p
                          className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1"
                          style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}
                        >
                          Experience
                        </p>
                        <p className="text-sm font-bold text-white capitalize" style={{ fontFamily: 'Syne, sans-serif' }}>
                          {user.experience}
                        </p>
                      </div>
                      <div>
                        <p
                          className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1"
                          style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}
                        >
                          Intensity
                        </p>
                        <p className="text-sm font-bold mono" style={{ color: 'var(--accent)' }}>
                          {user.intensity}/10
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer CTA */}
              <div
                className="px-7 pb-7 pt-4"
                style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}
              >
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
                  className="btn-primary w-full"
                  style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontWeight: 800,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    fontSize: '1rem',
                    padding: '16px 24px',
                    background: 'var(--accent)',
                    color: '#000',
                  }}
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