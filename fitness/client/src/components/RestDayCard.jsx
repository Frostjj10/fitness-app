import { useState } from 'react';
import { formatDate } from '../utils/format';

export default function RestDayCard({ day, onAddExercise, onRemoveExercise }) {
  const [expanded, setExpanded] = useState(false);
  const workout = day.workout;
  const hasCore = workout && workout.exercises?.length > 0;

  return (
    <div className="card overflow-hidden">
      <div
        className="bg-gradient-to-r from-slate-400 to-slate-500 text-white px-5 py-3 cursor-pointer hover:from-slate-500 hover:to-slate-600 transition-all"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex justify-between items-center">
          <div>
            <div className="font-bold text-sm">{day.dayOfWeek}</div>
            <div className="text-xs text-slate-200">{formatDate(day.date)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-md">Rest</div>
            {hasCore && (
              <div className="text-xs text-slate-200 mt-0.5">{workout.exercises.length} core exercises</div>
            )}
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="p-4">
          <div className="text-xs section-title mb-3">{workout ? 'Core Finisher' : 'Recovery Day'}</div>
          {workout && workout.exercises.length > 0 ? (
            <div className="space-y-2">
              {workout.exercises.map((ex, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{ex.name}</div>
                    <div className="text-xs text-slate-500">
                      {ex.sets}×{ex.reps} · {ex.restSeconds}s rest
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveExercise && onRemoveExercise(ex.exerciseId)}
                    className="text-red-400 hover:text-red-700 text-xs px-2 py-1 hover:bg-red-50 rounded-lg transition-all"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-400 mb-3">No core exercises scheduled</div>
          )}
          <button
            onClick={() => onAddExercise && onAddExercise('core')}
            className="mt-3 w-full py-2 border-2 border-dashed border-slate-300 text-slate-500 rounded-xl hover:border-slate-400 hover:text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-all"
          >
            + Add Core Exercise
          </button>
        </div>
      ) : (
        <div className="p-4 flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl mb-2">😴</div>
          <div className="text-sm font-semibold text-slate-500">Recovery Day</div>
          <div className="text-xs text-slate-400 mt-0.5">{formatDate(day.date)}</div>
          {hasCore && (
            <div className="mt-2 text-xs text-brand-600 bg-brand-50 px-2 py-1 rounded-lg font-semibold">
              + {workout.exercises.length} core exercises
            </div>
          )}
        </div>
      )}
    </div>
  );
}
