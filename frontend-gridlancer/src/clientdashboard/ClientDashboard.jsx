import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import socket from '../socket';
import ClientSettings from './ClientSettings';

import ClientOverview from './ClientOverview';
import ClientProjects from './ClientProjects';

const ClientDashboard = () => {
  const [client, setClient] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [meetingInvite, setMeetingInvite] = useState(null);

  // Ban overlay states
  const [isBanned, setIsBanned] = useState(false);
  const [banDate, setBanDate] = useState(null);
  const [unbanRequested, setUnbanRequested] = useState(false);
  const [requestSending, setRequestSending] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('gridlancer_client');
    localStorage.removeItem('gridlancer_client_token');
    navigate('/client-login');
  };

  const syncClientData = async (clientId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/clients/direct/${clientId}`);
      if (res.data.status === 'banned' || res.data.is_banned) {
        setIsBanned(true);
        setBanDate(res.data.banned_until);
        setUnbanRequested(res.data.unban_requested === 1);
        return;
      }
      setIsBanned(false);
      setClient(res.data);
      localStorage.setItem('gridlancer_client', JSON.stringify(res.data));
    } catch (err) {
      console.error("Failed to sync client data:", err);
    }
  };

  useEffect(() => {
    if (client?.id) {
      const joinClientRoom = () => {
        socket.emit("join_client", client.id);
      };

      joinClientRoom();
      socket.on("connect", joinClientRoom);

      const handleClientBanned = (data) => {
        setIsBanned(true);
        setBanDate(data?.banned_until);
        setUnbanRequested(false);
      };

      const handleClientUnbanned = () => {
        setIsBanned(false);
        syncClientData(client.id);
      };

      const handleMeetingStarted = (data) => {
        setMeetingInvite(data);
        setTimeout(() => {
          setMeetingInvite(prev => prev && prev.roomName === data.roomName ? null : prev);
        }, 120000);
      };

      socket.on("client_banned", handleClientBanned);
      socket.on("client_unbanned", handleClientUnbanned);
      socket.on("meeting_started", handleMeetingStarted);

      return () => {
        socket.off("connect", joinClientRoom);
        socket.off("client_banned", handleClientBanned);
        socket.off("client_unbanned", handleClientUnbanned);
        socket.off("meeting_started", handleMeetingStarted);
      };
    }
  }, [client?.id]);

  useEffect(() => {
    const localClient = localStorage.getItem('gridlancer_client');
    const localToken = localStorage.getItem('gridlancer_client_token');

    if (localClient && localClient !== 'undefined' && localToken) {
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${localToken}`;
        const parsed = JSON.parse(localClient);
        setClient(parsed);
        syncClientData(parsed.id);
      } catch (e) {
        navigate('/client-login');
      }
    } else {
      navigate('/client-login');
    }
  }, [navigate]);

  if (!client) return null;

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col md:flex-row overflow-hidden relative">

      {/* Mobile Header */}
      <div className="md:hidden h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 z-20 shrink-0">
        <div className="font-bold text-white text-lg flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-xs">CD</div>
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
      <div className={`fixed inset-y-0 left-0 w-64 min-h-screen border-r border-slate-800 bg-slate-900 p-6 flex flex-col gap-6 z-40 transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800 rounded-full p-1 z-50">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="flex items-center gap-3 mb-8 mt-2 md:mt-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 overflow-hidden shrink-0">
            {client.image ? (
              <img src={client.image} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-lg">{client.name ? client.name.charAt(0).toUpperCase() : 'C'}</span>
            )}
          </div>
          <div className="overflow-hidden">
            <div className="text-white font-bold text-lg truncate">Client Portal</div>
            <div className="text-slate-400 text-xs truncate">{client.name}</div>
          </div>
        </div>

        <div className="space-y-2">
          {['Overview', 'My Projects', 'Settings'].map((item, i) => (
            <div
              key={i}
              onClick={() => { setActiveTab(item); setIsSidebarOpen(false); }}
              className={`px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all ${activeTab === item ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
              {item}
            </div>
          ))}
        </div>

        <div className="mt-auto">
          <button onClick={handleLogout} className="w-full py-3 px-4 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer text-sm font-semibold text-left flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sign Out
          </button>
        </div>
      </div>

      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-10 flex flex-col z-10 overflow-y-auto custom-scrollbar">
        {activeTab === 'Overview' && <ClientOverview client={client} />}
        {activeTab === 'My Projects' && <ClientProjects client={client} />}
        {activeTab === 'Settings' && <ClientSettings client={client} onClientUpdate={setClient} />}
      </div>

      {/* BAN OVERLAY MODAL */}
      {isBanned && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-red-500/20 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative">
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/10">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            
            <h2 className="text-2xl font-black text-white">Account Suspended</h2>
            <p className="text-xs text-slate-400 mt-2">
              Your client portal has been temporarily deactivated by the administration.
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
                      await axios.post(`http://localhost:5000/api/clients/${client.id}/request-unban`);
                      setUnbanRequested(true);
                    } catch (e) {
                      console.error(e);
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
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
};

export default ClientDashboard;
