import React from 'react';
import { CheckCheck, MessageSquare, Phone, Video, MoreVertical, Paperclip, Send, Smile } from 'lucide-react';

export default function WhatsAppChatMockup({ 
  contactName = "Customer", 
  phoneNumber = "+91 98765 43210", 
  messageText = "", 
  mediaUrl = null,
  mediaType = null,
  time = "10:42 AM"
}) {
  return (
    <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl bg-[#0b141a] flex flex-col h-[480px]">
      {/* WhatsApp Header */}
      <div className="bg-[#1f2c34] px-4 py-3 flex items-center justify-between border-b border-slate-700/40 text-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-emerald-700/80 flex items-center justify-center font-bold text-sm text-white shadow-inner">
            {contactName ? contactName.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white leading-tight truncate max-w-[140px]">
              {contactName || "Customer Name"}
            </h4>
            <p className="text-[11px] text-emerald-400 font-mono">
              {phoneNumber || "+91 98765 43210"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-slate-400">
          <Video className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
          <Phone className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
          <MoreVertical className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-4 overflow-y-auto whatsapp-chat-bg flex flex-col justify-end space-y-3">
        {/* Date pill */}
        <div className="flex justify-center">
          <span className="bg-[#182229]/90 backdrop-blur text-slate-400 text-[10px] uppercase font-semibold px-3 py-0.5 rounded-md shadow-sm border border-slate-800">
            Today
          </span>
        </div>

        {/* Sent Message Bubble */}
        <div className="self-end max-w-[88%] bg-[#005c4b] text-slate-100 rounded-xl rounded-tr-none p-3 shadow-md border border-emerald-900/40 text-sm relative group">
          {/* Media preview if present */}
          {mediaUrl && (
            <div className="mb-2 rounded-lg overflow-hidden border border-emerald-800/50 bg-black/40">
              {mediaType === 'image' ? (
                <img src={mediaUrl} alt="Attached Media" className="w-full h-32 object-cover" />
              ) : (
                <div className="p-3 flex items-center space-x-2 text-xs text-emerald-200">
                  <Paperclip className="w-4 h-4 text-emerald-300" />
                  <span className="truncate">Document Attachment</span>
                </div>
              )}
            </div>
          )}

          {/* Formatted Text */}
          <div className="whitespace-pre-wrap leading-relaxed text-[13px] text-emerald-50">
            {messageText || (
              <span className="text-emerald-300/60 italic">
                Type your message or select a template to preview dynamic personalization...
              </span>
            )}
          </div>

          {/* Timestamp & Status */}
          <div className="flex items-center justify-end space-x-1 mt-1 text-[10px] text-emerald-200/70">
            <span>{time}</span>
            <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
          </div>
        </div>
      </div>

      {/* Fake Input Bar */}
      <div className="bg-[#1f2c34] px-3 py-2.5 flex items-center space-x-2 border-t border-slate-700/40 text-slate-400">
        <Smile className="w-5 h-5 text-slate-400" />
        <Paperclip className="w-5 h-5 text-slate-400" />
        <div className="flex-1 bg-[#2a3942] rounded-lg px-3 py-1.5 text-xs text-slate-400">
          Message
        </div>
        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-md">
          <Send className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
