import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socket from '../socket';
import NewProjectModal from './NewProjectModal';
import ProjectDetail from './ProjectDetail';

const Projects = ({ user, pendingProjectId, onClearPending, planLimits, onUpgrade, onProjectChange }) => {
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', desc: '', type: 'success' });

  const triggerToast = (title, desc, type = 'success') => {
    setToastMessage({ title, desc, type });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Initial fetch
  useEffect(() => {
    const fetchProjects = async (isBackground = false) => {
      if (!user?.id) return;
      try {
        if (!isBackground) setIsLoading(true);
        const clientsRes = await axios.get(`http://localhost:5000/api/clients/${user.id}?t=${Date.now()}`);
        const clients = clientsRes.data;

        let allProjects = [];
        for (const client of clients) {
          const projectsRes = await axios.get(`http://localhost:5000/api/projects/${client.id}?t=${Date.now()}`);

          const projectsWithStats = await Promise.all(projectsRes.data.map(async (p) => {
            try {
              const invRes = await axios.get(`http://localhost:5000/api/projects/${p.id}/invoices?t=${Date.now()}`);
              const paid = invRes.data.filter(i => i.status === 'Paid').reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
              const unpaidCount = invRes.data.filter(i => i.status !== 'Paid').length;
              return {
                ...p,
                clientId: client.id,
                clientName: client.name,
                clientEmail: client.email,
                progress: p.progress || 0,
                status: p.status || 'Pending',
                color: 'from-indigo-500 to-purple-500', // Default color
                totalPaid: paid,
                unpaidCount
              };
            } catch (e) {
              return {
                ...p,
                clientId: client.id,
                clientName: client.name,
                clientEmail: client.email,
                progress: p.progress || 0,
                status: p.status || 'Pending',
                color: 'from-indigo-500 to-purple-500',
                totalPaid: 0,
                unpaidCount: 0
              };
            }
          }));

          allProjects = [...allProjects, ...projectsWithStats];
        }

        // Sort by newest first
        allProjects.sort((a, b) => b.id - a.id);
        setProjects(allProjects);
      } catch (err) {
        console.error(err);
      } finally {
        if (!isBackground) setIsLoading(false);
      }
    };

    fetchProjects();
    const handleUpdate = () => fetchProjects(true);
    socket.on("project_list_updated", handleUpdate);
    return () => {
      socket.off("project_list_updated", handleUpdate);
    };
  }, [user]);

  // Handle auto-opening a specific project via notifications
  useEffect(() => {
    if (pendingProjectId && projects.length > 0) {
      const proj = projects.find(p => p.id === pendingProjectId);
      if (proj) {
        setSelectedProject(proj);
        if (onClearPending) onClearPending();
      }
    }
  }, [pendingProjectId, projects, onClearPending]);

  const handleProjectCreated = (newProject) => {
    setProjects([newProject, ...projects]);
  };

  const handleDeleteProject = async (e, projectId, projectTitle) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${projectTitle}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/projects/${projectId}`);
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (err) {
      console.error('Failed to delete project', err);
      triggerToast('Error', 'Failed to delete project', 'error');
    }
  };

  if (selectedProject) {
    const handleUpdate = (updatedProject) => {
      setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
      setSelectedProject(updatedProject);
    };
    return <ProjectDetail project={selectedProject} onBack={() => setSelectedProject(null)} user={user} onUpdateProject={handleUpdate} planLimits={planLimits} onUpgrade={onUpgrade} />;
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-0 mb-6 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Projects</h2>
          <p className="text-sm sm:text-base text-slate-400 font-medium">Manage and track all your active client projects.</p>
        </div>
        {user?.role !== 'member' && (
          <button onClick={() => setIsModalOpen(true)} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all transform hover:-translate-y-0.5 shadow-lg shadow-indigo-500/25 flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center sm:justify-start">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Project
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-slate-400 animate-pulse">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 border border-slate-800 border-dashed rounded-3xl">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4"><svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg></div>
          <h3 className="text-xl font-bold text-white mb-2">No projects yet</h3>
          <p className="text-slate-400 mb-6">Create your first project to get started.</p>
          <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm transition-colors cursor-pointer">Create Project</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <div key={proj.id} onClick={() => setSelectedProject(proj)} className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl group hover:border-indigo-500/50 transition-all cursor-pointer relative overflow-hidden flex flex-col min-h-[200px] sm:min-h-[220px]">
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${proj.color || 'from-indigo-500 to-purple-500'}`}></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-[40px] rounded-full group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>

              {/* Top Row: Client & Actions */}
              <div className="flex justify-between items-start mb-3 relative z-10">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest truncate pr-4">{proj.clientName || proj.client || 'Client'}</div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${proj.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
                      proj.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-400' :
                        'bg-amber-500/10 text-amber-400'
                    }`}>
                    {proj.status}
                  </div>
                  <div className="flex gap-1 ml-2">

                    {user?.role !== 'member' && (
                      <button
                        onClick={(e) => handleDeleteProject(e, proj.id, proj.title || proj.name)}
                        className="text-slate-600 hover:text-rose-500 transition-colors p-1 bg-slate-900 rounded-md border border-slate-800"
                        title="Delete Project"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Title Area */}
              <h3 className="text-xl font-bold text-white mb-6 relative z-10 group-hover:text-indigo-400 transition-colors line-clamp-2">{proj.title || proj.name || 'Untitled Project'}</h3>

              {/* Meta & Financials */}
              <div className="flex justify-between items-end mb-8 relative z-10 mt-auto">
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {proj.deadline ? new Date(proj.deadline).toLocaleDateString() : 'No Deadline'}
                  </div>
                </div>

                {(proj.totalPaid > 0 || proj.unpaidCount > 0) && (
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-white">
                      ${parseFloat(proj.totalPaid || 0).toFixed(2)}
                    </div>
                    {proj.unpaidCount > 0 && (
                      <div className="text-[10px] font-bold text-rose-400 mt-1 uppercase tracking-wider bg-rose-500/10 inline-block px-2 py-0.5 rounded-md border border-rose-500/20">
                        {proj.unpaidCount} unpaid
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="relative z-10">
                <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
                  <span>Progress</span>
                  <span className="text-white">{proj.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${proj.color || 'from-indigo-500 to-purple-500'}`} style={{ width: `${proj.progress}%` }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
        onProjectCreated={handleProjectCreated}
      />

      {/* Toast Notification */}
      <div className={`fixed bottom-4 right-4 sm:bottom-8 sm:right-8 left-4 sm:left-auto z-50 transform transition-all duration-500 ease-out ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
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
    </>
  );
};

export default Projects;
