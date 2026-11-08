import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { MessageSquareReply, RefreshCw, Eye, X } from 'lucide-react';

export default function Replies() {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeReply, setActiveReply] = useState(null);

  const fetchReplies = async () => {
    try {
      setLoading(true);
      const res = await api.get('/replies');
      setReplies(res.data.replies || []);
    } catch (err) {
      console.error('Failed to fetch replies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReplies();
  }, []);

  const handleSync = async () => {
    try {
      setSyncing(true);
      await api.post('/gmail/sync');
      await fetchReplies();
    } catch (err) {
      alert('Sync failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Replies Received</h2>
          <p className="text-sm text-slate-500">
            Detected Gmail responses from your outreach recipients (automatically cancels pending follow-ups)
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 shadow-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Checking Gmail...' : 'Check for Replies'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading replies...</div>
        ) : replies.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquareReply className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">No replies recorded yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Antigravity checks Gmail threads automatically every 3 minutes.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/75 text-xs uppercase font-medium text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Snippet</th>
                  <th className="py-3 px-4">Received At (IST)</th>
                  <th className="py-3 px-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {replies.map((reply) => (
                  <tr key={reply._id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {reply.contactId?.name || reply.from}
                      </div>
                      <div className="text-xs text-slate-400">{reply.from}</div>
                      {reply.contactId?.company && (
                        <div className="text-[11px] text-slate-500">
                          {reply.contactId.company}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 max-w-xs truncate">
                      {reply.subject || '(No Subject)'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 max-w-md truncate">
                      {reply.snippet || '—'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {reply.receivedAt
                        ? new Date(reply.receivedAt).toLocaleString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                          })
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setActiveReply(reply)}
                        className="p-1 text-indigo-600 hover:text-indigo-800 rounded"
                        title="View Reply Snippet"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal View Reply */}
      {activeReply && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Reply Message</h3>
              <button onClick={() => setActiveReply(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400">From:</span>{' '}
                <strong className="text-slate-800">{activeReply.from}</strong>
              </div>
              <div>
                <span className="text-slate-400">Subject:</span>{' '}
                <strong className="text-slate-800">{activeReply.subject}</strong>
              </div>
              <div>
                <span className="text-slate-400">Gmail Thread ID:</span>{' '}
                <code className="text-slate-600">{activeReply.gmailThreadId}</code>
              </div>
              <div className="pt-2">
                <span className="text-slate-500 font-semibold block mb-1">Snippet:</span>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-slate-800 leading-relaxed font-sans">
                  {activeReply.snippet || activeReply.body || '(No snippet)'}
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                onClick={() => setActiveReply(null)}
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

