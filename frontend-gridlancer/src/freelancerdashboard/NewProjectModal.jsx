import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NewProjectModal = ({ isOpen, onClose, user, onProjectCreated, planLimits }) => {
  const [formData, setFormData] = useState({
    projectName: '',
    clientName: '',
    clientEmail: '',
    clientPassword: '',
    deadline: '',
    description: ''
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [showMemberSelector, setShowMemberSelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user.plan === 'Agency' && isOpen) {
      axios.get(`https://gridlancer-production.up.railway.app/api/teams/members/${user.id}`)
        .then(res => {
          if (res.data && res.data.members) {
            const assignable = res.data.members.filter(m => m.role !== 'owner');
            setTeamMembers(assignable);
          }
        })
        .catch(console.error);
    }
  }, [user.id, isOpen]);

  if (!isOpen) return null;

  const validateField = (name, value) => {
    const errors = { ...formErrors };
    switch (name) {
      case 'clientEmail': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          errors.clientEmail = 'Please enter a valid email address';
        } else {
          delete errors.clientEmail;
        }
        break;
      }
      case 'clientName':
        if (value && value.trim().length < 2) {
          errors.clientName = 'Name must be at least 2 characters';
        } else {
          delete errors.clientName;
        }
        break;
      case 'clientPassword':
        if (value && value.length < 4) {
          errors.clientPassword = 'Password must be at least 4 characters';
        } else {
          delete errors.clientPassword;
        }
        break;
      case 'projectName':
        if (value && value.trim().length < 2) {
          errors.projectName = 'Project name must be at least 2 characters';
        } else {
          delete errors.projectName;
        }
        break;
      default:
        break;
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFieldChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    // Clear error on type
    if (formErrors[name]) {
      const errors = { ...formErrors };
      delete errors[name];
      setFormErrors(errors);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Check plan limits dynamically using planLimits
    const maxClients = planLimits?.limits?.maxClients || 3;
    const maxProjects = planLimits?.limits?.maxProjects || 3;
    const currentPlanName = planLimits?.plan || user.plan || 'Starter';

    try {
      const clientsRes = await axios.get(`https://gridlancer-production.up.railway.app/api/clients/${user.id}`);
      const currentClients = clientsRes.data;

      // 1. Client limit check
      const clientExists = currentClients.some(c => c.email.toLowerCase() === formData.clientEmail.toLowerCase());
      if (!clientExists && currentClients.length >= maxClients) {
        setError(`${currentPlanName} plan limit reached: You can have a maximum of ${maxClients} client(s). Please upgrade your plan to add more!`);
        setIsSubmitting(false);
        return;
      }

      // 2. Project limit check
      let count = 0;
      for (const cl of currentClients) {
        const projectsRes = await axios.get(`https://gridlancer-production.up.railway.app/api/projects/${cl.id}`);
        count += projectsRes.data.length;
      }
      if (count >= maxProjects) {
        setError(`${currentPlanName} plan limit reached: You can create a maximum of ${maxProjects} project(s). Please upgrade your plan to build more!`);
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      console.error(err);
      setError("Error validating subscription plan limits. Please try again.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Step 1: Create the client
      const clientRes = await axios.post('https://gridlancer-production.up.railway.app/api/clients', {
        user_id: user.id,
        name: formData.clientName,
        email: formData.clientEmail,
        password: formData.clientPassword
      });

      const clientId = clientRes.data.clientId;

      // Step 2: Create the project
      const projRes = await axios.post('https://gridlancer-production.up.railway.app/api/projects', {
        user_id: user.id,
        client_id: clientId,
        title: formData.projectName,
        description: formData.description,
        deadline: formData.deadline,
        assignedTo: assignedMembers
      });

      const newProject = {
        id: projRes.data.projectId,
        name: formData.projectName,
        title: formData.projectName,
        client: formData.clientName,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        description: formData.description,
        deadline: formData.deadline,
        status: 'Pending',
        progress: 0,
        color: 'from-blue-500 to-cyan-500'
      };

      onProjectCreated(newProject);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create project and client.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed mt-10 inset-0 z-10 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-slate-900 z-100000000000000 border border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 sm:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Create New Project</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {error && <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-semibold">{error}</div>}

          <form id="new-project-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Project Details</h3>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Project Name</label>
                <input required type="text" value={formData.projectName} onChange={e => setFormData({ ...formData, projectName: e.target.value })} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" placeholder="e.g. E-commerce Website Redesign" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1.5">
                    Deadline
                  </label>
                  <input required type="date" value={formData.deadline} min={today} onChange={e => setFormData({ ...formData, deadline: e.target.value })} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white
                  focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors [color-scheme:dark]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                <textarea required rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none" placeholder="Briefly describe the project goals..."></textarea>
              </div>
            </div>

            {user.plan === 'Agency' && teamMembers.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Team Assignment</h3>
                  <button
                    type="button"
                    onClick={() => setShowMemberSelector(!showMemberSelector)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-indigo-400 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {showMemberSelector ? 'Hide Selector' : 'Add Team Members'}
                  </button>
                </div>

                {showMemberSelector && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    <p className="text-xs text-slate-500 font-medium">Select which team members will have access to this project.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {teamMembers.map(member => {
                        const isChecked = assignedMembers.includes(member.id);
                        return (
                          <label key={member.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isChecked ? 'bg-indigo-500/10 border-indigo-500/50 text-white font-bold' : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-455'}`}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setAssignedMembers(assignedMembers.filter(id => id !== member.id));
                                } else {
                                  setAssignedMembers([...assignedMembers, member.id]);
                                }
                              }}
                              className="accent-indigo-500 w-4 h-4"
                            />
                            <div>
                              <div className="text-xs">{member.name}</div>
                              <div className="text-[10px] text-slate-500 font-normal uppercase">{member.role}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {assignedMembers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950/40 rounded-lg border border-slate-850">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider self-center mr-1">Assigned:</span>
                    {assignedMembers.map(id => {
                      const m = teamMembers.find(member => member.id === id);
                      if (!m) return null;
                      return (
                        <span key={id} className="px-2.5 py-1 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-bold text-[10px] rounded-lg flex items-center gap-1.5">
                          {m.name}
                          <button
                            type="button"
                            onClick={() => setAssignedMembers(assignedMembers.filter(uid => uid !== id))}
                            className="text-indigo-400 hover:text-white font-bold"
                          >
                            &times;
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="w-full h-px bg-slate-800"></div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Client Access</h3>
              <p className="text-xs text-slate-400 font-medium">We will automatically create a secure client dashboard using these details.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Client Name</label>
                  <input required type="text" value={formData.clientName} onChange={e => handleFieldChange('clientName', e.target.value)} onBlur={e => validateField('clientName', e.target.value)} className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-white focus:outline-none focus:ring-1 transition-colors ${formErrors.clientName ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500'}`} placeholder="e.g. Acme Corp" />
                  {formErrors.clientName && <p className="text-rose-400 text-xs mt-1 font-medium">{formErrors.clientName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Client Email</label>
                  <input required type="email" value={formData.clientEmail} onChange={e => handleFieldChange('clientEmail', e.target.value)} onBlur={e => validateField('clientEmail', e.target.value)} className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-white focus:outline-none focus:ring-1 transition-colors ${formErrors.clientEmail ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500'}`} placeholder="client@acme.com" />
                  {formErrors.clientEmail && <p className="text-rose-400 text-xs mt-1 font-medium">{formErrors.clientEmail}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Client Password</label>
                  <input required type="password" value={formData.clientPassword} onChange={e => handleFieldChange('clientPassword', e.target.value)} onBlur={e => validateField('clientPassword', e.target.value)} className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-white focus:outline-none focus:ring-1 transition-colors ${formErrors.clientPassword ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500'}`} placeholder="••••••••" />
                  {formErrors.clientPassword && <p className="text-rose-400 text-xs mt-1 font-medium">{formErrors.clientPassword}</p>}
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-900/50 flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button type="button" onClick={onClose} className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer">
            Cancel
          </button>
          <button type="submit" form="new-project-form" disabled={isSubmitting || Object.keys(formErrors).length > 0} className="w-full sm:w-auto justify-center bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2">
            {isSubmitting ? 'Creating...' : 'Create Project & Client'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewProjectModal;
