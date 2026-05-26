import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Settings = ({ user, onUserUpdate }) => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', desc: '', type: 'success' });
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    image: user?.image || ''
  });
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you ABSOLUTELY sure you want to delete your account? This will permanently delete all your projects, clients, and data. This action cannot be undone.")) {
      try {
        await axios.delete(`http://localhost:5000/api/users/${user.id}`);
        localStorage.removeItem('gridlancer_user');
        localStorage.removeItem('gridlancer_token');
        navigate('/');
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
      await axios.put(`http://localhost:5000/api/users/${user.id}`, {
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

      const updatedUser = {
        ...user,
        name: formData.name,
        email: formData.email,
        image: formData.image
      };
      localStorage.setItem('gridlancer_user', JSON.stringify(updatedUser));

      // Update parent state to reflect changes instantly in sidebar
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
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
    <div className="max-w-3xl mx-auto w-full animate-[fadeIn_0.3s_ease-out]">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Profile Settings</h2>
        <p className="text-slate-400 font-medium">Manage your personal information and security preferences.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden p-8">
        {error && <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-semibold">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 border-4 border-slate-800 shadow-lg shadow-purple-500/20 flex items-center justify-center font-bold text-white text-3xl overflow-hidden relative">
              {formData.image ? (
                <img src={formData.image} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                formData.name ? formData.name.charAt(0).toUpperCase() : 'U'
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
              <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
              <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
            </div>
          </div>

          <div className="w-full h-px bg-slate-800 my-8"></div>

          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Change Password</h4>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password (leave blank to keep current)</label>
              <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" placeholder="••••••••" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 mt-4 border-t border-slate-800">
            {isSaved && <span className="text-emerald-400 font-semibold text-sm animate-[fadeIn_0.2s_ease-out]">Changes saved successfully!</span>}
            <button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/25 cursor-pointer">
              Save Profile
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 bg-rose-500/5 border border-rose-500/20 rounded-3xl p-8 relative overflow-hidden group">
        <h3 className="text-xl font-bold text-rose-500 mb-2">Danger Zone</h3>
        <p className="text-slate-400 font-medium mb-6">Permanently delete your account and all associated data (clients, projects, messages, etc). This cannot be undone.</p>
        <button
          onClick={handleDeleteAccount}
          className="bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/50 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-rose-500/10 cursor-pointer"
        >
          Delete Account
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Toast Notification */}
      <div className={`fixed bottom-8 right-8 z-50 transform transition-all duration-500 ease-out ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
        <div className={`bg-slate-900 border ${toastMessage.type === 'success' ? 'border-emerald-500/50 shadow-emerald-500/20' : 'border-rose-500/50 shadow-rose-500/20'} shadow-2xl rounded-2xl p-5 pr-12 flex items-start gap-4 relative`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${toastMessage.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
            {toastMessage.type === 'success' ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            )}
          </div>
          <div>
            <h4 className="text-white font-bold text-lg">{toastMessage.title}</h4>
            <p className="text-slate-400 text-sm mt-1">{toastMessage.desc}</p>
          </div>
          <button onClick={() => setShowToast(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
