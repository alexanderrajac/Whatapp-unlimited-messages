import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  UploadCloud, 
  Filter, 
  Tag, 
  RefreshCw, 
  CheckCircle2, 
  X, 
  Smartphone,
  MapPin,
  Mail,
  Edit2
} from 'lucide-react';
import api from '../api/client';

export default function Contacts({ setActivePage }) {
  const [contacts, setContacts] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  
  // Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTagInput, setFormTagInput] = useState('');
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/contacts', {
        params: { search: search || undefined, tag: selectedTag || undefined }
      });
      setContacts(res.data.contacts || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await api.get('/contacts/tags');
      setTags(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchTags();
  }, [search, selectedTag]);

  const handleOpenAdd = () => {
    setEditingContact(null);
    setFormName('');
    setFormPhone('');
    setFormCity('');
    setFormEmail('');
    setFormTagInput('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingContact(c);
    setFormName(c.name || '');
    setFormPhone(c.phone_number || '');
    setFormCity(c.city || '');
    setFormEmail(c.email || '');
    setFormTagInput((c.tags || []).join(', '));
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    if (!formPhone) {
      setFormError("Phone number is required");
      return;
    }
    setFormSaving(true);
    setFormError('');

    const parsedTags = formTagInput.split(',').map((t) => t.trim()).filter(Boolean);

    try {
      if (editingContact) {
        await api.put(`/contacts/${editingContact.id}`, {
          name: formName,
          phone_number: formPhone,
          city: formCity,
          email: formEmail,
          tags: parsedTags
        });
      } else {
        await api.post('/contacts', {
          name: formName,
          phone_number: formPhone,
          city: formCity,
          email: formEmail,
          tags: parsedTags,
          opt_in_status: 'OPTED_IN'
        });
      }
      setIsModalOpen(false);
      fetchContacts();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to save contact.");
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteContact = async (id) => {
    if (confirm("Delete this contact?")) {
      try {
        await api.delete(`/contacts/${id}`);
        fetchContacts();
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
            <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Users className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Customer Contacts ({total})
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Manage your customer database, tags, custom fields, and CSV imports.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActivePage('quick-campaign')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 flex items-center gap-1.5 transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            Upload & Send CSV
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Single Contact
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or city..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {tags.length > 0 && (
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="w-full sm:w-48 bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Tags</option>
            {tags.map((t) => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Contacts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3 text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
            <span>Loading contacts...</span>
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs space-y-3">
            <Users className="w-10 h-10 mx-auto text-slate-600" />
            <p className="font-semibold text-slate-400">No contacts found</p>
            <p>Upload a CSV file or add a contact manually to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">WhatsApp Phone</th>
                  <th className="px-6 py-3.5">City</th>
                  <th className="px-6 py-3.5">Tags</th>
                  <th className="px-6 py-3.5">Custom Attributes</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-white flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-emerald-400 font-bold flex items-center justify-center text-xs">
                        {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div>
                        <div>{c.name || "Unnamed"}</div>
                        {c.email && <div className="text-[11px] text-slate-500 font-normal">{c.email}</div>}
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono text-emerald-400">
                      +{c.phone_number}
                    </td>

                    <td className="px-6 py-4 text-slate-400">
                      {c.city || "—"}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {c.tags && c.tags.length > 0 ? (
                          c.tags.map((t, idx) => (
                            <span key={idx} className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/20 font-medium">
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {c.custom_fields && Object.keys(c.custom_fields).length > 0 ? (
                          Object.entries(c.custom_fields).slice(0, 3).map(([k, v], idx) => (
                            <span key={idx} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700 font-mono truncate max-w-[120px]">
                              {k}: {String(v)}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteContact(c.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
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

      {/* Add / Edit Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingContact ? "Edit Contact" : "Add New Contact"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveContact} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Patel"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">WhatsApp Phone Number *</label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210 (or with country code)"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">City</label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai"
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. ramesh@example.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Tags (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. VIP, Wholesale, Lead"
                  value={formTagInput}
                  onChange={(e) => setFormTagInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
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
                  disabled={formSaving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
                >
                  {formSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
