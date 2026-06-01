import React from 'react';

const AdvancedUI = () => {
  return (
    <section className="py-16 sm:py-24 bg-slate-900 overflow-hidden relative border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-10 sm:gap-16">
        <div className="lg:w-1/2">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4 sm:mb-6">Unparalleled client experience</h2>
          <p className="text-base sm:text-lg text-slate-400 mb-6 sm:mb-8 leading-relaxed">
            Stop sending endless email updates. Give your clients a breathtaking dashboard where they can view invoices, approve tasks, and download assets instantly.
          </p>
          <ul className="space-y-4">
            <li className="flex items-center text-slate-300"><span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mr-3 text-sm">✔</span> Interactive progress bars</li>
            <li className="flex items-center text-slate-300"><span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mr-3 text-sm">✔</span> Real-time status badges</li>
            <li className="flex items-center text-slate-300"><span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mr-3 text-sm">✔</span> Intuitive card layouts</li>
          </ul>
        </div>
        
        <div className="lg:w-1/2 relative w-full">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 blur-[80px] rounded-full"></div>
          <div className="relative bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl transform hover:-translate-y-2 transition-transform duration-500">
            <div className="flex justify-between items-center mb-6">
              <div className="text-white font-bold">Active Project</div>
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">On Track</div>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Overall Progress</span>
                <span className="text-white font-bold">68%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="w-[68%] h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-indigo-500/50 transition-colors">
                <div className="text-slate-400 text-xs mb-1">Upcoming Milestone</div>
                <div className="text-white font-semibold text-sm">Design Approval</div>
                <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">⏱️ Due in 2 days</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-indigo-500/50 transition-colors">
                <div className="text-slate-400 text-xs mb-1">Recent Invoice</div>
                <div className="text-white font-semibold text-sm">$2,400.00</div>
                <div className="mt-3 text-xs text-amber-400 flex items-center gap-1">⏳ Pending Payment</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdvancedUI;
