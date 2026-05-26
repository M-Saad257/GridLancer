import React from 'react';

const Trust = () => {
  return (
    <section className="py-12 bg-slate-950 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-8">
          Trusted by top freelancers and agencies worldwide
        </p>
        <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="text-xl md:text-2xl font-black text-white flex items-center gap-2"><div className="w-6 h-6 bg-white rounded-sm"></div> Acme Corp</div>
          <div className="text-xl md:text-2xl font-black text-white flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-white"></div> GlobalStack</div>
          <div className="text-xl md:text-2xl font-black text-white flex items-center gap-2"><div className="w-0 h-0 border-l-[12px] border-l-transparent border-b-[20px] border-b-white border-r-[12px] border-r-transparent"></div> Vertex</div>
          <div className="text-xl md:text-2xl font-black text-white flex items-center gap-2"><div className="w-6 h-6 border-4 border-white rounded-full"></div> Nexus Design</div>
        </div>
      </div>
    </section>
  );
};

export default Trust;
