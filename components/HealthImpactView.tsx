
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardTheme, HealthProfile, HealthRiskAssessment } from '../types';
import { ShieldAlert, Info, User, Clock, HeartPulse, Activity, BrainCircuit } from 'lucide-react';
import { assessHealthRisk } from '../services/geminiService';

const HealthImpactView: React.FC<{ theme: DashboardTheme; pm25: number }> = ({ theme, pm25 }) => {
  const cigarettes = Math.round(pm25 / 22); // Broad scientific approximation
  const isDark = theme === 'dark';
  
  const [profile, setProfile] = useState<HealthProfile>({
    ageGroup: 'Adult',
    condition: 'None',
    outdoorHours: 2
  });
  const [assessment, setAssessment] = useState<HealthRiskAssessment | null>(null);
  const [calibrating, setCalibrating] = useState(false);

  const handleAssessment = async () => {
    setCalibrating(true);
    const result = await assessHealthRisk(profile, pm25 * 1.5); // Estimate AQI roughly from PM2.5 or use context
    setAssessment(result);
    setCalibrating(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header className="mb-20">
        <h2 className="text-5xl font-black tracking-tighter mb-4">Physiological Risk Registry</h2>
        <p className="opacity-30 font-medium text-lg max-w-2xl leading-relaxed">Scientific assessment of atmospheric impact on metabolic and respiratory systems based on PM2.5 concentrations.</p>
      </header>

      {/* MODULE 3: DIGITAL TWIN */}
      <section className="glass-card p-10 rounded-[48px] border-indigo-500/20 bg-indigo-500/[0.02]">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
            <BrainCircuit size={24} className="text-indigo-400" />
          </div>
          <div>
             <h3 className="text-2xl font-black uppercase tracking-tight">Health Digital Twin</h3>
             <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Hyper-Personalized Risk Engine</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="space-y-4">
            <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Age Group</span>
            <div className="flex flex-wrap gap-2">
              {['Child', 'Adult', 'Elderly'].map(opt => (
                <button 
                  key={opt}
                  onClick={() => setProfile(p => ({ ...p, ageGroup: opt as any }))}
                  className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${
                    profile.ageGroup === opt ? 'bg-indigo-500 text-white border-indigo-500' : 'border-current/10 opacity-50 hover:opacity-100'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Condition</span>
            <div className="flex flex-wrap gap-2">
              {['None', 'Asthma', 'Heart Condition', 'Pregnant'].map(opt => (
                <button 
                  key={opt}
                  onClick={() => setProfile(p => ({ ...p, condition: opt as any }))}
                  className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${
                    profile.condition === opt ? 'bg-indigo-500 text-white border-indigo-500' : 'border-current/10 opacity-50 hover:opacity-100'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Planned Exposure</span>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="0" 
                max="8" 
                step="1"
                value={profile.outdoorHours}
                onChange={(e) => setProfile(p => ({ ...p, outdoorHours: parseInt(e.target.value) }))}
                className="flex-1 accent-indigo-500"
              />
              <span className="font-black tabular-nums">{profile.outdoorHours}h</span>
            </div>
          </div>
        </div>

        {!assessment ? (
          <button 
            onClick={handleAssessment}
            disabled={calibrating}
            className="w-full py-4 rounded-full bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50"
          >
            {calibrating ? "Simulating Metabolic Impact..." : "Calibrate Digital Twin"}
          </button>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 rounded-[32px] bg-white/5 border border-white/10 space-y-6">
             <div className="flex justify-between items-start">
               <div>
                 <span className="text-[9px] font-black uppercase tracking-widest opacity-40 block mb-2">Personalized Warning</span>
                 <p className="text-lg font-bold italic leading-relaxed">"{assessment.personalizedWarning}"</p>
               </div>
               <div className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                 assessment.dailyExposureRisk === 'Critical' ? 'text-rose-500 border-rose-500' : 
                 assessment.dailyExposureRisk === 'High' ? 'text-amber-500 border-amber-500' : 
                 'text-emerald-500 border-emerald-500'
               }`}>
                 {assessment.dailyExposureRisk} Risk
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div>
                   <span className="text-[9px] font-black uppercase tracking-widest opacity-40 block mb-1">Max Outdoor Limit</span>
                   <span className="text-2xl font-black tabular-nums">{assessment.recommendedOutdoorLimit} min</span>
                </div>
                <div>
                   <span className="text-[9px] font-black uppercase tracking-widest opacity-40 block mb-1">Protective Protocol</span>
                   <span className="text-sm font-bold">{assessment.protectiveMeasure}</span>
                </div>
             </div>
             <button onClick={() => setAssessment(null)} className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 underline">
               Recalibrate
             </button>
          </motion.div>
        )}
      </section>

      <div className="glass-card p-14 rounded-[48px] border-rose-500/10 bg-rose-500/[0.02] flex flex-col md:flex-row items-center gap-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5"><ShieldAlert size={120} /></div>
        <div className="flex flex-col items-center gap-4">
          <div className="text-[120px] font-black tracking-tighter leading-none text-rose-500 tabular-nums">{cigarettes}</div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 text-center">Cigarette Equivalent / Day</span>
        </div>
        <div className="flex-1 space-y-6">
          <h3 className="text-2xl font-bold">Atmospheric Toxicity Index</h3>
          <p className="opacity-50 leading-relaxed font-medium">The inhalation of ambient PM2.5 at current concentrations is physiologically equivalent to consuming the above quantity of tobacco units in a 24-hour cycle.</p>
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
            <Info size={16} className="opacity-30" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Source: Global Burden of Disease Studies</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { title: "Respiratory / Asthma", risk: "Critical", advice: "High probability of exacerbated symptoms and increased rescue inhaler reliance." },
          { title: "Cardiovascular", risk: "Severe", advice: "Increased systemic inflammation and heart rate variability identified in recent clusters." },
          { title: "Pediatric Care", risk: "Elevated", advice: "Recommended suspension of prolonged outdoor exertion during peak diurnal intervals." },
          { title: "Elderly Population", risk: "Extreme", advice: "Strict indoor containment prioritized for individuals with pre-existing metabolic conditions." }
        ].map((item, i) => (
          <motion.div key={i} className="glass-card p-10 rounded-[40px] border-current/5">
             <div className="flex justify-between mb-6">
               <h4 className="text-lg font-bold">{item.title}</h4>
               <span className="text-rose-500 text-[9px] font-black uppercase tracking-widest">{item.risk} Risk</span>
             </div>
             <p className="opacity-40 text-sm leading-relaxed font-medium">{item.advice}</p>
          </motion.div>
        ))}
      </div>

      <div className="pt-20 opacity-20 text-[9px] font-black uppercase tracking-[0.6em] text-center">
        DISCLAIMER: DATA IS INDICATIVE. CONSULT CERTIFIED MEDICAL PROFESSIONALS FOR INDIVIDUAL DIAGNOSIS.
      </div>
    </div>
  );
};

export default HealthImpactView;
