import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Send,
  Clock,
  Paperclip,
  Eye,
  AlertTriangle,
  CheckCircle,
  FileText,
  X,
  Upload,
  Search,
} from 'lucide-react';

export default function Compose({ setCurrentPage }) {
  const [contacts, setContacts] = useState([]);
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [contactSearch, setContactSearch] = useState('');
  const [subjectTemplate, setSubjectTemplate] = useState('Application for Opportunities - {{companyName}}');
  const [bodyTemplate, setBodyTemplate] = useState(
    'Hi {{firstName}},\n\nI hope this email finds you well.\n\nI have been following {{companyName}}\'s work and would love to explore relevant opportunities where my experience as {{designation}} or engineering contributor could add value.\n\nI have attached my resume for your review. Would appreciate the opportunity to connect.\n\nBest regards,\n{{candidateName}}'
  );
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [candidateName, setCandidateName] = useState('');

  // Previews
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

  // Scheduling modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduledAtTime, setScheduledAtTime] = useState('');
  const [scheduleWarning, setScheduleWarning] = useState('');

  // Status/Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [cRes, rRes, sRes] = await Promise.all([
          api.get('/contacts?limit=200&status=ACTIVE'),
          api.get('/resumes'),
          api.get('/settings'),
        ]);
        setContacts(cRes.data.contacts || []);
        setResumes(rRes.data || []);
        if (rRes.data.length > 0) {
          setSelectedResumeId(rRes.data[0]._id);
        }
        setCandidateName(sRes.data.candidateName || '');
      } catch (err) {
        console.error('Failed to load compose data:', err);
      }
    }
    loadData();
  }, []);

  const handleInsertPlaceholder = (field, target) => {
    const token = `{{${field}}}`;
    if (target === 'subject') {
      setSubjectTemplate((prev) => prev + ' ' + token);
    } else {
      setBodyTemplate((prev) => prev + ' ' + token);
    }
  };

  const handleSelectAll = () => {
    if (selectedContactIds.length === filteredContacts.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(filteredContacts.map((c) => c._id));
    }
  };

  const toggleSelectContact = (id) => {
    if (selectedContactIds.includes(id)) {
      setSelectedContactIds(selectedContactIds.filter((cid) => cid !== id));
    } else {
      setSelectedContactIds([...selectedContactIds, id]);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const q = contactSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q)
    );
  });

  // Handle PDF Resume Upload directly
  const handleUploadResume = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await api.post('/resumes', formData);
      setResumes([res.data, ...resumes]);
      setSelectedResumeId(res.data._id);
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.error || err.message));
    }
  };

  // Preview Generation
  const handleGeneratePreview = async () => {
    if (selectedContactIds.length === 0) {
      setError('Please select at least one recipient to preview.');
      return;
    }
    setError('');
    try {
      setPreviewLoading(true);
      const res = await api.post('/emails/preview', {
        contactIds: selectedContactIds,
        subjectTemplate,
        bodyTemplate,
        attachmentId: selectedResumeId || null,
      });
      setPreviews(res.data.previews || []);
      setActivePreviewIndex(0);
      setPreviewOpen(true);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Send Now
  const handleSendNow = async () => {
    if (selectedContactIds.length === 0) {
      setError('Please select at least one recipient.');
      return;
    }
    if (!window.confirm(`Send personalized outreach email immediately to ${selectedContactIds.length} recipient(s)?`)) return;

    try {
      setLoading(true);
      setError('');
      setSuccessMsg('');
      const res = await api.post('/emails/send', {
        contactIds: selectedContactIds,
        subjectTemplate,
        bodyTemplate,
        attachmentId: selectedResumeId || null,
      });
      setSuccessMsg(`Sent ${res.data.sentCount} emails successfully! 48-hour follow-up queued.`);
      if (res.data.errors && res.data.errors.length > 0) {
        setError(`Some emails failed: ${res.data.errors.map((e) => e.email + ': ' + e.error).join(', ')}`);
      }
      setSelectedContactIds([]);
      setPreviewOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Open Schedule Modal
  const handleOpenSchedule = () => {
    if (selectedContactIds.length === 0) {
      setError('Please select at least one recipient.');
      return;
    }
    setError('');
    setScheduleWarning('');
    setScheduleModalOpen(true);
  };

  // Confirm Schedule
  const handleConfirmSchedule = async () => {
    if (!scheduledAtTime) {
      setScheduleWarning('Please select a date and time.');
      return;
    }

    try {
      setLoading(true);
      setScheduleWarning('');
      const res = await api.post('/emails/schedule', {
        contactIds: selectedContactIds,
        subjectTemplate,
        bodyTemplate,
        attachmentId: selectedResumeId || null,
        scheduledAt: scheduledAtTime,
      });

      setScheduleModalOpen(false);
      setSuccessMsg(`Scheduled ${res.data.scheduledCount} emails successfully!`);
      setSelectedContactIds([]);
    } catch (err) {
      setScheduleWarning(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Email Composer</h2>
        <p className="text-sm text-slate-500">
          Personalized 1-on-1 outreach with placeholders, resume attachments, and 48-hour follow-up.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start space-x-2">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recipient Selection Panel */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[650px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Select Recipients</h3>
              <span className="text-xs text-indigo-600 font-medium">
                {selectedContactIds.length} selected
              </span>
            </div>
            <button
              onClick={handleSelectAll}
              className="text-xs font-medium text-slate-600 hover:text-indigo-600"
            >
              {selectedContactIds.length === filteredContacts.length && filteredContacts.length > 0
                ? 'Deselect All'
                : 'Select All'}
            </button>
          </div>

          <div className="pt-3 pb-2 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1">
            {filteredContacts.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No active contacts found</p>
            ) : (
              filteredContacts.map((contact) => (
                <div
                  key={contact._id}
                  onClick={() => toggleSelectContact(contact._id)}
                  className={`p-2.5 rounded-lg cursor-pointer flex items-start space-x-2.5 transition-colors ${
                    selectedContactIds.includes(contact._id)
                      ? 'bg-indigo-50/70 border border-indigo-200/60'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedContactIds.includes(contact._id)}
                    onChange={() => {}}
                    className="rounded text-indigo-600 mt-1 h-3.5 w-3.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {contact.name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{contact.email}</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {contact.company} • {contact.designation}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 leading-tight">
            * Each contact will receive an individual personalized email. Recipients never see other addresses.
          </div>
        </div>

        {/* Composer Panel */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col space-y-4">
          {/* Placeholder helper chips */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-700 mr-2">Quick Placeholders:</span>
            <div className="inline-flex flex-wrap gap-1.5 mt-1 sm:mt-0">
              {[
                { label: 'First Name', tag: 'firstName' },
                { label: 'Full Name', tag: 'fullName' },
                { label: 'Company', tag: 'companyName' },
                { label: 'Designation', tag: 'designation' },
                { label: 'Your Name', tag: 'candidateName' },
              ].map((p) => (
                <button
                  key={p.tag}
                  type="button"
                  onClick={() => handleInsertPlaceholder(p.tag, 'body')}
                  className="px-2 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                >
                  + &#123;&#123;{p.tag}&#125;&#125;
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700">Subject Line</label>
              <button
                type="button"
                onClick={() => handleInsertPlaceholder('companyName', 'subject')}
                className="text-[11px] text-indigo-600 hover:underline"
              >
                + &#123;&#123;companyName&#125;&#125;
              </button>
            </div>
            <input
              type="text"
              value={subjectTemplate}
              onChange={(e) => setSubjectTemplate(e.target.value)}
              placeholder="e.g. Inquiring regarding opportunities at {{companyName}}"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col">
            <label className="text-xs font-semibold text-slate-700 mb-1">Email Body (Plain Text)</label>
            <textarea
              value={bodyTemplate}
              onChange={(e) => setBodyTemplate(e.target.value)}
              rows={12}
              className="w-full flex-1 px-3.5 py-2.5 text-sm font-sans border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Attachment Selection */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 gap-3">
            <div className="flex items-center space-x-2">
              <Paperclip className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700">Resume Attachment (PDF):</span>
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">No Attachment</option>
                {resumes.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.originalName} ({Math.round(r.size / 1024)} KB)
                  </option>
                ))}
              </select>
              <label className="inline-flex items-center px-2.5 py-1.5 border border-slate-300 bg-white hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-700 cursor-pointer shadow-sm">
                <Upload className="w-3.5 h-3.5 mr-1" />
                Upload PDF
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleUploadResume}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleGeneratePreview}
              disabled={previewLoading || selectedContactIds.length === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <Eye className="w-4 h-4 mr-2" />
              {previewLoading ? 'Generating Preview...' : 'Preview Personalized Emails'}
            </button>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleOpenSchedule}
                disabled={loading || selectedContactIds.length === 0}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-sm font-semibold hover:bg-purple-100 transition-colors disabled:opacity-50"
              >
                <Clock className="w-4 h-4 mr-2" />
                Schedule
              </button>
              <button
                type="button"
                onClick={handleSendNow}
                disabled={loading || selectedContactIds.length === 0}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4 mr-2" />
                {loading ? 'Sending...' : 'Send Now'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewOpen && previews.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Email Preview Before Sending</h3>
                <p className="text-xs text-slate-500">
                  Showing recipient {activePreviewIndex + 1} of {previews.length}
                </p>
              </div>
              <button onClick={() => setPreviewOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Carousel navigation */}
            <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <button
                disabled={activePreviewIndex === 0}
                onClick={() => setActivePreviewIndex((p) => Math.max(0, p - 1))}
                className="px-2.5 py-1 rounded border border-slate-300 disabled:opacity-40"
              >
                ← Previous
              </button>
              <span className="font-medium text-slate-700">
                To: <span className="text-indigo-600">{previews[activePreviewIndex].recipientEmail}</span> ({previews[activePreviewIndex].contactName})
              </span>
              <button
                disabled={activePreviewIndex === previews.length - 1}
                onClick={() => setActivePreviewIndex((p) => Math.min(previews.length - 1, p + 1))}
                className="px-2.5 py-1 rounded border border-slate-300 disabled:opacity-40"
              >
                Next →
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {previews[activePreviewIndex].hasUnresolved && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Warning: Contains unresolved placeholder(s):{' '}
                    <strong>{previews[activePreviewIndex].unresolvedPlaceholders.join(', ')}</strong>
                  </span>
                </div>
              )}

              <div className="text-xs space-y-1">
                <div className="text-slate-500 font-medium">Subject:</div>
                <div className="text-sm font-semibold text-slate-900 bg-slate-50 p-2.5 rounded border border-slate-200">
                  {previews[activePreviewIndex].subject}
                </div>
              </div>

              <div className="text-xs space-y-1">
                <div className="text-slate-500 font-medium">Body:</div>
                <div className="text-xs text-slate-800 whitespace-pre-wrap bg-slate-50 p-3.5 rounded border border-slate-200 font-sans leading-relaxed">
                  {previews[activePreviewIndex].body}
                </div>
              </div>

              {previews[activePreviewIndex].attachment && (
                <div className="text-xs flex items-center space-x-2 text-slate-600 bg-slate-100 p-2 rounded">
                  <FileText className="w-4 h-4 text-rose-500" />
                  <span>Attachment: <strong>{previews[activePreviewIndex].attachment.name}</strong></span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setPreviewOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
              >
                Close Preview
              </button>
              <button
                onClick={handleSendNow}
                disabled={loading}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-sm"
              >
                Confirm & Send Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Picker Modal */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Schedule Email Outreach</h3>
              <button onClick={() => setScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Select the date and time to send out this email campaign. Timing is enforced in{' '}
              <strong>Asia/Kolkata (IST)</strong> timezone.
            </p>

            {scheduleWarning && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
                {scheduleWarning}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Send Date & Time (Asia/Kolkata) *
              </label>
              <input
                type="datetime-local"
                value={scheduledAtTime}
                onChange={(e) => setScheduledAtTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900">
              ℹ️ Once sent, an automatic 48-hour follow-up will be scheduled. If the recipient replies before the follow-up, it will be automatically cancelled.
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setScheduleModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSchedule}
                disabled={loading}
                className="px-5 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700"
              >
                Confirm Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

