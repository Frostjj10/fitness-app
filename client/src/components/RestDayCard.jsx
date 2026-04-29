import { useState } from 'react';
import { formatDate } from '../utils/format';

export default function RestDayCard({ day, onAddExercise, onRemoveExercise }) {
  const [expanded, setExpanded] = useState(false);
  const workout = day.workout;
  const hasCore = workout && workout.exercises?.length > 0;

  return (
    <div
      className="transition-all"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div
        className="px-5 py-3 flex justify-between items-center cursor-pointer"
        style={{ background: 'var(--surface-2)', borderBottom: expanded ? '1px solid var(--border)' : 'none' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div>
          <div
            className="font-bold text-sm text-white"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}
          >
            {day.dayOfWeek}
          </div>
          <div
            className="text-xs font-medium mt-0.5"
            style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            {formatDate(day.date)}
          </div>
        </div>
        <div className="text-right">
          <div
            className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5"
            style={{ background: 'var(--surface-3)', color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}
          >
            Rest
          </div>
          {hasCore && (
            <div
              className="text-xs font-medium mt-0.5"
              style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              {workout.exercises.length} core
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div className="p-4">
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-3"
            style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}
          >
            {workout ? 'Core Finisher' : 'Recovery'}
          </p>
          {workout && workout.exercises.length > 0 ? (
            <div className="space-y-2">
              {workout.exercises.map((ex, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                >
                  <div>
                    <div
                      className="font-semibold text-sm text-white"
                      style={{ fontFamily: 'Syne, sans-serif' }}
                    >
                      {ex.name}
                    </div>
                    <div
                      className="text-xs font-medium mt-0.5"
                      style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}
                    >
                      {ex.sets}×{ex.reps} · {ex.restSeconds}s rest
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveExercise && onRemoveExercise(ex.exerciseId)}
                    className="text-lg font-bold transition-all hover:opacity-60"
                    style={{ color: 'var(--border)' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p
              className="text-sm mb-3"
              style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              No core exercises
            </p>
          )}
          <button
            onClick={() => onAddExercise && onAddExercise('core')}
            className="mt-3 w-full py-2 font-bold text-xs uppercase tracking-widest transition-all"
            style={{
              border: '2px dashed var(--border)',
              color: 'var(--text-dim)',
              background: 'transparent',
              fontFamily: 'Barlow Condensed, sans-serif',
              letterSpacing: '0.1em',
            }}
          >
            + Add Core Exercise
          </button>
        </div>
      )}
    </div>
  );
}