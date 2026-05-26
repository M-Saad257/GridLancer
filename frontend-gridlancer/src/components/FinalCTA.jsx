import React from 'react';
import { Link } from 'react-router-dom';

const FinalCTA = () => {
  return (
    <section className="py-24 bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 to-slate-950"></div>
      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
          Start managing your clients <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">like a pro</span>
        </h2>
        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
          Join thousands of freelancers and agencies who use GridLancer to deliver an unparalleled client experience.
        </p>
        <Link to="/signup" className="inline-flex items-center cursor-pointer justify-center px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-1 text-lg" onClick={() => window.scrollTo(0, 0)}>
          Get Started Now
        </Link>
      </div>
    </section>
  );
};

export default FinalCTA;
