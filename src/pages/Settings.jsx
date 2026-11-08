import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Save, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    dailySendingLimit: 50,
    candidateName: '',
    defaultFollowUpSubject: 'Following up on my previous email - {{companyName}}',
    defaultFollowUpBody:
      'Hi {{firstName}},\n\nI wanted to follow up on my previous email and check whether there might be any suitable opportunities.\n\nI would appreciate your consideration.\n\nRegards,\n{{candidateName}}',
    allowedDays: [0, 1, 2, 3, 4, 5, 6],
    timezone: 'Asia/Kolkata',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await api.get('/settings');
        setSettings(res.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccessMsg('');
      const res = await api.patch('/settings', settings);
      setSuccessMsg(res.data.message || 'Settings saved successfully!');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (dayIndex) => {
    const current = settings.allowedDays || [];
    if (current.includes(dayIndex)) {
      if (current.length === 1) {
        alert('At least one day must be selected.');
        return;
      }
      setSettings({
        ...settings,
        allowedDays: current.filter((d) => d !== dayIndex),
      });
    } else {
      setSettings({
        ...settings,
        allowedDays: [...current, dayIndex].sort(),
      });
    }
  };

  const DAYS = [
    { label: 'Sun', val: 0 },
    { label: 'Mon', val: 1 },
    { label: 'Tue', val: 2 },
    { label: 'Wed', val: 3 },
    { label: 'Thu', val: 4 },
    { label: 'Fri', val: 5 },
    { label: 'Sat', val: 6 },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Outreach Settings</h2>
        <p className="text-sm text-slate-500">
          Configure sending limits, candidate identity, sending schedule windows, and 48-hour follow-up templates.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Settings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-slate-900">General & Sending Controls</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Full Name (Candidate Name)
              </label>
              <input
                type="text"
                placeholder="e.g. Aman Sharma"
                value={settings.candidateName}
                onChange={(e) => setSettings({ ...settings, candidateName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400">
                Substituted for &#123;&#123;candidateName&#125;&#125; in emails.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Daily Sending Limit
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={settings.dailySendingLimit}
                onChange={(e) =>
                  setSettings({ ...settings, dailySendingLimit: parseInt(e.target.value, 10) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400">
                Conservative limit per calendar day (Asia/Kolkata timezone).
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Allowed Sending Days of Week
            </label>
            <div className="flex gap-2">
              {DAYS.map((d) => {
                const isSelected = (settings.allowedDays || []).includes(d.val);
                return (
                  <button
                    key={d.val}
                    type="button"
                    onClick={() => toggleDay(d.val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              If an automated 48-hour follow-up falls on a disallowed day, it will roll forward to the next permitted window.
            </span>
          </div>
        </div>

        {/* Default Follow-up Template */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Default 48-Hour Follow-up Template
            </h3>
            <p className="text-xs text-slate-500">
              This message is sent in the original Gmail thread exactly 48 hours after the initial email if no reply is received.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Follow-up Subject Line
            </label>
            <input
              type="text"
              required
              value={settings.defaultFollowUpSubject}
              onChange={(e) => setSettings({ ...settings, defaultFollowUpSubject: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Follow-up Body
            </label>
            <textarea
              rows={8}
              required
              value={settings.defaultFollowUpBody}
              onChange={(e) => setSettings({ ...settings, defaultFollowUpBody: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-sans leading-relaxed"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

