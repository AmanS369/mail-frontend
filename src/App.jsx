import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import CsvImport from './pages/CsvImport';
import Compose from './pages/Compose';
import ScheduledEmails from './pages/ScheduledEmails';
import SentEmails from './pages/SentEmails';
import Replies from './pages/Replies';
import GmailIntegration from './pages/GmailIntegration';
import Settings from './pages/Settings';
import api from './services/api';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [gmailConnected, setGmailConnected] = useState(false);

  // Check Gmail connection status periodically
  const checkGmailStatus = async () => {
    try {
      const res = await api.get('/gmail/status');
      setGmailConnected(!!res.data.connected);
    } catch (err) {
      setGmailConnected(false);
    }
  };

  useEffect(() => {
    checkGmailStatus();
    const interval = setInterval(checkGmailStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard setCurrentPage={setCurrentPage} />;
      case 'contacts':
        return <Contacts setCurrentPage={setCurrentPage} />;
      case 'csv-import':
        return <CsvImport setCurrentPage={setCurrentPage} />;
      case 'compose':
        return <Compose setCurrentPage={setCurrentPage} />;
      case 'scheduled':
        return <ScheduledEmails />;
      case 'sent':
        return <SentEmails />;
      case 'replies':
        return <Replies />;
      case 'gmail':
        return <GmailIntegration onStatusChange={setGmailConnected} />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        gmailConnected={gmailConnected}
      />
      <main className="flex-1 overflow-y-auto p-8 max-h-screen">
        {renderPage()}
      </main>
    </div>
  );
}

