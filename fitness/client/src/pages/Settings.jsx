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

    // Import weight logs
    if (data.weightLog?.length) {
      const logsWithUser = data.weightLog.map(log => ({ ...log, user_id: user.id }));
      await supabase.from('weight_logs').upsert(logsWithUser);
    }

    // Import workout logs
    if (data.workoutLog?.length) {
      const logsWithUser = data.workoutLog.map(log => ({ ...log, user_id: user.id }));
      await supabase.from('workout_logs').upsert(logsWithUser);
    }

    window.location.reload();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      {/* Profile */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Profile</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={form.name || ''}
              onChange={e => updateField('name', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Age</label>
            <input
              type="number"
              value={form.age || ''}
              onChange={e => updateField('age', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Weight ({form.unit})</label>
            <input
              type="number"
              value={form.weight || ''}
              onChange={e => updateField('weight', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Unit</label>
            <select
              value={form.unit || 'lbs'}
              onChange={e => updateField('unit', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="lbs">lbs</option>
              <option value="kg">kg</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Goal</label>
            <select
              value={form.goal || ''}
              onChange={e => updateField('goal', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select...</option>
              <option value="strength">Strength</option>
              <option value="hypertrophy">Hypertrophy</option>
              <option value="endurance">Endurance</option>
              <option value="weight-loss">Weight Loss</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Experience</label>
            <select
              value={form.experience || ''}
              onChange={e => updateField('experience', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select...</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
        <button
          onClick={saveProfile}
          className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Save Profile
        </button>
        {saved && <span className="ml-4 text-green-600">Saved!</span>}
      </div>

      {/* Data */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Data</h2>
        <div className="flex gap-4">
          <button
            onClick={exportData}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Export Data
          </button>
          <label className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer">
            Import Data
            <input
              type="file"
              accept=".json"
              onChange={importData}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          Export your data as a JSON backup. Import to restore your workout history.
        </p>
      </div>
    </div>
  );
}
