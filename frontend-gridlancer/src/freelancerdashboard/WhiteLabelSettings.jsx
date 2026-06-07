import React, { useState, useEffect } from 'react';
import axios from 'axios';

const WhiteLabelSettings = ({ user }) => {
  const [logo, setLogo] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [subdomain, setSubdomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchBrandingSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/white-label/${user.id}`);
      if (res.data) {
        setLogo(res.data.logo_url || '');
        setPrimaryColor(res.data.primary_color || '#6366f1');
        setSubdomain(res.data.subdomain || '');
      }
    } catch (err) {
      console.error("Failed to load white label settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchBrandingSettings();
    }
  }, [user?.id]);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      triggerToast('Logo size should be under 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setLogo(uploadEvent.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post('http://localhost:5000/api/white-label', {
        user_id: user.id,
        logo_url: logo,
        primary_color: primaryColor,
        subdomain: subdomain ? subdomain.trim().toLowerCase() : null
      });
      triggerToast('White label branding saved successfully!', 'success');
    } catch (err) {
      console.error(err);
      triggerToast(err.response?.data?.message || 'Failed to save white label settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setLogo('');
    setPrimaryColor('#6366f1');
    setSubdomain('');
  };

  if (loading) return <div className="text-slate-400 animate-pulse font-bold py-10">Loading branding config...</div>;

  return (
    <div className="flex flex-col xl:flex-row gap-8 animate-fadeIn">
      {/* Toast */}
      <div className={`fixed bottom-6 right-6 left-6 sm:left-auto sm:w-96 z-[9999] transform transition-all duration-500 ease-out ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
        <div className={`bg-slate-900/95 backdrop-blur-md border ${toast.type === 'success' ? 'border-emerald-500/30 shadow-emerald-500/10' : 'border-rose-500/30 shadow-rose-500/10'} shadow-2xl rounded-2xl p-4 pr-10 flex items-start gap-3.5 relative`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-bold text-sm leading-snug">{toast.type === 'success' ? 'Notification' : 'Error'}</h4>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{toast.message}</p>
          </div>
          <button onClick={() => setToast({ ...toast, show: false })} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {/* Settings Form */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 blur-[40px] rounded-full pointer-events-none"></div>
        
        <div>
          <h2 className="text-2xl font-black text-white mb-2">White Label Customization</h2>
          <p className="text-xs text-slate-400 mb-8">Establish client trust by displaying your agency branding, logo, colors and domain instead of GridLancer branding.</p>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Custom Subdomain */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Custom Subdomain</label>
              <div className="flex rounded-xl bg-slate-950 border border-slate-800 overflow-hidden focus-within:border-indigo-500 transition-colors">
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                  placeholder="your-agency"
                  className="flex-1 px-4 py-3 bg-transparent text-white text-sm outline-none placeholder:text-slate-600 font-semibold"
                />
                <span className="px-4 bg-slate-900 border-l border-slate-800 flex items-center text-xs font-bold text-slate-400 select-none">
                  .gridlancer.com
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">Let clients visit <strong className="text-slate-400">{subdomain || 'your-agency'}.gridlancer.com</strong> to log in. (Local development simulation: uses query parameter previewing).</p>
            </div>

            {/* Custom Brand Color */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Primary Brand Color</label>
              <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
                <input 
                  type="color" 
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-10 bg-transparent border-0 cursor-pointer rounded-lg overflow-hidden shrink-0" 
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full bg-transparent text-white font-mono text-sm outline-none font-bold"
                  />
                  <span className="text-[9px] text-slate-500 font-bold block mt-0.5 uppercase tracking-wider">HEX Color Code</span>
                </div>
              </div>
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Agency Logo</label>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-slate-950 border border-slate-800 p-4 rounded-xl">
                <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden relative shrink-0">
                  {logo ? (
                    <img src={logo} alt="Agency Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-2xl">🏢</span>
                  )}
                </div>
                <div className="flex-1 w-full">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    id="logo-file-input"
                    className="hidden"
                  />
                  <label 
                    htmlFor="logo-file-input"
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold rounded-lg text-white text-center cursor-pointer transition-colors block sm:inline-block w-full sm:w-auto"
                  >
                    Select Logo File
                  </label>
                  <span className="text-[9px] text-slate-500 block mt-2 font-semibold">Supports PNG, JPG (under 2MB, square or landscape format).</span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-850">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-650 hover:opacity-90 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-500/10 text-center"
              >
                {saving ? 'Saving Brand...' : 'Save Configuration'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer rounded-xl text-center"
              >
                Reset Default
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Preview Card Mockup */}
      <div className="w-full xl:w-96 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Live Portal Preview</h3>
          <p className="text-[10px] text-slate-500 font-semibold mb-6">See how your custom-branded portal looks to client logins.</p>

          <div className="bg-slate-950 rounded-2xl border border-slate-850 p-6 flex flex-col items-center justify-center min-h-[300px] text-center shadow-inner relative">
            {/* Custom Brand Border */}
            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: primaryColor }}></div>
            
            {/* Custom Logo Mock */}
            <div className="w-20 h-12 flex items-center justify-center overflow-hidden mb-6">
              {logo ? (
                <img src={logo} alt="Mock Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="font-extrabold text-sm text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <span className="w-5 h-5 bg-indigo-500 rounded flex items-center justify-center text-[10px]">GL</span>
                  GridLancer
                </div>
              )}
            </div>

            <h4 className="text-sm font-bold text-white">Client Portal Login</h4>
            <p className="text-[10px] text-slate-500 mt-1">Sign in to review projects and pay invoices.</p>

            <div className="w-full mt-6 space-y-2">
              <div className="h-9 rounded-lg bg-slate-900 border border-slate-850 w-full"></div>
              <div className="h-9 rounded-lg bg-slate-900 border border-slate-850 w-full"></div>
            </div>

            <button 
              type="button" 
              onClick={(e) => e.preventDefault()}
              className="w-full h-9 rounded-lg text-[10px] font-black uppercase tracking-wider text-white mt-4 border border-transparent shadow"
              style={{ backgroundColor: primaryColor }}
            >
              Sign In
            </button>

            <div className="text-[8px] text-slate-650 mt-6 select-none">
              Portal branded with color <span className="font-mono font-bold" style={{ color: primaryColor }}>{primaryColor}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-indigo-500/5 border border-indigo-950 p-4 rounded-2xl flex flex-col gap-3">
          <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span>🚀</span> Test Portal Integration
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">You can directly test the custom-branded portal in a new window. It will override GridLancer logos and apply your custom hex primary color.</p>
          <button
            onClick={() => {
              window.open(`/client-login?whiteLabel=${user.id}`, '_blank');
            }}
            className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-extrabold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer text-center transition-all"
          >
            Launch Branded Preview 🔗
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhiteLabelSettings;
