import React from 'react';
import { useNavigate } from 'react-router-dom';

const Pricing = () => {
  const navigate = useNavigate();
  return (
    <section id="pricing" className="py-24 bg-slate-950 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">Simple, transparent pricing</h2>
          <p className="mt-4 text-lg text-slate-400">Start for free, upgrade when you need more power.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 flex flex-col hover:border-slate-700 transition-colors">
            <h3 className="text-2xl font-semibold text-white">Starter</h3>
            <p className="mt-4 text-slate-400">Perfect for new freelancers.</p>
            <p className="mt-6 flex items-baseline">
              <span className="text-5xl font-extrabold text-white">$0</span>
              <span className="text-xl font-medium text-slate-500 ml-1">/forever</span>
            </p>
            <ul className="mt-8 space-y-4 flex-grow text-sm">
              <li className="flex items-center text-slate-300"><span className="text-indigo-400 mr-3 text-lg font-bold">✔</span> Max 3 clients & 3 projects</li>
              <li className="flex items-center text-slate-300"><span className="text-indigo-400 mr-3 text-lg font-bold">✔</span> Max 3 files per project</li>
              <li className="flex items-center text-slate-300"><span className="text-indigo-400 mr-3 text-lg font-bold">✔</span> Milestone invoicing</li>
              <li className="flex items-center text-slate-300"><span className="text-indigo-400 mr-3 text-lg font-bold">✔</span> Project activity logs</li>
              <li className="flex items-center text-slate-300"><span className="text-indigo-400 mr-3 text-lg font-bold">✔</span> Client complaints to admin</li>
            </ul>
            <button onClick={() => navigate('/login')} className="mt-8 cursor-pointer w-full py-4 px-4 border border-slate-700 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">Get Started Free<span className='text-xl ml-1'>→</span></button>
          </div>
          
          {/* Pro Plan */}
          <div className="bg-slate-900 border border-indigo-500/50 rounded-3xl p-10 flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-indigo-500/20">
            <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
            <div className="absolute top-6 right-6">
              <span className="bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 text-xs font-bold uppercase tracking-wider py-1.5 px-3 rounded-full">Most Popular</span>
            </div>
            <h3 className="text-2xl font-semibold text-white">Pro</h3>
            <p className="mt-4 text-slate-400">For active growing professionals.</p>
            <p className="mt-6 flex items-baseline">
              <span className="text-5xl font-extrabold text-white">$29</span>
              <span className="text-xl font-medium text-slate-500 ml-1">/mo</span>
            </p>
            <ul className="mt-8 space-y-4 flex-grow text-sm">
              <li className="flex items-center text-slate-300"><span className="text-indigo-400 mr-3 text-lg font-bold">✔</span> Max 20 clients</li>
              <li className="flex items-center text-slate-300"><span className="text-indigo-400 mr-3 text-lg font-bold">✔</span> Max 20 projects</li>
              <li className="flex items-center text-slate-300"><span className="text-indigo-400 mr-3 text-lg font-bold">✔</span> Max 50 files per project</li>
              <li className="flex items-center text-slate-300"><span className="text-indigo-400 mr-3 text-lg font-bold">✔</span> Real-time chat & notifications</li>
              <li className="flex items-center text-slate-300"><span className="text-indigo-400 mr-3 text-lg font-bold">✔</span> Invoice tracking & PDF download</li>
              <li className="flex items-center text-slate-300"><span className="text-indigo-400 mr-3 text-lg font-bold">✔</span> Client complaints to admin</li>
              <li className="flex items-center text-slate-300"><span className="text-indigo-400 mr-3 text-lg font-bold">✔</span> Complaint tracking & status</li>
              <li className="flex items-center text-slate-300"><span className="text-indigo-400 mr-3 text-lg font-bold">✔</span> Video Call</li>
            </ul>
            <button onClick={() => navigate('/signup?plan=Pro')} className="mt-8 w-full py-4 px-4 bg-gradient-to-r from-indigo-500 cursor-pointer to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all">Get Started<span className='text-xl ml-1'>→</span></button>
          </div>
 
          {/* Agency Plan */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 flex flex-col hover:border-slate-700 transition-colors">
            <h3 className="text-2xl font-semibold text-white">Agency</h3>
            <p className="mt-4 text-slate-400">For large teams with advanced needs.</p>
            <p className="mt-6 flex items-baseline">
              <span className="text-5xl font-extrabold text-white">$79</span>
              <span className="text-xl font-medium text-slate-500 ml-1">/mo</span>
            </p>
            <ul className="mt-8 space-y-4 flex-grow text-sm">
              <li className="flex items-center text-slate-300"><span className="text-indigo-400 mr-3 text-lg font-bold">✔</span> Unlimited clients & projects</li>
              <li className="flex items-center text-slate-300"><span className="text-indigo-400 mr-3 text-lg font-bold">✔</span> Max 999 files per project</li>
              <li className="flex items-center text-slate-300"><span className="text-indigo-400 mr-3 text-lg font-bold">✔</span> Real-time chat & notifications</li>
              <li className="flex items-center text-slate-300"><span className="text-indigo-400 mr-3 text-lg font-bold">✔</span> Invoice tracking & PDF download</li>
              <li className="flex items-center text-slate-300"><span className="text-indigo-400 mr-3 text-lg font-bold">✔</span> Advanced dashboard</li>
              <li className="flex items-center text-slate-300"><span className="text-indigo-400 mr-3 text-lg font-bold">✔</span> Client complaints to admin</li>
              <li className="flex items-center text-slate-300"><span className="text-indigo-400 mr-3 text-lg font-bold">✔</span> Complaint tracking & status</li>
              <li className="flex items-center text-slate-300"><span className="text-indigo-400 mr-3 text-lg font-bold">✔</span> Video Call</li>
              <li className="flex items-center text-slate-300"><span className="text-indigo-400 mr-3 text-lg font-bold">✔</span> Team members & collaboration</li>
            </ul>
            <button onClick={() => navigate('/signup?plan=Agency')} className="mt-8 w-full py-4 px-4 border border-slate-700 text-white cursor-pointer font-bold rounded-xl hover:bg-slate-800 transition-colors">Get Started <span className='text-xl ml-1'>→</span></button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
