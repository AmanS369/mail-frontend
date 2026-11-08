import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { Clock, XCircle, Search, Paperclip } from 'lucide-react';

export default function ScheduledEmails() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchScheduled = async () => {
    try {
      setLoading(true);
      const res = await api.get('/emails', {
        params: { status: 'SCHEDULED', search },
      });
      setEmails(res.data.emails || []);
    } catch (err) {
      console.error('Failed to fetch scheduled emails:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduled();
  }, [search]);

  const handleCancel = async (id, recipient) => {
    if (!window.confirm(`Cancel scheduled email to ${recipient}?`)) return;
    try {
      await api.post(`/emails/${id}/cancel`);
      fetchScheduled();
    } catch (err) {
      alert('Cancel failed: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Scheduled Outreach Emails</h2>
          <p className="text-sm text-slate-500">
            Pending outreach emails waiting for their scheduled send time
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search scheduled..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading scheduled emails...</div>
        ) : emails.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">No scheduled emails</p>
            <p className="text-xs text-slate-400 mt-1">
              You can schedule emails from the Compose tab.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/75 text-xs uppercase font-medium text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Scheduled For (IST)</th>
                  <th className="py-3 px-4">Attachment</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {emails.map((email) => (
                  <tr key={email._id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">
                        {email.contactId?.name || email.recipientEmail}
                      </div>
                      <div className="text-xs text-slate-400">{email.recipientEmail}</div>
                      {email.contactId?.company && (
                        <div className="text-[11px] text-slate-500">
                          {email.contactId.company} • {email.contactId.designation}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 max-w-xs truncate">
                      {email.subject}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-purple-700">
                      {email.scheduledAt
                        ? new Date(email.scheduledAt).toLocaleString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                          })
                        : '—'}
                    </td>
                    <td className="py-3 px-4">
                      {email.attachmentId ? (
                        <span className="inline-flex items-center text-xs text-slate-700">
                          <Paperclip className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {email.attachmentId.originalName}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleCancel(email._id, email.recipientEmail)}
                        className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Cancel
                      </button>
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

