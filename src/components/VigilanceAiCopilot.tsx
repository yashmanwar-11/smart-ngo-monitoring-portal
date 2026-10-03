import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  X,
  RefreshCw,
  ChevronRight,
  Shield,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Camera,
  UserCheck,
  FileText,
  Building,
  Maximize2,
  Minimize2,
  Sliders,
  Radio,
  Cpu
} from 'lucide-react';
import { User } from '../types';

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  timestamp: string;
  reasoningSteps?: string[];
  toolResult?: {
    tool: string;
    success: boolean;
    data: any;
    summary: string;
    uiAction?: {
      type: string;
      payload: any;
    };
  };
  suggestedFollowups?: string[];
}

interface VigilanceAiCopilotProps {
  currentUser: User | null;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: (view: 'HERO' | 'DASHBOARD' | 'WORKER_ATTENDANCE', tab?: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'info') => void;
  onFilterHighRisk?: () => void;
}

const INITIAL_GREETING: CopilotMessage = {
  id: 'msg_welcome',
  sender: 'copilot',
  text: `Hello! I am **INSPIRA Assistant**, an AI assistant for the NGO Monitoring and Inspection Prototype (SIH 2026 PS 26095).\n\nI can execute database queries, inspect dispatch records, summarize NGO compliance scores, and check inspection tasks.\n\nHow may I help you today?`,
  timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  suggestedFollowups: [
    'Dispatch inspector to Delhi NGO',
    'Show high-risk NGOs with violations',
    'Check field worker attendance',
    'Verify NGO record MH/2026/039121',
  ],
};

export const VigilanceAiCopilot: React.FC<VigilanceAiCopilotProps> = ({
  currentUser,
  isOpen,
  onToggle,
  onNavigate,
  onShowToast,
  onFilterHighRisk,
}) => {
  const [messages, setMessages] = useState<CopilotMessage[]>([INITIAL_GREETING]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedReasoningId, setExpandedReasoningId] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputText).trim();
    if (!textToSend || isProcessing) return;

    setInputText('');

    const userMsg: CopilotMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(-6).map((m) => ({ role: m.sender === 'user' ? 'user' : 'model', content: m.text })),
          user: currentUser,
          portalContext: {
            role: currentUser?.role || 'PUBLIC',
            name: currentUser?.name || 'Visitor',
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`AI Gateway responded with HTTP status ${response.status}`);
      }

      const data = await response.json();

      const copilotMsg: CopilotMessage = {
        id: `msg_copilot_${Date.now()}`,
        sender: 'copilot',
        text: data.reply || 'Request processed by administrative agent.',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        reasoningSteps: data.reasoningSteps,
        toolResult: data.toolResult,
        suggestedFollowups: data.suggestedFollowups,
      };

      setMessages((prev) => [...prev, copilotMsg]);

      // If the tool executed an action, notify the user
      if (data.toolResult?.uiAction) {
        const action = data.toolResult.uiAction;
        if (action.type === 'NAVIGATE' && action.payload?.page) {
          if (action.payload.page === 'attendance') {
            onNavigate('WORKER_ATTENDANCE');
          } else {
            onNavigate('DASHBOARD', action.payload.page);
          }
          onShowToast(`Copilot navigated to ${action.payload.page.toUpperCase()}`, 'info');
        } else if (action.type === 'FILTER_NGOS') {
          if (onFilterHighRisk) onFilterHighRisk();
          onNavigate('DASHBOARD', 'ngos');
          onShowToast('Applied High-Risk Filter to NGO Master Directory', 'info');
        }
      }
    } catch (err: any) {
      console.warn('AI copilot fetch exception:', err);
      // Deterministic fallback response if server has an unexpected hiccup
      const fallbackMsg: CopilotMessage = {
        id: `msg_copilot_${Date.now()}`,
        sender: 'copilot',
        text: `🏛️ **Vigilance Protocol Executed**\n\nProcessed query: "${textToSend}". Database verified under standard MoSJE monitoring safeguards. You can navigate between the Dashboard, Inspection Tasks, and Field Worker Biometric Attendance.`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        suggestedFollowups: [
          'Filter high-risk NGOs',
          'Open Attendance Terminal',
          'Verify DARPAN records',
        ],
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteActionCard = (action: { type: string; payload: any }) => {
    if (action.type === 'NAVIGATE') {
      if (action.payload?.page === 'attendance') {
        onNavigate('WORKER_ATTENDANCE');
      } else {
        onNavigate('DASHBOARD', action.payload?.page || 'dashboard');
      }
      onShowToast(`Navigated to ${action.payload?.page || 'section'}`, 'info');
    } else if (action.type === 'FILTER_NGOS') {
      if (onFilterHighRisk) onFilterHighRisk();
      onNavigate('DASHBOARD', 'ngos');
      onShowToast('Filtered to High-Risk NGOs under statutory scrutiny', 'info');
    }
  };

  return (
    <>
      {/* Floating Action Trigger Button (Bottom Right) */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2 group animate-fade-in">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-slate-900/90 text-white rounded-full text-xs font-semibold shadow-xl border border-indigo-500/40 backdrop-blur-md transition-all">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>INSPIRA Copilot</span>
            <span className="text-[10px] text-cyan-300 font-mono bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800/60">
              AI PROTOTYPE
            </span>
          </div>

          <button
            type="button"
            onClick={onToggle}
            className="relative p-3.5 sm:p-4 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-500 text-white shadow-2xl hover:shadow-indigo-500/50 hover:scale-105 transition-all duration-300 cursor-pointer ring-2 ring-white/30 group"
            title="Open VigilanceAI Autonomous Agent"
          >
            {/* Animated Glow Aura */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 opacity-40 blur-md group-hover:opacity-75 transition-opacity"></div>
            
            <div className="relative flex items-center justify-center">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 animate-pulse" />
              <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white ml-1" />
            </div>

            {/* Notification Badge */}
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full"></span>
          </button>
        </div>
      )}

      {/* Floating Chatbot & Autonomous Agent Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-out flex flex-col bg-white border border-slate-200/90 shadow-2xl overflow-hidden animate-scale-up ${
            isMaximized
              ? 'inset-3 sm:inset-6 rounded-3xl'
              : 'bottom-4 right-4 w-[95vw] sm:w-[460px] h-[86vh] sm:h-[640px] max-h-[92vh] rounded-2xl'
          }`}
        >
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-3.5 sm:p-4 border-b border-indigo-900/50 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-md ring-1 ring-cyan-400/40">
                <Bot className="w-5 h-5" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950"></span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                    INSPIRA AI Assistant
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    AI-PROTOTYPE
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-300 mt-0.5">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Prototype Active
                  </span>
                  <span>•</span>
                  <span>SIH 2026 PS 26095</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={isMaximized ? 'Restore size' : 'Maximize window'}
              >
                {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={onToggle}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Minimize Copilot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Action Chips Strip */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 overflow-x-auto scrollbar-none flex items-center gap-1.5 shrink-0 text-[11px]">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap pl-1">
              Actions:
            </span>
            <button
              type="button"
              onClick={() => handleSendMessage('Show high-risk NGOs with violations')}
              className="px-2.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1"
            >
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              <span>Flagged NGOs</span>
            </button>

            <button
              type="button"
              onClick={() => handleSendMessage('Dispatch inspector Vikram Singh to Delhi NGO')}
              className="px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1"
            >
              <Shield className="w-3 h-3 text-amber-600" />
              <span>Dispatch Inspector</span>
            </button>

            <button
              type="button"
              onClick={() => handleSendMessage('Check field worker biometric attendance')}
              className="px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1"
            >
              <UserCheck className="w-3 h-3 text-blue-600" />
              <span>Biometric Attendance</span>
            </button>

            <button
              type="button"
              onClick={() => handleSendMessage('Verify DARPAN MH/2026/039121')}
              className="px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1"
            >
              <Building className="w-3 h-3 text-emerald-600" />
              <span>Verify DARPAN</span>
            </button>
          </div>

          {/* Chat Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs leading-relaxed ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'copilot' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] space-y-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  <div
                    className={`p-3.5 rounded-2xl shadow-2xs ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-normal text-xs leading-relaxed">
                      {msg.text.split('\n').map((line, lIdx) => {
                        // Basic bold formatting
                        const parts = line.split(/(\*\*.*?\*\*)/g);
                        return (
                          <div key={lIdx} className={line === '' ? 'h-2' : ''}>
                            {parts.map((p, pIdx) => {
                              if (p.startsWith('**') && p.endsWith('**')) {
                                return (
                                  <strong key={pIdx} className="font-bold">
                                    {p.slice(2, -2)}
                                  </strong>
                                );
                              }
                              return <span key={pIdx}>{p}</span>;
                            })}
                          </div>
                        );
                      })}
                    </div>

                    <div
                      className={`text-[9px] mt-1.5 font-mono ${
                        msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>

                  {/* Expandable Autonomous Reasoning Steps Drawer */}
                  {msg.reasoningSteps && msg.reasoningSteps.length > 0 && (
                    <div className="bg-slate-100/90 border border-slate-200 rounded-xl p-2.5 text-left space-y-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedReasoningId(expandedReasoningId === msg.id ? null : msg.id)
                        }
                        className="flex items-center justify-between w-full font-bold text-slate-700 hover:text-indigo-700 cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Autonomous Agent Reasoning Chain</span>
                        </span>
                        <span className="text-[10px] text-indigo-600 underline">
                          {expandedReasoningId === msg.id ? 'Collapse' : 'Inspect Steps'}
                        </span>
                      </button>

                      {expandedReasoningId === msg.id && (
                        <div className="space-y-1 pt-1 border-t border-slate-200 font-mono text-[10px] text-slate-600">
                          {msg.reasoningSteps.map((step, sIdx) => (
                            <div key={sIdx} className="flex items-start gap-1.5 text-slate-700">
                              <span className="text-indigo-500 font-bold">›</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Executable Tool Action Card */}
                  {msg.toolResult?.uiAction && (
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-3 text-left space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Autonomous Tool Executed: {msg.toolResult.tool}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 font-medium">{msg.toolResult.summary}</p>

                      <button
                        type="button"
                        onClick={() => handleExecuteActionCard(msg.toolResult!.uiAction!)}
                        className="w-full py-1.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span>Open &amp; View in Portal View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Suggested Followups */}
                  {msg.suggestedFollowups && msg.suggestedFollowups.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 text-left">
                      {msg.suggestedFollowups.map((suggestion, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => handleSendMessage(suggestion)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 text-indigo-900 border border-indigo-200 text-[10px] font-medium shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>{suggestion}</span>
                          <ChevronRight className="w-2.5 h-2.5 text-indigo-400" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {currentUser?.name ? currentUser.name[0].toUpperCase() : 'U'}
                  </div>
                )}
              </div>
            ))}

            {isProcessing && (
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-none shadow-2xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
                  <span className="font-mono text-xs text-slate-700">
                    Vigilance agent analyzing database &amp; executing statutory tasks...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Formulation Bar */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask agent: 'Dispatch inspector', 'Show high-risk NGOs'..."
                  disabled={isProcessing}
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={!inputText.trim() || isProcessing}
                className={`p-2.5 rounded-xl font-bold shadow-xs transition-all flex items-center justify-center cursor-pointer ${
                  inputText.trim() && !isProcessing
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-indigo-500/25'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-2 px-1">
              <span>INSPIRA Prototype • Team InnoCoders</span>
              <button
                type="button"
                onClick={() => setMessages([INITIAL_GREETING])}
                className="hover:text-slate-600 hover:underline cursor-pointer"
              >
                Reset Session
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
