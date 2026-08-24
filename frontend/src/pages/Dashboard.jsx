import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Megaphone, 
  Sparkles, 
  ArrowUpRight, 
  Clock, 
  RefreshCw,
  Plus
} from 'lucide-react';
import api from '../api/client';

export default function Dashboard({ setActivePage, onOpenQRModal }) {
  const [stats, setStats] = useState({
    total_contacts: 0,
    total_campaigns: 0,
    total_sent: 0,
    today_sent: 0,
    total_failed: 0,
    success_rate: 100.0,
    active_campaigns: 0,
    recent_campaigns: [],
    recent_messages: []
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    try {
      const res = await api.get('/analytics/dashboard');
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    const interval = setInterval(fetchDashboardStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const kpis = [
    {
      title: 'Total Contacts',
      value: stats.total_contacts.toLocaleString(),
      sub: 'Saved in CRM',
      icon: Users,
      color: 'from-blue-600/20 to-blue-600/5',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-400',
    },
    {
      title: 'Total Messages Sent',
      value: stats.total_sent.toLocaleString(),
      sub: `${stats.today_sent} sent today`,
      icon: Send,
      color: 'from-emerald-600/20 to-emerald-600/5',
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
    },
    {
      title: 'Success Delivery Rate',
      value: `${stats.success_rate}%`,
      sub: `${stats.total_failed} failed attempts`,
      icon: CheckCircle2,
      color: 'from-teal-600/20 to-teal-600/5',
      borderColor: 'border-teal-500/30',
      iconColor: 'text-teal-400',
    },
    {
      title: 'Campaigns Launched',
      value: stats.total_campaigns.toLocaleString(),
      sub: `${stats.active_campaigns} in progress`,
      icon: Megaphone,
      color: 'from-purple-600/20 to-purple-600/5',
      borderColor: 'border-purple-500/30',
      iconColor: 'text-purple-400',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Hero Banner with Quick CTA */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fast Automated WhatsApp Dispatch</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            Send Personalized WhatsApp Messages to CSV Lists in Seconds
          </h2>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Upload your contact spreadsheet, preview dynamic placeholder variables (<code className="text-emerald-300 font-mono text-[11px] bg-emerald-950/60 px-1.5 py-0.5 rounded">{'{{Name}}'}</code>, <code className="text-emerald-300 font-mono text-[11px] bg-emerald-950/60 px-1.5 py-0.5 rounded">{'{{City}}'}</code>, <code className="text-emerald-300 font-mono text-[11px] bg-emerald-950/60 px-1.5 py-0.5 rounded">{'{{Product}}'}</code>), and auto-dispatch smoothly with humanized delays.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setActivePage('quick-campaign')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4" />
              Launch CSV Campaign Now
            </button>

            <button
              onClick={onOpenQRModal}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              Check Linked WhatsApp Device →
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-6 rounded-2xl bg-gradient-to-b ${kpi.color} bg-slate-900 border ${kpi.borderColor} shadow-xl relative overflow-hidden`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{kpi.title}</span>
                <div className={`p-2 rounded-xl bg-slate-950/60 border border-slate-800 ${kpi.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-2xl font-extrabold text-white font-mono tracking-tight">{kpi.value}</h3>
                <p className="text-[11px] text-slate-400 mt-1">{kpi.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2-Column: Recent Campaigns & Message Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Campaigns (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-emerald-400" />
              Recent Campaigns
            </h3>
            <button
              onClick={() => setActivePage('campaigns')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {stats.recent_campaigns.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No campaigns launched yet. Click "Quick CSV Campaign" to start your first campaign.
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recent_campaigns.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setActivePage('quick-campaign')}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-emerald-500/30 transition-all cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white truncate max-w-[200px]">{c.name}</h4>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      c.status === 'RUNNING' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      c.status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>{c.sent_count + c.failed_count} / {c.total_recipients} sent</span>
                      <span className="font-mono text-emerald-400">{c.progress_percent}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(c.progress_percent, 3)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Message Logs Feed (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-teal-400" />
              Latest Sent Messages
            </h3>
            <button
              onClick={() => setActivePage('messages')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              Logs <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {stats.recent_messages.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No recent message dispatches recorded.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {stats.recent_messages.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start justify-between text-xs gap-2"
                >
                  <div className="space-y-1 truncate">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white">{m.contact_name || "Customer"}</span>
                      <span className="text-[11px] text-emerald-400 font-mono">+{m.phone_number}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{m.message_text}</p>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
