import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import socket from '../socket';
import PlanLockBanner from '../components/PlanLockBanner';

const notificationSound = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU" + 'A'.repeat(500));

const Overview = ({ user, onNotificationClick, planLimits, onUpgrade }) => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeProjects: 0,
    pendingInvoices: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyticsBlocked, setAnalyticsBlocked] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [latestProjectId, setLatestProjectId] = useState(null);
  const totalClientMessagesRef = useRef(0);
  const initializedRef = useRef(false);

  const isStarterPlan = planLimits?.plan === 'Starter' || planLimits?.limits?.analytics === false;

  const fetchDashboardData = async (isBackground = false) => {
    if (!user?.id) return;

    try {
      if (!isBackground) setLoading(true);

      // 1. Fetch Stats (plan-gated)
      try {
        const statsRes = await axios.get(`http://localhost:5000/api/users/${user.id}/stats`);
        const authenticStats = statsRes.data;
        setAnalyticsBlocked(false);
        setStats({
          totalRevenue: authenticStats.totalRevenue || 0,
          activeProjects: authenticStats.activeProjects || 0,
          pendingInvoices: authenticStats.pendingInvoices || 0
        });
      } catch (statsErr) {
        if (statsErr.response?.status === 403 && statsErr.response?.data?.upgrade) {
          setAnalyticsBlocked(true);
        }
      }

      // 2. Fetch Projects for Activity & Chart
      const clientsRes = await axios.get(`http://localhost:5000/api/clients/${user.id}`);
      const clients = clientsRes.data;

      let allProjects = [];
      for (const client of clients) {
        const projectsRes = await axios.get(`http://localhost:5000/api/projects/${client.id}`);
        allProjects = [...allProjects, ...projectsRes.data.map(p => ({ ...p, clientName: client.name }))];
      }

      let allActivities = [];
      let allInvoices = [];

      await Promise.all(allProjects.map(async (p) => {
        try {
          // Fetch messages for activity
          const msgRes = await axios.get(`http://localhost:5000/api/projects/${p.id}/messages`);
          msgRes.data.forEach(msg => {
            if (msg.message.includes('New Invoice') || msg.message.includes('Payment Sent')) {
              allActivities.push({
                title: msg.message.includes('Payment Sent') ? 'Payment Received' : 'Invoice Created',
                desc: msg.message,
                time: new Date(msg.created_at),
                color: msg.message.includes('Payment Sent') ? 'bg-emerald-500' : 'bg-amber-500',
                shadow: msg.message.includes('Payment Sent') ? 'shadow-emerald-500/50' : 'shadow-amber-500/50'
              });
            }
          });

          // Add project creation activity
          allActivities.push({
            title: 'Project Created',
            desc: `${p.title} for ${p.clientName}`,
            time: new Date(p.created_at || Date.now()),
            color: 'bg-indigo-500',
            shadow: 'shadow-indigo-500/50'
          });

          // Fetch invoices for Recent Invoices panel
          const invRes = await axios.get(`http://localhost:5000/api/projects/${p.id}/invoices`);
          invRes.data.forEach(inv => {
            allInvoices.push({ ...inv, projectName: p.title, clientName: p.clientName });
          });
        } catch (e) { }
      }));

      // Sort and format activity
      allActivities.sort((a, b) => b.time - a.time);

      const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
      };

      const formattedActivities = allActivities.slice(0, 15).map(act => ({
        ...act,
        timeStr: timeAgo(act.time)
      }));

      if (formattedActivities.length === 0) {
        formattedActivities.push({
          title: 'Welcome to GridLancer',
          desc: 'Get started by creating a client and a project.',
          timeStr: 'Just now',
          color: 'bg-indigo-500',
          shadow: 'shadow-indigo-500/50'
        });
      }

      setRecentActivity(formattedActivities);

      // Sort invoices
      allInvoices.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRecentInvoices(allInvoices.slice(0, 6));

    } catch (error) {
      console.error("Error fetching dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const pollNotifications = async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${user.id}/notifications`);
      const total = res.data.total || 0;
      if (res.data.latest_project_id) {
        setLatestProjectId(res.data.latest_project_id);
      }

      if (!initializedRef.current) {
        totalClientMessagesRef.current = total;
        initializedRef.current = true;
      } else if (total > totalClientMessagesRef.current) {
        const newMsgs = total - totalClientMessagesRef.current;
        setNotifications(prev => prev + newMsgs);
        totalClientMessagesRef.current = total;
        try { notificationSound.play().catch(e => { }); } catch (e) { }
      }
    } catch (err) { }
  };

  useEffect(() => {
    if (!user?.id) return;

    fetchDashboardData();
    pollNotifications();

    // Listen to real-time events via Socket
    const handleProjectListUpdate = () => fetchDashboardData(true);
    const handleStatsUpdate = () => fetchDashboardData(true);
    const handleNotificationsUpdate = () => pollNotifications();

    socket.on("project_list_updated", handleProjectListUpdate);
    socket.on("stats_updated", handleStatsUpdate);
    socket.on("notifications_updated", handleNotificationsUpdate);

    return () => {
      socket.off("project_list_updated", handleProjectListUpdate);
      socket.off("stats_updated", handleStatsUpdate);
      socket.off("notifications_updated", handleNotificationsUpdate);
    };
  }, [user?.id]);

  return (
    <>
      {/* Real-time notification lock banner for Starter */}
      {isStarterPlan && (
        <div className="mb-4">
          <PlanLockBanner
            feature="Real-time Notifications"
            description="Upgrade to Pro to receive instant push notifications when clients message you."
            requiredPlan="Pro"
            onUpgrade={onUpgrade}
            compact
          />
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.name ? user.name.split(' ')[0] : 'Freelancer'} 👋</h2>
          <p className="text-slate-400 font-medium">Here's what's happening with your projects today.</p>
        </div>
        <div className="flex gap-4">
          {!isStarterPlan && (
            <div
              onClick={() => {
                setNotifications(0);
                if (onNotificationClick && latestProjectId) {
                  onNotificationClick(latestProjectId);
                }
              }}
              className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-700 hover:text-white transition-colors shadow-lg relative"
            >
              🔔
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-2 border-slate-950 text-white text-[10px] font-bold flex items-center justify-center animate-[bounce_1s_infinite]">
                  {notifications}
                </span>
              )}
            </div>
          )}
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 border-2 border-slate-800 cursor-pointer shadow-lg shadow-purple-500/20 flex items-center justify-center font-bold text-white overflow-hidden relative">
            {user?.image ? (
              <img src={user.image} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user?.name ? user.name.charAt(0).toUpperCase() : 'U'
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        {user?.role === 'member' ? (
          /* MEMBER VIEW — simplified stats */
          [
            { label: 'Assigned Projects', value: loading ? '...' : stats.activeProjects.toString(), color: 'text-indigo-400', icon: '📁' },
            { label: 'Active Tasks', value: loading ? '...' : (stats.pendingInvoices || 0).toString(), color: 'text-amber-400', icon: '✅' },
            { label: 'Team Role', value: 'Member', color: 'text-purple-400', icon: '👤' }
          ].map((stat, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-indigo-500/50 transition-colors cursor-pointer">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-slate-800 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="text-sm font-semibold text-slate-400 mb-2 relative z-10">{stat.label}</div>
              <div className="text-4xl font-extrabold text-white relative z-10 flex items-end gap-3">
                <span className="text-2xl mr-1">{stat.icon}</span> {stat.value}
              </div>
            </div>
          ))
        ) : analyticsBlocked || isStarterPlan ? (
          <>
            {['Total Revenue', 'Active Projects', 'Pending Invoices'].map((label, i) => (
              <div key={i} className="bg-slate-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center text-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="text-sm font-bold text-slate-500">{label}</div>
                <div className="text-xs text-indigo-400 font-bold">🔒 Analytics — Pro only</div>
                <button onClick={onUpgrade} className="mt-1 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-black hover:opacity-90 transition-all cursor-pointer">
                  Upgrade to Pro
                </button>
              </div>
            ))}
          </>
        ) : (
          [{ label: 'Total Revenue', value: loading ? '...' : `$${stats.totalRevenue.toLocaleString()}`, change: stats.totalRevenue > 0 ? '+12%' : '0%', color: 'text-emerald-400' },
           { label: 'Active Projects', value: loading ? '...' : stats.activeProjects.toString(), change: stats.activeProjects > 0 ? `+${stats.activeProjects}` : '0', color: 'text-indigo-400' },
           { label: 'Pending Invoices', value: loading ? '...' : stats.pendingInvoices.toString(), change: stats.pendingInvoices > 0 ? `+${stats.pendingInvoices}` : '0', color: 'text-rose-400' }
          ].map((stat, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-indigo-500/50 transition-colors cursor-pointer">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-slate-800 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="text-sm font-semibold text-slate-400 mb-2 relative z-10">{stat.label}</div>
              <div className="text-4xl font-extrabold text-white relative z-10 flex items-end gap-3">
                {stat.value}
                {stat.change !== '0' && stat.change !== '0%' && (
                  <span className={`text-sm font-bold ${stat.color} mb-1.5 px-2 py-1 bg-slate-950 rounded-lg`}>{stat.change}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Chart & Activity */}
      <div className="flex flex-col lg:flex-row gap-6 mt-4 flex-1 min-h-[400px]">
        {user?.role !== 'member' && (
          <div className="flex-[2] bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl flex flex-col relative overflow-hidden group hover:border-slate-700 transition-colors">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none"></div>

            <div className="flex justify-between items-center mb-8 relative z-10">
              <div className="text-white font-bold text-xl">Recent Invoices</div>
              <div className="px-4 py-2 bg-slate-800 rounded-lg text-xs font-semibold text-slate-300 shadow-inner border border-slate-700">All Time</div>
            </div>

            <div className="flex-1 relative z-10 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              {recentInvoices.length === 0 ? (
                <div className="flex h-full items-center justify-center text-slate-500 font-semibold italic">No invoices created yet.</div>
              ) : (
                recentInvoices.map((inv, i) => (
                  <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${inv.status === 'Paid' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-amber-500 shadow-amber-500/20'}`}>
                        $
                      </div>
                      <div>
                        <div className="text-white font-bold">{inv.title}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{inv.projectName} &bull; {new Date(inv.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-extrabold text-white">${parseFloat(inv.amount).toFixed(2)}</div>
                      <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase w-16 text-center ${inv.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {inv.status}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className={`${user?.role === 'member' ? 'flex-1' : 'flex-1'} bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl flex flex-col relative overflow-hidden group hover:border-slate-700 transition-colors`}>
          <div className="text-white font-bold text-xl mb-8 relative z-10">Recent Activity</div>
          <div className="space-y-8 flex-1 overflow-y-auto relative z-10 pr-2">
            <div className="absolute left-[13px] top-2 bottom-2 w-0.5 bg-slate-800 z-0"></div>
            {loading ? (
              <div className="text-slate-400 text-center mt-10">Loading activity...</div>
            ) : (
              recentActivity.map((act, i) => (
                <div key={i} className="flex gap-5 relative z-10 cursor-pointer group/item">
                  <div className={`w-7 h-7 rounded-full border-4 border-slate-900 ${act.color} flex-shrink-0 group-hover/item:scale-125 transition-transform shadow-lg ${act.shadow}`}></div>
                  <div>
                    <div className="text-base font-bold text-slate-300 group-hover/item:text-white transition-colors">{act.title}</div>
                    <div className="text-sm font-medium text-slate-400 mt-1">{act.desc}</div>
                    <div className="text-xs font-semibold text-slate-500 mt-1.5">{act.timeStr}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Overview;

