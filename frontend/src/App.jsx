import React, { useState } from 'react';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import QRModal from './components/whatsapp/QRModal';
import Dashboard from './pages/Dashboard';
import QuickCSVCampaign from './pages/QuickCSVCampaign';
import Contacts from './pages/Contacts';
import Templates from './pages/Templates';
import Campaigns from './pages/Campaigns';
import Messages from './pages/Messages';
import Settings from './pages/Settings';

export default function App() {
  const [activePage, setActivePage] = useState('quick-campaign');
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard setActivePage={setActivePage} onOpenQRModal={() => setIsQRModalOpen(true)} />;
      case 'quick-campaign':
        return <QuickCSVCampaign onOpenQRModal={() => setIsQRModalOpen(true)} />;
      case 'contacts':
        return <Contacts setActivePage={setActivePage} />;
      case 'templates':
        return <Templates setActivePage={setActivePage} />;
      case 'campaigns':
        return <Campaigns setActivePage={setActivePage} />;
      case 'messages':
        return <Messages />;
      case 'settings':
        return <Settings onOpenQRModal={() => setIsQRModalOpen(true)} />;
      default:
        return <QuickCSVCampaign onOpenQRModal={() => setIsQRModalOpen(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onOpenQRModal={() => setIsQRModalOpen(true)}
        activePage={activePage}
        setActivePage={setActivePage}
      />

      {/* Main Content Area with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          onOpenQRModal={() => setIsQRModalOpen(true)}
        />

        {/* Mobile Navigation bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 px-3 py-2 flex items-center justify-around text-[10px] font-semibold text-slate-400">
          <button
            onClick={() => setActivePage('quick-campaign')}
            className={`flex flex-col items-center py-1 ${activePage === 'quick-campaign' ? 'text-emerald-400' : ''}`}
          >
            <span>🚀 Send CSV</span>
          </button>
          <button
            onClick={() => setActivePage('dashboard')}
            className={`flex flex-col items-center py-1 ${activePage === 'dashboard' ? 'text-emerald-400' : ''}`}
          >
            <span>📊 Dashboard</span>
          </button>
          <button
            onClick={() => setActivePage('contacts')}
            className={`flex flex-col items-center py-1 ${activePage === 'contacts' ? 'text-emerald-400' : ''}`}
          >
            <span>👥 Contacts</span>
          </button>
          <button
            onClick={() => setActivePage('campaigns')}
            className={`flex flex-col items-center py-1 ${activePage === 'campaigns' ? 'text-emerald-400' : ''}`}
          >
            <span>📢 Campaigns</span>
          </button>
          <button
            onClick={() => setIsQRModalOpen(true)}
            className="flex flex-col items-center py-1 text-teal-400"
          >
            <span>📱 Link Device</span>
          </button>
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          {renderContent()}
        </main>
      </div>

      {/* WhatsApp QR Linked Device Modal */}
      <QRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
      />
    </div>
  );
}
