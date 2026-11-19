import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  User,
  Send,
  RotateCcw,
  Trash2,
  Sparkles,
  MapPin,
  Building,
  Info,
  CheckCircle2,
  FileQuestion,
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Tag,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';
import { Property, BuyerPreferences } from '../../types';
import { Badge } from '../common/Badge';
import {
  ChatMessage,
  EvidenceSourceType,
  SUGGESTED_QUESTIONS,
  getCurrentTimeFormatted,
  getInitialDemoMessages,
  simulateAssistantResponse
} from '../../services/mockAssistantSimulator';

interface AIAssistantChatProps {
  property?: Property | null;
  buyerPreferences?: BuyerPreferences | null;
  onClose?: () => void;
  isCompact?: boolean;
}

export const AIAssistantChat: React.FC<AIAssistantChatProps> = ({
  property,
  buyerPreferences,
  onClose,
  isCompact = false
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => getInitialDemoMessages(property));
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat when new messages or typing state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle sending a message (either typed or from suggested chip)
  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isTyping) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'buyer',
      text: textToSend,
      timestamp: getCurrentTimeFormatted()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsTyping(true);

    try {
      const assistantResponse = await simulateAssistantResponse(textToSend, property, buyerPreferences);
      setMessages((prev) => [...prev, assistantResponse]);
    } catch (err) {
      console.error('Error simulating assistant response:', err);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  // Reset to sample initial state for presentation demo
  const handleResetDemo = () => {
    setMessages(getInitialDemoMessages(property));
    setInputQuery('');
    setIsTyping(false);
  };

  // Clear all messages
  const handleClearChat = () => {
    setMessages([]);
    setInputQuery('');
    setIsTyping(false);
  };

  // Render color-coded evidence source pill
  const renderSourceTag = (source: EvidenceSourceType) => {
    switch (source) {
      case 'Seller-provided information':
        return (
          <span
            key={source}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
          >
            <Building size={10} className="text-slate-500" />
            Seller-provided information
          </span>
        );
      case 'Property listing':
        return (
          <span
            key={source}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200"
          >
            <Tag size={10} className="text-blue-500" />
            Property listing
          </span>
        );
      case 'Location research':
        return (
          <span
            key={source}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
          >
            <MapPin size={10} className="text-emerald-500" />
            Location research
          </span>
        );
      case 'Sample calculation':
        return (
          <span
            key={source}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200"
          >
            <Sparkles size={10} className="text-purple-500" />
            Sample calculation
          </span>
        );
      case 'Information unavailable':
        return (
          <span
            key={source}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200"
          >
            <FileQuestion size={10} className="text-rose-500" />
            Information unavailable
          </span>
        );
      default:
        return null;
    }
  };

  // Format message text with line breaks and markdown-style bolding
  const renderFormattedText = (text: string) => {
    const paragraphs = text.split('\n\n');
    return (
      <div className="space-y-2 text-xs sm:text-sm text-slate-800 leading-relaxed">
        {paragraphs.map((p, idx) => {
          // Check if paragraph is a list
          if (p.includes('\n•') || p.startsWith('•') || p.match(/^\d+\./)) {
            const lines = p.split('\n');
            return (
              <div key={idx} className="space-y-1">
                {lines.map((line, lIdx) => {
                  const cleaned = line.replace(/^[•\-\d+\.]\s*/, '');
                  const isItem = line.startsWith('•') || line.match(/^\d+\./);
                  return (
                    <div key={lIdx} className={isItem ? 'flex items-start gap-1.5 pl-1' : ''}>
                      {isItem && <span className="text-indigo-500 font-bold">•</span>}
                      <span
                        dangerouslySetInnerHTML={{
                          __html: parseSimpleMarkdown(isItem ? cleaned : line)
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            );
          }

          return (
            <p
              key={idx}
              dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(p) }}
            />
          );
        })}
      </div>
    );
  };

  // Lightweight helper to convert **bold** and *italic* to HTML
  const parseSimpleMarkdown = (str: string): string => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-slate-600">$1</em>');
  };

  const sampleName = property?.name || 'Sea Breeze Tower Apartment';
  const sampleLocality = property?.locality ? `${property.locality}, ${property.city || 'Visakhapatnam'}` : 'Madhurawada, Visakhapatnam';
  const samplePrice = property?.asking_price || '₹85 lakh';
  const sampleType = property?.property_type ? property.property_type.replace('_', ' ') : 'Apartment';
  const sampleArea = property?.area ? `${property.area.toLocaleString()} ${property.area_unit || 'sq. ft.'}` : '1,450 sq. ft.';
  const samplePhoto = property?.photos?.[0]?.url || '/assets/ramez_seapoint.jpg';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[700px] max-h-[85vh] overflow-hidden">
      {/* --- HEADER --- */}
      <div className="px-5 py-3.5 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-indigo-50/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">AI Property Assistant</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800">
                <Sparkles size={10} className="text-indigo-600" />
                AI-assisted property insights
              </span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span>Ask questions about specifications, nearby amenities, extra costs, and due diligence.</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleResetDemo}
            title="Reset to initial presentation demo state"
            className="px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 border border-slate-200 flex items-center gap-1 transition-colors"
          >
            <RotateCcw size={12} />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>
          <button
            onClick={handleClearChat}
            title="Clear all messages"
            className="p-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
          >
            <Trash2 size={13} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              title="Close Assistant"
              className="p-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors ml-1"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* --- SELECTED PROPERTY CONTEXT CARD --- */}
      <div className="px-5 py-2.5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <img
            src={samplePhoto}
            alt={sampleName}
            className="w-12 h-10 object-cover rounded border border-slate-200 shrink-0"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-900">{sampleName}</span>
              <span className="capitalize px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-200/70 text-slate-700">
                {sampleType}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-0.5">
                <MapPin size={11} className="text-slate-400" />
                {sampleLocality}
              </span>
              <span>•</span>
              <span>{sampleArea}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Asking Price</span>
            <span className="font-bold text-sm text-emerald-600 font-mono">{samplePrice}</span>
          </div>
          <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded bg-white border border-slate-200 text-[11px] text-indigo-700 font-medium">
            <CheckCircle2 size={12} className="text-indigo-600" />
            <span>Active Property Context</span>
          </div>
        </div>
      </div>

      {/* --- CHAT MESSAGE SCROLL AREA --- */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/30">
        {/* Intro Help Banner if only initial message */}
        {messages.length <= 1 && (
          <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-100 text-xs text-blue-900 flex items-start gap-2.5">
            <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">How to use this assistant:</p>
              <p className="text-slate-600">
                Click any of the suggested question chips below or type a custom question. Answers highlight evidence sources such as seller disclosures, listing specs, or location research.
              </p>
            </div>
          </div>
        )}

        {/* Message stream */}
        {messages.map((msg) => {
          const isUser = msg.sender === 'buyer';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold shadow-2xs ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-indigo-600 text-white border border-indigo-200'
                }`}
              >
                {isUser ? <User size={15} /> : <Bot size={16} />}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[85%] sm:max-w-[78%] space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                {/* Header info */}
                <div className={`flex items-center gap-2 text-[10px] text-slate-400 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <span className="font-semibold text-slate-600">
                    {isUser ? 'You (Buyer)' : 'AI Property Assistant'}
                  </span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Bubble Container */}
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl shadow-2xs ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs space-y-3'
                  }`}
                >
                  {/* Body text */}
                  {isUser ? (
                    <p className="text-xs sm:text-sm leading-relaxed">{msg.text}</p>
                  ) : (
                    renderFormattedText(msg.text)
                  )}

                  {/* Evidence Sources and Notices for Assistant Answers */}
                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <div className="pt-2.5 border-t border-slate-100 mt-2 space-y-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Evidence Sources:
                        </span>
                        {msg.sources.map((src) => renderSourceTag(src))}
                      </div>

                      {msg.notVerifiedNotice && (
                        <div className="flex items-center gap-1.5 text-[10.5px] text-amber-700 bg-amber-50/70 border border-amber-200/60 px-2 py-0.5 rounded">
                          <Info size={11} className="text-amber-600 shrink-0" />
                          <span>Not independently verified. For presentation and informational guidance only.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Bot size={16} />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3.5 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-medium">
                <span className="flex gap-1 items-center">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                <span className="ml-1 text-[11px] text-slate-500">Reviewing property listing evidence & location data...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* --- SUGGESTED QUESTION CHIPS --- */}
      <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-200">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1.5">
          <Sparkles size={12} className="text-indigo-600" />
          <span>Suggested Questions:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {SUGGESTED_QUESTIONS.map((question, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(question)}
              disabled={isTyping}
              className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-medium bg-white text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* --- INPUT BAR --- */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask a question about this property (e.g., amenities, nearby schools, additional costs)..."
              disabled={isTyping}
              className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
            />
            {inputQuery && (
              <button
                type="button"
                onClick={() => setInputQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!inputQuery.trim() || isTyping}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs"
          >
            <span>Send</span>
            <Send size={13} />
          </button>
        </form>

        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 px-1">
          <span>Press <kbd className="font-mono bg-slate-100 px-1 py-0.5 rounded border border-slate-200">Enter ↵</kbd> to send</span>
          <span className="italic">Responses simulated for presentation purposes • Not legal advice</span>
        </div>
      </div>
    </div>
  );
};
