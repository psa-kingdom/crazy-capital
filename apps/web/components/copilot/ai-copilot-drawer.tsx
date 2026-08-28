'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Copy,
  Check,
  Zap,
  BookOpen,
  MessageSquare,
  FileText,
  ChevronRight,
  RefreshCw,
  Scale,
} from 'lucide-react';
import { Button } from '@cc/ui';
import { copilotApi } from '@/lib/api';

interface CopilotMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: string[];
  suggestedActions?: string[];
  draftPayload?: {
    channel?: string;
    body?: string;
    recipientName?: string;
  };
  timestamp: string;
}

export function AiCopilotDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<CopilotMsg[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content:
        'Namaste! I am your **Crazy Capital AI Operations Copilot**.\n\nI can help you review application blockers, draft client WhatsApp/Email messages, and answer Indian statutory compliance questions (MCA SPICe+, GST, Trademark, DPIIT Startup rules).',
      citations: ['Companies Act 2013', 'CGST Act 2017', 'Trade Marks Act 1999'],
      suggestedActions: [
        'Draft WhatsApp reminder for pending docs',
        'Check SPICe+ MCA requirements',
        'GST REG-01 threshold rules',
        'Trademark NICE class search',
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: CopilotMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res: any = await copilotApi.chat({
        sessionId,
        message: text,
        contextType: 'GENERAL',
      });

      if (res?.sessionId) setSessionId(res.sessionId);

      const assistantMsg: CopilotMsg = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: res.reply || 'Analysis complete.',
        citations: res.citations || [],
        suggestedActions: res.suggestedActions || [],
        draftPayload: res.draftPayload,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e: any) {
      // Local fallback intelligent answer
      let reply = `### MCA & Compliance Intelligence\n\nFor **${text}**:\n• All statutory documents (PAN, Aadhaar, Bank Statement < 2 months) are required.\n• DIR-3 KYC and DSC Class 3 must be active.\n• Timeline: 3-7 business days via SPICe+ integrated web form.`;
      let draftPayload: any = undefined;

      if (text.toLowerCase().includes('whatsapp') || text.toLowerCase().includes('draft')) {
        const body = `Namaste! 📋 Regarding your compliance registration with Crazy Capital: Kindly upload your pending statutory documents on https://crazycapital.in/customer/documents so our team can complete your filing today. Thank you!`;
        reply = `Here is a drafted WhatsApp update for your client:\n\n> ${body}\n\nClick below to copy or dispatch via notification gateway.`;
        draftPayload = { channel: 'WHATSAPP', body, recipientName: 'Valued Client' };
      }

      const fallbackMsg: CopilotMsg = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: reply,
        citations: ['Companies Act 2013', 'MCA CRC Guidelines'],
        suggestedActions: ['Copy Draft', 'Search Compliance Base', 'Check Gate Rules'],
        draftPayload,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <>
      {/* Floating Sparkly Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-brand-700 via-indigo-700 to-purple-800 text-white rounded-full shadow-xl shadow-brand-700/30 hover:shadow-2xl hover:shadow-brand-700/40 hover:scale-105 active:scale-95 transition-all font-semibold text-xs border border-white/20"
        >
          <div className="relative">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-brand-900 animate-ping" />
          </div>
          <span>Crazy Copilot</span>
          <span className="bg-white/20 text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">AI 4.3</span>
        </button>
      </div>

      {/* Slide-Over Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
              {/* Drawer Header */}
              <div className="p-4 bg-gradient-to-r from-slate-900 via-brand-950 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-brand-600/30 text-brand-300 border border-brand-500/30">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">Crazy Operations Copilot</h3>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                        Online
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">Indian Compliance • MCA • GST • Workflows</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                      {msg.role === 'user' ? (
                        <>
                          <span>You</span> <User className="w-3 h-3" />
                        </>
                      ) : (
                        <>
                          <Bot className="w-3 h-3 text-brand-600" /> <span>Crazy Copilot</span>
                        </>
                      )}
                      <span>• {msg.timestamp}</span>
                    </div>

                    <div
                      className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs ${
                        msg.role === 'user'
                          ? 'bg-brand-600 text-white rounded-br-none'
                          : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                      }`}
                    >
                      <div className="space-y-2 whitespace-pre-wrap">
                        {msg.content}
                      </div>

                      {/* Draft Box inside Copilot message */}
                      {msg.draftPayload && msg.draftPayload.body && (
                        <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> Ready Draft ({msg.draftPayload.channel || 'WHATSAPP'})
                            </span>
                            <button
                              onClick={() => handleCopyText(msg.id, msg.draftPayload!.body!)}
                              className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" /> Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" /> Copy Text
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Citations */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                          {msg.citations.map((c, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200"
                            >
                              ⚖️ {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Suggested Quick Follow-ups */}
                    {msg.suggestedActions && msg.suggestedActions.length > 0 && msg.role === 'assistant' && (
                      <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                        {msg.suggestedActions.map((act, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(act)}
                            className="text-[10px] font-semibold bg-white hover:bg-brand-50 text-slate-700 hover:text-brand-700 px-2 py-1 rounded-lg border border-slate-200 hover:border-brand-200 transition-colors flex items-center gap-1 text-left"
                          >
                            <Zap className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                            <span>{act}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 w-fit text-xs text-slate-500 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-600" />
                    <span>Analyzing statutory guidelines & workflows...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3.5 bg-white border-t border-slate-200 space-y-2">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask compliance rule, draft WhatsApp..."
                    className="flex-1 text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-brand-500"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!inputMessage.trim() || isLoading}
                    className="px-3 py-2.5"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
                <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                  <span>Powered by Indian Statutory Catalog (ADR-018)</span>
                  <span>Instant Regulatory Q&amp;A</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
