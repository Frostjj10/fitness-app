import { useState } from 'react';

export default function WorkoutDayCard({ day, onAddExercise, onRemoveExercise, onUpdateExercise }) {
  const [expanded, setExpanded] = useState(false);
  const [editingEx, setEditingEx] = useState(null);
  const [editValues, setEditValues] = useState({});

  const workout = day.workout;
  if (!workout) return null;

  function startEdit(ex) {
    setEditingEx(ex.exerciseId);
    setEditValues({
      sets: ex.sets,
      reps: ex.reps,
      targetWeight: ex.targetWeight,
      restSeconds: ex.restSeconds,
    });
  }

  function cancelEdit() {
    setEditingEx(null);
    setEditValues({});
  }

  function saveEdit(exerciseId) {
    onUpdateExercise(exerciseId, editValues);
    setEditingEx(null);
    setEditValues({});
  }

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div
        className="bg-blue-700 text-white px-4 py-2 font-medium cursor-pointer hover:bg-blue-800"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex justify-between items-center">
          <div>
            <div>{day.dayOfWeek}</div>
            <div className="text-xs font-normal opacity-80">{day.date}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-normal">{workout.dayOfWeek}</div>
            <div className="text-xs opacity-75">{workout.exercises.length} exercises</div>
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="p-4">
          <div className="text-sm text-blue-600 font-medium mb-3">{workout.muscleGroups}</div>
          <div className="space-y-3">
            {workout.exercises.map((ex, i) => {
              const isCardio = ex.unit === 'min';
              return (
              <div key={i} className={`border rounded-lg p-3 ${isCardio ? 'border-orange-200 bg-orange-50' : ''}`}>
                {editingEx === ex.exerciseId ? (
                  // Inline edit mode
                  <div className="space-y-2">
                    <div className="font-medium text-sm">{ex.name}</div>
                    {isCardio ? (
                      // Cardio: only duration
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <label className="text-xs text-gray-500">Duration (min)</label>
                          <input
                            type="number"
                            value={editValues.reps}
                            onChange={e => setEditValues(v => ({ ...v, reps: parseInt(e.target.value) || 0 }))}
                            className="w-full border rounded px-2 py-1"
                            min="1"
                          />
                        </div>
                      </div>
                    ) : (
                      // Strength: sets, reps, weight, rest
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div>
                          <label className="text-xs text-gray-500">Sets</label>
                          <input
                            type="number"
                            value={editValues.sets}
                            onChange={e => setEditValues(v => ({ ...v, sets: parseInt(e.target.value) || 0 }))}
                            className="w-full border rounded px-2 py-1"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Reps</label>
                          <input
                            type="number"
                            value={editValues.reps}
                            onChange={e => setEditValues(v => ({ ...v, reps: parseInt(e.target.value) || 0 }))}
                            className="w-full border rounded px-2 py-1"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Weight</label>
                          <input
                            type="number"
                            value={editValues.targetWeight}
                            onChange={e => setEditValues(v => ({ ...v, targetWeight: parseFloat(e.target.value) || 0 }))}
                            className="w-full border rounded px-2 py-1"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Rest (s)</label>
                          <input
                            type="number"
                            value={editValues.restSeconds}
                            onChange={e => setEditValues(v => ({ ...v, restSeconds: parseInt(e.target.value) || 0 }))}
                            className="w-full border rounded px-2 py-1"
                            min="0"
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(ex.exerciseId)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm flex items-center gap-2">
                        {ex.name}
                        {isCardio && <span className="text-xs bg-orange-200 text-orange-700 px-1.5 py-0.5 rounded">Cardio</span>}
                      </div>
                      <div className="text-xs text-gray-500">
                        {isCardio
                          ? `${ex.reps} min · ${ex.equipment}`
                          : `${ex.sets}×${ex.reps} @ ${ex.targetWeight} lbs · ${ex.restSeconds}s rest · ${ex.isCompound ? 'Compound' : 'Isolation'}`
                        }
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!isCardio && (
                        <button
                          onClick={() => startEdit(ex)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => onRemoveExercise(ex.exerciseId)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>

          <button
            onClick={onAddExercise}
            className="mt-4 w-full py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:border-blue-500 hover:text-blue-700 text-sm font-medium"
          >
            + Add Exercise
          </button>
        </div>
      ) : (
        <div className="p-4">
          <div className="text-sm text-blue-600 font-medium mb-2">{workout.muscleGroups}</div>
          <div className="space-y-1">
            {workout.exercises.slice(0, 3).map((ex, i) => (
              <div key={i} className="text-sm text-gray-600 truncate">{ex.name}</div>
            ))}
            {workout.exercises.length > 5 && (
              <div className="text-xs text-gray-400">+{workout.exercises.length - 5} more</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
