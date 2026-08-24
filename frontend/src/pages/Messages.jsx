import React, { useState, useEffect } from 'react';
import { History, Search, Filter, RefreshCw, Send, CheckCircle2, XCircle } from 'lucide-react';
import api from '../api/client';

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await api.get('/messages/history', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          limit: 100
        }
      });
      setMessages(res.data.messages || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [search, statusFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <History className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Message Delivery Logs ({total})
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Real-time audit log of all outbound messages sent through the WhatsApp gateway.
          </p>
        </div>

        <button
          onClick={fetchMessages}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Feed
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by recipient name, phone, or message text..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48 bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Statuses</option>
          <option value="SENT">Sent Successfully</option>
          <option value="FAILED">Failed</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3 text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
            <span>Loading message logs...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs space-y-3">
            <History className="w-10 h-10 mx-auto text-slate-600" />
            <p className="font-semibold text-slate-400">No message history yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Recipient</th>
                  <th className="px-6 py-3.5">WhatsApp Number</th>
                  <th className="px-6 py-3.5">Dispatched Message</th>
                  <th className="px-6 py-3.5">Sent Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {messages.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      {m.status === 'SENT' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> SENT
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1 w-fit" title={m.error_message}>
                          <XCircle className="w-3 h-3" /> FAILED
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 font-bold text-white">
                      {m.contact_name || "Customer"}
                    </td>

                    <td className="px-6 py-4 font-mono text-emerald-400">
                      +{m.phone_number}
                    </td>

                    <td className="px-6 py-4 max-w-md whitespace-pre-wrap font-mono text-[11px] text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/30 my-1">
                      {m.message_text}
                    </td>

                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                      {new Date(m.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
