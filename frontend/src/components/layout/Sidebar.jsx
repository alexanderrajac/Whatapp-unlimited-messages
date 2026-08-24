import React from 'react';
import { 
  LayoutDashboard, 
  Send, 
  Users, 
  FileText, 
  Megaphone, 
  History, 
  Settings, 
  QrCode,
  Sparkles,
  BarChart3
} from 'lucide-react';

export default function Sidebar({ activePage, setActivePage, onOpenQRModal }) {
  const menuItems = [
    {
      id: 'quick-campaign',
      name: 'Quick CSV Campaign',
      icon: Sparkles,
      badge: 'Auto Send',
      highlight: true
    },
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'contacts',
      name: 'Contacts & CSV',
      icon: Users,
    },
    {
      id: 'templates',
      name: 'Message Templates',
      icon: FileText,
    },
    {
      id: 'campaigns',
      name: 'Campaigns',
      icon: Megaphone,
    },
    {
      id: 'messages',
      name: 'Message Logs',
      icon: History,
    },
    {
      id: 'settings',
      name: 'Settings & Safety',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  item.highlight
                    ? isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
                      : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-900/30'
                    : isActive
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* QR Device Linking Card at bottom of Sidebar */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
        <div className="flex items-center space-x-2.5 text-xs text-slate-300 font-medium">
          <QrCode className="w-4 h-4 text-emerald-400" />
          <span>Device Connection</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Link WhatsApp via QR to send personalized bulk campaigns directly.
        </p>
        <button
          onClick={onOpenQRModal}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <QrCode className="w-3.5 h-3.5 text-emerald-400" />
          Scan QR Code
        </button>
      </div>
    </aside>
  );
}
