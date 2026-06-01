import React from 'react';

const Testimonials = () => {
  return (
    <section className="py-16 sm:py-24 bg-slate-900 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-white tracking-tight">Loved by top teams</h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400">See what our users are saying about GridLancer.</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-3xl p-5 sm:p-8 flex flex-col justify-between">
            <p className="text-slate-300 leading-relaxed mb-8">
              "GridLancer completely changed how we run our agency. Our clients are constantly praising the professional dashboard we give them. It's a game changer."
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">S</div>
              <div>
                <div className="text-white font-bold">Sarah Jenkins</div>
                <div className="text-slate-500 text-sm">Founder, DesignCo</div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-3xl p-5 sm:p-8 flex flex-col justify-between">
            <p className="text-slate-300 leading-relaxed mb-8">
              "We used to stitch together 5 different tools just to share files and track progress. GridLancer does it all beautifully in one place. Worth every penny."
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">M</div>
              <div>
                <div className="text-white font-bold">Marcus Thorne</div>
                <div className="text-slate-500 text-sm">Lead Developer, StackBuild</div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-3xl p-5 sm:p-8 flex flex-col justify-between md:hidden lg:flex">
            <p className="text-slate-300 leading-relaxed mb-8">
              "The automated billing integration with the client portal is flawless. Getting paid has never been faster. Our clients love the transparency."
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">E</div>
              <div>
                <div className="text-white font-bold">Elena Rodriguez</div>
                <div className="text-slate-500 text-sm">Freelance Marketer</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
