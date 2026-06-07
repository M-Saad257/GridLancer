import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import socket from '../socket';
import Overview from './Overview';
import Projects from './Projects';
import Clients from './Clients';
import Settings from './Settings';
import Team from './Team';
import PlanLockBanner from '../components/PlanLockBanner';
import CalendarView from '../components/CalendarView';
import WhiteLabelSettings from './WhiteLabelSettings';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [projectCount, setProjectCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [planVersion, setPlanVersion] = useState(0);
  const navigate = useNavigate();

  const [pendingProjectId, setPendingProjectId] = useState(null);

  // Subscription states
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [adminBankDetails, setAdminBankDetails] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [meetingInvite, setMeetingInvite] = useState(null);

  // Plan limits state
  const [planLimits, setPlanLimits] = useState({
    plan: 'Starter',
    limits: { maxProjects: 3, maxClients: 3, maxFiles: 3, realtime: false, analytics: false, invoiceTracking: false, videoCall: false },
    usage: { projects: 0, clients: 0 }
  });

  // Ban overlay states
  const [isBanned, setIsBanned] = useState(false);
  const [banDate, setBanDate] = useState(null);
  const [banReason, setBanReason] = useState(null);
  const [unbanRequested, setUnbanRequested] = useState(false);
  const [requestSending, setRequestSending] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const syncUserData = async (userId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${userId}`);
      if (res.data.status === 'banned' || res.data.is_banned) {
        setIsBanned(true);
        setBanDate(res.data.banned_until);
        setBanReason(res.data.ban_reason);
        setUnbanRequested(res.data.unban_requested === 1);
        return;
      }
      setIsBanned(false);
      setUser(res.data);
      localStorage.setItem('gridlancer_user', JSON.stringify(res.data));
    } catch (err) {
      console.error("Failed to sync fresh user data:", err);
    }
  };

  const fetchUpgradeStatus = async (userId) => {
    try {
      const requestRes = await axios.get(`http://localhost:5000/api/upgrade-requests/user/${userId}`);
      const req = requestRes.data.request;
      setPendingRequest(req);
      if (req && req.status === 'Pending') {
        setShowPaymentModal(true);
      }
    } catch (e) {
      console.error("Failed to fetch upgrade request:", e);
    }
  };

  const fetchPlanLimits = async (userId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${userId}/plan-limits`);
      setPlanLimits(res.data);
    } catch (e) {
      console.error("Failed to fetch plan limits:", e);
    }
  };

  useEffect(() => {
    const localUser = localStorage.getItem('gridlancer_user');
    const sessionUser = sessionStorage.getItem('gridlancer_user');

    let loggedInUser = null;
    try {
      if (localUser && localUser !== 'undefined') {
        loggedInUser = JSON.parse(localUser);
      } else if (sessionUser && sessionUser !== 'undefined') {
        loggedInUser = JSON.parse(sessionUser);
      } else {
        navigate('/login');
        return;
      }

      if (loggedInUser && loggedInUser.id > 100000) {
        localStorage.removeItem('gridlancer_user');
        sessionStorage.removeItem('gridlancer_user');
        navigate('/login');
        return;
      }

      setUser(loggedInUser);
      syncUserData(loggedInUser.id);
      fetchUpgradeStatus(loggedInUser.id);
      fetchPlanLimits(loggedInUser.id);

      // Fetch admin settings for bank details
      axios.get('http://localhost:5000/api/admin/settings')
        .then(res => {
          setAdminBankDetails(res.data.admin_bank_account || 'Bank: GridLancer Main Bank\nAccount: 1234-5678-9012-3456\nHolder: Admin Corp Ltd');
        })
        .catch(err => console.error(err));

    } catch (e) {
      console.error("Failed to parse user data:", e);
      localStorage.removeItem('gridlancer_user');
      sessionStorage.removeItem('gridlancer_user');
      navigate('/login');
      return;
    }

    const fetchStorageData = async () => {
      try {
        const clientsRes = await axios.get(`http://localhost:5000/api/clients/${loggedInUser.id}`);
        const clients = clientsRes.data;
        let count = 0;
        for (const client of clients) {
          const projectsRes = await axios.get(`http://localhost:5000/api/projects/${client.id}`);
          count += projectsRes.data.length;
        }
        setProjectCount(count);
      } catch (err) {
        console.error(err);
      }
    };

    fetchStorageData();
  }, [navigate]);

  // Sync user plan and upgrade request status when the page becomes visible or focused
  useEffect(() => {
    if (!user?.id) return;

    const syncAll = () => {
      syncUserData(user.id);
      fetchUpgradeStatus(user.id);
    };

    // Initial sync
    syncAll();

    // Listen to focus and visibility changes (triggers sync when switching back to this tab)
    const handleFocus = () => syncAll();

    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);

    // Join room and listen to real-time plan updates/approvals
    const joinUserRoom = () => {
      socket.emit("join_user", user.id);
    };

    joinUserRoom();
    socket.on("connect", joinUserRoom);

    const handlePlanUpdated = (data) => {
      // Immediately update user plan in state and localStorage (optimistic)
      if (data && data.plan) {
        setUser(prev => {
          const updated = { ...prev, plan: data.plan };
          localStorage.setItem('gridlancer_user', JSON.stringify(updated));
          return updated;
        });
      }
      // Clear pending upgrade request immediately
      setPendingRequest(null);
      setShowUpgradeModal(false);
      setShowPaymentModal(false);

      // Re-sync everything from server to confirm
      syncUserData(user.id);
      fetchUpgradeStatus(user.id);
      fetchPlanLimits(user.id);

      // Bump planVersion to force Overview to re-fetch analytics
      setPlanVersion(prev => prev + 1);

      if (data && data.plan) {
        showToast(`🎉 Your plan has been changed to ${data.plan}!`, 'success');
      } else {
        showToast(`Your upgrade request was updated.`, 'success');
      }
    };

    const handleUserBanned = (data) => {
      setIsBanned(true);
      setBanDate(data?.banned_until);
      setBanReason(data?.reason || null);
      setUnbanRequested(false);
    };

    const handleUserUnbanned = () => {
      setIsBanned(false);
      syncAll();
      showToast('Your account ban has been revoked!', 'success');
    };

    const handleMeetingStarted = (data) => {
      setMeetingInvite(data);
      setTimeout(() => {
        setMeetingInvite(prev => prev && prev.roomName === data.roomName ? null : prev);
      }, 120000);
    };

    socket.on("plan_updated", handlePlanUpdated);
    socket.on("user_banned", handleUserBanned);
    socket.on("user_unbanned", handleUserUnbanned);
    socket.on("meeting_started", handleMeetingStarted);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
      socket.off("connect", joinUserRoom);
      socket.off("plan_updated", handlePlanUpdated);
      socket.off("user_banned", handleUserBanned);
      socket.off("user_unbanned", handleUserUnbanned);
      socket.off("meeting_started", handleMeetingStarted);
    };
  }, [user?.id]);

  const handleLogout = () => {
    localStorage.removeItem('gridlancer_user');
    sessionStorage.removeItem('gridlancer_user');
    navigate('/login');
  };

  const handleNotificationClick = (projectId) => {
    if (projectId) {
      setPendingProjectId(projectId);
      setActiveTab('Projects');
    }
  };

  const handleUpgradeClick = () => {
    if (pendingRequest && pendingRequest.status === 'Pending') {
      setShowPaymentModal(true);
    } else {
      setShowUpgradeModal(true);
    }
  };

  const handleChoosePlan = async (planName) => {
    try {
      const res = await axios.post('http://localhost:5000/api/upgrade-request', {
        user_id: user.id,
        requested_plan: planName
      });
      if (res.data.instant) {
        showToast(res.data.message || `Plan updated to ${res.data.plan || planName} successfully.`, 'success');
        // Update user state and local storage with the new plan
        const updatedUser = { ...user, plan: res.data.plan || planName };
        setUser(updatedUser);
        localStorage.setItem('gridlancer_user', JSON.stringify(updatedUser));
        await fetchUpgradeStatus(user.id);
        await fetchPlanLimits(user.id);
        setPlanVersion(prev => prev + 1);
        setShowUpgradeModal(false);
      } else {
        showToast(res.data.message || 'Upgrade request created!', 'success');
        await fetchUpgradeStatus(user.id);
        setShowUpgradeModal(false);
        setShowPaymentModal(true);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit upgrade request.', 'error');
    }
  };

  const handleConfirmPaid = async () => {
    if (!pendingRequest) return;
    try {
      const res = await axios.post(`http://localhost:5000/api/upgrade-request/${pendingRequest.id}/paid`);
      showToast(res.data.message || 'Payment details marked as submitted!', 'success');
      await fetchUpgradeStatus(user.id);
    } catch (err) {
      showToast('Failed to mark request as Paid.', 'error');
    }
  };

  if (!user) return null;

  // Calculate actual storage authentically based on base64 avatar size
  const avatarBytes = user.image ? Math.round((user.image.length * 3) / 4) : 0;
  const totalBytes = avatarBytes + 0;

  const storageMB = (totalBytes / (1024 * 1024)).toFixed(2);
  const maxStorageMB = user.plan === 'Agency' ? 100000 : user.plan === 'Pro' ? 2000 : 100;
  const storagePercentage = Math.min(100, (totalBytes / (maxStorageMB * 1024 * 1024)) * 100);

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col md:flex-row overflow-hidden relative font-sans">

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
          GridLancer
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
      <div className={`fixed inset-y-0 left-0 w-64 h-screen border-r border-slate-800 bg-slate-900 py-4 px-4 flex flex-col gap-3.5 z-40 transition-transform duration-300 md:relative md:translate-x-0 overflow-y-auto overflow-x-hidden md:overflow-hidden select-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800 rounded-full p-1 z-50">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* User Card with Subscription Upgrades info */}
        <div className="flex flex-col gap-2.5 bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/60 shadow-inner">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 overflow-hidden relative shrink-0">
              {user.image ? (
                <img src={user.image} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-base">{user.name ? user.name.charAt(0).toUpperCase() : 'C'}</span>
              )}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-white font-bold text-xs truncate">{user.name}</div>
              <div className="text-slate-400 text-[9px] truncate">{user.email}</div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-850 pt-2 mt-0.5">
            <div className="flex flex-col gap-0.5">
              <span className="text-[7px] text-slate-500 font-bold uppercase tracking-wider">Plan Status</span>
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider w-max ${user.plan === 'Agency' ? 'bg-gradient-to-r from-purple-500 to-indigo-650 text-white' :
                  user.plan === 'Pro' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                {user.plan || 'Starter'}
              </span>
            </div>

            <button
              onClick={handleUpgradeClick}
              className="px-2 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-450 hover:to-purple-550 text-white font-bold text-[8px] rounded-lg shadow shadow-indigo-500/10 cursor-pointer transition-all flex items-center gap-1 shrink-0"
            >
              {user.plan === 'Starter' ? 'Upgrade Plan' : 'Change Plan'}
            </button>
          </div>

          {pendingRequest && pendingRequest.status === 'Pending' && (
            <div className="mt-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-405 text-[8px] font-bold p-1.5 rounded-lg flex flex-col items-center justify-center gap-1 shadow-inner">
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-yellow-400 animate-ping"></div>
                Upgrade Pending
              </div>
              <button
                onClick={() => {
                  syncUserData(user.id);
                  fetchUpgradeStatus(user.id);
                  showToast('Checking upgrade status...', 'success');
                }}
                className="w-full py-0.5 bg-yellow-500/20 hover:bg-yellow-500/35 border border-yellow-500/30 text-yellow-300 font-extrabold text-[8px] uppercase tracking-wider transition-all cursor-pointer text-center rounded-md"
              >
                Check Status
              </button>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          {(() => {
            const tabs = user.role === 'member' 
              ? ['Overview', 'Projects', 'Calendar']
              : ['Overview', 'Projects', 'Calendar', 'Clients', 'Team', 'White Label', 'Settings'];
            return tabs.map((item, i) => {
              const isTeamGated = item === 'Team' && user.plan !== 'Agency';
              const isWLBGated = item === 'White Label' && user.plan !== 'Agency';
              let displayName = item;
              if (item === 'Team' && isTeamGated) displayName = 'Team (Agency)';
              if (item === 'White Label' && isWLBGated) displayName = 'White Label (Agency)';
              return (
                <div
                  key={i}
                  onClick={() => {
                    setActiveTab(item);
                    setIsSidebarOpen(false);
                    if (user?.id) {
                      syncUserData(user.id);
                      fetchUpgradeStatus(user.id);
                    }
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${activeTab === item ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                  {displayName}
                </div>
              );
            });
          })()}
        </div>

        <div className="mt-auto">
          <button onClick={handleLogout} className="w-full py-2 px-3 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer text-xs font-semibold text-left flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sign Out
          </button>
        </div>
      </div>

      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* Main Content Area */}
      <div className="flex-1 p-3 sm:p-6 md:p-10 flex flex-col z-10 overflow-y-auto custom-scrollbar">
        {activeTab === 'Overview' && <Overview user={user} onNotificationClick={handleNotificationClick} planLimits={planLimits} onUpgrade={handleUpgradeClick} planVersion={planVersion} />}
        {activeTab === 'Projects' && <Projects user={user} pendingProjectId={pendingProjectId} onClearPending={() => setPendingProjectId(null)} planLimits={planLimits} onUpgrade={handleUpgradeClick} onProjectChange={() => fetchPlanLimits(user.id)} />}
        {activeTab === 'Calendar' && <CalendarView user={user} onOpenProject={(projId) => { setPendingProjectId(projId); setActiveTab('Projects'); }} />}
        {activeTab === 'Clients' && user.role !== 'member' && <Clients user={user} planLimits={planLimits} onUpgrade={handleUpgradeClick} onClientChange={() => fetchPlanLimits(user.id)} />}
        {activeTab === 'Team' && (
          user.plan === 'Agency' ? (
            <Team user={user} planLimits={planLimits} onUpgrade={handleUpgradeClick} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="max-w-md w-full">
                <PlanLockBanner
                  feature="Team Collaboration & Members"
                  description="Invite team members, assign projects, set roles (Admin/Member), and collaborate in group-style chat on the Agency plan."
                  requiredPlan="Agency"
                  onUpgrade={handleUpgradeClick}
                />
              </div>
            </div>
          )
        )}
        {activeTab === 'White Label' && (
          user.plan === 'Agency' ? (
            <WhiteLabelSettings user={user} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="max-w-md w-full">
                <PlanLockBanner
                  feature="White Label Branding"
                  description="Customize your client portal with your own logo, primary colors, and a custom subdomain to deliver a premium, client-facing experience."
                  requiredPlan="Agency"
                  onUpgrade={handleUpgradeClick}
                />
              </div>
            </div>
          )
        )}
        {activeTab === 'Settings' && <Settings user={user} onUserUpdate={setUser} />}
      </div>

      {/* PRICING PLANS SELECTOR MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShowUpgradeModal(false)}></div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-4xl w-full relative z-10 max-h-[90vh] overflow-y-auto custom-scrollbar animate-fadeIn shadow-2xl">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 p-2 rounded-full transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="text-center mb-8">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white">Upgrade Your GridLancer Account</h2>
              <p className="text-sm text-slate-400 mt-2">Unlock unlimited clients, projects, professional PDF invoices, and real-time support.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">

              {/* Starter Plan */}
              <div className="bg-slate-950/50 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div>
                  <h3 className="text-lg font-bold text-slate-300">Starter Plan</h3>
                  <p className="text-xs text-slate-500 mt-1">For freelancers starting out</p>
                  <div className="text-3xl font-black text-white mt-4">$0 <span className="text-xs text-slate-500 font-medium">/ forever</span></div>
 
                  <ul className="space-y-3 mt-6 text-xs text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="text-slate-500">✔️</span> Max 3 clients & 3 projects
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-slate-500">✔️</span> Max 3 files per project
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-slate-500">✔️</span> Milestone invoicing
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-slate-500">✔️</span> Project activity logs
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-slate-500">✔️</span> Client complaints to admin
                    </li>
                  </ul>
                </div>
                {user.plan === 'Starter' ? (
                  <button
                    disabled
                    className="w-full mt-8 py-3 rounded-xl bg-slate-800 text-slate-500 text-xs font-bold border border-slate-700 cursor-not-allowed text-center"
                  >
                    Active Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleChoosePlan('Starter')}
                    className="w-full mt-8 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold border border-slate-700 transition-all cursor-pointer text-center"
                  >
                    Downgrade to Starter
                  </button>
                )}
              </div>
 
              {/* Pro Plan */}
              <div className="bg-slate-900 border-2 border-indigo-500 p-6 rounded-2xl flex flex-col justify-between shadow-lg shadow-indigo-500/10 relative hover:border-indigo-400 transition-all">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow">Popular Choice</span>
                <div>
                  <h3 className="text-lg font-bold text-white">Pro Plan</h3>
                  <p className="text-xs text-slate-400 mt-1">For active growing professionals</p>
                  <div className="text-3xl font-black text-white mt-4">$29 <span className="text-xs text-slate-400 font-medium">/ month</span></div>
 
                  <ul className="space-y-3 mt-6 text-xs text-slate-350">
                    <li className="flex items-center gap-2">
                      <span className="text-indigo-400">✔️</span> Max 20 clients
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-indigo-400">✔️</span> Max 20 projects
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-indigo-400">✔️</span> Max 50 files per project
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-indigo-400">✔️</span> Real-time chat & notifications
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-indigo-400">✔️</span> Invoice tracking & PDF download
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-indigo-400">✔️</span> Client complaints to admin
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-indigo-400">✔️</span> Complaint tracking & status
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-indigo-400">✔️</span> Video Call
                    </li>
                  </ul>
                </div>
                {user.plan === 'Pro' ? (
                  <button
                    disabled
                    className="w-full mt-8 py-3 rounded-xl bg-slate-850 text-slate-550 text-xs font-bold border border-slate-800 cursor-not-allowed text-center"
                  >
                    Active Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleChoosePlan('Pro')}
                    className="w-full mt-8 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-450 text-white text-xs font-black transition-all cursor-pointer text-center shadow shadow-indigo-500/20"
                  >
                    {user.plan === 'Agency' ? 'Downgrade to Pro' : 'Choose Pro Plan'}
                  </button>
                )}
              </div>
 
              {/* Agency Plan */}
              <div className="bg-slate-950/50 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div>
                  <h3 className="text-lg font-bold text-purple-400">Agency Plan</h3>
                  <p className="text-xs text-slate-500 mt-1">For teams and high-volume scale</p>
                  <div className="text-3xl font-black text-white mt-4">$79 <span className="text-xs text-slate-500 font-medium">/ month</span></div>
 
                  <ul className="space-y-3 mt-6 text-xs text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="text-purple-400">✔️</span> Unlimited clients & projects
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-purple-400">✔️</span> Max 999 files per project
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-purple-400">✔️</span> Real-time chat & notifications
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-purple-400">✔️</span> Invoice tracking & PDF download
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-purple-400">✔️</span> Advanced dashboard
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-purple-400">✔️</span> Client complaints to admin
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-purple-400">✔️</span> Complaint tracking & status
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-purple-400">✔️</span> Video Call
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-purple-400">✔️</span> Team members & collaboration
                    </li>
                  </ul>
                </div>
                {user.plan === 'Agency' ? (
                  <button
                    disabled
                    className="w-full mt-8 py-3 rounded-xl bg-slate-850 text-slate-550 text-xs font-bold border border-slate-800 cursor-not-allowed text-center"
                  >
                    Active Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleChoosePlan('Agency')}
                    className="w-full mt-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-650 hover:from-purple-450 hover:to-indigo-600 text-white text-xs font-black transition-all cursor-pointer text-center"
                  >
                    Choose Agency Plan
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL WITH BANK DETAILS */}
      {showPaymentModal && pendingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)}></div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-md w-full relative z-10 animate-fadeIn shadow-2xl">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 p-2 rounded-full transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="mb-4">
              <span className="text-[10px] bg-yellow-500/10 text-yellow-405 px-2 py-0.5 rounded border border-yellow-500/20 font-bold uppercase">Pending Verification</span>
              <h2 className="text-xl font-bold text-white mt-2">Subscription Bank Transfer</h2>
              <p className="text-xs text-slate-400 mt-1">To active your upgraded account, please transfer subscription fee to our bank details.</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 my-4 space-y-3.5">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Transfer Details</div>

              <div className="text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Requested Plan:</span>
                  <span className="text-white font-bold">{pendingRequest.requested_plan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Subscription Rate:</span>
                  <span className="text-white font-black">{pendingRequest.requested_plan === 'Pro' ? '$29 / mo' : '$79 / mo'}</span>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Admin Account details</div>
                <pre className="text-xs text-indigo-300 font-mono whitespace-pre-wrap leading-relaxed font-semibold bg-indigo-950/20 p-3 rounded-lg border border-indigo-950/50">
                  {adminBankDetails}
                </pre>
              </div>
            </div>

            {/* Honesty Note */}
            <div className="bg-indigo-500/5 border border-indigo-950 p-3.5 rounded-xl text-[10px] text-slate-400 leading-relaxed my-4 flex gap-2">
              <span className="text-xs text-indigo-400">💡</span>
              <div>
                <strong>Honesty Clause:</strong> Please proceed with the bank transfer before confirming. Approvals are checked manually against actual records.
              </div>
            </div>

            {pendingRequest.payment_status === 'Paid' ? (
              <div className="w-full py-3.5 bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold text-center rounded-xl flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-ping"></div>
                Awaiting Admin Verification
              </div>
            ) : (
              <button
                onClick={handleConfirmPaid}
                className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-450 text-white text-xs font-black transition-all cursor-pointer rounded-xl text-center shadow shadow-indigo-500/25"
              >
                I Have Transferred - Confirm Paid
              </button>
            )}
          </div>
        </div>
      )}

      {/* BAN OVERLAY MODAL */}
      {isBanned && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-red-500/20 rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-md w-full text-center shadow-2xl relative">
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/10">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>

            <h2 className="text-2xl font-black text-white">Account Suspended</h2>
            <p className="text-xs text-slate-400 mt-2">
              {banReason ? banReason : 'Your freelancer dashboard has been temporarily deactivated by the administration.'}
            </p>

            <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl my-6">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Suspension Details</span>
              <div className="text-xs font-semibold text-red-400">
                Banned until: {banDate ? new Date(banDate).toLocaleString() : 'Permanent'}
              </div>
            </div>

            <div className="space-y-3">
              {unbanRequested ? (
                <div className="w-full py-3.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-405 text-xs font-bold rounded-xl flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-ping"></div>
                  Unban Request Under Review
                </div>
              ) : (
                <button
                  disabled={requestSending}
                  onClick={async () => {
                    setRequestSending(true);
                    try {
                      await axios.post(`http://localhost:5000/api/users/${user.id}/request-unban`);
                      setUnbanRequested(true);
                      showToast('Unban request submitted successfully.', 'success');
                    } catch (e) {
                      showToast('Failed to submit unban request.', 'error');
                    } finally {
                      setRequestSending(false);
                    }
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-red-500 to-indigo-650 hover:from-red-450 hover:to-indigo-600 text-white text-xs font-black transition-all cursor-pointer rounded-xl text-center shadow shadow-indigo-500/20"
                >
                  {requestSending ? 'Submitting Request...' : 'Request Unban'}
                </button>
              )}

              <button
                onClick={handleLogout}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-750 text-slate-350 text-xs font-bold rounded-xl border border-slate-750 transition-all cursor-pointer"
              >
                Sign Out / Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEETING INVITE FLOATING BANNER */}
      {meetingInvite && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] max-w-lg w-[calc(100%-2rem)] md:w-full bg-slate-900/95 backdrop-blur border border-indigo-500/40 rounded-2xl p-4 shadow-[0_10px_50px_rgba(99,102,241,0.25)] flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 animate-bounce">
              📹
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Video Call Invite</div>
              <div className="text-sm font-semibold text-white mt-0.5">
                <span className="text-indigo-400 font-extrabold">{meetingInvite.senderName}</span> has started a meeting for project <strong className="text-indigo-300">{meetingInvite.projectTitle}</strong>.
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              onClick={() => setMeetingInvite(null)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-350 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-750"
            >
              Dismiss
            </button>
            <button
              onClick={() => {
                window.open(`https://meet.jit.si/${meetingInvite.roomName}`, '_blank');
                setMeetingInvite(null);
              }}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg shadow-indigo-500/25"
            >
              Join Call
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.35s ease forwards; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
};

export default Dashboard;
