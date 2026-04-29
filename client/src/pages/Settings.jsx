import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Settings({ user, onUpdate }) {
  const [form, setForm] = useState({ ...user });
  const [saved, setSaved] = useState(false);

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function saveProfile() {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        name: form.name,
        weight: parseFloat(form.weight) || form.weight,
        unit: form.unit,
        goal: form.goal,
        experience: form.experience,
        intensity: form.intensity,
        progressive_overload: form.progressive_overload ?? true,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Profile save error:', error);
      alert('Failed to save: ' + error.message);
    } else if (data) {
      onUpdate(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function exportData() {
    const { data: weightLog } = await supabase.from('weight_logs').select('*');
    const { data: workoutLog } = await supabase.from('workout_logs').select('*');
    const { data: schedules } = await supabase.from('schedules').select('*');

    const exportData = {
      user: form,
      weightLog: weightLog || [],
      workoutLog: workoutLog || [],
      schedules: schedules || [],
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const text = await file.text();
    const data = JSON.parse(text);

    if (data.weightLog?.length) {
      const logsWithUser = data.weightLog.map(log => ({ ...log, user_id: user.id }));
      await supabase.from('weight_logs').upsert(logsWithUser);
    }

    if (data.workoutLog?.length) {
      const logsWithUser = data.workoutLog.map(log => ({ ...log, user_id: user.id }));
      await supabase.from('workout_logs').upsert(logsWithUser);
    }

    window.location.reload();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="page-title">Settings</h1>
        <p
          className="text-sm font-medium mt-2"
          style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}
        >
          Manage your profile and preferences
        </p>
      </div>

      {/* Profile section */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} className="p-6">
        <div className="section-title mb-6">Profile</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Name</label>
            <input type="text" value={form.name || ''} onChange={e => updateField('name', e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Age</label>
            <input type="number" value={form.age || ''} onChange={e => updateField('age', e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Weight ({form.unit || 'lbs'})</label>
            <input type="number" value={form.weight || ''} onChange={e => updateField('weight', e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Unit</label>
            <select value={form.unit || 'lbs'} onChange={e => updateField('unit', e.target.value)} className="input">
              <option value="lbs">lbs</option>
              <option value="kg">kg</option>
            </select>
          </div>
          <div>
            <label className="label">Goal</label>
            <select value={form.goal || ''} onChange={e => updateField('goal', e.target.value)} className="input">
              <option value="">Select...</option>
              <option value="strength">Strength</option>
              <option value="hypertrophy">Hypertrophy</option>
              <option value="endurance">Endurance</option>
              <option value="weight-loss">Weight Loss</option>
            </select>
          </div>
          <div>
            <label className="label">Experience</label>
            <select value={form.experience || ''} onChange={e => updateField('experience', e.target.value)} className="input">
              <option value="">Select...</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div className="col-span-2">
            <div
              className="flex items-center gap-4 p-4"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
            >
              <input
                type="checkbox"
                id="progressive_overload"
                checked={form.progressive_overload ?? true}
                onChange={e => updateField('progressive_overload', e.target.checked)}
                style={{ accentColor: 'var(--accent)', width: '20px', height: '20px' }}
              />
              <label htmlFor="progressive_overload">
                <div
                  className="text-sm font-bold text-white"
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  Progressive Overload Suggestions
                </div>
                <div
                  className="text-xs font-medium mt-0.5"
                  style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}
                >
                  Automatically suggest next session's weight based on your logged performance
                </div>
              </label>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-6">
          <button onClick={saveProfile} className="btn-primary">
            Save Profile
          </button>
          {saved && (
            <span
              className="text-sm font-bold flex items-center gap-2"
              style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                <path d="M5 13l4 4L19 7"/>
              </svg>
              Saved!
            </span>
          )}
        </div>
      </div>

      {/* Data section */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} className="p-6">
        <div className="section-title mb-6">Data</div>
        <div className="flex gap-3">
          <button onClick={exportData} className="btn-secondary">
            Export Data
          </button>
          <label className="btn-secondary cursor-pointer">
            Import Data
            <input type="file" accept=".json" onChange={importData} className="hidden" />
          </label>
        </div>
        <p
          className="text-sm font-medium mt-4"
          style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          Export your data as a JSON backup. Import to restore your workout history.
        </p>
      </div>
    </div>
  );
}