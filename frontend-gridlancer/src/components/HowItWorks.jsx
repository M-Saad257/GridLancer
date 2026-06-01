import React, { useState } from 'react';

const steps = [
  { 
    id: '1', 
    title: 'Add your clients', 
    desc: 'Invite them via email to their secure workspace.',
    visual: (
      <div className="w-full h-36 bg-slate-950 rounded-xl border border-slate-800 p-5 flex flex-col gap-3 relative overflow-hidden group-hover:border-indigo-500/50 transition-colors shadow-inner">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">@</div>
          <div className="h-2 w-24 bg-slate-800 rounded-full"></div>
        </div>
        <div className="h-10 w-full bg-slate-900 border border-slate-800 rounded-lg flex items-center px-4">
          <div className="h-1.5 w-32 bg-slate-700 rounded-full"></div>
        </div>
        <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold px-4 py-2 rounded-lg shadow-lg shadow-indigo-500/20 rotate-[-5deg] group-hover:rotate-0 transition-transform">Invite Sent!</div>
      </div>
    )
  },
  { 
    id: '2', 
    title: 'Create projects', 
    desc: 'Set milestones, upload files, and assign tasks.',
    visual: (
      <div className="w-full h-36 bg-slate-950 rounded-xl border border-slate-800 p-5 flex flex-col gap-3 relative overflow-hidden group-hover:border-purple-500/50 transition-colors shadow-inner">
        <div className="flex gap-3">
          <div className="w-2/3 h-14 bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col gap-2">
            <div className="h-2 w-16 bg-slate-700 rounded-full"></div>
            <div className="h-1.5 w-10 bg-slate-700/50 rounded-full"></div>
          </div>
          <div className="w-1/3 h-14 bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-slate-700 border-t-purple-500 animate-spin"></div>
          </div>
        </div>
        <div className="w-full h-10 bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center gap-3">
          <div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 text-[8px]">✓</div>
          <div className="h-1.5 w-20 bg-slate-700 rounded-full"></div>
        </div>
      </div>
    )
  },
  { 
    id: '3', 
    title: 'Share dashboard', 
    desc: 'Clients track progress in real-time without asking.',
    visual: (
      <div className="w-full h-36 bg-slate-950 rounded-xl border border-slate-800 p-5 flex flex-col gap-3 relative overflow-hidden group-hover:border-pink-500/50 transition-colors shadow-inner">
        <div className="w-full h-16 bg-gradient-to-tr from-slate-900 to-slate-800 rounded-lg border border-slate-700 p-3 flex items-end gap-2 overflow-hidden">
          {[30, 60, 45, 80, 100].map((h, i) => (
            <div key={i} className="flex-1 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-sm group-hover:animate-pulse" style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }}></div>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex-1 h-6 bg-slate-900 border border-slate-800 rounded-md"></div>
          <div className="flex-1 h-6 bg-slate-900 border border-slate-800 rounded-md"></div>
          <div className="flex-1 h-6 bg-slate-900 border border-slate-800 rounded-md"></div>
        </div>
      </div>
    )
  }
];

const HowItWorks = () => {
  const [hoveredStep, setHoveredStep] = useState(0);

  return (
    <section id="how-it-works" className="py-16 sm:py-32 bg-slate-950 relative overflow-hidden border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-24">
          <div className="text-indigo-400 font-extrabold uppercase tracking-widest text-xs sm:text-sm mb-4">Simple Process</div>
          <h2 className="text-2xl sm:text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
            How it <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">works</span>
          </h2>
          <p className="mt-4 sm:mt-6 text-base sm:text-xl text-slate-400 font-light">
            Get your clients onboarded in minutes, not days. A beautifully simple workflow.
          </p>
        </div>

        <div className="relative">
          {/* Background Static Line */}
          <div className="absolute top-[28px] left-[16.66%] w-[66.66%] h-0.5 bg-slate-800 hidden md:block"></div>
          
          {/* Animated Flow Line */}
          <div 
            className="absolute top-[28px] left-[16.66%] h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hidden md:block transition-all duration-700 ease-out z-0"
            style={{ 
              width: hoveredStep >= 3 ? '66.66%' : hoveredStep >= 2 ? '33.33%' : '0%',
              opacity: hoveredStep >= 2 ? 1 : 0 
            }}
          >
             {/* Glowing dot at the head of the line */}
             <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_20px_rgba(217,70,239,1)] transition-opacity duration-300"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-8 relative z-10">
            {steps.map((item, i) => {
              const stepNumber = parseInt(item.id);
              const isHovered = hoveredStep >= stepNumber;
              
              return (
                <div 
                  key={i} 
                  className="relative flex flex-col group cursor-pointer"
                  onMouseEnter={() => setHoveredStep(stepNumber)}
                  onMouseLeave={() => setHoveredStep(0)}
                >
                  <div className="flex items-center justify-center mb-10">
                    <div className={`w-14 h-14 rounded-2xl bg-slate-900 border-2 flex items-center justify-center text-2xl font-black transition-all duration-500 shadow-2xl relative z-10 ${
                      isHovered 
                        ? 'border-indigo-500 bg-gradient-to-br from-indigo-600 to-purple-600 text-white scale-110 shadow-indigo-500/50' 
                        : 'border-slate-800 text-slate-500 group-hover:border-slate-700 group-hover:text-slate-400 group-hover:bg-slate-800'
                    }`}>
                      {item.id}
                    </div>
                  </div>
                  
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 group-hover:border-slate-700 transition-colors shadow-xl">
                    <div className="mb-8">
                      {item.visual}
                    </div>
                    <h3 className={`text-xl sm:text-2xl font-bold mb-3 tracking-tight transition-colors duration-300 text-center ${isHovered ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400' : 'text-white'}`}>
                      {item.title}
                    </h3>
                    <p className="text-slate-400 leading-relaxed font-light text-center">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
