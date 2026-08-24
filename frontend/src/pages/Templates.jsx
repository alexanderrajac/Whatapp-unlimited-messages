import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Edit2, Copy, Check, Sparkles, X, Smartphone } from 'lucide-react';
import api from '../api/client';
import WhatsAppChatMockup from '../components/whatsapp/WhatsAppChatMockup';

export default function Templates({ setActivePage }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('MARKETING');
  const [formBody, setFormBody] = useState('');
  const [formMediaUrl, setFormMediaUrl] = useState('');
  const [formMediaType, setFormMediaType] = useState('none');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/templates');
      setTemplates(res.data || []);
      if (res.data?.length > 0 && !selectedTemplate) {
        setSelectedTemplate(res.data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleOpenAdd = () => {
    setFormName('');
    setFormCategory('MARKETING');
    setFormBody('Hello {{Name}}! 👋\n\nWe have an exclusive offer on {{Product}} in {{City}}.\n\nReply to claim your discount! ✨');
    setFormMediaUrl('');
    setFormMediaType('none');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!formName || !formBody) {
      setErrorMsg("Template name and body text are required");
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await api.post('/templates', {
        name: formName,
        category: formCategory,
        body_text: formBody,
        media_url: formMediaUrl || null,
        media_type: formMediaType !== 'none' ? formMediaType : null
      });
      setIsModalOpen(false);
      fetchTemplates();
      setSelectedTemplate(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (confirm("Delete this template?")) {
      try {
        await api.delete(`/templates/${id}`);
        fetchTemplates();
        if (selectedTemplate?.id === id) setSelectedTemplate(null);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <FileText className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Message Templates & Placeholders
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Create reusable WhatsApp templates with dynamic variables like <code className="text-emerald-400 font-mono text-[11px] bg-slate-950 px-1 py-0.5 rounded">{'{{Name}}'}</code>, <code className="text-emerald-400 font-mono text-[11px] bg-slate-950 px-1 py-0.5 rounded">{'{{Product}}'}</code>.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create New Template
        </button>
      </div>

      {/* Grid layout: Templates list (7 cols) & Live WhatsApp Preview (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Templates List */}
        <div className="lg:col-span-7 space-y-3">
          {templates.map((t) => {
            const isSelected = selectedTemplate?.id === t.id;
            return (
              <div
                key={t.id}
                onClick={() => setSelectedTemplate(t)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                  isSelected
                    ? 'bg-slate-900 border-emerald-500/50 shadow-xl shadow-emerald-950/30'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <h3 className="text-sm font-bold text-white">{t.name}</h3>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700 font-medium">
                      {t.category}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(t.body_text, t.id);
                      }}
                      className="p-1 text-slate-400 hover:text-emerald-400"
                      title="Copy template text"
                    >
                      {copiedId === t.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(t.id);
                      }}
                      className="p-1 text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 whitespace-pre-wrap font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 leading-relaxed">
                  {t.body_text}
                </p>

                {/* Variable Pills */}
                {t.variables && t.variables.length > 0 && (
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                    <span>Variables:</span>
                    <div className="flex flex-wrap gap-1">
                      {t.variables.map((v, i) => (
                        <span key={i} className="bg-emerald-950/60 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-md font-mono text-[10px]">
                          {`{{${v}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Live Phone Mockup of selected template */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-24">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              Live Template Preview
            </h4>

            <WhatsAppChatMockup
              contactName="Rajesh Kumar"
              phoneNumber="+91 98765 43210"
              messageText={
                selectedTemplate
                  ? selectedTemplate.body_text
                      .replace(/\{\{\s*Name\s*\}\}/gi, "Rajesh Kumar")
                      .replace(/\{\{\s*City\s*\}\}/gi, "Mumbai")
                      .replace(/\{\{\s*Product\s*\}\}/gi, "Solid Teak Dining Set")
                      .replace(/\{\{\s*Discount\s*\}\}/gi, "20%")
                  : "Select a template to preview dynamic variable rendering."
              }
              mediaUrl={selectedTemplate?.media_url}
              mediaType={selectedTemplate?.media_type}
            />
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Create Message Template</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveTemplate} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Template Title</label>
                <input
                  type="text"
                  placeholder="e.g. VIP Festival Discount Offer"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="MARKETING">Marketing & Promotions</option>
                  <option value="UTILITY">Order & Delivery Utility</option>
                  <option value="SUPPORT">Customer Support</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">
                  Template Body (use {'{{Name}}'}, {'{{City}}'}, {'{{Product}}'} placeholders)
                </label>
                <textarea
                  rows={6}
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono leading-relaxed focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Media Type</label>
                  <select
                    value={formMediaType}
                    onChange={(e) => setFormMediaType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="none">Text Only</option>
                    <option value="image">Image Attachment</option>
                    <option value="document">PDF Document</option>
                  </select>
                </div>
                {formMediaType !== 'none' && (
                  <div>
                    <label className="text-slate-300 font-semibold mb-1 block">Media URL</label>
                    <input
                      type="url"
                      placeholder="https://example.com/banner.jpg"
                      value={formMediaUrl}
                      onChange={(e) => setFormMediaUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/30"
                >
                  {saving ? "Saving..." : "Save Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
