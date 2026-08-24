import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Shield, Clock, Globe, Save, CheckCircle2, QrCode } from 'lucide-react';
import api from '../api/client';

export default function Settings({ onOpenQRModal }) {
  const [minDelay, setMinDelay] = useState(3);
  const [maxDelay, setMaxDelay] = useState(6);
  const [countryCode, setCountryCode] = useState('91');
  const [autoSave, setAutoSave] = useState(true);
  const [gatewayUrl, setGatewayUrl] = useState('http://localhost:3001');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setMinDelay(res.data.min_delay_seconds || 3);
      setMaxDelay(res.data.max_delay_seconds || 6);
      setCountryCode(res.data.default_country_code || '91');
      setAutoSave(res.data.auto_save_contacts ?? true);
      setGatewayUrl(res.data.whatsapp_gateway_url || 'http://localhost:3001');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/settings', {
        min_delay_seconds: parseInt(minDelay),
        max_delay_seconds: parseInt(maxDelay),
        default_country_code: countryCode,
        auto_save_contacts: autoSave
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert("Error saving settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur">
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
            <SettingsIcon className="w-4 h-4" />
          </span>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Settings & Safety Rules
          </h2>
        </div>
        <p className="text-xs text-slate-400">
          Configure anti-ban intervals, default country prefix, and connection options.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Anti-ban Delay Settings Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center space-x-2.5 text-sm font-bold text-white">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Anti-Ban Dispatch Safety Delays</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            WhatsApp actively flags accounts that send high-speed bursts. Setting a natural delay (e.g. 3–6 seconds) between messages keeps your account safe and ensures reliable delivery.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">
                Minimum Delay (seconds)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={minDelay}
                onChange={(e) => setMinDelay(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">
                Maximum Delay (seconds)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={maxDelay}
                onChange={(e) => setMaxDelay(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Regional & Phone Settings */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center space-x-2.5 text-sm font-bold text-white">
            <Globe className="w-4 h-4 text-blue-400" />
            <span>Country & Contact Defaults</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">
                Default Country Code (for 10-digit numbers)
              </label>
              <div className="flex items-center">
                <span className="bg-slate-800 px-3 py-2 border border-r-0 border-slate-800 rounded-l-xl text-xs text-slate-400 font-mono">+</span>
                <input
                  type="text"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  placeholder="91"
                  className="w-full bg-slate-950 border border-slate-800 rounded-r-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <span className="text-xs text-slate-300 font-semibold">
                  Auto-save CSV contacts to CRM directory
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* WhatsApp Gateway Info Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-xl">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              WhatsApp Linked Device Session
            </h4>
            <p className="text-[11px] text-slate-400">
              Gateway endpoint: <span className="font-mono text-emerald-400">{gatewayUrl}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenQRModal}
            className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <QrCode className="w-3.5 h-3.5" />
            Manage Device Link
          </button>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end space-x-3">
          {savedSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Settings updated successfully!
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
