import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { MailCheck, Search, Eye, XCircle, X } from 'lucide-react';

export default function SentEmails() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeModalEmail, setActiveModalEmail] = useState(null);

  const fetchSent = async () => {
    try {
      setLoading(true);
      const res = await api.get('/emails', {
        params: {
          status: 'SENT,FOLLOW_UP_PENDING,FOLLOW_UP_SENT,REPLIED,BOUNCED',
          search,
        },
      });
      setEmails(res.data.emails || []);
    } catch (err) {
      console.error('Failed to fetch sent emails:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSent();
  }, [search]);

  const handleCancelFollowUp = async (id) => {
    if (!window.confirm('Cancel the pending 48-hour follow-up for this email?')) return;
    try {
      await api.post(`/emails/${id}/cancel`);
      fetchSent();
      if (activeModalEmail && activeModalEmail._id === id) {
        setActiveModalEmail(null);
      }
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sent Outreach Emails</h2>
          <p className="text-sm text-slate-500">
            History of accepted Gmail outreach emails and their automated follow-up status
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search sent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading sent emails...</div>
        ) : emails.length === 0 ? (
          <div className="p-12 text-center">
            <MailCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">No sent emails yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Once you send emails, they will show up here along with follow-up timers.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/75 text-xs uppercase font-medium text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Sent At (IST)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">48h Follow-up</th>
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
                          {email.contactId.company}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 max-w-xs truncate">
                      {email.subject}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {email.sentAt
                        ? new Date(email.sentAt).toLocaleString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                          })
                        : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={email.status} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col space-y-0.5">
                        <StatusBadge status={email.followUpStatus} />
                        {email.followUpStatus === 'PENDING' && email.followUpDueAt && (
                          <span className="text-[11px] text-amber-700">
                            Due: {new Date(email.followUpDueAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setActiveModalEmail(email)}
                          className="p-1 text-slate-500 hover:text-indigo-600 rounded"
                          title="View Message"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {email.followUpStatus === 'PENDING' && (
                          <button
                            onClick={() => handleCancelFollowUp(email._id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Cancel Follow-up"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
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

      {/* Modal View Detail */}
      {activeModalEmail && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Email Details</h3>
              <button onClick={() => setActiveModalEmail(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400">To:</span>{' '}
                <strong className="text-slate-800">{activeModalEmail.recipientEmail}</strong>
              </div>
              <div>
                <span className="text-slate-400">Subject:</span>{' '}
                <strong className="text-slate-800">{activeModalEmail.subject}</strong>
              </div>
              <div className="flex space-x-4">
                <div>
                  <span className="text-slate-400">Status:</span>{' '}
                  <StatusBadge status={activeModalEmail.status} />
                </div>
                <div>
                  <span className="text-slate-400">Follow-up:</span>{' '}
                  <StatusBadge status={activeModalEmail.followUpStatus} />
                </div>
              </div>
              {activeModalEmail.gmailMessageId && (
                <div>
                  <span className="text-slate-400">Gmail Message ID:</span>{' '}
                  <code className="text-slate-600">{activeModalEmail.gmailMessageId}</code>
                </div>
              )}
              {activeModalEmail.gmailThreadId && (
                <div>
                  <span className="text-slate-400">Gmail Thread ID:</span>{' '}
                  <code className="text-slate-600">{activeModalEmail.gmailThreadId}</code>
                </div>
              )}
              {activeModalEmail.attachmentId && (
                <div>
                  <span className="text-slate-400">Attachment:</span>{' '}
                  <strong className="text-slate-800">{activeModalEmail.attachmentId.originalName}</strong>
                </div>
              )}

              <div className="pt-2">
                <span className="text-slate-500 font-semibold block mb-1">Body Content:</span>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 whitespace-pre-wrap text-slate-800 leading-relaxed">
                  {activeModalEmail.body}
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-between items-center border-t border-slate-100">
              {activeModalEmail.followUpStatus === 'PENDING' ? (
                <button
                  onClick={() => handleCancelFollowUp(activeModalEmail._id)}
                  className="px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200"
                >
                  Cancel 48h Follow-up
                </button>
              ) : <div />}

              <button
                onClick={() => setActiveModalEmail(null)}
                className="px-4 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

