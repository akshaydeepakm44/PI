import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { propertyApi } from '../../services/api';
import { Property } from '../../types';
import {
  Bot,
  Sparkles,
  X,
  Send,
  RotateCcw,
  MessageSquare,
  Building,
  MapPin,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Minimize2,
  CheckCircle2,
  Search,
  Sliders,
  DollarSign,
  ShieldCheck,
  Info
} from 'lucide-react';
import {
  GlobalChatMessage,
  GLOBAL_SUGGESTED_CHIPS,
  getGlobalInitialMessages,
  simulateGlobalAssistantResponse,
  AssistantRecommendation
} from '../../services/preferenceAssistantSimulator';

export const GlobalAIAssistantWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<GlobalChatMessage[]>(() => getGlobalInitialMessages());
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch properties to feed into the global preference matcher
  const { data: properties } = useQuery({
    queryKey: ['global-assistant-properties'],
    queryFn: () => propertyApi.getProperties()
  });

  // Extract propertyId if user is on a property detail page
  const propertyMatch = location.pathname.match(/\/properties\/(\d+)/);
  const activePropertyId = propertyMatch ? parseInt(propertyMatch[1], 10) : null;
  const activeProperty = properties?.find((p) => p.id === activePropertyId) || null;

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isTyping) return;

    const userMsg: GlobalChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    try {
      const assistantResponse = await simulateGlobalAssistantResponse(
        textToSend,
        properties || null,
        activeProperty
      );
      setMessages((prev) => [...prev, assistantResponse]);
    } catch (err) {
      console.error('Error in global assistant:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetChat = () => {
    setMessages(getGlobalInitialMessages());
    setInputQuery('');
    setIsTyping(false);
  };

  const handleNavigateToProperty = (propId: number) => {
    // Navigate to property detail page with assistant tab ready
    navigate(`/buyer/properties/${propId}?tab=ai_assistant`);
    setIsOpen(false);
  };

  return (
    <>
      {/* --- FLOATING CHAT WINDOW (EXPANDED) --- */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 sm:w-[420px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-xs">
                <Bot size={18} className="text-white" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-xs sm:text-sm tracking-tight text-white">AI Property Assistant</h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    Live Demo
                  </span>
                </div>
                <p className="text-[10px] text-slate-300">Preference discovery & location intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Restart conversation"
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
              >
                <RotateCcw size={13} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize assistant"
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>

          {/* Context pill if browsing specific property */}
          {activeProperty ? (
            <div className="px-3.5 py-1.5 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between text-[11px] text-indigo-900">
              <div className="flex items-center gap-1.5 truncate">
                <Building size={12} className="text-indigo-600 shrink-0" />
                <span className="font-semibold truncate">Browsing: {activeProperty.name}</span>
              </div>
              <span className="text-[10px] text-indigo-600 font-mono shrink-0 font-bold">{activeProperty.asking_price}</span>
            </div>
          ) : (
            <div className="px-3.5 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
              <span className="flex items-center gap-1.5">
                <Search size={11} className="text-slate-400" />
                <span>Searching across all directory listings</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Visakhapatnam</span>
            </div>
          )}

          {/* Chat Messages Container */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-slate-50/40">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  {/* Bubble */}
                  <div
                    className={`p-3 rounded-2xl max-w-[88%] text-xs leading-relaxed shadow-2xs ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs space-y-2'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* Recommendation Cards if matched */}
                    {msg.recommendations && msg.recommendations.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-2 mt-2">
                        {msg.recommendations.map((rec) => (
                          <div
                            key={rec.id}
                            className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-indigo-50/50 hover:border-indigo-300 transition-all flex items-start gap-2.5 text-left"
                          >
                            <img
                              src={rec.image}
                              alt={rec.name}
                              className="w-12 h-11 object-cover rounded border border-slate-200 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className="font-bold text-xs text-slate-900 truncate">{rec.name}</h4>
                                <span className="font-bold text-[11px] text-emerald-600 font-mono shrink-0">
                                  {rec.asking_price}
                                </span>
                              </div>
                              <p className="text-[10.5px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                <MapPin size={9} className="text-slate-400 shrink-0" />
                                <span>{rec.locality}</span>
                                <span>•</span>
                                <span className="font-medium text-slate-700">{rec.bhk || rec.area}</span>
                              </p>
                              <button
                                onClick={() => handleNavigateToProperty(rec.id)}
                                className="mt-1.5 text-[10.5px] font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 transition-colors"
                              >
                                <span>View Listing & Ask AI</span>
                                <ArrowRight size={10} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Evidence Source Badges */}
                    {!isUser && msg.sources && msg.sources.length > 0 && (
                      <div className="pt-1.5 border-t border-slate-100 flex items-center gap-1 flex-wrap text-[10px] text-slate-400">
                        <span>Sources:</span>
                        {msg.sources.map((src, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200"
                          >
                            {src}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 px-1 font-mono">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-3 py-2 text-xs text-indigo-700 w-fit shadow-2xs">
                <span className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                <span className="text-[11px] text-slate-500">Searching matching listings...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Preference Chips */}
          <div className="px-3 py-2 bg-slate-50/90 border-t border-slate-200">
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-thin">
              {GLOBAL_SUGGESTED_CHIPS.map((chip, cIdx) => (
                <button
                  key={cIdx}
                  onClick={() => handleSendMessage(chip.replace(/^[^\w\s]+\s*/, ''))}
                  disabled={isTyping}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full text-[10.5px] font-medium bg-white text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 transition-all shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-1.5"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask e.g. 'I'm searching for 3 BHK flats' or '2 BHK'..."
                disabled={isTyping}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-indigo-500 focus:bg-white text-slate-800 placeholder-slate-400"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isTyping}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition-colors shadow-2xs"
                title="Send message"
              >
                <Send size={13} />
              </button>
            </form>
            <div className="flex items-center justify-between text-[9.5px] text-slate-400 px-1 mt-1">
              <span>Interactive preference & search mockup</span>
              <button
                onClick={handleResetChat}
                className="hover:text-indigo-600 underline cursor-pointer"
              >
                Reset demo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FLOATING HOVER BUTTON (COLLAPSED STATE) --- */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold text-xs shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-white/20 select-none cursor-pointer"
          title="Open AI Property Assistant"
        >
          <div className="relative flex items-center justify-center">
            <Bot size={18} className="text-white group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-indigo-600 animate-pulse" />
          </div>

          <div className="flex flex-col text-left">
            <span className="leading-tight font-bold">Ask AI Assistant</span>
            <span className="text-[10px] text-indigo-100 font-normal leading-none hidden sm:inline">
              3 BHK • 2 BHK • Diligence
            </span>
          </div>

          <span className="p-1 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors ml-0.5">
            <Sparkles size={12} className="text-amber-300" />
          </span>
        </button>
      )}
    </>
  );
};
