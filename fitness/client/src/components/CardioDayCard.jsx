import { useState } from 'react';

export default function CardioDayCard({ day, onAddExercise, onRemoveExercise, onUpdateExercise }) {
  const [expanded, setExpanded] = useState(false);
  const [editValuesById, setEditValuesById] = useState({});

  const workout = day.workout;
  if (!workout) return null;

  function startEdit(ex) {
    setEditValuesById(prev => ({
      ...prev,
      [ex.exerciseId]: { reps: ex.reps, restSeconds: ex.restSeconds },
    }));
  }

  function cancelEdit(exerciseId) {
    setEditValuesById(prev => {
      const next = { ...prev };
      delete next[exerciseId];
      return next;
    });
  }

  function saveEdit(exerciseId) {
    const editValues = editValuesById[exerciseId];
    if (editValues) {
      onUpdateExercise(exerciseId, editValues);
    }
    cancelEdit(exerciseId);
  }

  function getEditValues(exerciseId) {
    return editValuesById[exerciseId] || {};
  }

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden border-2 border-orange-200">
      <div
        className="bg-orange-500 text-white px-4 py-2 font-medium cursor-pointer hover:bg-orange-600"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex justify-between items-center">
          <div>
            <div>{day.dayOfWeek}</div>
            <div className="text-xs font-normal opacity-80">{day.date}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-normal">Cardio</div>
            <div className="text-xs opacity-75">{workout.exercises.length} exercises</div>
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="p-4">
          <div className="text-sm text-orange-600 font-medium mb-3">{workout.muscleGroups}</div>
          <div className="space-y-3">
            {workout.exercises.map((ex, i) => (
              <div key={i} className="border rounded-lg p-3">
                {editValuesById[ex.exerciseId] ? (
                  <div className="space-y-2">
                    <div className="font-medium text-sm">{ex.name}</div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <label className="text-xs text-gray-500">Duration ({ex.unit})</label>
                        <input
                          type="number"
                          value={getEditValues(ex.exerciseId).reps}
                          onChange={e => setEditValuesById(prev => ({
                            ...prev,
                            [ex.exerciseId]: { ...prev[ex.exerciseId], reps: parseInt(e.target.value) || 0 }
                          }))}
                          className="w-full border rounded px-2 py-1"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Rest (s)</label>
                        <input
                          type="number"
                          value={getEditValues(ex.exerciseId).restSeconds}
                          onChange={e => setEditValuesById(prev => ({
                            ...prev,
                            [ex.exerciseId]: { ...prev[ex.exerciseId], restSeconds: parseInt(e.target.value) || 0 }
                          }))}
                          className="w-full border rounded px-2 py-1"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(ex.exerciseId)} className="px-3 py-1 bg-orange-500 text-white text-sm rounded">Save</button>
                      <button onClick={() => cancelEdit(ex.exerciseId)} className="px-3 py-1 bg-gray-200 text-sm rounded">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{ex.name}</div>
                      <div className="text-xs text-gray-500">
                        {ex.sets} × {ex.reps} {ex.unit} {ex.equipment !== 'bodyweight' ? `· ${ex.equipment}` : ''}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(ex)} className="text-orange-600 hover:text-orange-800 text-sm">Edit</button>
                      <button onClick={() => onRemoveExercise(ex.exerciseId)} className="text-red-500 hover:text-red-700 text-sm">✕</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={onAddExercise}
            className="mt-4 w-full py-2 border-2 border-dashed border-orange-300 text-orange-600 rounded-lg hover:border-orange-500 text-sm font-medium"
          >
            + Add Exercise
          </button>
        </div>
      ) : (
        <div className="p-4">
          <div className="text-sm text-orange-600 font-medium mb-2">{workout.muscleGroups}</div>
          <div className="space-y-1">
            {workout.exercises.slice(0, 3).map((ex, i) => (
              <div key={i} className="text-sm text-gray-600 truncate">{ex.name} ({ex.reps} {ex.unit})</div>
            ))}
            {workout.exercises.length > 3 && (
              <div className="text-xs text-gray-400">+{workout.exercises.length - 3} more</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
