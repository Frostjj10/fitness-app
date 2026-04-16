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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full transition-colors ${
                i <= step ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <h2 className="text-2xl font-bold mb-2">{currentStep.title}</h2>
        <p className="text-gray-500 mb-6">Step {step + 1} of {steps.length}</p>

        {/* Name */}
        {step === 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">What's your name?</label>
            <input
              type="text"
              value={form.name}
              onChange={e => updateField('name', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg"
              placeholder="Enter your name"
              autoFocus
            />
          </div>
        )}

        {/* Body */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Age</label>
              <input
                type="number"
                value={form.age}
                onChange={e => updateField('age', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="25"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Weight</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={form.weight}
                  onChange={e => updateField('weight', e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="175"
                />
                <select
                  value={form.unit}
                  onChange={e => updateField('unit', e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="lbs">lbs</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Height (optional)</label>
              <input
                type="text"
                value={form.height}
                onChange={e => updateField('height', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder={"5'10\" or 178cm"}
              />
            </div>
          </div>
        )}

        {/* Goal */}
        {step === 2 && (
          <div className="grid grid-cols-2 gap-3">
            {GOALS.map(g => (
              <button
                key={g.value}
                onClick={() => updateField('goal', g.value)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  form.goal === g.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="font-medium">{g.label}</div>
                <div className="text-sm text-gray-500">{g.description}</div>
              </button>
            ))}
          </div>
        )}

        {/* Experience */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {EXPERIENCE_LEVELS.map(l => (
                <button
                  key={l.value}
                  onClick={() => updateField('experience', l.value)}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    form.experience === l.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="font-medium text-sm">{l.label}</div>
                  <div className="text-xs text-gray-500">{l.description}</div>
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Preferred Intensity: <span className="text-blue-600 font-bold">{form.intensity}</span>/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={form.intensity}
                onChange={e => updateField('intensity', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Easy</span>
                <span>Maximum</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
          )}
          <div className="flex-1" />
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={!canProceed()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Get Started
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
