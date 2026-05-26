import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import socket from '../socket';

const notificationSound = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU" + 'A'.repeat(500));

const ClientOverview = ({ client }) => {
  const [stats, setStats] = useState({ activeProjects: 0, completedProjects: 0, totalPaid: 0 });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const previousInvoiceCount = useRef(0);

  const fetchStats = async (isBackground = false) => {
    try {
      if (!isBackground) setIsLoading(true);
      // Using the same projects endpoint, then calculating stats client-side
      const res = await axios.get(`http://localhost:5000/api/client/projects?t=${Date.now()}`);
      const projects = res.data;

      const activeCount = projects.filter(p => p.status !== 'Completed').length;
      const completedCount = projects.length - activeCount;

      let totalPaid = 0;
      try {
        const allInvoices = await Promise.all(projects.map(async (p) => {
          const invRes = await axios.get(`http://localhost:5000/api/projects/${p.id}/invoices?t=${Date.now()}`);
          return invRes.data.map(inv => ({ ...inv, projectName: p.title }));
        }));
        const flatInvoices = allInvoices.flat();

        if (previousInvoiceCount.current > 0 && flatInvoices.length > previousInvoiceCount.current) {
          notificationSound.play().catch(e => console.log('Audio play prevented', e));
        }
        previousInvoiceCount.current = flatInvoices.length;

        totalPaid = flatInvoices.filter(i => i.status === 'Paid').reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

        flatInvoices.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setRecentInvoices(flatInvoices.slice(0, 5));
      } catch (err) { console.error('Error calculating total paid', err); }

      setStats({
        activeProjects: activeCount,
        completedProjects: completedCount,
        totalPaid: parseFloat(totalPaid).toFixed(2)
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (client?.id) {
      fetchStats();
      
      const handleUpdate = () => fetchStats(true);
      socket.on("project_list_updated", handleUpdate);
      socket.on("stats_updated", handleUpdate);

      return () => {
        socket.off("project_list_updated", handleUpdate);
        socket.off("stats_updated", handleUpdate);
      };
    }
  }, [client?.id]);

  return (
    <div className="animate-[fadeIn_0.3s_ease-out] flex-1 flex flex-col h-full min-h-0">
      <h2 className="text-3xl font-bold text-white mb-2 flex-shrink-0">Welcome back, {client.name} 👋</h2>
      <p className="text-slate-400 font-medium mb-8 flex-shrink-0">Here is an overview of your projects with your freelancer.</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 flex-shrink-0">
        {[
          { title: 'Active Projects', value: stats.activeProjects, icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'indigo' },
          { title: 'Completed', value: stats.completedProjects, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'emerald' },
          { title: 'Total Paid', value: `$${stats.totalPaid}`, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'purple' }
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-slate-700 transition-colors shadow-xl">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${stat.color}-500/10 blur-[40px] rounded-full group-hover:scale-150 transition-transform duration-500`}></div>
            <div className="flex items-center gap-4 relative z-10 mb-4">
              <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-500/10 flex items-center justify-center text-${stat.color}-400 shadow-lg shadow-${stat.color}-500/20`}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} /></svg>
              </div>
              <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.title}</div>
            </div>
            <div className="text-4xl font-extrabold text-white relative z-10">{isLoading ? '-' : stat.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-6 flex-shrink-0">
            <h3 className="text-xl font-bold text-white">Recent Invoices</h3>
          </div>

          <div className="overflow-y-auto overflow-x-hidden custom-scrollbar pr-2 flex-1 min-h-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="pb-4 font-bold">Invoice Item</th>
                  <th className="pb-4 font-bold">Project</th>
                  <th className="pb-4 font-bold">Date</th>
                  <th className="pb-4 font-bold text-right">Amount</th>
                  <th className="pb-4 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-500 italic">No invoices found.</td>
                  </tr>
                ) : (
                  recentInvoices.map((inv, i) => (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 text-white font-bold">{inv.title}</td>
                      <td className="py-4 text-slate-400 font-medium">{inv.projectName}</td>
                      <td className="py-4 text-slate-400 text-sm">{new Date(inv.created_at).toLocaleDateString()}</td>
                      <td className="py-4 text-white font-extrabold text-right">${parseFloat(inv.amount).toFixed(2)}</td>
                      <td className="py-4 text-right">
                        <span className={`inline-block px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase ${inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
};

export default ClientOverview;
