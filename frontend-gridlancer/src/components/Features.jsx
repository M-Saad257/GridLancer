import React from 'react';

const features = [
  { 
    title: "Client Management", 
    desc: "Keep all client details, notes, and contacts in one centralized hub designed for maximum clarity.", 
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        <circle cx="12" cy="7" r="4" fill="currentColor" fillOpacity="0.2" stroke="none" />
        <path d="M9 21v-1a6 6 0 0112 0v1" fill="currentColor" fillOpacity="0.2" stroke="none" />
      </svg>
    ),
    color: "from-blue-500 to-indigo-500",
    hoverColor: "group-hover:text-indigo-400"
  },
  { 
    title: "Project Tracking", 
    desc: "Monitor milestones, deadlines, and deliverables with beautiful visual timelines and status indicators.", 
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        <rect x="3" y="5" width="4" height="14" rx="1" fill="currentColor" fillOpacity="0.2" stroke="none" />
        <rect x="17" y="5" width="4" height="14" rx="1" fill="currentColor" fillOpacity="0.2" stroke="none" />
      </svg>
    ),
    color: "from-indigo-500 to-purple-500",
    hoverColor: "group-hover:text-purple-400"
  },
  { 
    title: "Client Portal Access", 
    desc: "Give clients a magic link to view their secure, white-labeled dashboard without ever logging in.", 
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        <path d="M5 5h14v8H5z" fill="currentColor" fillOpacity="0.2" stroke="none" />
      </svg>
    ),
    color: "from-purple-500 to-pink-500",
    hoverColor: "group-hover:text-pink-400"
  },
  { 
    title: "Real-time Updates", 
    desc: "Clients see progress instantly as you check off tasks, eliminating the need for status update emails.", 
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        <path d="M13 3L4 14h7v7l9-11h-7z" fill="currentColor" fillOpacity="0.2" stroke="none" />
      </svg>
    ),
    color: "from-amber-500 to-orange-500",
    hoverColor: "group-hover:text-amber-400"
  },
  { 
    title: "Secure Authentication", 
    desc: "Enterprise-grade security and permissions to protect your sensitive files and internal agency data.", 
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        <path d="M12 22.622C6.824 21.29 3 16.591 3 11c0-1.042.133-2.052.382-3.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 018.618 3.04C20.867 8.948 21 9.958 21 11c0 5.591-3.824 10.29-9 11.622z" fill="currentColor" fillOpacity="0.15" stroke="none" />
      </svg>
    ),
    color: "from-emerald-400 to-teal-500",
    hoverColor: "group-hover:text-emerald-400"
  },
  { 
    title: "Simple Dashboard UI", 
    desc: "Absolutely zero learning curve. A breathtaking interface your clients will instantly understand and love.", 
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        <rect x="4" y="4" width="6" height="6" rx="2" fill="currentColor" fillOpacity="0.2" stroke="none" />
        <rect x="14" y="14" width="6" height="6" rx="2" fill="currentColor" fillOpacity="0.2" stroke="none" />
      </svg>
    ),
    color: "from-rose-400 to-red-500",
    hoverColor: "group-hover:text-rose-400"
  },
];

const Features = () => {
  return (
    <section id="features" className="py-16 sm:py-32 bg-slate-950 relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20 relative z-10">
          <div className="text-indigo-400 font-extrabold uppercase tracking-widest text-xs sm:text-sm mb-4">Powerful Capabilities</div>
          <h2 className="text-2xl sm:text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">scale</span>
          </h2>
          <p className="mt-4 sm:mt-6 text-base sm:text-xl text-slate-400 font-light">
            We stripped away the clutter and built a suite of features designed specifically for modern service businesses.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {features.map((f, i) => (
            <div key={i} className="group relative bg-slate-900 border border-slate-800 p-5 sm:p-8 rounded-3xl hover:border-slate-600 transition-all duration-500 overflow-hidden cursor-pointer">
              {/* Hover Glow Effect inside card */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${f.color} blur-[60px] opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none rounded-full`}></div>
              
              <div className="relative z-10">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-6 sm:mb-8 shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500`}>
                  {/* Fixed disappearing icon by using solid color shifts instead of background clipping */}
                  <div className={`text-slate-400 ${f.hoverColor} transition-colors duration-300 drop-shadow-md`}>
                    {React.cloneElement(f.icon, { className: "w-7 h-7" })}
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed font-light text-base sm:text-lg">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
