
import React from 'react';
import { motion } from 'framer-motion';
import { X, Database, BrainCircuit, Activity, Layout, ArrowRight, Server, ShieldCheck } from 'lucide-react';

interface ArchitectureModalProps {
  onClose: () => void;
  theme: 'dark' | 'light';
}

const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ onClose, theme }) => {
  const isDark = theme === 'dark';

  const steps = [
    { icon: Activity, label: "User Input", sub: "Location & Query" },
    { icon: Database, label: "AQI Data Layer", sub: "CPCB/WAQI Ingestion" },
    { icon: Server, label: "Risk Modeling", sub: "Ward Interpolation" },
    { icon: BrainCircuit, label: "Gemini Reasoning", sub: "Contextual Analysis" },
    { icon: ShieldCheck, label: "Action Matrix", sub: "GRAP Protocols" },
    { icon: Layout, label: "Dashboard", sub: "Visual Intelligence" }
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`relative w-full max-w-5xl p-10 rounded-[48px] shadow-2xl overflow-hidden ${isDark ? 'bg-black border border-white/10' : 'bg-white border border-black/10'}`}
      >
        <button 
          onClick={onClose}
          className={`absolute top-8 right-8 p-4 rounded-full transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
        >
          <X size={24} />
        </button>

        <div className="mb-12">
          <h2 className="text-3xl font-black uppercase tracking-tight mb-2">System Architecture</h2>
          <p className="opacity-40 font-medium">Data flow pipeline for Environmental Decision Intelligence.</p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 overflow-x-auto pb-8">
          {steps.map((step, i) => (
            <React.Fragment key={i}>
              <div className={`flex flex-col items-center text-center gap-4 min-w-[140px] p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-500/10 text-indigo-600'}`}>
                  <step.icon size={24} />
                </div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-wide mb-1">{step.label}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-40">{step.sub}</div>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:block opacity-20">
                  <ArrowRight size={24} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="mt-8 p-6 rounded-3xl border border-dashed border-current/20 opacity-60 text-xs font-mono">
          <span className="font-bold">TECH STACK:</span> React 18 • TypeScript • Tailwind • Framer Motion • Leaflet • Recharts • Google Gemini API • WAQI API
        </div>
      </motion.div>
    </div>
  );
};

export default ArchitectureModal;
