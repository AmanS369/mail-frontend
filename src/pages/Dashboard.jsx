import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import {
  Users,
  Send,
  Clock,
  MessageSquareReply,
  AlertCircle,
  CheckCircle2,
  Hourglass,
  RefreshCw,
} from 'lucide-react';

export default function Dashboard({ setCurrentPage }) {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, actRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/activity?limit=25'),
      ]);
      setStats(statsRes.data);
      setActivity(actRes.data.activity || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleManualSync = async () => {
    try {
      setSyncing(true);
      await api.post('/gmail/sync');
      await fetchData();
    } catch (err) {
      alert('Sync failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setSyncing(false);
    }
  };

  const statCards = [
    { label: 'Total Contacts', value: stats?.totalContacts ?? 0, icon: Users, color: 'text-slate-700', bg: 'bg-slate-100' },
    { label: 'Emails Sent', value: stats?.emailsSent ?? 0, icon: Send, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Scheduled Emails', value: stats?.scheduledEmails ?? 0, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Replies Received', value: stats?.repliesReceived ?? 0, icon: MessageSquareReply, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Follow-ups Due', value: stats?.followUpsPending ?? 0, icon: Hourglass, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Follow-ups Sent', value: stats?.followUpsSent ?? 0, icon: CheckCircle2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Failed Emails', value: stats?.failedEmails ?? 0, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h2>
          <p className="text-sm text-slate-500">Real-time status of your personal outreach pipeline</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="inline-flex items-center px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Checking Replies...' : 'Sync Replies'}
          </button>
          <button
            onClick={() => setCurrentPage('compose')}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 shadow-sm transition-colors"
          >
            <Send className="w-4 h-4 mr-2" />
            Compose Email
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 leading-tight">{card.label}</span>
                <div className={`p-1.5 rounded-lg ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {loading ? '...' : card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Recent Outreach Activity</h3>
            <p className="text-xs text-slate-500">Live recipient and thread tracking</p>
          </div>
          <button
            onClick={fetchData}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading outreach activity...</div>
        ) : activity.length === 0 ? (
          <div className="p-12 text-center">
            <Send className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">No email activity yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Add contacts and send or schedule your first outreach email!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/75 text-xs uppercase font-medium text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Company & Role</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Initial Status</th>
                  <th className="py-3 px-4">Sent / Scheduled</th>
                  <th className="py-3 px-4">Reply Status</th>
                  <th className="py-3 px-4">Follow-up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activity.map((row) => (
                  <tr key={row.emailId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{row.contact.name}</div>
                      <div className="text-xs text-slate-400">{row.contact.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800">{row.contact.company}</div>
                      <div className="text-xs text-slate-400">{row.contact.designation}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate font-medium text-slate-800">
                      {row.subject}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={row.initialEmailStatus} />
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {row.sentAt
                        ? new Date(row.sentAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                        : row.scheduledAt
                        ? `Scheduled: ${new Date(row.scheduledAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`
                        : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={row.replyStatus} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col space-y-1">
                        <StatusBadge status={row.followUpStatus} />
                        {row.followUpDueAt && row.followUpStatus === 'PENDING' && (
                          <span className="text-[11px] text-amber-700">
                            Due: {new Date(row.followUpDueAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

