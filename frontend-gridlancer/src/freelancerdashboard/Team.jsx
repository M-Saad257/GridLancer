import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Team = ({ user, planLimits, onUpgrade }) => {
  const [teamData, setTeamData] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'member'
  });

  const fetchTeamDetails = async (isBackground = false) => {
    if (!user?.id) return;
    try {
      if (!isBackground) setIsLoading(true);
      const res = await axios.get(`http://localhost:5000/api/teams/members/${user.id}`);
      if (res.data && res.data.team) {
        setTeamData(res.data.team);
        setMembers(res.data.members || []);
      } else {
        setTeamData(null);
        setMembers([]);
      }
    } catch (err) {
      console.error("Error fetching team data:", err);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamDetails();
  }, [user?.id]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamNameInput.trim()) return;
    setIsCreatingTeam(true);
    try {
      const res = await axios.post('http://localhost:5000/api/teams', {
        ownerId: user.id,
        name: teamNameInput
      });
      setTeamData(res.data.team);
      await fetchTeamDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create team');
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setInviteForm({ ...inviteForm, password: pwd });
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    setIsInviting(true);

    try {
      await axios.post('http://localhost:5000/api/teams/invite', {
        teamId: teamData.id,
        name: inviteForm.name,
        email: inviteForm.email,
        password: inviteForm.password,
        role: inviteForm.role
      });

      setInviteSuccess(`Successfully invited ${inviteForm.name}! Credentials created.`);
      setInviteForm({ name: '', email: '', password: '', role: 'member' });
      await fetchTeamDetails(true);
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Failed to send invite');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (memberId === user.id) return;
    if (!window.confirm(`Are you sure you want to remove ${memberName} from the team?`)) return;

    try {
      await axios.delete(`http://localhost:5000/api/teams/members/${memberId}`);
      setMembers(members.filter(m => m.id !== memberId));
    } catch (err) {
      alert('Failed to remove team member.');
    }
  };

  const canManageTeam = user.role === 'owner' || user.role === 'admin';

  if (isLoading) {
    return <div className="text-slate-400 animate-pulse">Loading team data...</div>;
  }

  // 1. If team doesn't exist (and owner/admin visits)
  if (!teamData) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-650/10 blur-[60px] rounded-full pointer-events-none"></div>
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/20">
            <span className="text-2xl">👥</span>
          </div>

          <h3 className="text-2xl font-black text-white mb-2">Create Your Agency Team</h3>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Expand GridLancer from a solo tool to a collaborative agency platform. Build a workspace for admins and developers.
          </p>

          {user.role === 'owner' ? (
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <input
                required
                type="text"
                value={teamNameInput}
                onChange={e => setTeamNameInput(e.target.value)}
                placeholder="Team Name (e.g. Pixel Forge)"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-center text-sm font-semibold"
              />
              <button
                type="submit"
                disabled={isCreatingTeam}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-650 hover:from-indigo-450 hover:to-purple-600 text-white font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-500/25 text-sm"
              >
                {isCreatingTeam ? 'Creating Workspace...' : 'Create Team Workspace'}
              </button>
            </form>
          ) : (
            <div className="text-sm text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
              No team exists yet. Please ask the Agency Owner to set up the team workspace.
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Active Team Dashboard
  return (
    <div className="space-y-8">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-4">
        <div>
          <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-[10px] font-black uppercase rounded-lg tracking-wider">
            {teamData.name} Workspace
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-2 mb-1">Agency Team</h2>
          <p className="text-slate-400 font-medium">Collaborate, assign client tasks, and manage roles.</p>
        </div>
        {canManageTeam && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white rounded-xl font-bold text-sm transition-all transform hover:-translate-y-0.5 shadow-lg shadow-indigo-500/25 flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Invite Member
          </button>
        )}
      </div>

      {/* Members Grid / List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/40 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Team Members ({members.length})</h3>
          <span className="text-xs text-slate-500 font-medium">All accounts inherit Agency Plan limits</span>
        </div>

        <div className="divide-y divide-slate-850">
          {members.map((member) => (
            <div key={member.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-850/20 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center text-white font-bold text-lg">
                  {member.image ? (
                    <img src={member.image} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    member.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{member.name}</span>
                    {member.id === user.id && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 text-[8px] font-extrabold uppercase">You</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{member.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Role</span>
                  <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wide border mt-1 ${
                    member.role === 'owner' ? 'bg-purple-550/15 border-purple-500/30 text-purple-300' :
                    member.role === 'admin' ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300' :
                    'bg-slate-800 border-slate-750 text-slate-450'
                  }`}>
                    {member.role}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status Indicator */}
                  <div className="flex flex-col items-end sm:items-center">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider hidden sm:inline">Status</span>
                    <span className="flex items-center gap-1.5 mt-1">
                      <span className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-emerald-500 shadow shadow-emerald-500/50' : 'bg-red-500'}`}></span>
                      <span className="text-xs text-slate-400 font-bold capitalize">{member.status}</span>
                    </span>
                  </div>

                  {/* Remove Button */}
                  {canManageTeam && member.role !== 'owner' && member.id !== user.id && (
                    <button
                      onClick={() => handleRemoveMember(member.id, member.name)}
                      className="p-2 bg-slate-850 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/20 text-slate-550 hover:text-rose-450 rounded-xl transition-all cursor-pointer ml-3"
                      title="Remove from Team"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* INVITE MEMBER MODAL */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => { setIsInviteModalOpen(false); setInviteError(''); setInviteSuccess(''); }}></div>
          
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-fadeIn flex flex-col">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-xl font-bold text-white">Invite Team Member</h2>
              <button onClick={() => { setIsInviteModalOpen(false); setInviteError(''); setInviteSuccess(''); }} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="p-6 space-y-5">
              {inviteError && <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs font-bold rounded-xl">{inviteError}</div>}
              {inviteSuccess && <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-xs font-bold rounded-xl">{inviteSuccess}</div>}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  required
                  type="text"
                  value={inviteForm.name}
                  onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })}
                  placeholder="e.g. Hamza Ali"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  required
                  type="email"
                  value={inviteForm.email}
                  onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="hamza@agency.com"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Login Password</label>
                <div className="flex gap-2">
                  <input
                    required
                    type="text"
                    value={inviteForm.password}
                    onChange={e => setInviteForm({ ...inviteForm, password: e.target.value })}
                    placeholder="Enter password or generate suggestions"
                    className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  />
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="px-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-indigo-400 font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">System Role</label>
                <select
                  value={inviteForm.role}
                  onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm [color-scheme:dark]"
                >
                  <option value="member">Member (Access assigned projects only)</option>
                  <option value="admin">Admin (Manage clients, projects, team members)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsInviteModalOpen(false); setInviteError(''); setInviteSuccess(''); }}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-650 hover:from-indigo-450 hover:to-purple-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 text-sm cursor-pointer disabled:opacity-50"
                >
                  {isInviting ? 'Creating...' : 'Invite & Provision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
