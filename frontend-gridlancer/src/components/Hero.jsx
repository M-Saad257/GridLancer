import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-20 lg:pt-40 lg:pb-40 overflow-hidden bg-slate-950 min-h-screen flex flex-col items-start sm:text-left">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/30 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-purple-600/20 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        <h1 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight max-w-5xl mx-auto drop-shadow-lg">
          Give your clients their own <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-gradient-x">dashboard</span>
        </h1>
        <p className="mt-3 sm:mt-6 text-xs sm:text-lg md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-light px-2 sm:px-0">
          Manage clients, track projects, and share real-time progress — all in one powerful, beautifully designed platform built for modern agencies.
        </p>
        <div className="mt-6 sm:mt-12 flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-6 px-2 sm:px-0">
          <Link to="/signup" className="w-full sm:w-auto group relative px-5 py-2.5 sm:px-8 sm:py-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm sm:text-lg hover:shadow-2xl hover:shadow-indigo-500/40 transition-all transform hover:-translate-y-1 overflow-hidden">
            <span className="relative z-10">Get Started for Free</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
          </Link>
          <a href="#features" className="w-full sm:w-auto group px-5 py-2.5 sm:px-8 sm:py-4 rounded-full bg-slate-900/50 border border-slate-700 hover:border-slate-500 text-white font-bold text-sm sm:text-lg backdrop-blur-md transition-all flex items-center justify-center gap-2">
            View Features
            <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </a>
        </div>

        {/* Massive Detailed Dashboard Mockup */}
        <div className="mt-10 sm:mt-28 relative max-w-6xl mx-auto perspective-1000 z-20 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>

          <div className="relative rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col transform transition-transform duration-700 hover:scale-[1.02]">
            {/* Mockup Window Header */}
            <div className="h-10 sm:h-12 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800 flex items-center px-3 sm:px-6 gap-2 sm:gap-3">
              <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-rose-500/90 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
              <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-amber-500/90 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
              <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-500/90 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
              <div className="ml-auto max-w-[160px] sm:max-w-[256px] w-full h-5 sm:h-6 bg-slate-800 rounded-md border border-slate-700 flex items-center justify-center text-[8px] sm:text-[10px] text-slate-500 font-mono tracking-widest truncate px-2">gridlancer.com/dashboard</div>
            </div>

            {/* Mockup Body Layout */}
            <div className="flex flex-col sm:flex-row flex-1 sm:h-[600px] bg-slate-950">
              {/* Sidebar */}
              <div className="w-64 border-r border-slate-800 bg-slate-900/50 p-6 flex flex-col gap-6 hidden md:flex">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-sm">J</span>
                  </div>
                  <div className="text-white font-bold text-lg">John's Studio</div>
                </div>
                <div className="space-y-2">
                  {['Overview', 'Projects', 'Invoices', 'Files', 'Settings'].map((item, i) => (
                    <div key={i} className={`px-4 py-2.5 rounded-lg text-sm font-semibold ${i === 0 ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner' : 'text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer'}`}>
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-auto bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700 shadow-lg">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Storage</div>
                  <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mb-1">
                    <div className="w-[85%] h-full bg-indigo-500"></div>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">85GB / 100GB Used</div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 p-3 sm:p-8 flex flex-col gap-4 sm:gap-8 overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
                  <div>
                    <h2 className="text-base sm:text-2xl font-bold text-white mb-1">Welcome back, John 👋</h2>
                    <p className="text-slate-400 text-[10px] sm:text-sm font-medium">Here's what's happening with your projects today.</p>
                  </div>
                  <div className="hidden md:flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-700 hover:text-white transition-colors">🔔</div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 border-2 border-slate-800 cursor-pointer shadow-lg"></div>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 min-[400px]:grid-cols-3 gap-2 sm:gap-6">
                  {[
                    { label: 'Total Revenue', value: '$24,500', change: '+12%', color: 'text-emerald-400' },
                    { label: 'Active Projects', value: '12', change: '+2', color: 'text-indigo-400' },
                    { label: 'Pending Invoices', value: '3', change: '-1', color: 'text-rose-400' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-5 shadow-lg relative overflow-hidden group hover:border-indigo-500/50 transition-colors cursor-pointer">
                      <div className="absolute -right-6 -top-6 w-24 h-24 bg-slate-800 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                      <div className="text-[10px] sm:text-sm font-semibold text-slate-400 mb-1 relative z-10">{stat.label}</div>
                      <div className="text-lg sm:text-3xl font-extrabold text-white relative z-10 flex items-end gap-1 sm:gap-3">
                        {stat.value}
                        <span className={`text-[10px] sm:text-sm font-semibold ${stat.color} mb-0.5 sm:mb-1`}>{stat.change}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chart & Activity */}
                <div className="flex flex-col md:flex-row gap-3 sm:gap-6 h-[280px] sm:h-full min-h-0">
                  <div className="flex-1 md:flex-[2] bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-6 shadow-lg flex flex-col">
                    <div className="flex justify-between items-center mb-3 sm:mb-6">
                      <div className="text-white font-bold text-xs sm:text-lg">Revenue Growth</div>
                      <div className="px-2 py-0.5 sm:px-3 sm:py-1 bg-slate-800 rounded-md text-[10px] sm:text-xs font-semibold text-slate-300 cursor-pointer hover:bg-slate-700 transition-colors">This Month ▼</div>
                    </div>
                    {/* Fake Chart Lines */}
                    <div className="flex-1 relative flex items-end gap-1 sm:gap-3 pb-4 sm:pb-6 border-b border-slate-800">
                      {[40, 60, 45, 80, 55, 90, 75, 100].map((h, i) => (
                        <div key={i} className="flex-1 bg-indigo-500/10 hover:bg-indigo-500/30 transition-colors rounded-t-lg relative group cursor-pointer" style={{ height: `${h}%` }}>
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white font-bold text-xs py-1.5 px-2.5 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10 pointer-events-none">${h}k</div>
                          <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg transform origin-bottom scale-y-0 animate-[grow_1.5s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: `${i * 100}ms` }}></div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-[8px] sm:text-xs font-bold text-slate-500 mt-2 sm:mt-4 uppercase tracking-widest px-1 sm:px-2">
                      <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                  </div>

                  <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg hidden lg:flex flex-col">
                    <div className="text-white font-bold text-lg mb-6">Recent Activity</div>
                    <div className="space-y-6 flex-1 overflow-hidden relative">
                      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-800 z-0"></div>
                      {[
                        { title: 'New Invoice Paid', time: '2m ago', color: 'bg-emerald-500', shadow: 'shadow-emerald-500/50' },
                        { title: 'Project Approved', time: '1h ago', color: 'bg-indigo-500', shadow: 'shadow-indigo-500/50' },
                        { title: 'File Uploaded', time: '3h ago', color: 'bg-purple-500', shadow: 'shadow-purple-500/50' },
                        { title: 'Client Message', time: '5h ago', color: 'bg-amber-500', shadow: 'shadow-amber-500/50' }
                      ].map((act, i) => (
                        <div key={i} className="flex gap-4 relative z-10 group cursor-pointer">
                          <div className={`w-6 h-6 rounded-full border-4 border-slate-900 ${act.color} flex-shrink-0 group-hover:scale-125 transition-transform shadow-lg ${act.shadow}`}></div>
                          <div>
                            <div className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{act.title}</div>
                            <div className="text-xs font-medium text-slate-500 mt-0.5">{act.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating UI Elements for depth */}
          <div className="absolute -left-12 top-1/3 bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-[float_4s_ease-in-out_infinite] hidden xl:flex flex-col gap-3 z-30">
            <div className="flex justify-between items-center gap-6">
              <div className="text-xs text-slate-400 font-extrabold uppercase tracking-widest">Project Omega</div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
            </div>
            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-purple-400">92%</div>
            <div className="w-48 h-2.5 bg-slate-800 rounded-full overflow-hidden shadow-inner"><div className="w-[92%] h-full bg-gradient-to-r from-indigo-500 to-purple-500"></div></div>
          </div>

          <div className="absolute -right-8 bottom-1/4 bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-[float_5s_ease-in-out_infinite_reverse] hidden xl:flex items-center gap-5 z-30">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <div className="text-base font-extrabold text-white">Payment Received</div>
              <div className="text-sm font-semibold text-slate-400 mt-0.5">Invoice #4029 • $3,500</div>
            </div>
          </div>
        </div>
      </div>

      {/* Required keyframes for animations used inline */}
      <style>{`
        @keyframes grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-20px); } 100% { transform: translateY(0px); } }
        .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 4s ease infinite; }
        @keyframes gradient-x { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      `}</style>
    </section>
  );
};

export default Hero;