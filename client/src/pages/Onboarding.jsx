import { useState } from 'react';
import { supabase } from '../lib/supabase';

const GOALS = [
  { value: 'strength', label: 'Strength', description: 'Get stronger, add muscle' },
  { value: 'hypertrophy', label: 'Hypertrophy', description: 'Build muscle size' },
  { value: 'endurance', label: 'Endurance', description: 'Improve stamina' },
  { value: 'weight-loss', label: 'Weight Loss', description: 'Burn fat, lean out' },
];

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: '< 1 year training' },
  { value: 'intermediate', label: 'Intermediate', description: '1-3 years training' },
  { value: 'advanced', label: 'Advanced', description: '3+ years training' },
];

export default function Onboarding({ user: authUser, onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    age: '',
    weight: '',
    height: '',
    goal: '',
    experience: '',
    intensity: 7,
    unit: 'lbs',
  });

  const steps = [
    { title: 'Welcome', fields: ['name'] },
    { title: 'Your Body', fields: ['age', 'weight', 'height', 'unit'] },
    { title: 'Your Goal', fields: ['goal'] },
    { title: 'Experience', fields: ['experience', 'intensity'] },
  ];

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function canProceed() {
    const currentFields = steps[step].fields;
    for (const field of currentFields) {
      if (!form[field] || form[field] === '') return false;
    }
    return true;
  }

  async function handleComplete() {
    const profile = {
      id: authUser.id,
      name: form.name,
      goal: form.goal,
      experience: form.experience,
      weight: parseFloat(form.weight) || 165,
      unit: form.unit,
      intensity: form.intensity,
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert([profile])
      .select()
      .single();

    if (error) {
      console.error('Error saving profile:', error);
      return;
    }

    onComplete(data);
  }

  const currentStep = steps[step];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--bg)' }}
    >
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          opacity: 0.3,
        }}
      />

      <div
        className="w-full max-w-md relative z-10 p-8"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* Progress bar */}
        <div className="flex gap-2 mb-10">
          {steps.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 transition-colors"
              style={{
                background: i <= step ? 'var(--accent)' : 'var(--border)',
              }}
            />
          ))}
        </div>

        <div className="mb-2">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2"
            style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}
          >
            Step {step + 1} of {steps.length}
          </p>
          <h2
            className="text-4xl font-extrabold text-white tracking-tight"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            {currentStep.title}
          </h2>
        </div>

        {/* Name */}
        {step === 0 && (
          <div>
            <label className="label">What's your name?</label>
            <input
              type="text"
              value={form.name}
              onChange={e => updateField('name', e.target.value)}
              className="input"
              placeholder="Enter your name"
              autoFocus
            />
          </div>
        )}

        {/* Body */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="label">Age</label>
              <input
                type="number"
                value={form.age}
                onChange={e => updateField('age', e.target.value)}
                className="input"
                placeholder="25"
              />
            </div>
            <div>
              <label className="label">Weight</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={form.weight}
                  onChange={e => updateField('weight', e.target.value)}
                  className="input flex-1"
                  placeholder="175"
                />
                <select
                  value={form.unit}
                  onChange={e => updateField('unit', e.target.value)}
                  className="input w-24"
                >
                  <option value="lbs">lbs</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Height (optional)</label>
              <input
                type="text"
                value={form.height}
                onChange={e => updateField('height', e.target.value)}
                className="input"
                placeholder={"5'10\" or 178cm"}
              />
            </div>
          </div>
        )}

        {/* Goal */}
        {step === 2 && (
          <div className="grid grid-cols-2 gap-2">
            {GOALS.map(g => (
              <button
                key={g.value}
                onClick={() => updateField('goal', g.value)}
                className="p-4 text-left transition-all"
                style={{
                  border: `2px solid ${form.goal === g.value ? 'var(--accent)' : 'var(--border)'}`,
                  background: form.goal === g.value ? 'rgba(202,255,0,0.08)' : 'var(--surface-2)',
                }}
              >
                <div
                  className="font-bold text-sm text-white"
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  {g.label}
                </div>
                <div
                  className="text-xs mt-0.5 font-medium"
                  style={{ color: 'var(--text-dim)' }}
                >
                  {g.description}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Experience */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {EXPERIENCE_LEVELS.map(l => (
                <button
                  key={l.value}
                  onClick={() => updateField('experience', l.value)}
                  className="p-4 text-center transition-all"
                  style={{
                    border: `2px solid ${form.experience === l.value ? 'var(--accent)' : 'var(--border)'}`,
                    background: form.experience === l.value ? 'rgba(202,255,0,0.08)' : 'var(--surface-2)',
                  }}
                >
                  <div
                    className="font-bold text-sm text-white"
                    style={{ fontFamily: 'Syne, sans-serif' }}
                  >
                    {l.label}
                  </div>
                  <div
                    className="text-xs mt-0.5 font-medium"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    {l.description}
                  </div>
                </button>
              ))}
            </div>
            <div>
              <label
                className="label"
                style={{ color: 'var(--text-dim)' }}
              >
                Preferred Intensity:{' '}
                <span style={{ color: 'var(--accent)', fontWeight: 800 }}>{form.intensity}</span>/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={form.intensity}
                onChange={e => updateField('intensity', parseInt(e.target.value))}
                className="w-full"
              />
              <div
                className="flex justify-between text-xs mt-1 font-bold"
                style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}
              >
                <span>Easy</span>
                <span>Maximum</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-10">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="px-6 py-3 font-bold text-sm transition-all"
              style={{
                border: `2px solid var(--border)`,
                color: 'var(--text-dim)',
                background: 'transparent',
                fontFamily: 'Barlow Condensed, sans-serif',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Back
            </button>
          )}
          <div className="flex-1" />
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="px-8 py-3 font-bold text-sm transition-all"
              style={{
                background: canProceed() ? 'var(--accent)' : 'var(--surface-3)',
                color: canProceed() ? '#000' : 'var(--text-dim)',
                fontFamily: 'Barlow Condensed, sans-serif',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: canProceed() ? 'pointer' : 'not-allowed',
                border: 'none',
              }}
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={!canProceed()}
              className="px-8 py-3 font-bold text-sm transition-all"
              style={{
                background: canProceed() ? 'var(--accent)' : 'var(--surface-3)',
                color: canProceed() ? '#000' : 'var(--text-dim)',
                fontFamily: 'Barlow Condensed, sans-serif',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: canProceed() ? 'pointer' : 'not-allowed',
                border: 'none',
              }}
            >
              Get Started
            </button>
          )}
        </div>
      </div>
    </div>
  );
}