import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <Link to="/" className="mb-6 md:mb-0 flex items-center gap-2" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-s leading-none">G</span>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">GridLancer</span>
          </Link>
          
          <div className="flex flex-wrap justify-center sm:justify-start space-x-4 sm:space-x-8 text-sm font-medium">
            <Link to="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-slate-400 hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/contact" className="text-slate-400 hover:text-white transition-colors">Contact Us</Link>
          </div>
        </div>
      </div>
      <div className='border-t border-slate-800 mx-8'></div>
      <div className="pt-4 text-center flex flex-col md:flex-row justify-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} GridLancer. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
