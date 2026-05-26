import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socket from '../socket';
import ClientProjectDetail from './ClientProjectDetail';

const ClientProjects = ({ client }) => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    const fetchProjects = async (isBackground = false) => {
      try {
        if (!isBackground) setIsLoading(true);
        const res = await axios.get(`http://localhost:5000/api/client/projects?t=${Date.now()}`);
        const projectsData = res.data;

        const projectsWithStats = await Promise.all(projectsData.map(async (p) => {
          try {
            const invRes = await axios.get(`http://localhost:5000/api/projects/${p.id}/invoices?t=${Date.now()}`);
            const paid = invRes.data.filter(i => i.status === 'Paid').reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
            const unpaidCount = invRes.data.filter(i => i.status !== 'Paid').length;
            return { ...p, status: p.status || 'Pending', progress: p.progress || 0, totalPaid: paid, unpaidCount };
          } catch (e) {
            return { ...p, status: p.status || 'Pending', progress: p.progress || 0, totalPaid: 0, unpaidCount: 0 };
          }
        }));

        setProjects(projectsWithStats);
      } catch (err) {
        console.error(err);
      } finally {
        if (!isBackground) setIsLoading(false);
      }
    };

    if (client?.id) {
      fetchProjects();
      const handleUpdate = () => fetchProjects(true);
      socket.on("project_list_updated", handleUpdate);
      return () => {
        socket.off("project_list_updated", handleUpdate);
      };
    }
  }, [client?.id]);

  if (selectedProject) {
    const updatedSelectedProject = projects.find(p => p.id === selectedProject.id) || selectedProject;
    return <ClientProjectDetail project={{ ...updatedSelectedProject, status: updatedSelectedProject.status || 'Pending', progress: updatedSelectedProject.progress || 0 }} onBack={() => setSelectedProject(null)} client={client} />;
  }

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">My Projects</h2>
          <p className="text-slate-400 font-medium">Track your active projects and communicate with your freelancer.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : projects.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center shadow-xl">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">No active projects</h3>
          <p className="text-slate-400 max-w-md mx-auto">Your freelancer hasn't assigned any projects to you yet. Once they do, they will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <div key={project.id} onClick={() => setSelectedProject(project)} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl group hover:border-indigo-500/50 transition-all cursor-pointer relative overflow-hidden flex flex-col min-h-[220px]">
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${project.color || 'from-indigo-500 to-purple-500'}`}></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-[40px] rounded-full group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
              
              {/* Top Row: Actions */}
              <div className="flex justify-end items-start mb-3 relative z-10">
                <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  project.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
                  project.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-400' :
                  'bg-amber-500/10 text-amber-400'
                }`}>
                  {project.status}
                </div>
              </div>
              
              {/* Title Area */}
              <h3 className="text-xl font-bold text-white mb-6 relative z-10 group-hover:text-indigo-400 transition-colors line-clamp-2">{project.title || project.name || 'Untitled Project'}</h3>
              
              {/* Meta & Financials */}
              <div className="flex justify-between items-end mb-8 relative z-10 mt-auto">
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No Deadline'}
                  </div>
                </div>
                
                {(project.totalPaid > 0 || project.unpaidCount > 0) && (
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-white">
                      ${parseFloat(project.totalPaid || 0).toFixed(2)}
                    </div>
                    {project.unpaidCount > 0 && (
                      <div className="text-[10px] font-bold text-rose-400 mt-1 uppercase tracking-wider bg-rose-500/10 inline-block px-2 py-0.5 rounded-md border border-rose-500/20">
                        {project.unpaidCount} unpaid
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Progress Bar */}
              <div className="relative z-10">
                <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
                  <span>Progress</span>
                  <span className="text-white">{project.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${project.color || 'from-indigo-500 to-purple-500'}`} style={{ width: `${project.progress}%` }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientProjects;
