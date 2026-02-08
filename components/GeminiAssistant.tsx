
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, BrainCircuit, Activity, ShieldCheck, Maximize2, Minimize2 } from 'lucide-react';
import { getAssistantResponse } from '../services/geminiService';
import { Ward, LiveAqiData } from '../types';

interface GeminiAssistantProps {
  currentAqi: number;
  theme: 'dark' | 'light';
  selectedWard?: Ward | null;
  liveAqi?: LiveAqiData | null;
}

const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ currentAqi, theme, selectedWard, liveAqi }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isOpen]);

  const handleSend = async () => {
    if (!query.trim()) return;
    const userText = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    
    setIsTyping(true);

    // Prepare context for the service
    const context = {
      ward: selectedWard,
      cityData: liveAqi
    };

    // Prepare history formatted for Gemini SDK
    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const aiResponse = await getAssistantResponse(userText, context, history);
    
    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'model', text: aiResponse }]);
  };

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className={`fixed bottom-12 right-12 z-[100] flex flex-col items-end gap-4`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1, width: isExpanded ? 600 : 380, height: isExpanded ? 700 : 500 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`glass rounded-[32px] shadow-2xl flex flex-col overflow-hidden border border-white/10 backdrop-blur-xl ${isDark ? 'bg-black/80' : 'bg-white/80'}`}
          >
            {/* Header */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <BrainCircuit size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Powered by Gemini</h4>
                  <span className="text-xs font-bold tracking-tight block">Atmospheric Intelligence Console</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 rounded-full hover:bg-white/10 opacity-40 hover:opacity-100 transition-all">
                    {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                 </button>
                 <button onClick={toggleOpen} className="p-2 rounded-full hover:bg-white/10 opacity-40 hover:opacity-100 transition-all">
                   <X size={18} />
                 </button>
              </div>
            </div>

            {/* Context Status Bar */}
            <div className="px-6 py-2 bg-indigo-500/5 border-b border-indigo-500/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <Activity size={12} className="text-emerald-500" />
                   <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                      Target: {selectedWard ? selectedWard.name : 'Delhi NCT'}
                   </span>
                </div>
                <div className="flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Live Uplink</span>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                  <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center">
                     <Sparkles size={32} className="text-indigo-400" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold uppercase tracking-widest mb-2">Ready for Inquiry</h5>
                    <p className="text-[10px] font-medium max-w-[240px] leading-relaxed">
                      Analyze ward-specific pollution vectors, get forecast reasoning, or request mitigation strategies.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center max-w-[280px]">
                     {["Why is AQI high?", "Mitigation Plan", "Tomorrow's Forecast", "Compare Wards"].map(q => (
                       <button 
                         key={q} 
                         onClick={() => setQuery(q)}
                         className="px-3 py-1.5 rounded-lg border border-current/20 text-[9px] font-bold uppercase tracking-wider hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all"
                       >
                         {q}
                       </button>
                     ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-5 py-4 rounded-3xl text-sm font-medium leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 rounded-tr-sm' 
                      : 'bg-white/5 text-current border border-white/10 rounded-tl-sm'
                  }`}>
                    {m.text}
                    {m.role === 'model' && (
                       <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 opacity-50">
                          <ShieldCheck size={12} />
                          <span className="text-[8px] font-black uppercase tracking-widest">AI Generated • Verify with CPCB</span>
                       </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 px-6 py-4 rounded-3xl rounded-tl-sm border border-white/5 flex items-center gap-3">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40">Analysing</div>
                    <div className="flex gap-1">
                      {[0,1,2].map(d => (
                        <motion.div 
                          key={d}
                          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                          transition={{ repeat: Infinity, duration: 1, delay: d * 0.2 }}
                          className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-6 py-5 border-t border-white/5 bg-white/[0.02]">
               <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="Input command or query..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl outline-none text-sm font-medium py-4 pl-5 pr-12 placeholder:opacity-30 focus:bg-white/10 focus:border-indigo-500/30 transition-all"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    disabled={isTyping}
                  />
                  <button 
                    onClick={handleSend}
                    disabled={!query.trim() || isTyping}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-indigo-500 text-white opacity-0 group-focus-within:opacity-100 disabled:opacity-0 hover:bg-indigo-400 transition-all shadow-lg"
                  >
                    <Send size={16} />
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleOpen}
        className="group relative flex items-center gap-4 pl-6 pr-2 py-2 rounded-full glass border-white/10 hover:border-indigo-500/50 transition-all"
      >
         <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block">
            Launch Intelligence
         </span>
         <div className="w-14 h-14 rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-purple-500" />
            <BrainCircuit size={24} className="relative z-10" />
            {/* Ping animation for status */}
            <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-400 border border-indigo-600" />
         </div>
      </motion.button>
    </div>
  );
};

export default GeminiAssistant;
