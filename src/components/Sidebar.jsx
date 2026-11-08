import React from 'react';
import {
  LayoutDashboard,
  Users,
  UploadCloud,
  Send,
  Clock,
  MailCheck,
  MessageSquareReply,
  Mail,
  Settings as SettingsIcon,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'csv-import', label: 'CSV Import', icon: UploadCloud },
  { id: 'compose', label: 'Compose Email', icon: Send },
  { id: 'scheduled', label: 'Scheduled Emails', icon: Clock },
  { id: 'sent', label: 'Sent Emails', icon: MailCheck },
  { id: 'replies', label: 'Replies', icon: MessageSquareReply },
  { id: 'gmail', label: 'Gmail Integration', icon: Mail },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export default function Sidebar({ currentPage, setCurrentPage, gmailConnected }) {
  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0 min-h-screen">
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
            ✉️
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-tight">Antigravity</h1>
            <p className="text-xs text-slate-400">Personal Outreach</p>
          </div>
        </div>
      </div>

      {/* Gmail Status pill */}
      <div className="px-4 py-3 mx-3 my-3 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span
            className={`w-2 h-2 rounded-full ${
              gmailConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-400'
            }`}
          />
          <span className="text-xs font-medium text-slate-300">
            {gmailConnected ? 'Gmail Active' : 'Gmail Disconnected'}
          </span>
        </div>
        <button
          onClick={() => setCurrentPage('gmail')}
          className="text-[11px] text-indigo-400 hover:text-indigo-300 underline"
        >
          {gmailConnected ? 'Manage' : 'Connect'}
        </button>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
        Timezone: <span className="text-slate-400 font-medium">Asia/Kolkata</span>
      </div>
    </aside>
  );
}

