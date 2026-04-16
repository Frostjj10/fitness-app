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

    if (!error && data) {
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
        <p className="text-slate-500 mt-1">Manage your profile and preferences</p>
      </div>

      <div className="card p-6">
        <div className="section-title mb-4">Profile</div>
        <div className="grid grid-cols-2 gap-4">
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
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <input
                type="checkbox"
                checked={form.progressive_overload ?? true}
                onChange={e => updateField('progressive_overload', e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
              />
              <div>
                <div className="text-sm font-semibold text-slate-900">Progressive Overload Suggestions</div>
                <div className="text-xs text-slate-500">Automatically suggest next session's weight based on your logged performance</div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-5">
          <button onClick={saveProfile} className="btn-primary">
            Save Profile
          </button>
          {saved && (
            <span className="text-orange-500 font-semibold text-sm flex items-center gap-1">
              ✓ Saved!
            </span>
          )}
        </div>
      </div>

      <div className="card p-6">
        <div className="section-title mb-4">Data</div>
        <div className="flex gap-3">
          <button onClick={exportData} className="btn-secondary text-sm">
            Export Data
          </button>
          <label className="btn-secondary text-sm cursor-pointer">
            Import Data
            <input type="file" accept=".json" onChange={importData} className="hidden" />
          </label>
        </div>
        <p className="text-sm text-slate-400 mt-3">
          Export your data as a JSON backup. Import to restore your workout history.
        </p>
      </div>
    </div>
  );
}
