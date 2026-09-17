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

const promptStarters = [
  'Explain why SKU-8921-PRO was recommended a +11.8% price increase',
  'What is our highest-risk category for competitor undercutting?',
  'Simulate the net revenue impact of a 5% margin expansion on Software licenses',
  'Show all SKUs with less than 15 days of inventory buffer'
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

    setTimeout(() => {
      let replyContent = `I have analyzed the real-time pricing and elasticity telemetry across your catalog.\n\nKey Insights for "${text}":\n• SKU-8921-PRO maintains an empirical elasticity coefficient of -1.34 with competitor Apex pricing at $435.00 (+11.8% headroom).\n• Risk mitigation guardrails confirm inventory runway of 42 days with 0% stockout probability.\n• Expected gross margin accretion: +$24,500/mo.`;
      
      if (text.toLowerCase().includes('undercut')) {
        replyContent = `Competitor Radar Analysis:\n• 2 SKUs currently facing undercutting: SKU-3320-SENS (-3.7% gap by SensorTech) and SKU-1090-CAB (-8.8% gap by CableWorld).\n• Recommendation: Do not match CableWorld on SKU-1090-CAB as elasticity is highly inelastic (-0.45) and will needlessly sacrifice 220 bps of gross margin.`;
      } else if (text.toLowerCase().includes('inventory')) {
        replyContent = `Inventory Risk Alert:\n• SKU-3320-SENS has only 12 days of stock remaining.\n• Recommended dynamic pricing action: +4.2% scarcity surcharge to throttle daily velocity from 24/day to 18/day while replenishment clears transit.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: replyContent,
        },
      ]);
      setIsThinking(false);
    }, 900);
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
      <div className="flex flex-col h-[calc(100vh-210px)] border border-pm-borderSubtle rounded-sm bg-pm-surface overflow-hidden">
        {/* Terminal Status Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-pm-borderSubtle bg-pm-subtle text-[11px] font-mono">
          <div className="flex items-center gap-2 text-pm-text">
            <Terminal size={12} className="text-pm-accentText" />
            <span>PriceMind RAG Agent v2.4</span>
            <span className="text-pm-textDim">• GPT-4o / Claude 3.5 Sonnet Ensemble • Connected to Live ERP & MLflow</span>
          </div>
          <div className="flex items-center gap-1.5 text-pm-positiveText">
            <span className="w-1.5 h-1.5 rounded-full bg-pm-positiveText animate-pulse" />
            <span>Telemetry Online</span>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1 text-[10px] font-mono text-pm-textDim">
                  <span>{isUser ? 'Revenue Manager' : 'PriceMind AI Copilot'}</span>
                  <span>•</span>
                  <span>{m.timestamp}</span>
                </div>
                <div
                  className={`max-w-2xl px-4 py-3 rounded-sm text-xs leading-relaxed font-mono whitespace-pre-line ${
                    isUser
                      ? 'bg-pm-elevated text-pm-text border border-pm-borderStrong'
                      : 'bg-pm-subtle text-pm-text border border-pm-borderSubtle'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })}

          {isThinking && (
            <div className="flex flex-col items-start">
              <div className="text-[10px] font-mono text-pm-textDim mb-1">PriceMind AI Copilot</div>
              <div className="px-4 py-2.5 rounded-sm bg-pm-subtle border border-pm-borderSubtle text-xs font-mono text-pm-accentText flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pm-accentText animate-ping" />
                Querying TreeSHAP attributions & elasticity tensors...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Starters */}
        <div className="px-4 py-2 border-t border-pm-borderSubtle bg-pm-subtle/50 flex flex-wrap gap-2">
          {promptStarters.map((starter, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(starter)}
              className="text-[10px] font-mono px-2 py-1 rounded-sm bg-pm-surface hover:bg-pm-hover border border-pm-borderSubtle text-pm-textMuted hover:text-pm-text transition-colors cursor-pointer text-left truncate max-w-[320px]"
            >
              &gt; {starter}
            </button>
          ))}
        </div>

        {/* Chat Input */}
        <div className="p-3 border-t border-pm-borderSubtle bg-pm-surface">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask PriceMind AI about pricing rationale, elasticity, competitor actions, or simulation scenarios..."
              className="flex-1 bg-pm-subtle border border-pm-borderSubtle rounded-sm px-3 py-2 text-xs text-pm-text font-mono placeholder:text-pm-textDim focus:outline-none focus:border-pm-borderStrong"
            />
            <Button
              type="submit"
              size="sm"
              variant="primary"
              disabled={!input.trim() || isThinking}
              icon={Send}
              className="text-xs"
            >
              Submit Query
            </Button>
          </form>
        </div>
      </div>
    </ModuleShell>
  );
}
