import React from 'react';

const STATUS_CONFIGS = {
  ACTIVE: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Active' },
  SENT: { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Sent' },
  SCHEDULED: { bg: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Scheduled' },
  REPLIED: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold', label: 'Replied' },
  FOLLOW_UP_PENDING: { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Follow-up Due' },
  FOLLOW_UP_SENT: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Follow-up Sent' },
  BOUNCED: { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Bounced' },
  FAILED: { bg: 'bg-red-50 text-red-700 border-red-200', label: 'Failed' },
  CANCELLED: { bg: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Cancelled' },
  OPTED_OUT: { bg: 'bg-zinc-100 text-zinc-700 border-zinc-300', label: 'Opted Out' },
  SUPPRESSED: { bg: 'bg-zinc-100 text-zinc-700 border-zinc-300', label: 'Suppressed' },
  DRAFT: { bg: 'bg-slate-50 text-slate-500 border-slate-200', label: 'Draft' },
  PENDING: { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pending' },
  NONE: { bg: 'bg-slate-50 text-slate-400 border-slate-200', label: 'None' },
};

export default function StatusBadge({ status }) {
  const conf = STATUS_CONFIGS[status] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    label: status || 'Unknown',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${conf.bg}`}
    >
      {conf.label}
    </span>
  );
}

