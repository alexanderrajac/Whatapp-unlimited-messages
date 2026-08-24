import React, { useState, useEffect } from 'react';
import { Megaphone, Play, Pause, Trash2, Eye, RefreshCw, Sparkles, X, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../api/client';

export default function Campaigns({ setActivePage }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await api.get('/campaigns');
      setCampaigns(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    const interval = setInterval(fetchCampaigns, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleViewDetails = async (id) => {
    setModalLoading(true);
    try {
      const res = await api.get(`/campaigns/${id}`);
      setSelectedCampaign(res.data);
    } catch (err) {
      alert(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this campaign history?")) {
      try {
        await api.delete(`/campaigns/${id}`);
        fetchCampaigns();
        if (selectedCampaign?.id === id) setSelectedCampaign(null);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Megaphone className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Campaign Execution History
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Track real-time progress, delivery rates, and logs of all CSV campaigns.
          </p>
        </div>

        <button
          onClick={() => setActivePage('quick-campaign')}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          Create New CSV Campaign
        </button>
      </div>

      {/* Campaigns Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3 text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
            <span>Loading campaigns...</span>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs space-y-3">
            <Megaphone className="w-10 h-10 mx-auto text-slate-600" />
            <p className="font-semibold text-slate-400">No campaigns launched yet</p>
            <button
              onClick={() => setActivePage('quick-campaign')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
            >
              Start First Campaign
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Campaign Name</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Progress</th>
                  <th className="px-6 py-3.5">Sent / Failed</th>
                  <th className="px-6 py-3.5">Speed / Delay</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white text-sm">{c.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {new Date(c.created_at).toLocaleString()}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        c.status === 'RUNNING' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        c.status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        c.status === 'PAUSED' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}>
                        {c.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 w-48">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">{c.sent_count + c.failed_count} of {c.total_recipients}</span>
                          <span className="text-emerald-400 font-mono font-bold">{c.progress_percent}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.max(c.progress_percent, 2)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono text-xs">
                      <span className="text-emerald-400 font-bold">{c.sent_count}</span>
                      <span className="text-slate-500"> / </span>
                      <span className="text-red-400 font-bold">{c.failed_count}</span>
                    </td>

                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                      {c.min_delay}s - {c.max_delay}s
                    </td>

                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleViewDetails(c.id)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Campaign Details Inspector Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl p-6 space-y-4 text-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{selectedCampaign.name}</h3>
                <p className="text-xs text-slate-400">
                  {selectedCampaign.sent_count} sent, {selectedCampaign.failed_count} failed of {selectedCampaign.total_recipients} total
                </p>
              </div>
              <button onClick={() => setSelectedCampaign(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recipients Table in Modal */}
            <div className="overflow-y-auto flex-1 border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Recipient</th>
                    <th className="px-4 py-2.5">Phone Number</th>
                    <th className="px-4 py-2.5">Message Sent</th>
                    <th className="px-4 py-2.5">Sent At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {selectedCampaign.recipients?.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'SENT' ? 'bg-emerald-500/20 text-emerald-300' :
                          r.status === 'FAILED' ? 'bg-red-500/20 text-red-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-bold text-white">{r.name || "Customer"}</td>
                      <td className="px-4 py-2.5 font-mono text-emerald-400">+{r.phone_number}</td>
                      <td className="px-4 py-2.5 max-w-sm truncate text-slate-400 font-mono text-[11px]">{r.personalized_text}</td>
                      <td className="px-4 py-2.5 text-slate-500 font-mono text-[11px]">
                        {r.sent_at ? new Date(r.sent_at).toLocaleTimeString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedCampaign(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
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
