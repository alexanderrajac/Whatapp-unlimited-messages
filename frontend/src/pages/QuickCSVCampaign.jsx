import React, { useState, useEffect, useRef } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  ChevronRight, 
  Layers, 
  Eye, 
  Clock, 
  Smartphone,
  Download,
  Trash2
} from 'lucide-react';
import api from '../api/client';
import WhatsAppChatMockup from '../components/whatsapp/WhatsAppChatMockup';

export default function QuickCSVCampaign({ onOpenQRModal }) {
  // Wizard state
  const [file, setFile] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [campaignName, setCampaignName] = useState('');
  const [messageBody, setMessageBody] = useState(
    'Hello {{Name}}! 👋\n\nExclusive offer from CarpenterBullet! We have special pricing on {{Product}} available in {{City}}.\n\nReply to this message or visit us to claim your discount! ✨'
  );
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('none');
  const [minDelay, setMinDelay] = useState(3);
  const [maxDelay, setMaxDelay] = useState(6);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  
  // Campaign Execution & Live Progress
  const [campaignId, setCampaignId] = useState(null);
  const [campaignDetails, setCampaignDetails] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [activeTab, setActiveTab] = useState('builder'); // 'builder' | 'preview' | 'running'
  const [isLaunching, setIsLaunching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  // Load templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/templates');
      setTemplates(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTemplateSelect = (e) => {
    const tId = e.target.value;
    setSelectedTemplateId(tId);
    if (!tId) return;
    const t = templates.find((item) => String(item.id) === String(tId));
    if (t) {
      setMessageBody(t.body_text);
      if (t.media_url) {
        setMediaUrl(t.media_url);
        setMediaType(t.media_type || 'image');
      }
    }
  };

  const handleFileUpload = async (uploadedFile) => {
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setFileLoading(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const res = await api.post('/contacts/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setParsedData(res.data);
      if (!campaignName) {
        setCampaignName(`${uploadedFile.name.replace(/\.[^/.]+$/, "")} Campaign`);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to parse CSV file.");
    } finally {
      setFileLoading(false);
    }
  };

  const insertVariable = (varName) => {
    setMessageBody((prev) => `${prev} {{${varName}}}`);
  };

  // Generate Personalized Previews for all contacts
  const handleGeneratePreview = async () => {
    if (!parsedData || !parsedData.all_contacts || parsedData.all_contacts.length === 0) {
      setErrorMsg("Please upload a CSV file with valid contacts first.");
      return;
    }
    if (!messageBody.trim()) {
      setErrorMsg("Please enter a message template.");
      return;
    }

    setIsLaunching(true);
    setErrorMsg('');

    try {
      const res = await api.post('/campaigns/quick-csv-campaign', {
        name: campaignName || "Quick CSV Campaign",
        message_body: messageBody,
        media_url: mediaUrl || null,
        media_type: mediaType !== 'none' ? mediaType : null,
        template_id: selectedTemplateId ? parseInt(selectedTemplateId) : null,
        contacts: parsedData.all_contacts,
        min_delay: parseInt(minDelay),
        max_delay: parseInt(maxDelay),
        save_contacts_to_db: true
      });

      setCampaignId(res.data.campaign_id);
      setPreviewData(res.data.preview || []);
      setActiveTab('preview');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to generate campaign preview.");
    } finally {
      setIsLaunching(false);
    }
  };

  const [whatsappStatus, setWhatsappStatus] = useState({ isConnected: false });

  useEffect(() => {
    checkDeviceStatus();
  }, []);

  const checkDeviceStatus = async () => {
    try {
      const res = await api.get('/whatsapp/status');
      setWhatsappStatus(res.data);
    } catch (e) {
      // ignore
    }
  };

  // Start 1-Click Auto Dispatch
  const handleStartCampaign = async () => {
    if (!campaignId) {
      setErrorMsg("Please generate the preview first before starting the campaign.");
      return;
    }
    setIsLaunching(true);
    setErrorMsg('');
    try {
      await api.post(`/campaigns/${campaignId}/start`);
      setActiveTab('running');
      pollCampaignProgress(campaignId);
    } catch (err) {
      console.error("Start campaign error:", err);
      const detail = err.response?.data?.detail || err.response?.data?.error || err.message || "Failed to start campaign.";
      setErrorMsg(`Failed to start campaign: ${detail}`);
    } finally {
      setIsLaunching(false);
    }
  };

  // Poll progress when running
  const pollCampaignProgress = async (id) => {
    try {
      const res = await api.get(`/campaigns/${id}`);
      setCampaignDetails(res.data);
      if (res.data.status === 'RUNNING' || res.data.status === 'PAUSED') {
        setTimeout(() => pollCampaignProgress(id), 2500);
      }
    } catch (e) {
      console.error("Progress poll error:", e);
    }
  };

  const handlePause = async () => {
    if (!campaignId) return;
    await api.post(`/campaigns/${campaignId}/pause`);
    pollCampaignProgress(campaignId);
  };

  const handleResume = async () => {
    if (!campaignId) return;
    await api.post(`/campaigns/${campaignId}/resume`);
    pollCampaignProgress(campaignId);
  };

  const handleCancel = async () => {
    if (!campaignId) return;
    if (confirm("Are you sure you want to stop this campaign?")) {
      await api.post(`/campaigns/${campaignId}/cancel`);
      pollCampaignProgress(campaignId);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = "Name,Phone,City,Product,Discount,Price\n" +
      "Rajesh Kumar,9876543210,Mumbai,Solid Wood Dining Table,20%,₹28000\n" +
      "Priya Sharma,9823456789,Delhi,Luxury Recliner Sofa,15%,₹34999\n" +
      "Amit Patel,9812345678,Ahmedabad,Modular Kitchen Cabinet,25%,₹52000\n" +
      "Sunita Rao,9898765432,Bengaluru,King Size Teak Bed,10%,₹41000\n" +
      "Vikram Singh,9845612345,Jaipur,Designer TV Unit,30%,₹18500";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sample_contacts.csv";
    link.click();
  };

  // Dynamic sample for the WhatsApp Mockup
  const currentSampleContact = parsedData?.sample_contacts?.[0] || {
    name: "Rajesh Kumar",
    phone_number: "919876543210",
    city: "Mumbai",
    custom_fields: {
      Product: "Solid Wood Dining Table",
      Discount: "20%",
      Price: "₹28,000"
    }
  };

  // Render text for mockup preview
  const getRenderedMockupText = () => {
    let text = messageBody;
    const lookup = {
      name: currentSampleContact.name,
      city: currentSampleContact.city,
      phone: currentSampleContact.phone_number,
      ...currentSampleContact.custom_fields
    };
    for (const [k, v] of Object.entries(lookup)) {
      const reg = new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'gi');
      text = text.replace(reg, v || `[${k}]`);
    }
    return text;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Quick CSV Campaign Auto-Dispatcher
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Upload CSV contacts, personalize message placeholders with 1 click, and auto-dispatch via WhatsApp!
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={downloadSampleCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Download Sample CSV
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('builder')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'builder'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          1. Upload & Compose
        </button>

        <button
          onClick={() => previewData.length > 0 && setActiveTab('preview')}
          disabled={previewData.length === 0}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'preview'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
              : 'text-slate-400 hover:text-slate-200 disabled:opacity-40 hover:bg-slate-800/40'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          2. Personalized Preview ({previewData.length})
        </button>

        <button
          onClick={() => campaignId && setActiveTab('running')}
          disabled={!campaignId}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'running'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
              : 'text-slate-400 hover:text-slate-200 disabled:opacity-40 hover:bg-slate-800/40'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          3. Live Execution Stream
        </button>
      </div>

      {/* TAB 1: BUILDER & CSV UPLOAD */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: CSV & Message Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Upload CSV */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">1</span>
                  Upload Contacts (CSV / Excel)
                </h3>
                {parsedData && (
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-semibold border border-emerald-500/20">
                    ✓ {parsedData.total_rows} Contacts Loaded
                  </span>
                )}
              </div>

              {/* Drag & Drop Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  parsedData 
                    ? 'border-emerald-500/40 bg-emerald-950/10' 
                    : 'border-slate-700 hover:border-emerald-500/50 bg-slate-950/40 hover:bg-slate-950/70'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files?.[0])}
                />
                
                {fileLoading ? (
                  <div className="py-4 flex flex-col items-center space-y-2 text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                    <p className="text-xs">Parsing CSV columns and phone numbers...</p>
                  </div>
                ) : parsedData ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 text-left">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{parsedData.filename}</h4>
                        <p className="text-[11px] text-slate-400">
                          Columns: {parsedData.columns?.join(', ')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setParsedData(null);
                        setFile(null);
                      }}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="py-4 flex flex-col items-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-white">
                      Click to upload or drag & drop CSV / Excel file
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Supports Name, Phone, City, Product, Price, and custom columns
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Compose Message & Variables */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">2</span>
                  Create Personalized Message Template
                </h3>

                {/* Quick template loader */}
                {templates.length > 0 && (
                  <select
                    value={selectedTemplateId}
                    onChange={handleTemplateSelect}
                    className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Load Saved Template --</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Campaign Name */}
              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Campaign Title</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Diwali Mega Sale Contacts"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Variable Inserter Buttons */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span>Click to insert personalized variable:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {/* Default standard variables */}
                  {['Name', 'City', 'Phone'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-semibold transition-all hover:scale-105"
                    >
                      +{`{{${v}}}`}
                    </button>
                  ))}

                  {/* Columns detected from uploaded CSV */}
                  {parsedData?.columns
                    ?.filter((c) => !['name', 'phone', 'city'].includes(c.toLowerCase()))
                    .map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => insertVariable(col)}
                        className="px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-500/30 text-xs font-mono font-semibold transition-all hover:scale-105"
                      >
                        +{`{{${col}}}`}
                      </button>
                    ))}
                </div>
              </div>

              {/* Message Textarea */}
              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">WhatsApp Message Content</label>
                <textarea
                  rows={6}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Write your message here... Use {{Name}}, {{City}}, {{Product}} etc."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-white leading-relaxed focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Media Attachment (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs text-slate-300 font-semibold mb-1 block">Media Type</label>
                  <select
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="none">No Media (Text Only)</option>
                    <option value="image">Image Attachment</option>
                    <option value="document">PDF / Document</option>
                  </select>
                </div>

                {mediaType !== 'none' && (
                  <div>
                    <label className="text-xs text-slate-300 font-semibold mb-1 block">Public Media URL</label>
                    <input
                      type="url"
                      placeholder="https://example.com/brochure.jpg"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Step 3: Anti-Ban Safety Throttle */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    Humanized Anti-Ban Safety Delay
                  </span>
                  <span className="text-xs text-emerald-400 font-mono font-bold">
                    {minDelay}s - {maxDelay}s per message
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Adds randomized natural pauses between consecutive messages to prevent account restrictions.
                </p>
                <div className="flex items-center space-x-3 pt-1">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={minDelay}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setMinDelay(val);
                      if (val >= maxDelay) setMaxDelay(val + 2);
                    }}
                    className="flex-1 accent-emerald-500"
                  />
                </div>
              </div>

              {/* Next Button -> Generate Preview */}
              <button
                type="button"
                onClick={handleGeneratePreview}
                disabled={isLaunching || !parsedData}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
              >
                {isLaunching ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                Preview Personalized Messages for All ({parsedData?.total_rows || 0}) Contacts →
              </button>
            </div>
          </div>

          {/* Right Column: Live WhatsApp Screen Mockup (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  Live WhatsApp Preview
                </h4>
                <span className="text-[11px] text-slate-400">
                  Showing: {currentSampleContact.name}
                </span>
              </div>

              <WhatsAppChatMockup
                contactName={currentSampleContact.name}
                phoneNumber={currentSampleContact.phone_number}
                messageText={getRenderedMockupText()}
                mediaUrl={mediaUrl}
                mediaType={mediaType !== 'none' ? mediaType : null}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PERSONALIZED PREVIEW TABLE */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Personalized Message Previews ({previewData.length} Recipients)
                </h3>
                <p className="text-xs text-slate-400">
                  Review each recipient's customized WhatsApp message before starting automatic dispatch.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setActiveTab('builder')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  ← Edit Template
                </button>

                <button
                  onClick={handleStartCampaign}
                  disabled={isLaunching}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all transform hover:scale-105"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Start Auto-Sending Campaign Now 🚀
                </button>
              </div>
            </div>

            {!whatsappStatus.isConnected && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-300">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>
                    <strong>WhatsApp Not Linked Yet:</strong> Please link your WhatsApp via QR code or enable Sandbox Mode before dispatching.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onOpenQRModal}
                  className="px-3 py-1 bg-amber-600/30 hover:bg-amber-600/40 text-amber-200 border border-amber-500/40 rounded-lg font-bold transition-colors"
                >
                  Link Phone / Sandbox
                </button>
              </div>
            )}

            {/* Table of Previews */}
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Recipient Name</th>
                    <th className="px-4 py-3">Phone Number</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">Personalized Message Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {previewData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-white">{row.name || "Customer"}</td>
                      <td className="px-4 py-3 text-emerald-400 font-mono">+{row.phone_number}</td>
                      <td className="px-4 py-3 text-slate-400">{row.city || "—"}</td>
                      <td className="px-4 py-3 whitespace-pre-wrap font-mono text-[11px] text-slate-200 max-w-md bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40 my-1">
                        {row.personalized_text}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE EXECUTION STREAM */}
      {activeTab === 'running' && (
        <div className="space-y-6">
          {campaignDetails && (
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6 shadow-2xl">
              {/* Campaign Header & Status Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-3 h-3 rounded-full ${
                      campaignDetails.status === 'RUNNING' ? 'bg-emerald-500 animate-ping' :
                      campaignDetails.status === 'COMPLETED' ? 'bg-emerald-500' :
                      campaignDetails.status === 'PAUSED' ? 'bg-amber-500' : 'bg-red-500'
                    }`}></span>
                    <h3 className="text-lg font-bold text-white">{campaignDetails.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      campaignDetails.status === 'RUNNING' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      campaignDetails.status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      campaignDetails.status === 'PAUSED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {campaignDetails.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    Delay interval: {campaignDetails.min_delay}s - {campaignDetails.max_delay}s between messages
                  </p>
                </div>

                {/* Controls: Pause / Resume / Stop */}
                <div className="flex items-center space-x-2">
                  {campaignDetails.status === 'RUNNING' && (
                    <button
                      onClick={handlePause}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-amber-600/20"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      Pause
                    </button>
                  )}

                  {campaignDetails.status === 'PAUSED' && (
                    <button
                      onClick={handleResume}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Resume
                    </button>
                  )}

                  {['RUNNING', 'PAUSED'].includes(campaignDetails.status) && (
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Square className="w-3.5 h-3.5 fill-red-300" />
                      Stop
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar & KPI Counters */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-300">
                    Progress: {campaignDetails.sent_count + campaignDetails.failed_count} of {campaignDetails.total_recipients} processed
                  </span>
                  <span className="text-emerald-400 font-mono text-sm font-bold">
                    {campaignDetails.progress_percent}%
                  </span>
                </div>

                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${Math.max(campaignDetails.progress_percent, 2)}%` }}
                  ></div>
                </div>

                {/* Counters */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Total Contacts</p>
                    <p className="text-lg font-extrabold text-white">{campaignDetails.total_recipients}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-center">
                    <p className="text-[10px] uppercase font-bold text-emerald-400">Successfully Sent</p>
                    <p className="text-lg font-extrabold text-emerald-400">{campaignDetails.sent_count}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-center">
                    <p className="text-[10px] uppercase font-bold text-red-400">Failed</p>
                    <p className="text-lg font-extrabold text-red-400">{campaignDetails.failed_count}</p>
                  </div>
                </div>
              </div>

              {/* Real-time Recipient Stream Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Live Recipient Activity Log
                </h4>
                <div className="max-h-96 overflow-y-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5">Recipient</th>
                        <th className="px-4 py-2.5">Phone Number</th>
                        <th className="px-4 py-2.5">Message Snippet</th>
                        <th className="px-4 py-2.5">Sent Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {campaignDetails.recipients?.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-800/30">
                          <td className="px-4 py-2.5">
                            {r.status === 'SENT' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                                ✓ SENT
                              </span>
                            ) : r.status === 'FAILED' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1 w-fit" title={r.error_message}>
                                ✕ FAILED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 w-fit">
                                PENDING
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-white">{r.name || "Customer"}</td>
                          <td className="px-4 py-2.5 font-mono text-emerald-400">+{r.phone_number}</td>
                          <td className="px-4 py-2.5 truncate max-w-xs text-slate-400 font-mono text-[11px]">
                            {r.personalized_text}
                          </td>
                          <td className="px-4 py-2.5 text-slate-500 font-mono text-[11px]">
                            {r.sent_at ? new Date(r.sent_at).toLocaleTimeString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
