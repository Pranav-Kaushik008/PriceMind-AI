import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Sparkles, Zap, Terminal, CornerDownLeft, RefreshCw,
  TrendingUp, ShieldAlert, Cpu, ArrowUpRight, BarChart2
} from 'lucide-react';
import { ModuleShell } from '../components/layout/ModuleShell';
import { Button } from '../components/ui/Button';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../lib/utils';
import { mockAssistantMessages } from '../mock/mockData';
import { apiClient } from '../api/client';

const promptStarters = [
  'Which products have the biggest pricing opportunities?',
  'Why has demand decreased for this product?',
  'What happens if I increase this product price by 5%?',
  'Summarize this month revenue and profit performance'
];

export function AIAssistant() {
  const [messages, setMessages] = useState(mockAssistantMessages);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);
  const { setActivePage } = useAppStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsThinking(true);

    try {
      // Module 12: try the AI Agent endpoint first
      let content = null;
      let toolsBadge = '';

      const agentResponse = await apiClient.queryAgent(text);
      if (agentResponse && agentResponse.answer) {
        content = agentResponse.answer;
        const toolsUsed = agentResponse.tools_used || [];
        if (toolsUsed.length > 0) {
          toolsBadge = `\n\n_Tools used: ${toolsUsed.join(', ')}_`;
        }
      }

      // Fallback to Module 11 RAG assistant if agent is unavailable
      if (!content) {
        const ragResponse = await apiClient.queryAIAssistant(text);
        content = ragResponse?.content || 'No response received from the pricing intelligence backend.';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: content + toolsBadge,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: 'Unable to reach the pricing intelligence backend. Telemetry operating in offline mode.',
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const clearChat = () => {
    setMessages(mockAssistantMessages);
  };

  return (
    <ModuleShell
      breadcrumb={[{ label: 'AI Assistant' }]}
      title="Pricing Intelligence Copilot"
      description="Natural language revenue optimization agent, RAG-grounded policy explanations, and dynamic pricing simulation assistant."
      actions={
        <Button variant="ghost" size="sm" icon={RefreshCw} onClick={clearChat} className="text-xs">
          Reset Session
        </Button>
      }
    >
      <div className="flex flex-col h-[calc(100vh-210px)] border border-white/[0.08] rounded-2xl bg-[#0D1524]/60 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Terminal Status Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.08] bg-white/[0.02] text-xs font-sans">
          <div className="flex items-center gap-2.5 text-white">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Sparkles size={13} />
            </div>
            <span className="font-semibold">PriceMind RAG Agent v2.4</span>
            <span className="text-slate-400 hidden sm:inline">• Live ERP & MLflow Connected</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
            <span className="font-medium">Telemetry Online</span>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1.5 text-[11px] font-mono text-slate-400">
                  <span className="font-medium text-slate-300">{isUser ? 'You (Revenue Manager)' : 'PriceMind AI Copilot'}</span>
                  <span>•</span>
                  <span>{m.timestamp}</span>
                </div>
                <div
                  className={`max-w-2xl px-5 py-3.5 rounded-2xl text-xs leading-relaxed font-sans whitespace-pre-line shadow-md transition-all ${
                    isUser
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none border border-indigo-400/30 shadow-[0_4px_16px_rgba(99,102,241,0.25)]'
                      : 'bg-[#131D31]/80 backdrop-blur-md text-slate-200 rounded-tl-none border border-white/[0.08]'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })}

          {isThinking && (
            <div className="flex flex-col items-start">
              <div className="text-[11px] font-mono text-slate-400 mb-1.5">PriceMind AI Copilot</div>
              <div className="px-5 py-3.5 rounded-2xl rounded-tl-none bg-[#131D31]/80 backdrop-blur-md border border-indigo-500/30 text-xs font-sans text-indigo-300 flex items-center gap-3 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                </span>
                <span>Querying TreeSHAP attributions & elasticity tensors...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Starters */}
        <div className="px-5 py-3 border-t border-white/[0.06] bg-white/[0.01] flex flex-wrap gap-2">
          {promptStarters.map((starter, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(starter)}
              className="text-xs px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-indigo-500/15 border border-white/[0.08] hover:border-indigo-500/30 text-slate-300 hover:text-white transition-all cursor-pointer text-left truncate max-w-[340px] shadow-sm"
            >
              💡 {starter}
            </button>
          ))}
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-white/[0.08] bg-[#0A101D]/80 backdrop-blur-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask PriceMind AI about pricing rationale, elasticity, competitor actions, or simulation scenarios..."
              className="flex-1 bg-[#131D31]/90 border border-white/[0.08] focus:border-indigo-500/60 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-all font-sans shadow-inner"
            />
            <Button
              type="submit"
              size="md"
              variant="primary"
              disabled={!input.trim() || isThinking}
              icon={Send}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-medium shadow-[0_0_15px_rgba(99,102,241,0.3)] cursor-pointer"
            >
              Submit Query
            </Button>
          </form>
        </div>
      </div>
    </ModuleShell>
  );
}
