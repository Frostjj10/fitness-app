import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getExercisePickerData, DEFAULT_TEMPLATES } from '../utils/ppl';
import ExercisePicker from './ExercisePicker';

export default function TemplateEditor({ isOpen, onClose, onSave, templates = [] }) {
  const [view, setView] = useState('select'); // 'select' | 'edit'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editedTemplate, setEditedTemplate] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerDayIndex, setPickerDayIndex] = useState(null);
  const [allExercises, setAllExercises] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    const data = getExercisePickerData();
    setAllExercises(data.all || []);
  }, [isOpen]);

  function handleClose() {
    setView('select');
    setSelectedTemplate(null);
    setEditedTemplate(null);
    onClose();
  }

  function startEdit(tpl) {
    setSelectedTemplate(tpl);
    setEditedTemplate(JSON.parse(JSON.stringify(tpl)));
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
    const exerciseEntry = {
      exerciseId: ex.id,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      primaryMuscle: ex.primary,
      equipment: ex.equipment,
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

    // Convert camelCase to snake_case for API
    const templateToSave = {
      id: editedTemplate.id,
      name: editedTemplate.name,
      is_default: editedTemplate.is_default || editedTemplate.isDefault || false,
      day_types: (editedTemplate.dayTypes || editedTemplate.day_types || []).map(dt => ({
        label: dt.label,
        muscle_groups: dt.muscleGroups,
        exercises: (dt.exercises || []).map(ex => ({
          exercise_id: ex.exerciseId,
          sets: ex.sets,
          reps: ex.reps,
          rest_seconds: ex.restSeconds,
        })),
      })),
    };

    const isNew = !selectedTemplate || !templates.find(t => t.id === editedTemplate.id);

    let saved;
    if (isNew) {
      const { data } = await supabase
        .from('templates')
        .insert([templateToSave])
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
              {view === 'select' ? 'Choose a template to customize or create your own' : 'Edit day types and exercises'}
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
                {templates.map(t => (
                  <div
                    key={t.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      t.is_default || t.isDefault ? 'border-blue-200 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => startEdit(t)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{t.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {(t.dayTypes || t.day_types || []).length} day{(t.dayTypes || t.day_types || []).length > 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {(t.dayTypes || t.day_types || []).map(d => d.label).join(', ')}
                        </div>
                      </div>
                      {(t.is_default || t.isDefault) && (
                        <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded">Default</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Create new */}
              <button
                onClick={createNew}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 font-medium"
              >
                + Create New Template
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Template name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
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
                      {(dayType.exercises || []).map((ex, ei) => (
                        <div key={ei} className="flex items-center gap-2 bg-white rounded-lg p-2">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{ex.name}</div>
                            <div className="text-xs text-gray-400">{ex.muscleGroup} · {ex.equipment}</div>
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
                      ))}
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
      </div>
    </div>
  );
}
