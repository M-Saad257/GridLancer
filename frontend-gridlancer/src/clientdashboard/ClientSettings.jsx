import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ClientSettings = ({ client, onClientUpdate }) => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', desc: '', type: 'success' });
  const [preferences, setPreferences] = useState({
    projects: true,
    invoices: true,
    meetings: true,
    milestones: true,
    contracts: true,
    files: true,
    messages: true
  });
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  useEffect(() => {
    if (!client?.id) return;
    const fetchPrefs = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/email-preferences?clientId=${client.id}`);
        if (res.data) {
          setPreferences(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch email preferences:", err);
      } finally {
        setLoadingPrefs(false);
      }
    };
    fetchPrefs();
  }, [client?.id]);

  const handleTogglePref = (category) => {
    setPreferences(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const handleSavePreferences = async () => {
    try {
      await axios.put(`http://localhost:5000/api/email-preferences`, {
        clientId: client.id,
        preferences
      });
      setToastMessage({
        title: 'Preferences Updated',
        desc: 'Email preferences saved successfully!',
        type: 'success'
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
    } catch (err) {
      console.error("Failed to save email preferences:", err);
      setToastMessage({
        title: 'Error Saving',
        desc: 'Could not update email preferences.',
        type: 'error'
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  const [formData, setFormData] = useState({
    name: client?.name || '',
    email: client?.email || '',
    password: '',
    image: client?.image || ''
  });
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you ABSOLUTELY sure you want to delete your account? This will permanently delete your dashboard access and all associated data. This action cannot be undone.")) {
      try {
        await axios.delete(`http://localhost:5000/api/clients/${client.id}`);
        localStorage.removeItem('gridlancer_client');
        localStorage.removeItem('gridlancer_client_token');
        navigate('/client-login');
      } catch (err) {
        console.error(err);
        setToastMessage({
          title: 'Delete Failed',
          desc: 'Failed to delete account. Please try again.',
          type: 'error'
        });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
      }
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await axios.put(`http://localhost:5000/api/clients/${client.id}`, {
        name: formData.name,
        email: formData.email,
        password: formData.password || undefined,
        image: formData.image
      });

      setIsSaved(true);
      setToastMessage({
        title: 'Settings Saved',
        desc: 'Profile updated successfully!',
        type: 'success'
      });
      setShowToast(true);
      setTimeout(() => setIsSaved(false), 3000);
      
      const updatedClient = { 
        ...client, 
        name: formData.name, 
        email: formData.email,
        image: formData.image 
      };
      localStorage.setItem('gridlancer_client', JSON.stringify(updatedClient));
      
      // Update parent state to reflect changes instantly in sidebar
      if (onClientUpdate) {
        onClientUpdate(updatedClient);
      }

      // Reset password field after save
      setFormData(prev => ({ ...prev, password: '' }));
    } catch (err) {
      console.error(err);
      setError('Failed to update profile. Please try again.');
      setToastMessage({
        title: 'Save Failed',
        desc: 'Failed to update profile. Please try again.',
        type: 'error'
      });
      setShowToast(true);
    } finally {
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-0 mb-6 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Profile Settings</h2>
          <p className="text-sm sm:text-base text-slate-400 font-medium">Manage your personal information and security.</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none"></div>
        
        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border-4 border-slate-800 shadow-lg shadow-indigo-500/20 flex items-center justify-center font-bold text-white text-3xl overflow-hidden relative">
              {formData.image ? (
                <img src={formData.image} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                formData.name ? formData.name.charAt(0).toUpperCase() : 'C'
              )}
            </div>
            <div>
              <div className="flex gap-3 mb-2">
                <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer border border-slate-700 inline-block">
                  Upload Avatar
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                {formData.image && (
                  <button 
                    type="button" 
                    onClick={() => setFormData({ ...formData, image: '' })}
                    className="px-4 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-xl text-sm font-semibold transition-colors cursor-pointer border border-rose-500/20 inline-block">
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">JPG, GIF or PNG. Max size of 800K</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
            </div>
          </div>

          <div className="w-full h-px bg-slate-800 my-8"></div>
          
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Change Password</h4>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password (leave blank to keep current)</label>
              <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" placeholder="••••••••" />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 mt-4 border-t border-slate-800">
            {isSaved && <span className="text-emerald-400 font-semibold text-sm animate-[fadeIn_0.2s_ease-out]">Changes saved successfully!</span>}
            <button type="submit" className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-600 text-white px-6 sm:px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/25 cursor-pointer">
              Save Profile
            </button>
          </div>
        </form>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl mt-6 sm:mt-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none"></div>
        
        <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Email Notifications</h3>
        <p className="text-xs sm:text-sm text-slate-400 font-medium mb-6">Choose which alerts you want to receive directly in your email inbox.</p>

        {loadingPrefs ? (
          <div className="py-4 text-slate-400 animate-pulse text-sm font-semibold">Loading preferences...</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'projects', label: 'Project Status & Details Updates', desc: 'When projects are created or progress status is updated.' },
                { key: 'invoices', label: 'Invoice & Payment Receipts', desc: 'When invoices are created, paid, or due soon.' },
                { key: 'meetings', label: 'Video Meetings Notifications', desc: 'When team members schedule new video calls.' },
                { key: 'milestones', label: 'Milestone Deliverable Reviews', desc: 'When milestones require approval or revision.' },
                { key: 'contracts', label: 'Digital Contract Signatures', desc: 'When digital contracts are sent, accepted, or rejected.' },
                { key: 'files', label: 'New Files & Assets Uploads', desc: 'When new files are attached to the project.' },
                { key: 'messages', label: 'Offline Direct Messages', desc: 'When you receive chat messages while offline.' }
              ].map(pref => (
                <div 
                  key={pref.key} 
                  onClick={() => handleTogglePref(pref.key)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    preferences[pref.key] 
                      ? 'bg-indigo-500/5 border-indigo-500/30' 
                      : 'bg-slate-950/40 border-slate-850 hover:border-slate-800'
                  }`}
                >
                  <div className="flex-1">
                    <div className="text-xs sm:text-sm font-bold text-white mb-0.5">{pref.label}</div>
                    <div className="text-[10px] text-slate-500 leading-normal">{pref.desc}</div>
                  </div>
                  
                  {/* Custom Checkbox/Switch */}
                  <div className={`w-9 h-5 rounded-full p-0.5 transition-all ${preferences[pref.key] ? 'bg-indigo-500' : 'bg-slate-800'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-all transform ${preferences[pref.key] ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800 mt-6">
              <button 
                type="button"
                onClick={handleSavePreferences}
                className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-650 text-white px-6 sm:px-8 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/20 cursor-pointer text-center"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 sm:mt-8 bg-rose-500/5 border border-rose-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-8 relative overflow-hidden group">
        <h3 className="text-lg sm:text-xl font-bold text-rose-500 mb-2">Danger Zone</h3>
        <p className="text-xs sm:text-sm text-slate-400 font-medium mb-4 sm:mb-6">Permanently delete your client account. You will lose access to your dashboard and all project information. This cannot be undone.</p>
        <button 
          onClick={handleDeleteAccount}
          className="w-full sm:w-auto bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/50 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-rose-500/10 cursor-pointer"
        >
          Delete Account
        </button>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Toast Notification */}
      <div className={`fixed bottom-6 right-6 left-6 sm:left-auto sm:w-96 z-[9999] transform transition-all duration-500 ease-out ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
        <div className={`bg-slate-900/95 backdrop-blur-md border ${toastMessage.type === 'success' ? 'border-emerald-500/30 shadow-emerald-500/10' : 'border-rose-500/30 shadow-rose-500/10'} shadow-2xl rounded-2xl p-4 pr-10 flex items-start gap-3.5 relative`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${toastMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {toastMessage.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-bold text-sm leading-snug">{toastMessage.title || (toastMessage.type === 'success' ? 'Success' : 'Error')}</h4>
            {toastMessage.desc && <p className="text-slate-400 text-xs mt-1 leading-relaxed">{toastMessage.desc}</p>}
          </div>
          <button onClick={() => setShowToast(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientSettings;
