import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full min-[785px]:top-3 min-[785px]:left-1/2 min-[785px]:-translate-x-1/2 min-[785px]:w-[95%] max-w-7xl z-50 bg-slate-950 min-[785px]:bg-slate-900/80 backdrop-blur-md border-b min-[785px]:border border-slate-800 rounded-none min-[785px]:rounded-[30px] shadow-xl min-[785px]:shadow-2xl transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 min-[785px]:h-20">
          <Link to="/" className="flex items-center gap-2" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl leading-none">G</span>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">GridLancer</span>
          </Link>

          <div className="hidden min-[785px]:flex items-center space-x-8">
            <a href="#features" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">Features</a>
            <a href="#how-it-works" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">How It Works</a>
            <a href="#pricing" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">Pricing</a>
          </div>

          <div className="flex items-center space-x-4 min-[785px]:space-x-6">
            <Link to="/login" className="hidden min-[785px]:block text-slate-300 hover:text-white transition-colors text-sm font-medium">
              Login
            </Link>
            <Link to="/signup" className="hidden min-[785px]:block px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5">
              Get Started
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="min-[785px]:hidden p-2 text-slate-300 hover:text-white focus:outline-none"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        className={`min-[785px]:hidden grid transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <div className="px-6 pb-6 pt-2 border-t border-slate-800">
            <div className="flex flex-col space-y-4">
              <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-300 hover:text-white transition-colors text-sm font-medium">Features</a>
              <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-300 hover:text-white transition-colors text-sm font-medium">How It Works</a>
              <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-300 hover:text-white transition-colors text-sm font-medium">Pricing</a>
              <div className="pt-4 pb-2 border-t border-slate-800/50 flex flex-col gap-3">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors text-sm font-bold">
                  Login
                </Link>
                <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center py-2.5 rounded-xl bg-indigo-500 text-white transition-colors text-sm font-bold shadow-lg shadow-indigo-500/20">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;