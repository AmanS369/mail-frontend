import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Mail,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Send,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export default function GmailIntegration({ onStatusChange }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [testError, setTestError] = useState('');

  // Check URL query params for oauth return message
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get('/gmail/status');
      setStatus(res.data);
      if (onStatusChange) onStatusChange(res.data.connected);
      if (res.data.email) setTestEmail(res.data.email);
    } catch (err) {
      console.error('Failed to get Gmail status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const res = await api.get('/gmail/connect');
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      alert('OAuth init failed: ' + (err.response?.data?.error || err.message));
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect your Gmail account? Scheduled emails will be paused until reconnected.')) return;
    try {
      await api.post('/gmail/disconnect');
      fetchStatus();
    } catch (err) {
      alert('Disconnect failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmail) return;

    try {
      setTestSending(true);
      setTestResult('');
      setTestError('');
      const res = await api.post('/gmail/test-send', { recipientEmail: testEmail });
      setTestResult(res.data.message || 'Test email sent successfully!');
    } catch (err) {
      setTestError(err.response?.data?.error || err.message);
    } finally {
      setTestSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Gmail API Integration</h2>
        <p className="text-sm text-slate-500">
          Connect your Google account via OAuth 2.0 to send emails and track thread replies.
        </p>
      </div>

      {/* Status Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`p-3 rounded-xl ${
                status?.connected ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
              }`}
            >
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Google Account Connection</h3>
              <p className="text-xs text-slate-500">
                {status?.connected
                  ? `Connected as ${status.email}`
                  : 'No Google account currently linked'}
              </p>
            </div>
          </div>

          <div>
            {status?.connected ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <XCircle className="w-3.5 h-3.5 mr-1" />
                Disconnected
              </span>
            )}
          </div>
        </div>

        {status?.connected ? (
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Connected on:{' '}
              <strong className="text-slate-700">
                {new Date(status.connectedAt).toLocaleDateString()}
              </strong>
            </div>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
            >
              Disconnect Account
            </button>
          </div>
        ) : (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Grant offline access so the outreach worker can send scheduled emails and detect replies.
            </p>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-50"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {connecting ? 'Redirecting...' : 'Connect Gmail Account'}
            </button>
          </div>
        )}
      </div>

      {/* Test Email Section */}
      {status?.connected && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Send Test Email</h3>
            <p className="text-xs text-slate-500">
              Send a test outreach message to verify that Gmail API credentials and refresh token work.
            </p>
          </div>

          {testResult && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs">
              ✓ {testResult}
            </div>
          )}

          {testError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
              ✕ {testError}
            </div>
          )}

          <form onSubmit={handleSendTestEmail} className="flex gap-2">
            <input
              type="email"
              required
              placeholder="Recipient email for test..."
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={testSending}
              className="inline-flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 mr-2" />
              {testSending ? 'Sending Test...' : 'Send Test'}
            </button>
          </form>
        </div>
      )}

      {/* Setup Guide Box */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex items-center space-x-2 text-slate-800 font-semibold text-sm">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Google Cloud Console Configuration</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          To enable Gmail OAuth, configure your credentials in the{' '}
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-600 underline font-medium"
          >
            Google Cloud Console
          </a>
          :
        </p>
        <ul className="text-xs text-slate-600 list-disc list-inside space-y-1.5 pl-1">
          <li>
            <strong>Authorized Redirect URI:</strong>{' '}
            <code className="bg-slate-200/80 px-1.5 py-0.5 rounded text-[11px] font-mono text-slate-800">
              http://localhost:5000/api/gmail/callback
            </code>
          </li>
          <li>
            <strong>Required Scopes:</strong>{' '}
            <code className="text-[11px] text-slate-700">gmail.send</code> and{' '}
            <code className="text-[11px] text-slate-700">gmail.readonly</code>
          </li>
          <li>
            Ensure <code className="text-[11px]">GOOGLE_CLIENT_ID</code> and{' '}
            <code className="text-[11px]">GOOGLE_CLIENT_SECRET</code> are set in your{' '}
            <code className="text-[11px]">.env</code> file.
          </li>
        </ul>
      </div>
    </div>
  );
}

