import { useState } from 'react';

export default function RestDayCard({ day, onAddExercise, onRemoveExercise }) {
  const [expanded, setExpanded] = useState(false);
  const workout = day.workout;
  const hasCore = workout && workout.exercises?.length > 0;

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div
        className="bg-slate-400 text-white px-4 py-2 font-medium cursor-pointer hover:bg-slate-500"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex justify-between items-center">
          <div>
            <div>{day.dayOfWeek}</div>
            <div className="text-xs font-normal opacity-80">{day.date}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-normal">Rest</div>
            {hasCore && (
              <div className="text-xs opacity-75">{workout.exercises.length} core exercises</div>
            )}
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="p-4">
          <div className="text-sm text-slate-600 font-medium mb-3">{workout ? 'Core Finisher' : 'Recovery Day'}</div>
          {workout && workout.exercises.length > 0 ? (
            <div className="space-y-3">
              {workout.exercises.map((ex, i) => (
                <div key={i} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{ex.name}</div>
                      <div className="text-xs text-gray-500">
                        {ex.sets}×{ex.reps} {ex.unit || 'reps'} · {ex.restSeconds}s rest
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveExercise && onRemoveExercise(ex.exerciseId)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-400 mb-3">No core exercises scheduled</div>
          )}
          <button
            onClick={() => onAddExercise && onAddExercise('core')}
            className="mt-3 w-full py-2 border-2 border-dashed border-slate-300 text-slate-600 rounded-lg hover:border-slate-500 hover:text-slate-700 text-sm font-medium"
          >
            + Add Core Exercise
          </button>
        </div>
      ) : (
        <div className="p-4 text-center">
          <div className="text-sm text-gray-500">{day.date}</div>
          <div className="mt-2 text-slate-500 text-lg">😴</div>
          <div className="text-sm text-slate-400 mt-1">Recovery day</div>
          {hasCore && (
            <div className="mt-2 text-xs text-blue-500">
              + {workout.exercises.length} core exercises
            </div>
          )}
        </div>
      )}
    </div>
  );
}
