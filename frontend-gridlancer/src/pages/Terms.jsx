import React, { useEffect } from 'react';
import Navbar from '../Global/Navbar';
import Footer from '../components/Footer';

const Terms = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-950 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <Navbar />
      <div className="flex-grow pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto bg-slate-900 p-5 sm:p-12 rounded-2xl sm:rounded-3xl shadow-2xl shadow-indigo-500/10 border border-slate-800">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-6 sm:mb-8 border-b border-slate-800 pb-4 sm:pb-6">Terms of Service</h1>
          <div className="prose max-w-none text-slate-300">
            <p className="text-xs sm:text-sm text-slate-500 uppercase tracking-widest font-semibold mb-6 sm:mb-8">Last updated: {new Date().toLocaleDateString()}</p>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-6 sm:mt-10 mb-3 sm:mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">By accessing or using our services, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the services.</p>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-6 sm:mt-10 mb-3 sm:mb-4">2. Use of Services</h2>
            <p className="mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">You agree to use the services only for lawful purposes and in accordance with these Terms. You are responsible for all activity that occurs under your account.</p>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-6 sm:mt-10 mb-3 sm:mb-4">3. Termination</h2>
            <p className="mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">We may terminate or suspend your access to all or part of the services, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;
