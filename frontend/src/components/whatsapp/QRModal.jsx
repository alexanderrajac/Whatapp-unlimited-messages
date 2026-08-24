import React, { useState, useEffect } from 'react';
import { QrCode, X, RefreshCw, CheckCircle2, Smartphone, ShieldCheck, AlertCircle, Sparkles, LogOut } from 'lucide-react';
import api from '../../api/client';

export default function QRModal({ isOpen, onClose, onStatusChange }) {
  const [statusData, setStatusData] = useState({
    status: 'DISCONNECTED',
    isConnected: false,
    qrCode: null,
    user: null,
    isSimulationMode: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [testPhone, setTestPhone] = useState('');
  const [testMsg, setTestMsg] = useState('Hello from CarpenterBullet WhatsApp CRM! 🚀');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/whatsapp/status');
      setStatusData(res.data);
      if (onStatusChange) onStatusChange(res.data);
    } catch (err) {
      console.error("Failed to fetch WhatsApp status:", err);
      setError("Cannot reach WhatsApp Gateway service. Ensure whatsapp-service is running.");
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      const interval = setInterval(fetchStatus, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await api.post('/whatsapp/disconnect');
      await fetchStatus();
    } catch (err) {
      alert("Error disconnecting: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSimulation = async () => {
    setLoading(true);
    try {
      await api.post('/whatsapp/toggle-simulation', {
        enable: !statusData.isSimulationMode,
        phone: '919876543210',
        name: 'CarpenterBullet Business Account'
      });
      await fetchStatus();
    } catch (err) {
      alert("Error toggling test simulation: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestMessage = async (e) => {
    e.preventDefault();
    if (!testPhone) return;
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await api.post('/whatsapp/send-test', {
        phone: testPhone,
        message: testMsg
      });
      setTestResult({ success: true, message: "Test message sent successfully!" });
    } catch (err) {
      setTestResult({ success: false, message: err.response?.data?.detail || err.message });
    } finally {
      setTestSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                WhatsApp Linked Device
                {statusData.isConnected && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                    🟢 Active
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">Link your phone's WhatsApp to send automated campaigns</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {statusData.isConnected ? (
            /* Connected View */
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-600/30">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-base">
                      {statusData.user?.name || "Connected Account"}
                    </h4>
                    <p className="text-sm text-emerald-400 font-mono">
                      +{statusData.user?.phone || "WhatsApp Number"}
                    </p>
                    {statusData.isSimulationMode && (
                      <span className="inline-block mt-1 text-[11px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-md">
                        Simulation Mode Active
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Disconnect
                </button>
              </div>

              {/* Quick Test Message Tool */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Send Instant Test Message
                </h5>
                <form onSubmit={handleSendTestMessage} className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-300 mb-1 block">Recipient Phone Number (with country code)</label>
                    <input
                      type="text"
                      placeholder="e.g. 919876543210"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 mb-1 block">Message Content</label>
                    <input
                      type="text"
                      value={testMsg}
                      onChange={(e) => setTestMsg(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={testSending || !testPhone}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    {testSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Smartphone className="w-3.5 h-3.5" />}
                    Send Test WhatsApp Message
                  </button>

                  {testResult && (
                    <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                      testResult.success ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      <span>{testResult.message}</span>
                    </div>
                  )}
                </form>
              </div>
            </div>
          ) : (
            /* QR Scanning View */
            <div className="space-y-6 text-center">
              <div className="flex flex-col items-center justify-center p-4 bg-slate-950/70 border border-slate-800 rounded-2xl">
                {statusData.qrCode ? (
                  <div className="relative group p-3 bg-white rounded-2xl shadow-xl">
                    <img
                      src={statusData.qrCode}
                      alt="WhatsApp QR Code"
                      className="w-64 h-64 object-contain rounded-lg"
                    />
                    <div className="absolute inset-0 border-2 border-emerald-500 rounded-2xl pointer-events-none opacity-40 animate-pulse"></div>
                  </div>
                ) : (
                  <div className="w-64 h-64 flex flex-col items-center justify-center border border-dashed border-slate-700 rounded-2xl text-slate-400 space-y-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                    <p className="text-xs">Generating fresh WhatsApp QR Code...</p>
                  </div>
                )}

                <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Encrypted multi-device session. No Meta developer account needed.
                </p>
              </div>

              {/* Steps Guide */}
              <div className="text-left bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 space-y-2.5 text-xs text-slate-300">
                <h5 className="font-bold text-white uppercase text-[11px] tracking-wider mb-2">
                  How to link your phone:
                </h5>
                <div className="flex items-start space-x-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">1</span>
                  <span>Open <strong>WhatsApp</strong> on your mobile phone.</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">2</span>
                  <span>Tap <strong>Menu (⋮)</strong> or <strong>Settings</strong> &gt; <strong>Linked Devices</strong>.</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">3</span>
                  <span>Tap <strong>Link a Device</strong> and point your camera at the QR code above.</span>
                </div>
              </div>

              {/* Simulation Sandbox Button */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={handleToggleSimulation}
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  Enable Instant Sandbox / Simulation Mode (Test without scanning phone)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
