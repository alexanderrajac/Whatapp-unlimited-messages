import React, { useState, useEffect } from 'react';
import { Smartphone, QrCode, Sparkles, RefreshCw, Radio, ExternalLink, Shield } from 'lucide-react';
import api from '../../api/client';

export default function Navbar({ onOpenQRModal, activePage, setActivePage }) {
  const [statusData, setStatusData] = useState({
    isConnected: false,
    user: null,
    isSimulationMode: false,
    status: 'DISCONNECTED'
  });

  const checkStatus = async () => {
    try {
      const res = await api.get('/whatsapp/status');
      setStatusData(res.data);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Brand logo & active badge */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20">
          CB
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-white tracking-tight text-base">CarpenterBullet</h1>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold px-2 py-0.5 rounded-full">
              WhatsApp CRM
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions & WhatsApp Connection Status Badge */}
      <div className="flex items-center space-x-4">
        {/* Launch CSV Campaign Direct Button */}
        <button
          onClick={() => setActivePage('quick-campaign')}
          className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-lg shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Quick CSV Campaign</span>
        </button>

        {/* WhatsApp Link Status Pill */}
        <button
          onClick={onOpenQRModal}
          className={`flex items-center space-x-2.5 px-3.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
            statusData.isConnected
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/30'
              : 'bg-amber-950/40 border-amber-500/30 text-amber-300 hover:bg-amber-900/30 animate-pulse'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              statusData.isConnected ? 'bg-emerald-400' : 'bg-amber-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              statusData.isConnected ? 'bg-emerald-500' : 'bg-amber-500'
            }`}></span>
          </span>

          <Smartphone className="w-3.5 h-3.5" />
          
          <span className="font-semibold">
            {statusData.isConnected
              ? `Connected (${statusData.user?.phone || 'Linked'})`
              : 'Link WhatsApp Device (QR)'}
          </span>
        </button>
      </div>
    </header>
  );
}
