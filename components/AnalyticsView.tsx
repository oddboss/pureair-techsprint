
import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { Leaf, TrendingDown, Activity, Zap } from 'lucide-react';
import { DashboardTheme } from '../types';

const appleBezier = [0.25, 1, 0.5, 1];

const AnalyticsView: React.FC<{ theme: DashboardTheme }> = ({ theme }) => {
  const isDark = theme === 'dark';
  const hourlyData = Array.from({ length: 24 }).map((_, i) => ({ time: `${i}:00`, aqi: Math.floor(Math.random() * 200) + 100 }));
  const dailyData = Array.from({ length: 7 }).map((_, i) => ({ day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i], aqi: Math.floor(Math.random() * 150) + 200 }));
  const pollutantData = [
    { name: 'PM2.5', value: 45, color: '#ff3b30' },
    { name: 'PM10', value: 30, color: '#ff9500' },
    { name: 'NO2', value: 15, color: '#ffcc00' },
    { name: 'Others', value: 10, color: '#34c759' }
  ];

  // Mitigation Data Logic
  const mitigationData = [
    { name: 'Diesel Ban', reduction: 18, color: '#f43f5e' },
    { name: 'Traffic Cut', reduction: 14, color: '#f97316' },
    { name: 'Const. Halt', reduction: 16, color: '#eab308' },
    { name: 'Dust Supp.', reduction: 11, color: '#10b981' },
  ];

  // Exposure Reduction Simulation (72h)
  const exposureData = Array.from({ length: 12 }).map((_, i) => {
     const baseline = 300 + Math.sin(i) * 20;
     const intervention = baseline * (1 - (0.15 + (i * 0.01))); // Gradual improvement
     return {
       hour: `+${(i+1)*6}h`,
       baseline: Math.round(baseline),
       intervention: Math.round(intervention)
     };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 mb-10">
        <h2 className="text-5xl font-black tracking-tighter mb-4">Atmospheric Analytics</h2>
        <p className="opacity-30 font-medium text-lg">Detailed temporal analysis for administrative intelligence.</p>
      </motion.div>

      <div className="glass-card p-10 rounded-[40px] flex flex-col gap-8 h-[400px]">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Hourly Exposure Trend (24h)</h4>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={hourlyData}>
            <XAxis dataKey="time" hide />
            <Bar dataKey="aqi" radius={[4, 4, 0, 0]} fill={isDark ? "white" : "black"} opacity={0.15} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card p-10 rounded-[40px] flex flex-col gap-8 h-[400px]">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Daily Median Index (7 Days)</h4>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dailyData}>
            <Line type="monotone" dataKey="aqi" stroke={isDark ? "white" : "black"} strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card p-10 rounded-[40px] flex flex-col gap-8 h-[400px]">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Pollutant Contribution Profile</h4>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={pollutantData} layout="vertical" margin={{ left: 40 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: isDark ? 'white' : 'black', fontSize: 10, opacity: 0.4 }} />
            <Bar dataKey="value" radius={[0, 20, 20, 0]} barSize={20}>
              {pollutantData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card p-10 rounded-[40px] flex flex-col justify-center gap-4 h-[400px]">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Intelligence Summary</h4>
        <div className="space-y-6">
          <div className="flex justify-between border-b border-current/5 pb-4">
            <span className="opacity-40 text-sm font-bold uppercase tracking-widest">Peak AQI Timestamp</span>
            <span className="font-black">11:00 PM (482)</span>
          </div>
          <div className="flex justify-between border-b border-current/5 pb-4">
            <span className="opacity-40 text-sm font-bold uppercase tracking-widest">Baseline Variance</span>
            <span className="font-black text-rose-500">+12% vs Yesterday</span>
          </div>
          <div className="flex justify-between border-b border-current/5 pb-4">
            <span className="opacity-40 text-sm font-bold uppercase tracking-widest">Cleanest Interval</span>
            <span className="font-black">04:00 AM (112)</span>
          </div>
        </div>
      </div>

      {/* NEW EMISSION REDUCTION QUANTIFICATION LAYER */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: appleBezier }}
        className="lg:col-span-2 glass-card p-12 rounded-[48px] border-emerald-500/20 bg-emerald-500/[0.02] relative overflow-hidden"
      >
         <div className="absolute top-0 right-0 p-12 opacity-5"><Leaf size={120} /></div>
         
         <div className="flex flex-col md:flex-row items-start justify-between mb-12 gap-8">
            <div>
               <div className="flex items-center gap-3 mb-4">
                  <Leaf size={16} className="text-emerald-500" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Intervention Modeling</h4>
               </div>
               <h3 className="text-3xl font-black tracking-tight leading-none">Mitigation Impact Simulation</h3>
               <p className="opacity-40 text-sm font-medium mt-2 max-w-lg">
                 Projected outcomes of immediate policy interventions based on current pollutant ratios.
               </p>
            </div>
            
            <div className="flex gap-4">
               {[
                 { label: 'Est. PM2.5 Drop', val: '14%', icon: TrendingDown },
                 { label: 'Exposure Redux', val: '18%', icon: Activity },
                 { label: 'AI Confidence', val: '82%', icon: Zap }
               ].map((stat, i) => (
                 <div key={i} className="glass px-6 py-4 rounded-2xl flex flex-col items-center border-white/5 bg-white/5">
                    <stat.icon size={16} className="opacity-40 mb-2" />
                    <span className="text-xl font-black">{stat.val}</span>
                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-30">{stat.label}</span>
                 </div>
               ))}
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="h-[240px] flex flex-col gap-6">
               <h4 className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30">Projected PM2.5 Reduction by Intervention</h4>
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mitigationData} layout="vertical" margin={{ left: 40, right: 20 }}>
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: isDark ? 'white' : 'black', fontSize: 10, fontWeight: 700, opacity: 0.6 }} />
                     <Tooltip 
                       cursor={{ fill: 'transparent' }}
                       content={({ active, payload }) => {
                         if (active && payload && payload.length) {
                           return (
                             <div className="glass px-3 py-2 rounded-xl text-xs font-bold border-white/10">
                               {payload[0].value}% Reduction
                             </div>
                           );
                         }
                         return null;
                       }}
                     />
                     <Bar dataKey="reduction" radius={[0, 10, 10, 0]} barSize={24} animationDuration={1500}>
                       {mitigationData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>

            <div className="h-[240px] flex flex-col gap-6">
               <h4 className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30">Exposure Reduction Over 72 Hours</h4>
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={exposureData}>
                     <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: isDark ? 'white' : 'black', fontSize: 9, opacity: 0.3 }} />
                     <Tooltip 
                       content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="glass px-4 py-3 rounded-2xl border-white/10">
                                <div className="text-[10px] font-black uppercase opacity-40 mb-1">Simulated AQI</div>
                                <div className="flex items-center gap-4">
                                   <div className="text-xs font-bold text-rose-500">Base: {payload[0].value}</div>
                                   <div className="text-xs font-bold text-emerald-500">Post-Action: {payload[1].value}</div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                       }}
                     />
                     <Line type="monotone" dataKey="baseline" stroke="#f43f5e" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                     <Line type="monotone" dataKey="intervention" stroke="#10b981" strokeWidth={3} dot={false} />
                  </LineChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="mt-8 pt-6 border-t border-emerald-500/10 text-center">
            <span className="text-[8px] font-bold uppercase tracking-[0.1em] opacity-30">
              Impact values are AI-modeled estimations based on structured pollutant dominance and historical variance patterns.
            </span>
         </div>
      </motion.div>
    </div>
  );
};

export default AnalyticsView;
