import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Clients = ({ user }) => {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', desc: '', type: 'success' });

  useEffect(() => {
    const fetchClientsAndProjects = async () => {
      if (!user?.id) return;
      try {
        setIsLoading(true);
        const clientsRes = await axios.get(`http://localhost:5000/api/clients/${user.id}`);
        const clientsData = clientsRes.data;
        
        const clientsWithProjects = await Promise.all(clientsData.map(async (client) => {
          const projectsRes = await axios.get(`http://localhost:5000/api/projects/${client.id}`);
          return {
            ...client,
            projects: projectsRes.data
          };
        }));
        
        setClients(clientsWithProjects);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClientsAndProjects();
  }, [user]);

  const handleDeleteClient = async (clientId, clientName) => {
    if (!window.confirm(`Are you sure you want to delete ${clientName}? This will also delete all their projects and cannot be undone.`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/clients/${clientId}`);
      setClients(clients.filter(c => c.id !== clientId));
      setToastMessage({
        title: 'Client Deleted',
        desc: `Successfully deleted client ${clientName}.`,
        type: 'success'
      });
      setShowToast(true);
    } catch (err) {
      console.error('Failed to delete client', err);
      setToastMessage({
        title: 'Delete Failed',
        desc: 'Failed to delete client.',
        type: 'error'
      });
      setShowToast(true);
    } finally {
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  const handleDeleteProject = async (e, clientId, projectId, projectTitle) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${projectTitle}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/projects/${projectId}`);
      setClients(clients.map(c => {
        if (c.id === clientId) {
          return { ...c, projects: c.projects.filter(p => p.id !== projectId) };
        }
        return c;
      }));
      setToastMessage({
        title: 'Project Deleted',
        desc: `Successfully deleted project "${projectTitle}".`,
        type: 'success'
      });
      setShowToast(true);
    } catch (err) {
      console.error('Failed to delete project', err);
      setToastMessage({
        title: 'Delete Failed',
        desc: 'Failed to delete project.',
        type: 'error'
      });
      setShowToast(true);
    } finally {
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <div className="flex justify-between items-end mb-6 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Clients</h2>
          <p className="text-sm sm:text-base text-slate-400 font-medium">Manage your client relationships and their associated projects.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-slate-400 animate-pulse">Loading clients...</div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 border border-slate-800 border-dashed rounded-3xl">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4"><svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div>
          <h3 className="text-xl font-bold text-white mb-2">No clients yet</h3>
          <p className="text-slate-400 mb-6">Create a new project to add your first client.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div key={client.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col relative overflow-hidden group hover:border-indigo-500/50 transition-all">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
              
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id, client.name); }}
                className="absolute top-4 right-4 text-slate-500 hover:text-rose-500 transition-colors cursor-pointer"
                title="Delete Client"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white text-lg border border-slate-700 shadow-inner">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{client.name}</h3>
                  <div className="text-sm text-slate-400">{client.email}</div>
                </div>
              </div>
              
              <div className="mt-auto">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>Projects ({client.projects.length})</span>
                </div>
                
                <div className="space-y-3">
                  {client.projects.length === 0 ? (
                    <div className="text-sm text-slate-500 italic">No projects assigned.</div>
                  ) : (
                    client.projects.map(proj => (
                      <div key={proj.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center group/proj hover:border-slate-700 transition-colors">
                        <div className="flex flex-col min-w-0 pr-2">
                          <div className="font-semibold text-sm text-slate-300 group-hover/proj:text-white truncate">{proj.title}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{proj.deadline ? new Date(proj.deadline).toLocaleDateString() : 'No deadline'}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            proj.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
                            proj.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-400' :
                            'bg-amber-500/10 text-amber-400'
                          }`}>
                            {proj.status || 'Pending'}
                          </div>
                          <button 
                            onClick={(e) => handleDeleteProject(e, client.id, proj.id, proj.title)}
                            className="text-slate-500 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                            title="Delete Project"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Toast Notification */}
      <div className={`fixed bottom-6 right-6 left-6 sm:left-auto sm:w-96 z-[9999] transform transition-all duration-500 ease-out ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
        <div className={`bg-slate-900/95 backdrop-blur-md border ${toastMessage.type === 'success' ? 'border-emerald-500/30 shadow-emerald-500/10' : 'border-rose-500/30 shadow-rose-500/10'} shadow-2xl rounded-2xl p-4 pr-10 flex items-start gap-3.5 relative`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${toastMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-550/10 text-rose-450'}`}>
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

export default Clients;
