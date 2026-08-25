import React, { useState, useEffect } from 'react';
import {
  QrCode,
  X,
  RefreshCw,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  LogOut,
  Copy,
  Check,
  KeyRound,
  ArrowRight,
  Clock,
  Radio
} from 'lucide-react';
import api from '../../api/client';

export default function QRModal({ isOpen, onClose, onStatusChange }) {
  const [activeTab, setActiveTab] = useState('MOBILE'); // 'MOBILE' | 'DESKTOP' | 'SIMULATION'
  const [statusData, setStatusData] = useState({
    status: 'DISCONNECTED',
    isConnected: false,
    qrCode: null,
    user: null,
    isSimulationMode: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pairing code state for 1-device mobile linking
  const [pairPhone, setPairPhone] = useState('');
  const [pairCode, setPairCode] = useState('');
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [codeExpiresIn, setCodeExpiresIn] = useState(0);
  const [copied, setCopied] = useState(false);

  // Quick test message state
  const [testPhone, setTestPhone] = useState('');
  const [testMsg, setTestMsg] = useState('Hello from CarpenterBullet WhatsApp CRM! 🚀');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/whatsapp/status');
      setStatusData(res.data);
      if (onStatusChange) onStatusChange(res.data);
      if (res.data.isConnected) {
        setError(null);
        setPairCode('');
      }
    } catch (err) {
      console.error("Failed to fetch WhatsApp status:", err);
      setError("Cannot reach WhatsApp Gateway service. Ensure whatsapp-service is running.");
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      const interval = setInterval(fetchStatus, 3500);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Pairing Code Countdown Timer
  useEffect(() => {
    if (codeExpiresIn <= 0) return;
    const timer = setInterval(() => {
      setCodeExpiresIn((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [codeExpiresIn]);

  const handleRequestPairCode = async (e) => {
    e.preventDefault();
    if (!pairPhone) return;

    setIsRequestingCode(true);
    setError(null);
    try {
      const res = await api.post('/whatsapp/pair-code', { phone: pairPhone });
      if (res.data?.success && res.data?.code) {
        setPairCode(res.data.code);
        setCodeExpiresIn(res.data.expiresInSeconds || 120);
      } else {
        setError(res.data?.error || "Failed to generate pairing code. Please try again.");
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || err.message);
    } finally {
      setIsRequestingCode(false);
    }
  };

  const handleCopyCode = () => {
    const cleanCode = pairCode.replace(/[^a-zA-Z0-9]/g, '');
    navigator.clipboard.writeText(cleanCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await api.post('/whatsapp/disconnect');
      setPairCode('');
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
        name: 'CarpenterBullet Demo Account'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                WhatsApp Linked Device
                {statusData.isConnected && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Active
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">Connect your WhatsApp to send automated marketing campaigns</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (when not yet connected) */}
        {!statusData.isConnected && (
          <div className="flex border-b border-slate-800 bg-slate-950/40 p-1.5 gap-1.5">
            <button
              onClick={() => setActiveTab('MOBILE')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'MOBILE'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              📱 Phone Code (Same Mobile)
            </button>
            <button
              onClick={() => setActiveTab('DESKTOP')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'DESKTOP'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <QrCode className="w-4 h-4" />
              💻 Scan QR (PC / 2nd Device)
            </button>
            <button
              onClick={() => setActiveTab('SIMULATION')}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'SIMULATION'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Demo Mode
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
              <div>
                <strong className="block font-semibold">Gateway Notice:</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {statusData.isConnected ? (
            /* Connected View */
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-600/30">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-base">
                      {statusData.user?.name || "WhatsApp Business"}
                    </h4>
                    <p className="text-sm text-emerald-400 font-mono">
                      +{statusData.user?.phone || "Linked Account"}
                    </p>
                    {statusData.isSimulationMode && (
                      <span className="inline-block mt-1 text-[11px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-md font-medium">
                        ✨ Simulation Mode Active
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="px-3.5 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Disconnect
                </button>
              </div>

              {/* Instant Test Message Form */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Send Instant Test Message
                </h5>
                <form onSubmit={handleSendTestMessage} className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-300 mb-1 block">Recipient Phone Number (with Country Code)</label>
                    <input
                      type="text"
                      placeholder="e.g. 919876543210"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 mb-1 block">Message Text</label>
                    <input
                      type="text"
                      value={testMsg}
                      onChange={(e) => setTestMsg(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={testSending || !testPhone}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    {testSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                    Send Test WhatsApp Message
                  </button>

                  {testResult && (
                    <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      testResult.success ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      <span>{testResult.message}</span>
                    </div>
                  )}
                </form>
              </div>
            </div>
          ) : activeTab === 'MOBILE' ? (
            /* Mobile Phone Pairing Code View */
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
                <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-1">
                  <KeyRound className="w-4 h-4" />
                  Link Directly on the Same Mobile Phone
                </h4>
                <p className="text-xs text-slate-300">
                  Enter your phone number to receive an <strong>8-digit Pairing Code</strong>. You won't need a camera or a second device!
                </p>
              </div>

              {!pairCode ? (
                /* Phone Number Entry */
                <form onSubmit={handleRequestPairCode} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                      Your WhatsApp Phone Number (with Country Code)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. 919876543210"
                        value={pairPhone}
                        onChange={(e) => setPairPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-base text-white focus:outline-none focus:border-emerald-500 font-mono placeholder:text-slate-600"
                        autoFocus
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      💡 Tip: For India, prepend 91 (e.g. 919876543210).
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isRequestingCode || !pairPhone}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    {isRequestingCode ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating Pairing Code...
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        Generate 8-Digit Pairing Code
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Generated Code Display */
                <div className="space-y-5 text-center">
                  <div className="p-5 bg-slate-950/80 border border-emerald-500/40 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5" />
                        Your WhatsApp Pairing Code
                      </span>
                      {codeExpiresIn > 0 && (
                        <span className="flex items-center gap-1 text-amber-400 font-mono">
                          <Clock className="w-3 h-3" />
                          Expires in {codeExpiresIn}s
                        </span>
                      )}
                    </div>

                    {/* 8-Digit Code Badges */}
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                      {pairCode.split('').map((char, index) => (
                        char === '-' ? (
                          <span key={index} className="text-slate-500 font-bold text-lg px-1">-</span>
                        ) : (
                          <div
                            key={index}
                            className="w-8 h-10 sm:w-10 sm:h-12 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-center font-mono font-extrabold text-lg sm:text-xl text-emerald-300 shadow-inner"
                          >
                            {char}
                          </div>
                        )
                      ))}
                    </div>

                    {/* Copy Button */}
                    <div className="flex justify-center">
                      <button
                        onClick={handleCopyCode}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                          copied
                            ? 'bg-emerald-500 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                        }`}
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4" />
                            Code Copied to Clipboard!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy Pairing Code
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Mobile Instructions */}
                  <div className="text-left bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs text-slate-300">
                    <h5 className="font-bold text-white uppercase text-[11px] tracking-wider mb-2 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                      Steps to finish linking on your phone:
                    </h5>
                    <div className="flex items-start space-x-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">1</span>
                      <span>Open <strong>WhatsApp</strong> on your phone.</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">2</span>
                      <span>Go to <strong>Settings</strong> (or 3-dots ⋮) &gt; <strong>Linked Devices</strong>.</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">3</span>
                      <span>Tap <strong>Link a Device</strong> ➔ Tap <strong className="text-emerald-400">"Link with phone number instead"</strong> at the bottom.</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">4</span>
                      <span>Paste or enter the <strong>8-digit code</strong> above.</span>
                    </div>
                  </div>

                  <button
                    onClick={() => { setPairCode(''); setPairPhone(''); }}
                    className="text-xs text-slate-400 hover:text-slate-200 underline"
                  >
                    Enter a different phone number
                  </button>
                </div>
              )}
            </div>
          ) : activeTab === 'DESKTOP' ? (
            /* QR Code Desktop View */
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
                    <p className="text-xs font-medium">Generating fresh WhatsApp QR Code...</p>
                  </div>
                )}

                <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Encrypted multi-device session. No Meta developer account needed.
                </p>
              </div>

              {/* Instructions */}
              <div className="text-left bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 space-y-2.5 text-xs text-slate-300">
                <h5 className="font-bold text-white uppercase text-[11px] tracking-wider mb-2">
                  How to scan from your phone:
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
            </div>
          ) : (
            /* Simulation Sandbox Mode View */
            <div className="space-y-5 text-center p-6 bg-slate-950/60 border border-blue-500/30 rounded-2xl">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Instant Demo Sandbox Mode</h4>
                <p className="text-xs text-slate-300 mt-1.5 max-w-md mx-auto">
                  Test creating campaigns, uploading CSVs, and previewing automated messaging workflows immediately without connecting a physical phone.
                </p>
              </div>

              <button
                onClick={handleToggleSimulation}
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {statusData.isSimulationMode ? "Disable Demo Sandbox" : "Activate Instant Demo Sandbox"}
              </button>
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
