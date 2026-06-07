import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socket from '../socket';

const AdminDashboard = () => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Dashboard Data
  const [projects, setProjects] = useState([]);
  const [freelancers, setFreelancers] = useState([]);
  const [clients, setClients] = useState([]);
  const [upgradeRequests, setUpgradeRequests] = useState([]);
  const [activities, setActivities] = useState([]);
  const [bankAccount, setBankAccount] = useState('');
  const [complaints, setComplaints] = useState([]);
  
  // UI states
  const [activeTab, setActiveTab] = useState('Overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [resolvingComplaint, setResolvingComplaint] = useState(null);
  const [adminResponseText, setAdminResponseText] = useState('');
  
  // Ban durations state
  const [banDurations, setBanDurations] = useState({}); // e.g. { userId: '1d' }
  const [clientBanDurations, setClientBanDurations] = useState({});

  // Project Detail Drawer state
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectDetails, setProjectDetails] = useState({
    project: null,
    invoices: [],
    tasks: [],
    messages: [],
    files: []
  });
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Check auth on mount
  useEffect(() => {
    const token = localStorage.getItem('gridlancer_admin_token');
    if (token) {
      setIsAuthenticated(true);
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, []);

  // Listen to platform real-time updates via WebSockets
  useEffect(() => {
    if (isAuthenticated) {
      const joinAdminRoom = () => {
        socket.emit("join_admin");
      };

      joinAdminRoom();
      socket.on("connect", joinAdminRoom);
      
      const handleRefresh = () => {
        fetchDashboardData(true);
      };
      
      socket.on("refresh_admin_dashboard", handleRefresh);
      
      return () => {
        socket.off("connect", joinAdminRoom);
        socket.off("refresh_admin_dashboard", handleRefresh);
      };
    }
  }, [isAuthenticated]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError('');
    try {
      const res = await axios.post('http://localhost:5000/api/admin/login', {
        email: loginEmail,
        password: loginPassword
      });
      localStorage.setItem('gridlancer_admin_token', res.data.token);
      localStorage.setItem('gridlancer_admin_email', res.data.admin.email);
      setIsAuthenticated(true);
      showToast('Welcome back, Admin!', 'success');
      fetchDashboardData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Invalid credentials. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gridlancer_admin_token');
    localStorage.removeItem('gridlancer_admin_email');
    setIsAuthenticated(false);
    showToast('Admin logged out successfully.', 'success');
  };

  const fetchDashboardData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/admin/dashboard');
      setProjects(res.data.projects || []);
      setFreelancers(res.data.freelancers || []);
      setClients(res.data.clients || []);
      setActivities(res.data.activities || []);
      setUpgradeRequests(res.data.upgradeRequests || []);
      setComplaints(res.data.complaints || []);

      // Fetch admin settings for bank account
      const settingsRes = await axios.get('http://localhost:5000/api/admin/settings');
      setBankAccount(settingsRes.data.admin_bank_account || '');
    } catch (err) {
      console.error(err);
      showToast('Failed to load admin dashboard data.', 'error');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  // DISPUTE RESOLUTION ACTIONS
  const handleDisputeAction = async (complaintId, action, payload = {}) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/admin/complaints/${complaintId}/action`, {
        action,
        reason: payload.reason || '',
        duration: payload.duration || '1d',
        admin_response: payload.admin_response || ''
      });
      showToast(res.data.message || 'Action executed successfully.', 'success');
      setResolvingComplaint(null);
      fetchDashboardData(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to execute action.', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // BAN FREELANCER
  const handleBanFreelancer = async (userId) => {
    const duration = banDurations[userId] || '1d';
    try {
      const res = await axios.post(`http://localhost:5000/api/admin/users/${userId}/ban`, { duration });
      showToast(`Freelancer banned successfully.`, 'success');
      fetchDashboardData();
    } catch (err) {
      showToast('Error banning freelancer.', 'error');
    }
  };

  // UNBAN FREELANCER
  const handleUnbanFreelancer = async (userId) => {
    try {
      await axios.post(`http://localhost:5000/api/admin/users/${userId}/unban`);
      showToast('Freelancer unbanned successfully.', 'success');
      fetchDashboardData();
    } catch (err) {
      showToast('Error unbanning freelancer.', 'error');
    }
  };

  // DELETE FREELANCER
  const handleDeleteFreelancer = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this Freelancer? All their projects, files, and clients will remain linked but their account will be removed.')) return;
    try {
      await axios.delete(`http://localhost:5000/api/users/${userId}`);
      showToast('Freelancer deleted successfully.', 'success');
      fetchDashboardData();
    } catch (err) {
      showToast('Error deleting freelancer.', 'error');
    }
  };

  // BAN CLIENT
  const handleBanClient = async (clientId) => {
    const duration = clientBanDurations[clientId] || '1d';
    try {
      await axios.post(`http://localhost:5000/api/admin/clients/${clientId}/ban`, { duration });
      showToast(`Client banned successfully.`, 'success');
      fetchDashboardData();
    } catch (err) {
      showToast('Error banning client.', 'error');
    }
  };

  // UNBAN CLIENT
  const handleUnbanClient = async (clientId) => {
    try {
      await axios.post(`http://localhost:5000/api/admin/clients/${clientId}/unban`);
      showToast('Client unbanned successfully.', 'success');
      fetchDashboardData();
    } catch (err) {
      showToast('Error unbanning client.', 'error');
    }
  };

  // DELETE CLIENT
  const handleDeleteClient = async (clientId) => {
    if (!window.confirm('Are you sure you want to permanently delete this client?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/clients/${clientId}`);
      showToast('Client deleted successfully.', 'success');
      fetchDashboardData();
    } catch (err) {
      showToast('Error deleting client.', 'error');
    }
  };

  // DELETE PROJECT
  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to permanently delete this project? All associated tasks, invoices, files, and discussion logs will be deleted.')) return;
    try {
      await axios.delete(`http://localhost:5000/api/projects/${projectId}`);
      showToast('Project deleted successfully.', 'success');
      fetchDashboardData(true);
    } catch (err) {
      showToast('Error deleting project.', 'error');
    }
  };

  // APPROVE UPGRADE
  const handleApproveUpgrade = async (requestId) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/admin/upgrade-requests/${requestId}/approve`);
      showToast(res.data.message || 'Upgrade request approved.', 'success');
      fetchDashboardData();
    } catch (err) {
      showToast('Error approving upgrade.', 'error');
    }
  };

  // REJECT UPGRADE
  const handleRejectUpgrade = async (requestId) => {
    try {
      await axios.post(`http://localhost:5000/api/admin/upgrade-requests/${requestId}/reject`);
      showToast('Upgrade request rejected.', 'success');
      fetchDashboardData();
    } catch (err) {
      showToast('Error rejecting upgrade.', 'error');
    }
  };

  // SAVE BANK ACCOUNT
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/admin/settings', {
        admin_bank_account: bankAccount
      });
      showToast('Admin settings updated successfully.', 'success');
      fetchDashboardData();
    } catch (err) {
      showToast('Error saving settings.', 'error');
    }
  };

  // FETCH PROJECT DETAILS FOR DRAWER
  const handleViewProjectDetails = async (project) => {
    setSelectedProject(project);
    setLoadingDetails(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/admin/projects/${project.id}/details`);
      setProjectDetails(res.data);
    } catch (err) {
      showToast('Error loading project details.', 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Filters
  const filteredProjects = projects.filter(p =>
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.freelancer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFreelancers = freelancers.filter(f =>
    f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClients = clients.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden text-white font-sans">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
          <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 tracking-wide uppercase">
            GridLancer Admin
          </span>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">Sign in to your admin account</h2>
          <p className="mt-2 text-center text-sm text-slate-405">
            Authorized system personnel access control panel
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
          <div className="bg-slate-900 py-8 px-4 shadow-2xl shadow-indigo-500/10 sm:rounded-3xl sm:px-10 border border-slate-800">
            <form className="space-y-6" onSubmit={handleAdminLogin}>
              <div>
                <label className="block text-sm font-medium text-slate-350 mb-2">Admin Email Address</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-950 text-white placeholder-slate-550 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                  placeholder="admin@gridlancer.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-350 mb-2">Admin Security Password</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-950 text-white placeholder-slate-550 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/25 text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-650 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Toast Notification for Login error */}
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
              <h4 className="text-white font-bold text-sm leading-snug">{toast.type === 'success' ? 'Success' : 'Sign In Failed'}</h4>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">{toast.message}</p>
            </div>
            <button onClick={() => setToast({ ...toast, show: false })} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col md:flex-row overflow-hidden font-sans relative">
      
      {/* Toast Notification */}
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

      {/* Mobile Header */}
      <div className="md:hidden h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 z-20 shrink-0">
        <div className="font-bold text-white text-lg flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-xs">GL</div>
          GridLancer Admin
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 min-h-screen border-r border-slate-800 bg-slate-900 p-6 flex flex-col gap-6 z-40 transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800 rounded-full p-1 z-50">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3 mb-4 mt-2 md:mt-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-650 flex items-center justify-center shadow-lg shadow-indigo-500/20 overflow-hidden relative shrink-0">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <div className="overflow-hidden">
            <div className="text-white font-bold text-sm truncate">Admin Portal</div>
            <div className="text-slate-400 text-[10px] truncate">{localStorage.getItem('gridlancer_admin_email') || 'admin@gridlancer.com'}</div>
          </div>
        </div>

        <div className="space-y-1 flex-1">
          {['Overview', 'Projects', 'Freelancers', 'Clients', 'Upgrade Requests', 'Complaints', 'Settings'].map((tab) => (
            <div
              key={tab}
              onClick={() => { setActiveTab(tab); setSearchQuery(''); setIsSidebarOpen(false); }}
              className={`px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all flex items-center gap-3 ${
                activeTab === tab 
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {tab === 'Overview' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" /></svg>}
              {tab === 'Projects' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              {tab === 'Freelancers' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
              {tab === 'Clients' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
              {tab === 'Upgrade Requests' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" /></svg>}
              {tab === 'Complaints' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
              {tab === 'Settings' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              <span>{tab}</span>
              {tab === 'Upgrade Requests' && upgradeRequests.filter(r => r.status === 'Pending').length > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold">
                  {upgradeRequests.filter(r => r.status === 'Pending').length}
                </span>
              )}
              {tab === 'Complaints' && complaints.filter(c => c.status === 'Pending').length > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold animate-pulse">
                  {complaints.filter(c => c.status === 'Pending').length}
                </span>
              )}
            </div>
          ))}
        </div>

        <button 
          onClick={handleLogout}
          className="w-full py-3 px-4 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer text-sm font-semibold text-left flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Sign Out
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-10 flex flex-col overflow-y-auto relative z-10 custom-scrollbar">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-t-indigo-500 border-r-slate-800 border-b-slate-800 border-l-slate-800 rounded-full animate-spin"></div>
            <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider animate-pulse">Initializing System Data...</div>
          </div>
        ) : (
          <>
            {/* Header / Stats row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-slate-800/80 pb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100">{activeTab}</h1>
                <p className="text-xs md:text-sm text-slate-400 mt-1">Real-time overview and platform security center</p>
              </div>
              
              {activeTab !== 'Overview' && activeTab !== 'Settings' && (
                <div className="relative w-full md:w-80">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${activeTab.toLowerCase()}...`}
                    className="w-full px-4 py-2.5 pl-10 border border-slate-800 rounded-xl bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs transition-colors"
                  />
                  <svg className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
              )}
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === 'Overview' && (
              <div className="space-y-8 animate-fadeIn">
                {/* Stats cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="bg-slate-900 border border-slate-850 p-4 sm:p-6 rounded-2xl flex items-center justify-between group hover:border-slate-800 transition-all shadow-lg relative overflow-hidden">
                    <div className="space-y-1 relative z-10">
                      <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Active Projects</div>
                      <div className="text-3xl font-black text-white">{projects.length}</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center relative z-10 shadow-inner group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-850 p-4 sm:p-6 rounded-2xl flex items-center justify-between group hover:border-slate-800 transition-all shadow-lg relative overflow-hidden">
                    <div className="space-y-1 relative z-10">
                      <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Registered Freelancers</div>
                      <div className="text-3xl font-black text-white">{freelancers.length}</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center relative z-10 shadow-inner group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-850 p-4 sm:p-6 rounded-2xl flex items-center justify-between group hover:border-slate-800 transition-all shadow-lg relative overflow-hidden">
                    <div className="space-y-1 relative z-10">
                      <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Connected Clients</div>
                      <div className="text-3xl font-black text-white">{clients.length}</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center relative z-10 shadow-inner group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857" /></svg>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-850 p-4 sm:p-6 rounded-2xl flex items-center justify-between group hover:border-slate-800 transition-all shadow-lg relative overflow-hidden">
                    <div className="space-y-1 relative z-10">
                      <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pending Upgrades</div>
                      <div className="text-3xl font-black text-white">{upgradeRequests.filter(r => r.status === 'Pending').length}</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center relative z-10 shadow-inner group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3-3m0 0l3 3m-3-3v8" /></svg>
                    </div>
                  </div>
                </div>

                {/* Subcontent grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                  {/* Activity log timeline */}
                  <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 sm:p-6 lg:col-span-2">
                    <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-ping"></div>
                      Recent System Activities
                    </h3>
                    
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {activities.length === 0 ? (
                        <p className="text-sm text-slate-500 py-6 text-center">No activities recorded yet.</p>
                      ) : (
                        activities.map((act, i) => (
                          <div key={i} className="flex gap-4 border-l-2 border-slate-800 pl-4 py-1 relative">
                            <div className="absolute -left-[5px] top-2.5 w-2 h-2 rounded-full bg-indigo-500"></div>
                            <div className="flex-1">
                              <p className="text-xs text-slate-300 font-semibold">{act.message}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold uppercase">{act.activity_type}</span>
                                <span className="text-[10px] text-slate-500 font-medium">{new Date(act.created_at).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Plan pricing card limits summary info */}
                  <div className="bg-gradient-to-br from-indigo-900/10 via-purple-900/5 to-slate-900 border border-indigo-950 rounded-2xl p-4 sm:p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 uppercase tracking-wide mb-3">Subscription Plans Reference</h3>
                      <div className="space-y-3.5 text-xs">
                        <div className="flex items-center justify-between border-b border-indigo-950 pb-2">
                          <span className="font-semibold text-slate-400">Plan</span>
                          <span className="font-black text-slate-300">Starter / Pro / Agency</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-indigo-950 pb-2">
                          <span className="font-semibold text-slate-400">Client creation limit</span>
                          <span className="font-semibold text-slate-300">Max 5 / Unlimited</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-indigo-950 pb-2">
                          <span className="font-semibold text-slate-400">Project creation limit</span>
                          <span className="font-semibold text-slate-300">Max 5 / Unlimited</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-indigo-950 pb-2">
                          <span className="font-semibold text-slate-400">PDF Invoices</span>
                          <span className="font-semibold text-slate-300">Restricted / Full Access</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl mt-6 text-center">
                      <div className="text-xs text-slate-400 font-bold mb-1">Configure Bank Account</div>
                      <p className="text-[10px] text-slate-500 leading-relaxed mb-3">Ensure details match where freelancers send subscription payments.</p>
                      <button 
                        onClick={() => setActiveTab('Settings')}
                        className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-bold border border-indigo-500/20 transition-all cursor-pointer"
                      >
                        Edit Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PROJECTS TAB */}
            {activeTab === 'Projects' && (
              <div className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-xl animate-fadeIn">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-center bg-slate-900/60 text-slate-400 text-xs font-bold uppercase">
                        <th className="py-4 px-6">ID</th>
                        <th className="py-4 px-6">Project Title</th>
                        <th className="py-4 px-6">Freelancer</th>
                        <th className="py-4 px-6">Client</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6">Progress</th>
                        <th className="py-4 px-6">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-sm">
                      {filteredProjects.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-slate-500">No projects found.</td>
                        </tr>
                      ) : (
                        filteredProjects.map((proj) => (
                          <tr key={proj.id} className="hover:bg-slate-850/30 transition-colors">
                            <td className="py-4 px-6 text-slate-500 font-bold">#{proj.id}</td>
                            <td className="py-4 px-6 font-bold text-white">{proj.title}</td>
                            <td className="py-4 px-6 text-slate-300 font-semibold">{proj.freelancer_name || 'N/A'}</td>
                            <td className="py-4 px-6 text-slate-300 font-semibold">{proj.client_name || 'N/A'}</td>
                            <td className="py-4 px-6">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                proj.status === 'Completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                proj.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                              }`}>
                                {proj.status || 'Pending'}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden shrink-0">
                                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${proj.progress || 0}%` }}></div>
                                </div>
                                <span className="text-xs font-bold text-slate-400">{proj.progress || 0}%</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-right flex justify-end gap-2">
                              <button 
                                onClick={() => handleViewProjectDetails(proj)}
                                className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-bold text-xs border border-indigo-500/20 transition-all cursor-pointer"
                              >
                                View Detailed Log
                              </button>
                              <button 
                                onClick={() => handleDeleteProject(proj.id)}
                                className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs border border-red-500/20 transition-all cursor-pointer"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* FREELANCERS TAB */}
            {activeTab === 'Freelancers' && (
              <div className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-xl animate-fadeIn">
                <div className="custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-center bg-slate-900/60 text-slate-400 text-xs font-bold uppercase">
                        <th className="py-4 px-6">ID</th>
                        <th className="py-4 px-6">Name</th>
                        <th className="py-4 px-6">Email</th>
                        <th className="py-4 px-6">Plan</th>
                        <th className="py-4 px-6">Trust & Warnings</th>
                        <th className="py-4 px-6">Account Status</th>
                        <th className="py-4 px-6">Ban Action</th>
                        <th className="py-4 px-6 text-right">Manage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-sm">
                      {filteredFreelancers.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="py-8 text-center text-slate-500">No freelancers found.</td>
                        </tr>
                      ) : (
                        filteredFreelancers.map((free) => {
                          const isBanned = free.banned_until && new Date(free.banned_until) > new Date();
                          return (
                            <tr key={free.id} className="hover:bg-slate-850/30 transition-colors">
                              <td className="py-4 px-6 text-slate-500 font-bold">#{free.id}</td>
                              <td className="py-4 px-6 font-bold text-white">{free.name}</td>
                              <td className="py-4 px-6 text-slate-300 font-semibold">{free.email}</td>
                              <td className="py-4 px-6">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  free.plan === 'Agency' ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20' :
                                  free.plan === 'Pro' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' :
                                  'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}>
                                  {free.plan || 'Starter'}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex flex-col items-center gap-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-slate-450 font-semibold">Trust Score:</span>
                                    <span className={`text-xs font-black ${(free.trust_score ?? 100) >= 90 ? 'text-emerald-400' : (free.trust_score ?? 100) >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
                                      {free.trust_score ?? 100}/100
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-slate-450 font-semibold">Warnings:</span>
                                    <span className={`text-xs font-black ${(free.warnings_count ?? 0) >= 3 ? 'text-rose-500 animate-pulse font-extrabold' : (free.warnings_count ?? 0) >= 1 ? 'text-amber-550' : 'text-slate-500'}`}>
                                      {free.warnings_count ?? 0}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-2.5">
                                {isBanned ? (
                                  <div className="flex flex-col items-center">
                                    <span className="text-red-400 font-bold text-xs uppercase flex items-center gap-1.5">
                                      <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                      Temporarily Banned
                                    </span>
                                    <span className="text-[10px] text-slate-500 mt-0.5">Until {new Date(free.banned_until).toLocaleString()}</span>
                                    {free.unban_requested === 1 && (
                                      <span className="mt-1 px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[9px] font-bold uppercase tracking-wider w-max flex items-center gap-1 animate-pulse">
                                        ⚠️ Unban Requested
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-green-400 font-bold text-xs uppercase w-max flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                    Active Account
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-2.5">
                                {!isBanned ? (
                                  <div className="flex items-center gap-2">
                                    <select
                                      value={banDurations[free.id] || '1d'}
                                      onChange={(e) => setBanDurations({ ...banDurations, [free.id]: e.target.value })}
                                      className="px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500"
                                    >
                                      <option value="1d">1 Day</option>
                                      <option value="1w">1 Week</option>
                                      <option value="1m">1 Month</option>
                                      <option value="perm">Permanent</option>
                                    </select>
                                    <button 
                                      onClick={() => handleBanFreelancer(free.id)}
                                      className="px-2.5 w-max py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 transition-all cursor-pointer"
                                    >
                                      Apply Ban
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => handleUnbanFreelancer(free.id)}
                                    className="px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/20 transition-all cursor-pointer"
                                  >
                                    Revoke Ban
                                  </button>
                                )}
                              </td>
                              <td className="py-4 px-6 text-right">
                                <button 
                                  onClick={() => handleDeleteFreelancer(free.id)}
                                  className="p-2 rounded-lg bg-red-650 hover:bg-red-600 text-white transition-all cursor-pointer inline-flex items-center justify-center shadow shadow-red-500/10"
                                  title="Delete Freelancer"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CLIENTS TAB */}
            {activeTab === 'Clients' && (
              <div className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-xl animate-fadeIn">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="text-left border-collapse">
                    <thead>
                      <tr className="border-b text-center border-slate-800 bg-slate-900/60 text-slate-400 text-xs font-bold uppercase">
                        <th className="py-4 px-6">ID</th>
                        <th className="py-4 px-6 w-max">Client Name</th>
                        <th className="py-4 px-6 ">Email</th>
                        <th className="py-4 px-6 w-max">Linked Freelancer</th>
                        <th className="py-4 px-6 w-max">Account Status</th>
                        <th className="py-4 px-6 w-max">Ban Action</th>
                        <th className="py-4 px-6 w-max">Manage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-sm">
                      {filteredClients.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-slate-500">No clients found.</td>
                        </tr>
                      ) : (
                        filteredClients.map((cl) => {
                          const isBanned = cl.banned_until && new Date(cl.banned_until) > new Date();
                          return (
                            <tr key={cl.id} className="hover:bg-slate-850/30 text-center transition-colors">
                              <td className="py-4 px-6 text-slate-500 font-bold">#{cl.id}</td>
                              <td className="py-4 px-6 font-bold text-white">{cl.name}</td>
                              <td className="py-4 px-6 text-slate-300 font-semibold">{cl.email}</td>
                              <td className="py-4 px-6 text-slate-300 font-semibold">{cl.freelancer_name || 'Unassigned'}</td>
                              <td className="py-4 px-2.5">
                                {isBanned ? (
                                  <div className="flex flex-col items-center">
                                    <span className="text-red-400 font-bold text-xs uppercase flex items-center gap-1.5">
                                      <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                      Temporarily Banned
                                    </span>
                                    <span className="text-[10px] text-slate-500 mt-0.5">Until {new Date(cl.banned_until).toLocaleString()}</span>
                                    {cl.unban_requested === 1 && (
                                      <span className="mt-1 px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[9px] font-bold uppercase tracking-wider w-max flex items-center gap-1 animate-pulse">
                                        ⚠️ Unban Requested
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-green-400 w-max font-bold text-xs uppercase flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                    Active Account
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-6">
                                {!isBanned ? (
                                  <div className="flex items-center gap-2">
                                    <select
                                      value={clientBanDurations[cl.id] || '1d'}
                                      onChange={(e) => setClientBanDurations({ ...clientBanDurations, [cl.id]: e.target.value })}
                                      className="px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500"
                                    >
                                      <option value="1d">1 Day</option>
                                      <option value="1w">1 Week</option>
                                      <option value="1m">1 Month</option>
                                      <option value="perm">Permanent</option>
                                    </select>
                                    <button 
                                      onClick={() => handleBanClient(cl.id)}
                                      className="px-2.5 w-max py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 transition-all cursor-pointer"
                                    >
                                      Apply Ban
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => handleUnbanClient(cl.id)}
                                    className="px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/20 transition-all cursor-pointer"
                                  >
                                    Revoke Ban
                                  </button>
                                )}
                              </td>
                              <td className="py-4 px-6 text-right">
                                <button 
                                  onClick={() => handleDeleteClient(cl.id)}
                                  className="p-2 rounded-lg bg-red-650 hover:bg-red-600 text-white transition-all cursor-pointer inline-flex items-center justify-center shadow shadow-red-500/10"
                                  title="Delete Client"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* UPGRADE REQUESTS TAB */}
            {activeTab === 'Upgrade Requests' && (
              <div className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-xl animate-fadeIn">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-center text-xs font-bold uppercase">
                        <th className="py-4 px-6">ID</th>
                        <th className="py-4 px-6">Freelancer</th>
                        <th className="py-4 px-6">Email</th>
                        <th className="py-4 px-6">Requested Plan</th>
                        <th className="py-4 px-6">Request Date</th>
                        <th className="py-4 px-6">Payment Proof Status</th>
                        <th className="py-4 px-6">Approval Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-sm">
                      {upgradeRequests.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-slate-500">No upgrade requests received.</td>
                        </tr>
                      ) : (
                        upgradeRequests.map((req) => (
                          <tr key={req.id} className="hover:bg-slate-850/30 transition-colors text-center">
                            <td className="py-4 px-6 text-slate-500 font-bold">#{req.id}</td>
                            <td className="py-4 px-6 font-bold text-white">{req.freelancer_name}</td>
                            <td className="py-4 px-6 text-slate-300 font-semibold">{req.freelancer_email}</td>
                            <td className="py-4 px-6">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                req.requested_plan === 'Agency' ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white' :
                                'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                              }`}>
                                {req.requested_plan}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-400 font-medium">{new Date(req.created_at).toLocaleString()}</td>
                            <td className="py-4 px-6">
                              {req.payment_status === 'Paid' ? (
                                <span className="px-2 inline-block py-0.5 w-max rounded bg-green-500/10 text-green-400 font-bold border border-green-500/20 text-xs">
                                  Marked Paid
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 w-max rounded bg-red-500/10 text-red-400 font-bold border border-red-500/20 text-xs">
                                  Unpaid / Pending confirmation
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              {req.status === 'Pending' ? (
                                <div className="flex w-max items-center gap-2">
                                  <button 
                                    onClick={() => handleApproveUpgrade(req.id)}
                                    className="px-3 py-1.5 rounded-lg bg-green-500 text-slate-950 font-bold text-xs hover:bg-green-450 transition-all cursor-pointer shadow"
                                  >
                                    Approve & Upgrade
                                  </button>
                                  <button 
                                    onClick={() => handleRejectUpgrade(req.id)}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-750 transition-all cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span className={`text-xs font-bold uppercase tracking-wider ${req.status === 'Approved' ? 'text-green-400' : 'text-slate-500'}`}>
                                  {req.status}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* COMPLAINTS TAB */}
            {activeTab === 'Complaints' && (
              <div className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-xl animate-fadeIn">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-center text-xs font-bold uppercase">
                        <th className="py-4 px-6">ID</th>
                        <th className="py-4 px-6">Category</th>
                        <th className="py-4 px-6">Client</th>
                        <th className="py-4 px-6">Freelancer</th>
                        <th className="py-4 px-6">Project</th>
                        <th className="py-4 px-6">Subject / Details</th>
                        <th className="py-4 px-6">Date</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-sm">
                      {complaints.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="py-8 text-center text-slate-500">No complaints filed by clients.</td>
                        </tr>
                      ) : (
                        complaints.map((comp) => (
                          <tr key={comp.id} className="hover:bg-slate-850/30 transition-colors text-center">
                            <td className="py-4 px-6 text-slate-500 font-bold">#{comp.id}</td>
                            <td className="py-4 px-6">
                              <span className="px-2.5 py-1 bg-slate-950 border border-slate-850 text-slate-300 text-[10px] font-black uppercase rounded-lg tracking-wider">
                                {comp.category || 'General'}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-bold text-white">{comp.client_name}</div>
                              <div className="text-[10px] text-slate-500">{comp.client_email}</div>
                            </td>
                            <td className="py-4 px-6 text-left">
                              <div className="font-bold text-white">{comp.freelancer_name}</div>
                              <div className="text-[10px] text-slate-500">{comp.freelancer_email}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${
                                  (comp.freelancer_trust_score ?? 100) >= 90 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                  (comp.freelancer_trust_score ?? 100) >= 70 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                  'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                }`}>
                                  Rep: {comp.freelancer_trust_score ?? 100}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${
                                  (comp.freelancer_warnings_count ?? 0) >= 3 ? 'bg-rose-500/25 text-rose-400 border-rose-500/30 animate-pulse' :
                                  (comp.freelancer_warnings_count ?? 0) >= 1 ? 'bg-amber-500/25 text-amber-400 border-amber-500/30' :
                                  'bg-slate-800 text-slate-500 border-slate-700'
                                }`}>
                                  Warns: {comp.freelancer_warnings_count ?? 0}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-slate-300 font-semibold">{comp.project_title}</td>
                            <td className="py-4 px-6 text-left max-w-xs">
                              <div className="font-bold text-slate-200">{comp.subject}</div>
                              <div className="text-xs text-slate-450 mt-1 whitespace-pre-wrap leading-relaxed">{comp.description}</div>
                              {comp.evidence ? (
                                <div className="mt-2.5">
                                  <a 
                                    href={`http://localhost:5000/uploads/${comp.evidence}`}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-indigo-400 text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition-all"
                                  >
                                    📎 Download Evidence
                                  </a>
                                  <span className="text-[9px] text-slate-500 ml-1.5 font-medium block mt-0.5">({comp.evidence_name || 'attached file'})</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-500 italic block mt-2">No evidence attached</span>
                              )}
                              {comp.status !== 'Pending' && comp.admin_response && (
                                <div className="mt-3 text-xs bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                                  <span className="font-bold text-indigo-400 block mb-0.5">Admin Action Log:</span>
                                  <span className="text-slate-300 whitespace-pre-wrap">{comp.admin_response}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-6 text-slate-400 font-medium">{new Date(comp.created_at).toLocaleString()}</td>
                            <td className="py-4 px-6">
                              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-block ${
                                comp.status === 'Resolved' || comp.status === 'Rejected'
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                                  : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse'
                              }`}>
                                {comp.status}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              {comp.status === 'Pending' || comp.status === 'Under Review' ? (
                                <button 
                                  onClick={() => {
                                    setResolvingComplaint(comp);
                                    setAdminResponseText('');
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white font-extrabold text-xs hover:bg-indigo-450 transition-all cursor-pointer shadow shadow-indigo-500/20 flex items-center justify-center gap-1 mx-auto"
                                >
                                  ⚖️ Manage Dispute
                                </button>
                              ) : (
                                <span className="text-xs text-slate-550 font-semibold italic uppercase">Resolved</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'Settings' && (
              <div className="bg-slate-900 border border-slate-850 p-6 md:p-8 rounded-2xl shadow-xl max-w-xl animate-fadeIn">
                <h3 className="text-base font-bold text-slate-100 mb-2">Platform Global Configurations</h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">Modify configurations accessed across the client and freelancer portals.</p>

                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Admin Bank Account Number (Pricing upgrades)</label>
                                    <textarea
                                      rows="3"
                                      value={bankAccount}
                                      onChange={(e) => setBankAccount(e.target.value)}
                                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-semibold transition-colors"
                                      placeholder="e.g. Bank: GridLancer Main Bank&#10;Account: 1234-5678-9012-3456&#10;Holder: Admin Corp Ltd"
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">This information is shown to freelancers once they request a plan upgrade, instructing them on where to send the transfer.</p>
                                  </div>

                                  <button
                                    type="submit"
                                    className="flex justify-center py-3 px-6 border border-transparent rounded-xl shadow-lg text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-450 hover:to-purple-550 focus:outline-none transition-all cursor-pointer"
                                  >
                    Save Configuration
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>

      {/* PROJECT DETAILS DRAWER/SLIDE-OVER */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div 
            onClick={() => setSelectedProject(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Drawer content */}
          <div className="w-full max-w-3xl bg-slate-900 border-l border-slate-850 h-full flex flex-col relative z-10 shadow-2xl animate-slideLeft text-slate-300 font-sans">
            <button 
              onClick={() => setSelectedProject(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 p-2 rounded-full transition-all shrink-0 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="p-6 md:p-8 border-b border-slate-850">
              <div className="text-[10px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-max uppercase mb-2">Detailed Log View Only</div>
              <h2 className="text-xl md:text-2xl font-black text-white">{selectedProject.title}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs text-slate-400">
                <span>Freelancer: <strong className="text-slate-300 font-bold">{selectedProject.freelancer_name}</strong></span>
                <span className="text-slate-650">•</span>
                <span>Client: <strong className="text-slate-300 font-bold">{selectedProject.client_name}</strong></span>
                <span className="text-slate-650">•</span>
                <span>Deadline: <strong className="text-slate-300 font-bold">{selectedProject.deadline ? new Date(selectedProject.deadline).toLocaleDateString() : 'N/A'}</strong></span>
              </div>
            </div>

            {loadingDetails ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-t-indigo-500 border-r-slate-800 border-b-slate-800 border-l-slate-800 rounded-full animate-spin"></div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest animate-pulse">Retrieving Logs...</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-8">
                {/* Info and Progress */}
                <div className="grid grid-cols-2 gap-6 bg-slate-950/50 p-4 rounded-xl border border-slate-850">
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Project Status</div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      projectDetails.project?.status === 'Completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                      projectDetails.project?.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                      'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    }`}>
                      {projectDetails.project?.status || 'Pending'}
                    </span>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Development Progress</div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden shrink-0">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${projectDetails.project?.progress || 0}%` }}></div>
                      </div>
                      <span className="text-xs font-bold text-white">{projectDetails.project?.progress || 0}%</span>
                    </div>
                  </div>
                  <div className="col-span-2 border-t border-slate-850/50 pt-3">
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Description</div>
                    <p className="text-xs text-slate-350 leading-relaxed font-medium">{projectDetails.project?.description || 'No description provided.'}</p>
                  </div>
                </div>

                {/* Sub-tabs: Invoices & Tasks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Invoices */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                      Invoices Logs ({projectDetails.invoices.length})
                    </h3>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                      {projectDetails.invoices.length === 0 ? (
                        <p className="text-xs text-slate-550 italic">No invoices created.</p>
                      ) : (
                        projectDetails.invoices.map((inv) => (
                          <div key={inv.id} className="flex justify-between items-center p-3 bg-slate-950/30 border border-slate-850 rounded-xl">
                            <div>
                              <div className="text-xs font-bold text-slate-200">{inv.title}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{new Date(inv.created_at).toLocaleDateString()}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-extrabold text-indigo-400">${inv.amount}</div>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase inline-block mt-1 ${inv.status === 'Paid' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                {inv.status}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                      Tasks Checklist ({projectDetails.tasks.length})
                    </h3>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                      {projectDetails.tasks.length === 0 ? (
                        <p className="text-xs text-slate-550 italic">No tasks created.</p>
                      ) : (
                        projectDetails.tasks.map((task) => (
                          <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-950/30 border border-slate-850 rounded-xl">
                            <input 
                              type="checkbox" 
                              checked={!!task.is_completed} 
                              disabled 
                              className="w-4 h-4 rounded text-indigo-500 bg-slate-950 border-slate-800"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold truncate ${task.is_completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                                {task.title}
                              </p>
                            </div>
                            <div className="text-[10px] font-black text-slate-500 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                              Weight: {task.weight || 0}%
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Uploaded Files */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    Project File Logs ({projectDetails.files.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {projectDetails.files.length === 0 ? (
                      <p className="text-xs text-slate-550 italic col-span-2">No files uploaded.</p>
                    ) : (
                      projectDetails.files.map((file) => (
                        <div key={file.id} className="p-3 bg-slate-950/20 border border-slate-850 rounded-xl flex items-center gap-3">
                          <svg className="w-5 h-5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-200 truncate" title={file.original_name}>{file.original_name}</div>
                            <div className="text-[9px] text-slate-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB • {file.mime_type}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Discussion History */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    Discussion Chat History Logs ({projectDetails.messages.length})
                  </h3>
                  <div className="space-y-3 bg-slate-950/40 p-4 border border-slate-850 rounded-xl h-[300px] overflow-y-auto custom-scrollbar flex flex-col">
                    {projectDetails.messages.length === 0 ? (
                      <p className="text-xs text-slate-550 italic text-center my-auto">No discussion logs found.</p>
                    ) : (
                      projectDetails.messages.map((msg) => {
                        const isFreelancer = msg.sender_type === 'freelancer';
                        return (
                          <div 
                            key={msg.id} 
                            className={`flex flex-col max-w-[80%] ${isFreelancer ? 'self-end items-end' : 'self-start items-start'}`}
                          >
                            <div className="text-[9px] text-slate-500 font-bold mb-1 uppercase tracking-wider">
                              {isFreelancer ? `Freelancer (ID: ${msg.sender_id})` : `Client (ID: ${msg.sender_id})`}
                            </div>
                            <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                              isFreelancer ? 'bg-indigo-650 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'
                            }`}>
                              {msg.message}
                            </div>
                            <span className="text-[8px] text-slate-650 mt-1">{new Date(msg.created_at).toLocaleString()}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {resolvingComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setResolvingComplaint(null)}></div>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full relative z-10 animate-fadeIn shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
            <button
              onClick={() => setResolvingComplaint(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 p-2 rounded-full transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-[10px] font-black uppercase rounded-lg tracking-wider">
              Dispute Resolution Panel
            </span>
            <h3 className="text-xl font-black text-white mt-2 mb-4">Complaint Case #{resolvingComplaint.id}</h3>
            
            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-left">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850">
                <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block mb-2">Dispute Target (Freelancer)</span>
                <div className="text-sm font-bold text-white">{resolvingComplaint.freelancer_name}</div>
                <div className="text-xs text-slate-400 mt-0.5">{resolvingComplaint.freelancer_email}</div>
                
                {/* Standing */}
                <div className="flex gap-4 mt-3 pt-3 border-t border-slate-900">
                  <div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase">Reputation / Trust</div>
                    <div className={`text-sm font-black mt-0.5 ${
                      (resolvingComplaint.freelancer_trust_score ?? 100) >= 90 ? 'text-emerald-400' :
                      (resolvingComplaint.freelancer_trust_score ?? 100) >= 70 ? 'text-amber-400' :
                      'text-rose-400'
                    }`}>
                      {resolvingComplaint.freelancer_trust_score ?? 100}/100
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase">Active Warnings</div>
                    <div className={`text-sm font-black mt-0.5 ${
                      (resolvingComplaint.freelancer_warnings_count ?? 0) >= 3 ? 'text-rose-500 font-extrabold animate-pulse' :
                      (resolvingComplaint.freelancer_warnings_count ?? 0) >= 1 ? 'text-amber-450' :
                      'text-slate-500'
                    }`}>
                      {resolvingComplaint.freelancer_warnings_count ?? 0}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850">
                <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block mb-2">Filing Party (Client)</span>
                <div className="text-sm font-bold text-white">{resolvingComplaint.client_name}</div>
                <div className="text-xs text-slate-400 mt-0.5">{resolvingComplaint.client_email}</div>
                
                <div className="mt-3 pt-3 border-t border-slate-900 flex justify-between items-center">
                  <div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase">Project Title</div>
                    <div className="text-xs font-semibold text-slate-300 mt-0.5">{resolvingComplaint.project_title}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-550 font-bold uppercase text-right">Category</div>
                    <div className="text-[10px] font-black text-indigo-400 uppercase bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md mt-0.5">
                      {resolvingComplaint.category || 'General'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description & Evidence */}
            <div className="mb-6 bg-slate-950/60 p-4 rounded-2xl border border-slate-850 text-xs text-left">
              <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block mb-1">Complaint Content</span>
              <div className="font-semibold text-slate-200 mb-1">Subject: {resolvingComplaint.subject}</div>
              <div className="text-slate-400 whitespace-pre-wrap leading-relaxed">{resolvingComplaint.description}</div>
              {resolvingComplaint.evidence && (
                <div className="mt-3 pt-3 border-t border-slate-900 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Evidence Attached: {resolvingComplaint.evidence_name}</span>
                  <a 
                    href={`http://localhost:5000/uploads/${resolvingComplaint.evidence}`}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-indigo-400 rounded-lg text-[10px] font-extrabold transition-all"
                  >
                    📎 Download Evidence
                  </a>
                </div>
              )}
            </div>

            {/* Form & Actions */}
            <div className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Admin Resolution Statement / Action Notes (Required)</label>
                <textarea
                  value={adminResponseText}
                  onChange={(e) => setAdminResponseText(e.target.value)}
                  placeholder="Explain the rationale for this action. This will be logged as system feedback."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-colors custom-scrollbar font-medium"
                ></textarea>
              </div>

              {/* Action Buttons Grid */}
              <div className="space-y-3">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Dispute Actions (Select one to execute)</span>
                
                {/* 1. Warn / Clarify / Resolve / Reject */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    onClick={() => {
                      if (!adminResponseText.trim()) return alert("Please enter action notes explaining the warning.");
                      handleDisputeAction(resolvingComplaint.id, 'warn', { reason: adminResponseText });
                    }}
                    className="py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center"
                  >
                    ⚠️ Warn Freelancer
                  </button>
                  
                  <button
                    onClick={() => {
                      if (!adminResponseText.trim()) return alert("Please enter the clarification request content.");
                      handleDisputeAction(resolvingComplaint.id, 'clarify', { admin_response: adminResponseText });
                    }}
                    className="py-2.5 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center"
                  >
                    💬 Ask Clarification
                  </button>

                  <button
                    onClick={() => {
                      const notes = adminResponseText.trim() || 'Resolved by admin';
                      handleDisputeAction(resolvingComplaint.id, 'resolve', { admin_response: notes });
                    }}
                    className="py-2.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center"
                  >
                    ✅ Resolve Case
                  </button>

                  <button
                    onClick={() => {
                      const notes = adminResponseText.trim() || 'Complaint rejected';
                      handleDisputeAction(resolvingComplaint.id, 'reject', { admin_response: notes });
                    }}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center"
                  >
                    ❌ Reject Case
                  </button>
                </div>

                {/* 2. Ban Controls */}
                <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">Account Restriction Controls</span>
                      <p className="text-[10px] text-slate-500">Apply temporary restriction or permanent system ban.</p>
                    </div>
                    
                    {/* Duration Select */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Duration:</span>
                      <select
                        id="modal-ban-duration"
                        className="px-2 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-xs font-semibold text-slate-350 focus:outline-none [color-scheme:dark]"
                      >
                        <option value="1d">1 Day Restriction</option>
                        <option value="1w">1 Week Restriction</option>
                        <option value="1m">1 Month Restriction</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        if (!adminResponseText.trim()) return alert("Please enter the reason for restriction.");
                        const duration = document.getElementById("modal-ban-duration").value;
                        handleDisputeAction(resolvingComplaint.id, 'restrict', { reason: adminResponseText, duration });
                      }}
                      className="py-3 px-4 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/25 hover:border-orange-500/40 text-orange-400 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center shadow shadow-orange-500/5"
                    >
                      ⏳ Restrict Account
                    </button>
                    
                    <button
                      onClick={() => {
                        if (!adminResponseText.trim()) return alert("Please enter the reason for the permanent ban.");
                        handleDisputeAction(resolvingComplaint.id, 'ban', { reason: adminResponseText });
                      }}
                      className="py-3 px-4 bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/30 hover:border-rose-500/50 text-rose-455 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center shadow shadow-rose-500/5"
                    >
                      🚫 Permanent Ban
                    </button>
                  </div>
                </div>
              </div>

              {/* Close Panel button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setResolvingComplaint(null)}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-400 hover:text-white hover:bg-slate-850 border border-transparent hover:border-slate-800 transition-all cursor-pointer"
                >
                  Cancel & Close Panel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embed simple inline styles for animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
        
        .animate-fadeIn { animation: fadeIn 0.4s ease forwards; }
        .animate-slideLeft { animation: slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
