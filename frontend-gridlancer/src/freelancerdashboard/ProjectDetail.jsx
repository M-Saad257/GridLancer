import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import socket from '../socket';
import PlanLockBanner from '../components/PlanLockBanner';

// Tiny base64 notification sound (a subtle pop/ping)
const notificationSound = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU" + 'A'.repeat(500));

const ProjectDetail = ({ project, onBack, user, onUpdateProject, planLimits, onUpgrade }) => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', desc: '', type: 'success' });
  const [activeTab, setActiveTab] = useState('Overview');
  const [parentTab, setParentTab] = useState('Workspace');

  const tabGroups = {
    'Workspace': ['Overview', 'Tasks', 'Files & Assets'],
    'Finances': ['Milestones', 'Time Tracking', ...(user?.role !== 'member' ? ['Invoices'] : [])],
    'Agreements & Setup': ['Contracts', 'Activity Feed', ...(user?.role !== 'member' ? ['Settings'] : [])]
  };

  useEffect(() => {
    const foundGroup = Object.keys(tabGroups).find(group => tabGroups[group].includes(activeTab));
    if (foundGroup && foundGroup !== parentTab) {
      setParentTab(foundGroup);
    }
  }, [activeTab]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isClientTyping, setIsClientTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const previousMessageCount = useRef(0);
  const lastTypingTimeRef = useRef(0);

  // Tasks state
  const [tasks, setTasks] = useState([]);

  // Files state
  
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Invoices state
  const [invoices, setInvoices] = useState([]);
  const [newInvoiceTitle, setNewInvoiceTitle] = useState('');
  const [newInvoiceAmount, setNewInvoiceAmount] = useState('');
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);

  // Team assignments state
  const [teamMembers, setTeamMembers] = useState([]);
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  // Settings state
  const [settingsForm, setSettingsForm] = useState({
    title: project.title || project.name || '',
    description: project.description || '',
    deadline: project.deadline ? project.deadline.split('T')[0] : ''
  });

  // New features states
  const [milestones, setMilestones] = useState([]);
  const [isMilestoneFormOpen, setIsMilestoneFormOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: '', description: '', amount: '', deadline: '' });

  const [contracts, setContracts] = useState([]);
  const [isContractFormOpen, setIsContractFormOpen] = useState(false);
  const [newContract, setNewContract] = useState({ title: '', scope: '', terms: '', payment_terms: '' });

  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeTimerId, setActiveTimerId] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timeLogs, setTimeLogs] = useState([]);
  const [isManualTimeFormOpen, setIsManualTimeFormOpen] = useState(false);
  const [manualTime, setManualTime] = useState({ description: '', hours: '', minutes: '' });

  const [activities, setActivities] = useState([]);

  // Fetch milestones
  useEffect(() => {
    const fetchMilestones = () => {
      axios.get(`http://localhost:5000/api/milestones/project/${project.id}?t=${Date.now()}`)
        .then(res => setMilestones(res.data))
        .catch(console.error);
    };

    if (activeTab === 'Milestones') {
      fetchMilestones();
      socket.on("project_details_updated", fetchMilestones);
      return () => {
        socket.off("project_details_updated", fetchMilestones);
      };
    }
  }, [activeTab, project.id]);

  // Fetch contracts
  useEffect(() => {
    const fetchContracts = () => {
      axios.get(`http://localhost:5000/api/contracts/project/${project.id}?t=${Date.now()}`)
        .then(res => setContracts(res.data))
        .catch(console.error);
    };

    if (activeTab === 'Contracts') {
      fetchContracts();
      socket.on("project_details_updated", fetchContracts);
      return () => {
        socket.off("project_details_updated", fetchContracts);
      };
    }
  }, [activeTab, project.id]);

  // Fetch time logs & search active timers
  useEffect(() => {
    const fetchTimeLogs = () => {
      axios.get(`http://localhost:5000/api/time-entries/project/${project.id}?t=${Date.now()}`)
        .then(res => {
          setTimeLogs(res.data);
          // Check if there is an active running timer for this user in this project
          const running = res.data.find(log => log.end_time === null && log.user_id === user.id);
          if (running) {
            setIsTimerRunning(true);
            setActiveTimerId(running.id);
            const elapsed = Math.floor((Date.now() - new Date(running.start_time).getTime()) / 1000);
            setTimerSeconds(elapsed > 0 ? elapsed : 0);
          }
        })
        .catch(console.error);
    };

    if (activeTab === 'Time Tracking') {
      fetchTimeLogs();
      socket.on("project_details_updated", fetchTimeLogs);
      return () => {
        socket.off("project_details_updated", fetchTimeLogs);
      };
    }
  }, [activeTab, project.id, user.id]);

  // Timer interval
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Fetch activities
  useEffect(() => {
    const fetchActivities = () => {
      axios.get(`http://localhost:5000/api/projects/${project.id}/activities?t=${Date.now()}`)
        .then(res => setActivities(res.data))
        .catch(console.error);
    };

    if (activeTab === 'Activity Feed') {
      fetchActivities();
      socket.on("project_details_updated", fetchActivities);
      return () => {
        socket.off("project_details_updated", fetchActivities);
      };
    }
  }, [activeTab, project.id]);

  // Fetch invoices when tab is opened
  useEffect(() => {
    const fetchInvoices = () => {
      axios.get(`http://localhost:5000/api/projects/${project.id}/invoices?t=${Date.now()}`)
        .then(res => setInvoices(res.data))
        .catch(console.error);
    };

    if (activeTab === 'Invoices') {
      fetchInvoices();
      socket.on("project_details_updated", fetchInvoices);
      return () => {
        socket.off("project_details_updated", fetchInvoices);
      };
    }
  }, [activeTab, project.id]);

  // Fetch team members + assignments when Settings tab opens (Agency only)
  useEffect(() => {
    if (activeTab === 'Settings' && user?.plan === 'Agency' && (user?.role === 'owner' || user?.role === 'admin')) {
      setIsLoadingAssignments(true);
      Promise.all([
        axios.get(`http://localhost:5000/api/teams/members/${user.id}?t=${Date.now()}`),
        axios.get(`http://localhost:5000/api/projects/${project.id}/assignments?t=${Date.now()}`)
      ])
        .then(([membersRes, assignmentsRes]) => {
          // membersRes.data has { team, members }
          const allMembers = membersRes.data.members || [];
          setTeamMembers(allMembers);
          const assignedIds = (assignmentsRes.data || []).map(a => a.user_id);
          setAssignedMembers(assignedIds);
        })
        .catch(err => {
          console.error('Failed to load team assignments:', err);
          setTeamMembers([]);
          setAssignedMembers([]);
        })
        .finally(() => setIsLoadingAssignments(false));
    }
  }, [activeTab, project.id, user?.plan, user?.role, user?.id]);

  // Join the project room on mount/project change
  useEffect(() => {
    if (project?.id) {
      const joinProjectRoom = () => {
        socket.emit("join_project", project.id);
      };

      joinProjectRoom();
      socket.on("connect", joinProjectRoom);

      return () => {
        socket.off("connect", joinProjectRoom);
      };
    }
  }, [project.id]);

  // Fetch tasks when tab is opened
  useEffect(() => {
    const fetchTasks = () => {
      axios.get(`http://localhost:5000/api/projects/${project.id}/tasks?t=${Date.now()}`)
        .then(res => setTasks(res.data))
        .catch(console.error);
    };

    if (activeTab === 'Tasks') {
      fetchTasks();
      socket.on("project_details_updated", fetchTasks);
      return () => {
        socket.off("project_details_updated", fetchTasks);
      };
    }
  }, [activeTab, project.id]);

  // Fetch files when tab is opened
  useEffect(() => {
    const fetchFiles = () => {
      axios.get(`http://localhost:5000/api/projects/${project.id}/files?t=${Date.now()}`)
        .then(res => setFiles(res.data))
        .catch(console.error);
    };

    if (activeTab === 'Files & Assets') {
      fetchFiles();
      socket.on("project_details_updated", fetchFiles);
      return () => {
        socket.off("project_details_updated", fetchFiles);
      };
    }
  }, [activeTab, project.id]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', user?.id || 1);

    try {
      const res = await axios.post(`http://localhost:5000/api/projects/${project.id}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFiles([{
        id: res.data.fileId,
        project_id: project.id,
        filename: res.data.filename,
        original_name: file.name,
        mime_type: file.type,
        size: file.size,
        created_at: new Date().toISOString()
      }, ...files]);

      // Since backend sends a message automatically, let's just trigger a refetch of messages to update the chat instantly
      fetchMessages();
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403 && err.response?.data?.upgrade) {
        // Plan limit hit — show upgrade prompt
        setToastMessage({
          title: 'Upgrade Required',
          desc: err.response.data.message,
          type: 'error'
        });
      } else {
        setToastMessage({
          title: 'Upload Failed',
          desc: 'Error uploading file. Please try again.',
          type: 'error'
        });
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 6000);
    } finally {
      setIsUploading(false);
      // Reset input so they can upload same file again if deleted
      e.target.value = null;
    }

  };

  const handleDeleteFile = async (id) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/files/${id}`);
      setFiles(files.filter(f => f.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleToggleTask = async (task) => {
    try {
      const newStatus = task.is_completed ? 0 : 1;
      const res = await axios.put(`http://localhost:5000/api/tasks/${task.id}`, { is_completed: newStatus });
      setTasks(tasks.map(t => t.id === task.id ? { ...t, is_completed: newStatus } : t));
      if (onUpdateProject) {
        onUpdateProject({ ...project, progress: res.data.progress, status: res.data.status });
      }

      // Auto-send message when task is completed (only for Pro/Agency)
      if (newStatus === 1 && planLimits?.limits?.realtime !== false) {
        const taskMsg = `Task Completed: ${task.title}`;
        const msgRes = await axios.post(`http://localhost:5000/api/projects/${project.id}/messages`, {
          sender_type: 'freelancer',
          sender_id: user?.id,
          message: taskMsg
        });

        setMessages(prev => [...prev, {
          id: msgRes.data.messageId,
          sender_type: 'freelancer',
          sender_id: user?.id,
          message: taskMsg,
          created_at: new Date().toISOString()
        }]);
        previousMessageCount.current += 1;
      }
    } catch (err) { console.error(err) }
  };

  const handleAddInvoice = async (e) => {
    e.preventDefault();
    if (!newInvoiceTitle || !newInvoiceAmount) return;
    try {
      const res = await axios.post(`http://localhost:5000/api/projects/${project.id}/invoices`, {
        title: newInvoiceTitle,
        amount: newInvoiceAmount
      });
      setInvoices([{
        id: res.data.invoiceId,
        project_id: project.id,
        title: newInvoiceTitle,
        amount: newInvoiceAmount,
        status: 'Pending',
        created_at: new Date().toISOString()
      }, ...invoices]);

      // Show success toast immediately
      setToastMessage({
        title: 'Invoice Created',
        desc: `Invoice "${newInvoiceTitle}" for $${parseFloat(newInvoiceAmount).toFixed(2)} created successfully!`,
        type: 'success'
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);

      // Try to send a chat message about the invoice (non-blocking)
      try {
        const invoiceMsg = `New Invoice created: ${newInvoiceTitle} for $${parseFloat(newInvoiceAmount).toFixed(2)}`;
        const msgRes = await axios.post(`http://localhost:5000/api/projects/${project.id}/messages`, {
          sender_type: 'freelancer',
          sender_id: user.id,
          message: invoiceMsg
        });

        setMessages(prev => [...prev, {
          id: msgRes.data.messageId,
          sender_type: 'freelancer',
          sender_id: user.id,
          message: invoiceMsg,
          created_at: new Date().toISOString()
        }]);
        previousMessageCount.current += 1;
      } catch (msgErr) {
        // Message failed (e.g. Starter plan), but invoice was created successfully
        console.log('Invoice chat notification skipped:', msgErr.response?.data?.message || msgErr.message);
      }

      setNewInvoiceTitle('');
      setNewInvoiceAmount('');
      setIsInvoiceFormOpen(false);
    } catch (err) {
      console.error(err);
      setToastMessage({
        title: 'Invoice Failed',
        desc: err.response?.data?.message || 'Failed to create invoice.',
        type: 'error'
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  const handleUpdateInvoice = async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/api/invoices/${id}`, { status, user_id: user?.id });
      setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status } : inv));
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.upgrade) {
        setToastMessage({ title: '🔒 Upgrade Required', desc: err.response.data.message, type: 'error' });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 6000);
      } else { console.error(err); }
    }
  };

  const handleDeleteInvoice = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/invoices/${id}`);
      setInvoices(invoices.filter(inv => inv.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleViewPDF = (inv) => {
    if (user?.plan === 'Starter') {
      setToastMessage({
        title: 'Upgrade Required',
        desc: 'PDF Invoice export is only available on Pro & Agency. Please go back to the dashboard and click "Upgrade" to unlock!',
        type: 'error'
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 6000);
      return;
    }

    const printWindow = window.open('', '_blank');

    // Format dates
    const invoiceDate = new Date(inv.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const dueDate = new Date(new Date(inv.created_at).getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const freelancerName = user?.name || project.freelancerName || 'GridLancer Freelancer';
    const freelancerEmail = user?.email || 'freelancer@gridlancer.com';
    const clientName = project.clientName || 'GridLancer Client';
    const clientEmail = project.clientEmail || 'client@gridlancer.com';

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${inv.id} - ${inv.title} | GridLancer</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
          <link rel="icon" type="image/png" href="/favicon1.png" />
          <style>
            body {
              font-family: 'Inter', sans-serif;
              color: #1e293b;
              margin: 0;
              padding: 40px;
              background-color: #ffffff;
              -webkit-print-color-adjust: exact;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #f1f5f9;
              padding-bottom: 30px;
              margin-bottom: 40px;
            }
            .logo-container img {
              max-height: 50px;
              object-fit: contain;
            }
            .invoice-title {
              text-align: right;
            }
            .invoice-title h1 {
              font-size: 32px;
              font-weight: 800;
              margin: 0;
              color: #4f46e5;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .invoice-number {
              font-size: 16px;
              color: #64748b;
              margin-top: 5px;
              font-weight: 600;
            }
            .details-grid {
              display: -ms-grid;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin-bottom: 45px;
            }
            .details-block h3 {
              font-size: 12px;
              text-transform: uppercase;
              color: #94a3b8;
              letter-spacing: 1px;
              margin-bottom: 10px;
              font-weight: 700;
            }
            .details-block p {
              margin: 3px 0;
              font-size: 14px;
              line-height: 1.5;
            }
            .details-block .name {
              font-weight: 700;
              font-size: 16px;
              color: #0f172a;
            }
            .invoice-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 40px;
            }
            .invoice-table th {
              background-color: #f8fafc;
              color: #475569;
              font-size: 11px;
              text-transform: uppercase;
              font-weight: 700;
              letter-spacing: 0.5px;
              padding: 14px 16px;
              text-align: left;
              border-bottom: 2px solid #e2e8f0;
            }
            .invoice-table td {
              padding: 16px;
              font-size: 14px;
              border-bottom: 1px solid #f1f5f9;
            }
            .invoice-table td.amount {
              text-align: right;
              font-weight: 600;
            }
            .invoice-table th.amount {
              text-align: right;
            }
            .summary-container {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 50px;
            }
            .summary-table {
              width: 280px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              font-size: 14px;
              border-bottom: 1px solid #f1f5f9;
            }
            .summary-row.total {
              border-bottom: none;
              padding-top: 15px;
              font-size: 18px;
              font-weight: 800;
              color: #4f46e5;
            }
            .badge {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .badge-paid {
              background-color: #dcfce7;
              color: #15803d;
            }
            .badge-pending {
              background-color: #fef3c7;
              color: #b45309;
            }
            .footer {
              margin-top: 80px;
              border-top: 1px solid #f1f5f9;
              padding-top: 20px;
              text-align: center;
              font-size: 12px;
              color: #94a3b8;
            }
            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none !important;
              }
            }
            .print-btn {
              background-color: #4f46e5;
              color: white;
              border: none;
              padding: 10px 20px;
              font-size: 14px;
              font-weight: 700;
              border-radius: 8px;
              cursor: pointer;
              box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
              transition: all 0.2s;
            }
            .print-btn:hover {
              background-color: #4338ca;
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="no-print" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; background-color: #f8fafc; padding: 15px 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
              <span style="font-size: 14px; font-weight: 500; color: #475569;">Invoice Preview - Print or Save as PDF using the button.</span>
              <button onclick="window.print()" class="print-btn">Print / Save as PDF</button>
            </div>
            
            <div class="header">
              <div class="logo-container">
                <img src="/Logos.png" alt="GridLancer" onerror="this.src='/favicon1.png'; this.style.height='40px';">
                <div style="font-size: 12px; color: #64748b; margin-top: 5px; font-weight: 500;">From projects to payments.</div>
              </div>
              <div class="invoice-title">
                <h1>Invoice</h1>
                <div class="invoice-number">INV-2026-${inv.id.toString().padStart(4, '0')}</div>
                <div style="margin-top: 8px;">
                  <span class="badge ${inv.status === 'Paid' ? 'badge-paid' : 'badge-pending'}">${inv.status}</span>
                </div>
              </div>
            </div>
            
            <div class="details-grid">
              <div class="details-block">
                <h3>Billed By (Freelancer)</h3>
                <p class="name">${freelancerName}</p>
                <p>${freelancerEmail}</p>
                <p style="color: #64748b; font-size: 13px; margin-top: 8px;">Project: ${project.title || project.name}</p>
              </div>
              <div class="details-block" style="text-align: right;">
                <h3>Billed To (Client)</h3>
                <p class="name">${clientName}</p>
                <p>${clientEmail}</p>
                <p style="color: #64748b; font-size: 13px; margin-top: 15px;"><strong>Issued:</strong> ${invoiceDate}</p>
                <p style="color: #64748b; font-size: 13px;"><strong>Due:</strong> ${dueDate}</p>
              </div>
            </div>
            
            <table class="invoice-table">
              <thead>
                <tr>
                  <th style="width: 70%;">Description</th>
                  <th class="amount" style="width: 30%;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div style="font-weight: 600; color: #0f172a; margin-bottom: 4px;">${inv.title}</div>
                    <div style="font-size: 12px; color: #64748b; line-height: 1.4;">Project milestone payment for "${project.title || project.name}". All deliverables have been uploaded and reviewed.</div>
                  </td>
                  <td class="amount">$${parseFloat(inv.amount).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            
            <div class="summary-container">
              <table class="summary-table">
                <tr class="summary-row">
                  <td style="color: #64748b; padding: 6px 0; border: none;">Subtotal</td>
                  <td style="text-align: right; padding: 6px 0; border: none; font-weight: 600;">$${parseFloat(inv.amount).toFixed(2)}</td>
                </tr>
                <tr class="summary-row">
                  <td style="color: #64748b; padding: 6px 0; border: none;">Tax / VAT (0%)</td>
                  <td style="text-align: right; padding: 6px 0; border: none; font-weight: 600;">$0.00</td>
                </tr>
                <tr class="summary-row total">
                  <td style="padding: 12px 0 0 0; border-top: 2px solid #e2e8f0; font-size: 18px; font-weight: 800; color: #4f46e5;">Total Due</td>
                  <td style="text-align: right; padding: 12px 0 0 0; border-top: 2px solid #e2e8f0; font-size: 18px; font-weight: 800; color: #4f46e5;">$${parseFloat(inv.amount).toFixed(2)}</td>
                </tr>
              </table>
            </div>
            
            <div style="border-top: 2px dashed #e2e8f0; padding-top: 30px; margin-top: 50px;">
              <h4 style="font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Terms & Instructions</h4>
              <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0;">Payment is due within 14 days of issue date. Please remit payment via bank transfer or credit card on the GridLancer dashboard. Thank you for your business!</p>
            </div>
            
            <div class="footer">
              <p>Generated dynamically by GridLancer &copy; 2026. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const { title, description } = settingsForm;
      await axios.put(`http://localhost:5000/api/projects/${project.id}`, { title, description });
      if (onUpdateProject) {
        onUpdateProject({ ...project, title, description });
      }
      setToastMessage({
        title: 'Settings Saved',
        desc: 'Project settings updated successfully!',
        type: 'success'
      });
      setShowToast(true);
    } catch (err) {
      console.error(err);
      setToastMessage({
        title: 'Save Failed',
        desc: 'Failed to save settings.',
        type: 'error'
      });
      setShowToast(true);
    } finally {
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  const handleToggleAssignment = (memberId) => {
    setAssignedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSaveAssignments = async () => {
    try {
      await axios.put(`http://localhost:5000/api/projects/${project.id}/assignments`, {
        memberIds: assignedMembers
      });
      setToastMessage({
        title: 'Team Updated',
        desc: 'Project team assignments saved successfully!',
        type: 'success'
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } catch (err) {
      console.error(err);
      setToastMessage({
        title: 'Save Failed',
        desc: 'Failed to update team assignments.',
        type: 'error'
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/projects/${project.id}/messages?t=${Date.now()}`);
      const newMessages = res.data;

      if (previousMessageCount.current > 0 && newMessages.length > previousMessageCount.current) {
        const latestMessage = newMessages[newMessages.length - 1];
        if (latestMessage.sender_type !== 'freelancer') {
          try {
            notificationSound.play().catch(e => console.log('Audio play prevented', e));
          } catch (e) { }
        }
      }

      setMessages(newMessages);
      previousMessageCount.current = newMessages.length;

      const typingRes = await axios.get(`http://localhost:5000/api/projects/${project.id}/typing?t=${Date.now()}`);
      setIsClientTyping(typingRes.data.client);

    } catch (err) {
      console.error("Error fetching messages", err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (project?.id) {
      setIsLoadingMessages(true);
      fetchMessages();

      const handleNewMessage = (msg) => {
        if (msg.project_id == project.id) {
          // Skip our own messages — they're already added locally by handleSendMessage
          if (msg.sender_type === 'freelancer') return;
          
          try { notificationSound.play().catch(() => {}); } catch(e) {}
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      };

      socket.on("new_message", handleNewMessage);
      return () => {
        socket.off("new_message", handleNewMessage);
      };
    }
  }, [project.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);
    const now = Date.now();
    if (now - lastTypingTimeRef.current > 2000) {
      lastTypingTimeRef.current = now;
      axios.post(`http://localhost:5000/api/projects/${project.id}/typing`, { user_type: 'freelancer' }).catch(() => { });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await axios.post(`http://localhost:5000/api/projects/${project.id}/messages`, {
        sender_type: 'freelancer',
        sender_id: user.id,
        message: newMessage
      });

      const updatedMessages = [...messages, {
        id: res.data.messageId,
        sender_type: 'freelancer',
        sender_id: user.id,
        message: newMessage,
        created_at: new Date().toISOString()
      }];
      setMessages(updatedMessages);
      previousMessageCount.current = updatedMessages.length;
      setNewMessage('');
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.upgrade) {
        setToastMessage({ title: '🔒 Pro Feature', desc: err.response.data.message, type: 'error' });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 6000);
      } else {
        console.error("Error sending message", err);
      }
    }
  };

  const handleStartMeeting = async () => {
    if (planLimits?.limits?.videoCall === false || planLimits?.plan === 'Starter') {
      setToastMessage({
        title: '🔒 Pro Feature',
        desc: 'Video calling is a Pro & Agency feature. Upgrade to start an instant video meeting.',
        type: 'error'
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 6000);
      return;
    }

    try {
      const salt = "gridlancer-secure-jitsi-meeting-room-salt-2026";
      const createdTime = project.created_at || "default-time";
      const rawString = `${salt}-${project.id}-${createdTime}`;
      const msgBuffer = new TextEncoder().encode(rawString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      const roomName = `gridlancer-project-${hashHex.substring(0, 24)}`;
      
      socket.emit("start_meeting", {
        projectId: project.id,
        projectTitle: project.title || project.name,
        roomName: roomName,
        senderName: user?.name || "Freelancer",
        senderType: 'freelancer'
      });

      window.open(`https://meet.jit.si/${roomName}`, '_blank');
    } catch (err) {
      console.error("Failed to generate secure meeting room:", err);
      const roomName = `gridlancer-project-fallback-${project.id}`;
      socket.emit("start_meeting", {
        projectId: project.id,
        projectTitle: project.title || project.name,
        roomName: roomName,
        senderName: user?.name || "Freelancer",
        senderType: 'freelancer'
      });
      window.open(`https://meet.jit.si/${roomName}`, '_blank');
    }
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/milestones", {
        project_id: project.id,
        title: newMilestone.title,
        description: newMilestone.description,
        amount: newMilestone.amount ? parseFloat(newMilestone.amount) : null,
        deadline: newMilestone.deadline || null,
        user_id: user.id
      });
      setNewMilestone({ title: '', description: '', amount: '', deadline: '' });
      setIsMilestoneFormOpen(false);
      setToastMessage({ title: 'Milestone Created', desc: 'Milestone created successfully!', type: 'success' });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      
      axios.get(`http://localhost:5000/api/milestones/project/${project.id}`)
        .then(res => setMilestones(res.data));
    } catch (err) {
      console.error(err);
      setToastMessage({ title: 'Error', desc: 'Failed to create milestone.', type: 'error' });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleSubmitMilestoneForReview = async (milestoneId) => {
    try {
      await axios.put(`http://localhost:5000/api/milestones/${milestoneId}/status`, {
        status: 'Pending Review',
        user_id: user.id
      });
      setToastMessage({ title: 'Submitted', desc: 'Milestone submitted for review!', type: 'success' });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      
      axios.get(`http://localhost:5000/api/milestones/project/${project.id}`)
        .then(res => setMilestones(res.data));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateContract = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/contracts", {
        project_id: project.id,
        title: newContract.title,
        scope: newContract.scope,
        terms: newContract.terms,
        payment_terms: newContract.payment_terms,
        user_id: user.id
      });
      setNewContract({ title: '', scope: '', terms: '', payment_terms: '' });
      setIsContractFormOpen(false);
      setToastMessage({ title: 'Contract Sent', desc: 'Contract drafted and sent to client!', type: 'success' });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      
      axios.get(`http://localhost:5000/api/contracts/project/${project.id}`)
        .then(res => setContracts(res.data));
    } catch (err) {
      console.error(err);
      setToastMessage({ title: 'Error', desc: 'Failed to create contract.', type: 'error' });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleStartTimer = async () => {
    try {
      const nowStr = new Date().toISOString();
      const res = await axios.post("http://localhost:5000/api/time-entries", {
        project_id: project.id,
        user_id: user.id,
        description: 'Timer started',
        start_time: nowStr,
        is_manual: false
      });
      setIsTimerRunning(true);
      setActiveTimerId(res.data.logId);
      setTimerSeconds(0);
      setToastMessage({ title: 'Timer Started', desc: 'Working hours are now tracking.', type: 'success' });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      axios.get(`http://localhost:5000/api/time-entries/project/${project.id}`)
        .then(res => setTimeLogs(res.data));
    } catch (err) {
      console.error(err);
    }
  };

  const handleStopTimer = async (description) => {
    if (!activeTimerId) return;
    try {
      const nowStr = new Date().toISOString();
      await axios.put(`http://localhost:5000/api/time-entries/${activeTimerId}/stop`, {
        end_time: nowStr,
        duration: timerSeconds,
        description: description || 'No description provided'
      });
      setIsTimerRunning(false);
      setActiveTimerId(null);
      setTimerSeconds(0);
      setToastMessage({ title: 'Timer Stopped', desc: 'Time has been logged.', type: 'success' });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      axios.get(`http://localhost:5000/api/time-entries/project/${project.id}`)
        .then(res => setTimeLogs(res.data));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddManualTime = async (e) => {
    e.preventDefault();
    const totalSeconds = (parseInt(manualTime.hours || 0) * 3600) + (parseInt(manualTime.minutes || 0) * 60);
    if (totalSeconds <= 0) return;
    try {
      const now = new Date();
      const start = new Date(now.getTime() - totalSeconds * 1000).toISOString();
      await axios.post("http://localhost:5000/api/time-entries", {
        project_id: project.id,
        user_id: user.id,
        description: manualTime.description || 'Manual entry',
        start_time: start,
        end_time: now.toISOString(),
        duration: totalSeconds,
        is_manual: true
      });
      setManualTime({ description: '', hours: '', minutes: '' });
      setIsManualTimeFormOpen(false);
      setToastMessage({ title: 'Time Logged', desc: 'Manual time log added successfully.', type: 'success' });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      axios.get(`http://localhost:5000/api/time-entries/project/${project.id}`)
        .then(res => setTimeLogs(res.data));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTimeLog = async (logId) => {
    if (!window.confirm("Are you sure you want to delete this time entry?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/time-entries/${logId}`);
      setToastMessage({ title: 'Deleted', desc: 'Time entry deleted.', type: 'success' });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      axios.get(`http://localhost:5000/api/time-entries/project/${project.id}`)
        .then(res => setTimeLogs(res.data));
    } catch (err) {
      console.error(err);
    }
  };

  // Helper for relative time formatting
  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="flex flex-col xl:h-full animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700 shadow-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">{project.clientName}</div>
            <h2 className="text-3xl font-bold text-white">{project.title || project.name}</h2>
          </div>
        </div>
        <div className="flex flex-nowrap items-center gap-3 w-full sm:w-auto sm:ml-auto">
          <button
            onClick={handleStartMeeting}
            className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-500/5 flex items-center justify-center gap-1.5"
          >
            📹 Start Meeting
          </button>
          <div className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider text-center flex items-center justify-center ${project.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
            project.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
              'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
            {project.status}
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row flex-1 gap-6 min-h-0 xl:overflow-hidden pb-4 xl:pb-0 custom-scrollbar">
        {/* Project Content */}
        <div className="flex-[3] bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-8 flex flex-col shadow-xl relative xl:overflow-hidden shrink-0">
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${project.color || 'from-indigo-500 to-purple-500'}`}></div>

          {/* Grouped Tabs Categories */}
          <div className="flex gap-2 sm:gap-3 border-b border-slate-800 pb-3.5 mb-3.5 overflow-x-auto custom-scrollbar select-none">
            {Object.keys(tabGroups).map(group => {
              const isSelected = parentTab === group;
              let icon = "🛠️";
              if (group === "Finances") icon = "💼";
              if (group === "Agreements & Setup") icon = "⚙️";
              
              return (
                <button
                  key={group}
                  onClick={() => {
                    setParentTab(group);
                    if (tabGroups[group] && tabGroups[group].length > 0) {
                      setActiveTab(tabGroups[group][0]);
                    }
                  }}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                    isSelected 
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-650 text-white shadow-md shadow-indigo-650/20 border-indigo-500/30' 
                      : 'bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-slate-850'
                  }`}
                >
                  <span>{icon}</span> {group}
                </button>
              );
            })}
          </div>

          {/* Sub Tabs */}
          <div className="flex gap-4 sm:gap-6 border-b border-slate-800/40 mb-6 overflow-x-auto pb-2.5 custom-scrollbar select-none">
            {(tabGroups[parentTab] || []).map(tab => (
              <div
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors relative whitespace-nowrap ${
                  activeTab === tab ? 'text-indigo-400 font-extrabold' : 'text-slate-500 hover:text-slate-350'
                }`}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-t-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>}
              </div>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 xl:overflow-y-auto overflow-visible pr-2 custom-scrollbar">
            {activeTab === 'Overview' && (
              <div className="space-y-2">
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">Project Description</h3>
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-slate-300 leading-relaxed">
                    {project.description || 'No description provided for this project. Update settings to add one.'}
                  </div>
                </div>

                {/* Full Width Progress Bar */}
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                  <div className="flex justify-between items-end mb-3">
                    <div className="text-sm text-slate-500 font-bold uppercase tracking-wider">Project Progress</div>
                    <span className="text-2xl font-extrabold text-white">{project.progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${project.color || 'from-indigo-500 to-purple-500'}`} style={{ width: `${project.progress}%` }}></div>
                  </div>
                </div>

                {/* 2-Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-center">
                    <div className="text-xs text-slate-500 font-bold uppercase mb-1">Client Contact</div>
                    <div className="text-white font-medium truncate">{project.clientEmail || 'N/A'}</div>
                  </div>
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-center">
                    <div className="text-xs text-slate-500 font-bold uppercase mb-1">Deadline</div>
                    <div className="text-white font-medium">{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Not Set'}</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Tasks' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">Project Tasks</h3>
                  <div className="text-sm font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-lg">
                    Progress: {project.progress}%
                  </div>
                </div>

                <div className="space-y-3">
                  {tasks.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 italic border border-dashed border-slate-800 rounded-2xl">This project was created before default tasks were added.</div>
                  ) : (
                    tasks.map((task, index) => {
                      const isDisabled = (!task.is_completed && index > 0 && !tasks[index - 1].is_completed) ||
                        (task.is_completed && index < tasks.length - 1 && tasks[index + 1].is_completed);

                      return (
                        <div key={task.id} className={`p-4 rounded-xl border flex items-center justify-between group transition-all ${task.is_completed ? 'bg-slate-900/50 border-emerald-500/20' : 'bg-slate-950 border-slate-800 hover:border-slate-700'} ${isDisabled ? 'opacity-50' : ''}`}>
                          <div className="flex items-center gap-4">
                            <div
                              onClick={() => { if (!isDisabled) handleToggleTask(task) }}
                              className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${task.is_completed ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-600 hover:border-indigo-500'}`}
                            >
                              {task.is_completed && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <span className={`font-medium ${task.is_completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                              {task.title}
                              {task.weight > 0 && <span className="ml-3 px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-400 border border-slate-700">{task.weight}% weight</span>}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Files & Assets' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">Project Files</h3>
                  <div className="relative">
                    <input
                      type="file"
                      id="file-upload"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                    <button className="px-4 py-2 bg-indigo-500 cursor-pointer hover:bg-indigo-600 text-white rounded-xl font-bold text-sm transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      {isUploading ? 'Uploading...' : 'Upload File'}
                    </button>
                  </div>
                </div>

                {files.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center p-10 bg-slate-950 rounded-2xl border border-slate-800 border-dashed">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4"><svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg></div>
                    <h3 className="text-xl font-bold text-white mb-2">No Files Yet</h3>
                    <p className="text-slate-400 max-w-md">Upload deliverables, zip files, and images here. The client will be able to download them.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {files.map(file => (
                      <div key={file.id} className="bg-slate-950 items-center border border-slate-800 rounded-xl p-4 flex gap-4 hover:border-slate-700 transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-white text-sm truncate mb-1" title={file.original_name}>{file.original_name}</div>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>{(file.size / 1024).toFixed(1)} KB</span>
                            <span>{new Date(file.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                          <a href={`http://localhost:5000/uploads/${file.filename}`} target="_blank" download className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          </a>
                          {user?.role !== 'member' && (
                            <button onClick={() => handleDeleteFile(file.id)} className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer hover:bg-rose-500/10 rounded-lg">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Milestones' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">Project Milestones</h3>
                  {user?.role !== 'member' && (
                    <button
                      onClick={() => setIsMilestoneFormOpen(!isMilestoneFormOpen)}
                      className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      {isMilestoneFormOpen ? 'Cancel' : '➕ Add Milestone'}
                    </button>
                  )}
                </div>

                {isMilestoneFormOpen && user?.role !== 'member' && (
                  <form onSubmit={handleCreateMilestone} className="bg-slate-950 p-5 rounded-2xl border border-slate-805 space-y-4 animate-[fadeIn_0.2s_ease-out]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Milestone Title</label>
                        <input required type="text" placeholder="e.g. Design Handover" value={newMilestone.title} onChange={e => setNewMilestone({...newMilestone, title: e.target.value})} className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-indigo-500 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Target Deadline</label>
                        <input type="date" value={newMilestone.deadline} onChange={e => setNewMilestone({...newMilestone, deadline: e.target.value})} className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-indigo-500 transition-colors" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Description (Optional)</label>
                        <input type="text" placeholder="Details about deliverables..." value={newMilestone.description} onChange={e => setNewMilestone({...newMilestone, description: e.target.value})} className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-indigo-500 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Payment Amount ($) (Optional)</label>
                        <input type="number" step="0.01" placeholder="e.g. 500 (auto-generates invoice on approval)" value={newMilestone.amount} onChange={e => setNewMilestone({...newMilestone, amount: e.target.value})} className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-indigo-500 transition-colors" />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button type="submit" className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-650 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer">Create Milestone</button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {milestones.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 italic border border-dashed border-slate-800 rounded-2xl">No milestones created yet. Add milestones to track project phases.</div>
                  ) : (
                    milestones.map(ms => (
                      <div key={ms.id} className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-800 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              ms.status === 'Approved' ? 'bg-emerald-400' :
                              ms.status === 'Pending Review' ? 'bg-yellow-400' :
                              ms.status === 'Revision Requested' ? 'bg-rose-400' : 'bg-slate-500'
                            }`}></span>
                            <span className="font-bold text-white text-sm">{ms.title}</span>
                          </div>
                          {ms.description && <p className="text-xs text-slate-400 mt-1">{ms.description}</p>}
                          <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 mt-2 font-semibold">
                            {ms.deadline && <span>Target: {new Date(ms.deadline).toLocaleDateString()}</span>}
                            {ms.amount && <span className="text-indigo-400">Payment: ${ms.amount}</span>}
                            <span className="uppercase tracking-wider px-2 py-0.5 bg-slate-900 border border-slate-850 rounded text-slate-400">{ms.status}</span>
                          </div>
                        </div>

                        <div className="shrink-0 flex gap-2 w-full md:w-auto justify-end">
                          {ms.status === 'Pending' && (
                            <button
                              onClick={() => handleSubmitMilestoneForReview(ms.id)}
                              className="px-3.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                            >
                              Submit for Review
                            </button>
                          )}
                          {ms.status === 'Revision Requested' && (
                            <button
                              onClick={() => handleSubmitMilestoneForReview(ms.id)}
                              className="px-3.5 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/25 border border-yellow-500/20 text-yellow-400 font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                            >
                              Resubmit for Review
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Contracts' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">Digital Contracts</h3>
                  {user?.role !== 'member' && (
                    <button
                      onClick={() => setIsContractFormOpen(!isContractFormOpen)}
                      className="px-4 py-2 bg-indigo-500 hover:bg-indigo-650 border border-indigo-550/20 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      {isContractFormOpen ? 'Cancel' : '➕ Draft Contract'}
                    </button>
                  )}
                </div>

                {isContractFormOpen && user?.role !== 'member' && (
                  <form onSubmit={handleCreateContract} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 animate-[fadeIn_0.2s_ease-out]">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Contract Title</label>
                      <input required type="text" placeholder="e.g. Master Services Agreement" value={newContract.title} onChange={e => setNewContract({...newContract, title: e.target.value})} className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-indigo-500 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Project Scope</label>
                      <textarea required rows="3" placeholder="Describe scope of deliverables..." value={newContract.scope} onChange={e => setNewContract({...newContract, scope: e.target.value})} className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-indigo-500 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Terms & Conditions</label>
                      <textarea required rows="3" placeholder="IP ownership, revisions policy, etc..." value={newContract.terms} onChange={e => setNewContract({...newContract, terms: e.target.value})} className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-indigo-500 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Payment Terms</label>
                      <textarea required rows="2" placeholder="e.g. 50% upfront, 50% on completion..." value={newContract.payment_terms} onChange={e => setNewContract({...newContract, payment_terms: e.target.value})} className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-indigo-500 transition-colors" />
                    </div>
                    <div className="flex justify-end pt-2">
                      <button type="submit" className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-650 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer">Send to Client</button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {contracts.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 italic border border-dashed border-slate-800 rounded-2xl">No contract drafted yet. Draft a digital agreement to lock scopes and secure trust.</div>
                  ) : (
                    contracts.map(cnt => (
                      <div key={cnt.id} className="bg-slate-950 border border-slate-850 rounded-xl p-5 space-y-4 hover:border-slate-800 transition-colors">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-white text-sm">{cnt.title}</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">Created on {new Date(cnt.created_at).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            cnt.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            cnt.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            'bg-slate-800 text-slate-400'
                          }`}>{cnt.status}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Scope</span>
                            <p className="text-slate-350 whitespace-pre-wrap">{cnt.scope}</p>
                          </div>
                          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Terms</span>
                            <p className="text-slate-350 whitespace-pre-wrap">{cnt.terms}</p>
                          </div>
                          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Payment</span>
                            <p className="text-slate-350 whitespace-pre-wrap">{cnt.payment_terms}</p>
                          </div>
                        </div>

                        {cnt.status === 'Accepted' && (
                          <div className="pt-3 border-t border-slate-900 flex justify-between items-center text-[10px] text-slate-500 font-semibold">
                            <span>Signature: <strong className="text-indigo-400 font-mono text-xs">{cnt.digital_signature}</strong></span>
                            <span>Signed At: {new Date(cnt.signed_at).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Time Tracking' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">Time Tracking Logs</h3>
                    <p className="text-xs text-slate-450 mt-0.5">Track work hours dynamically or log manual slots.</p>
                  </div>
                  
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setIsManualTimeFormOpen(!isManualTimeFormOpen)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-350 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      {isManualTimeFormOpen ? 'Cancel' : '📝 Log Manual'}
                    </button>
                    {isTimerRunning ? (
                      <button
                        onClick={() => {
                          const desc = prompt("What did you work on during this session?");
                          handleStopTimer(desc);
                        }}
                        className="flex-1 sm:flex-none px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all animate-pulse shadow-lg shadow-rose-500/20 cursor-pointer"
                      >
                        ⏱️ Stop ({Math.floor(timerSeconds/3600)}h {Math.floor((timerSeconds%3600)/60)}m {timerSeconds%60}s)
                      </button>
                    ) : (
                      <button
                        onClick={handleStartTimer}
                        className="flex-1 sm:flex-none px-5 py-2 bg-indigo-500 hover:bg-indigo-650 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/25 cursor-pointer"
                      >
                        ⏱️ Start Timer
                      </button>
                    )}
                  </div>
                </div>

                {isManualTimeFormOpen && (
                  <form onSubmit={handleAddManualTime} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 animate-[fadeIn_0.2s_ease-out]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Work Description</label>
                        <input required type="text" placeholder="e.g. Worked on homepage mockups" value={manualTime.description} onChange={e => setManualTime({...manualTime, description: e.target.value})} className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-indigo-500 transition-colors" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Hours</label>
                          <input type="number" min="0" max="24" placeholder="0" value={manualTime.hours} onChange={e => setManualTime({...manualTime, hours: e.target.value})} className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-indigo-500 transition-colors text-center font-bold" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Minutes</label>
                          <input type="number" min="0" max="59" placeholder="0" value={manualTime.minutes} onChange={e => setManualTime({...manualTime, minutes: e.target.value})} className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-indigo-500 transition-colors text-center font-bold" />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button type="submit" className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-650 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer">Add Time Entry</button>
                    </div>
                  </form>
                )}

                <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-4">Worker</th>
                        <th className="p-4">Description</th>
                        <th className="p-4">Duration</th>
                        <th className="p-4">Date</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {timeLogs.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-10 text-center text-slate-500 italic">No tracked hours yet. Start the timer to log work automatically.</td>
                        </tr>
                      ) : (
                        timeLogs.map(log => {
                          const durationStr = log.end_time 
                            ? `${Math.floor(log.duration / 3600)}h ${Math.floor((log.duration % 3600) / 60)}m`
                            : 'Tracking...';
                          return (
                            <tr key={log.id} className="hover:bg-slate-900/40 text-slate-200 font-medium">
                              <td className="p-4 font-bold">{log.userName || 'Freelancer'}</td>
                              <td className="p-4 text-slate-350">{log.description || 'Working session'}</td>
                              <td className="p-4 font-bold text-indigo-400">{durationStr}</td>
                              <td className="p-4 text-slate-500">{new Date(log.start_time).toLocaleDateString()}</td>
                              <td className="p-4 text-right">
                                {log.end_time && (user.id === log.user_id || user.role === 'owner') && (
                                  <button onClick={() => handleDeleteTimeLog(log.id)} className="p-1.5 text-slate-500 hover:text-rose-450 rounded-lg transition-colors cursor-pointer">
                                    🗑️
                                  </button>
                                )}
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

            {activeTab === 'Activity Feed' && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-xl font-bold text-white mb-6">Activity Timeline</h3>
                
                <div className="relative border-l border-slate-800 pl-6 ml-3 space-y-8 py-4">
                  {activities.length === 0 ? (
                    <div className="text-slate-500 italic text-xs pl-2">No activity logs recorded. Actions like files upload, invoice payments and milestone revisions will log feed alerts automatically.</div>
                  ) : (
                    activities.map(act => {
                      const icons = {
                        created: '📁',
                        task_completed: '✅',
                        file_uploaded: '📎',
                        invoice_paid: '💵',
                        invoice_generated: '📄',
                        meeting_scheduled: '📹',
                        milestone_created: '🎯',
                        milestone_submitted: '📤',
                        milestone_approved: '✨',
                        milestone_revision: '✏️',
                        contract_sent: '✍️',
                        contract_signed: '🤝'
                      };
                      return (
                        <div key={act.id} className="relative group">
                          {/* Timeline Dot */}
                          <div className="absolute -left-10 top-0.5 w-8 h-8 rounded-full bg-slate-900 border border-slate-855 flex items-center justify-center text-xs shadow-md group-hover:border-indigo-500 transition-colors">
                            {icons[act.activity_type] || '🔔'}
                          </div>
                          
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-white">{act.message}</p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                              <span>By {act.created_by_type}</span>
                              <span>•</span>
                              <span>{new Date(act.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Invoices' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">Invoices</h3>
                  <button
                    onClick={() => setIsInvoiceFormOpen(!isInvoiceFormOpen)}
                    className="px-4 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl font-bold text-sm transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <svg className={`w-4 h-4 transition-transform ${isInvoiceFormOpen ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    {isInvoiceFormOpen ? 'Cancel' : 'Create Invoice'}
                  </button>
                </div>

                {isInvoiceFormOpen && (
                  <form onSubmit={handleAddInvoice} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-wrap gap-4 items-end animate-[fadeIn_0.3s_ease-out]">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Invoice Item / Title</label>
                      <input type="text" required value={newInvoiceTitle} onChange={e => setNewInvoiceTitle(e.target.value)} className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="e.g. Website Design Phase 1" />
                    </div>
                    <div className="w-48">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Amount ($)</label>
                      <input type="number" required min="0" step="0.01" value={newInvoiceAmount} onChange={e => setNewInvoiceAmount(e.target.value)} className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="0.00" />
                    </div>
                    <button type="submit" className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-sm transition-colors cursor-pointer shadow-lg">Create</button>
                  </form>
                )}

                <div className="space-y-4">
                  {invoices.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 italic">No invoices created yet.</div>
                  ) : (
                    invoices.map(inv => (
                      <div key={inv.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex justify-between items-center group">
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="text-white font-bold text-lg">{inv.title}</div>
                            <button
                              onClick={() => handleViewPDF(inv)}
                              className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              title="View PDF Invoice"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              PDF
                            </button>
                          </div>
                          <div className="text-slate-400 text-sm mt-1">{new Date(inv.created_at).toLocaleDateString()}</div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-2xl font-extrabold text-white">${parseFloat(inv.amount).toFixed(2)}</div>
                          <div className="flex items-center gap-2">
                            <select
                              value={inv.status}
                              onChange={(e) => handleUpdateInvoice(inv.id, e.target.value)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase cursor-pointer border-none outline-none appearance-none text-center ${inv.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}
                            >
                              <option value="Pending" className="bg-slate-900 text-amber-400">PENDING</option>
                              <option value="Paid" className="bg-slate-900 text-emerald-400">PAID</option>
                            </select>
                            <button onClick={() => handleDeleteInvoice(inv.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Settings' && (
              <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2">Project Details</h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Project Title</label>
                    <input type="text" value={settingsForm.title} onChange={e => setSettingsForm({ ...settingsForm, title: e.target.value })} className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Description</label>
                    <textarea rows="4" value={settingsForm.description} onChange={e => setSettingsForm({ ...settingsForm, description: e.target.value })} className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"></textarea>
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Deadline</label>
                    <input type="date" disabled value={settingsForm.deadline} className="w-full px-4 py-3 bg-slate-900/50 border border-slate-850 rounded-xl text-slate-500 cursor-not-allowed focus:outline-none [color-scheme:dark]" />
                    <p className="text-[10px] text-slate-550 mt-1.5 italic">Note: The target deadline is fixed upon project creation and cannot be changed.</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
                  <h3 className="text-lg font-bold text-white mb-2 border-b border-slate-800 pb-2">Status</h3>
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <span className="text-slate-400 text-sm font-medium">Current Status</span>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${project.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : project.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                      {project.status || 'Pending'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 italic mt-4">
                    Note: Status and Progress percentage are now automatically calculated based on your completed Tasks.
                  </div>
                </div>

                {/* Team Assignment Panel — Agency owners/admins only */}
                {user?.plan === 'Agency' && (user?.role === 'owner' || user?.role === 'admin') && (
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        👥 Team Assignment
                      </h3>
                      <button
                        type="button"
                        onClick={handleSaveAssignments}
                        disabled={isLoadingAssignments}
                        className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                      >
                        Save Assignments
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">Select which team members can access this project, view its chat, files, and tasks.</p>

                    {isLoadingAssignments ? (
                      <div className="text-center py-8 text-slate-500 text-sm">Loading team members...</div>
                    ) : teamMembers.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-slate-500 text-sm mb-2">No team members found.</div>
                        <p className="text-xs text-slate-600">Go to the Team tab to invite members first.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {teamMembers.map(member => {
                          const isAssigned = assignedMembers.includes(member.user_id);
                          const isOwner = member.role === 'owner';
                          return (
                            <div
                              key={member.user_id}
                              onClick={() => !isOwner && handleToggleAssignment(member.user_id)}
                              className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                                isOwner
                                  ? 'bg-indigo-500/5 border-indigo-500/20 cursor-default'
                                  : isAssigned
                                    ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40 cursor-pointer'
                                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 cursor-pointer'
                              }`}
                            >
                              {/* Checkbox */}
                              <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                isOwner
                                  ? 'bg-indigo-500 border-indigo-500 text-white'
                                  : isAssigned
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-slate-600'
                              }`}>
                                {(isAssigned || isOwner) && (
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                )}
                              </div>

                              {/* Avatar */}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${
                                isOwner ? 'bg-indigo-500' : isAssigned ? 'bg-emerald-500' : 'bg-slate-700'
                              }`}>
                                {(member.name || member.email || '?').charAt(0).toUpperCase()}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0 pr-2">
                                <div className="text-white text-sm font-semibold truncate">{member.name || member.email}</div>
                                <div className="text-xs text-slate-500 truncate">{member.email}</div>
                              </div>

                              {/* Role badge */}
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                member.role === 'owner'
                                  ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                                  : member.role === 'admin'
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}>
                                {isOwner ? '👑 Owner' : member.role}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <button type="submit" className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/25 cursor-pointer">Save Changes</button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Client Discussion Sidebar — locked for Starter */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl flex flex-col shadow-xl overflow-hidden min-w-[300px] shrink-0 h-[80vh] xl:h-auto">
          <div className="p-6 border-b border-slate-800 bg-slate-900/50">
            <h3 className="text-lg font-bold text-white">{project.clientName || 'Client'} Discussion</h3>
            <p className="text-sm text-slate-500">Communicate directly with {project.clientName}</p>
          </div>

          {planLimits?.limits?.realtime === false ? (
            /* STARTER LOCK PANEL */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h4 className="text-white font-extrabold text-base mb-1">🔒 Real-time Chat</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-indigo-500 to-purple-600 text-white">Pro</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                Live messaging with your client is a <strong className="text-white">Pro</strong> feature. Upgrade to send and receive messages in real-time.
              </p>
              <button
                onClick={onUpgrade}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-indigo-500/25 cursor-pointer flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
                </svg>
                Upgrade to Pro
              </button>
            </div>
          ) : (
            /* FULL CHAT UI for Pro/Agency */
            <>
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
                {isLoadingMessages ? (
                  <div className="text-slate-400 text-sm text-center">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-slate-500 text-sm text-center">No messages yet. Say hello!</div>
                ) : (
                  messages.map(msg => {
                    const isFreelancer = msg.sender_type === 'freelancer';
                    return isFreelancer ? (
                      <div key={msg.id} className="flex gap-4 flex-row-reverse">
                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">You</div>
                        <div className="flex flex-col items-end">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-xs text-slate-500">{timeAgo(msg.created_at)}</span>
                            <span className="font-bold text-indigo-400 text-sm">You</span>
                          </div>
                          <div className="bg-indigo-500 text-white p-3 rounded-2xl rounded-tr-sm text-sm shadow-lg shadow-indigo-500/20">{msg.message}</div>
                        </div>
                      </div>
                    ) : (
                      <div key={msg.id} className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {project.clientName ? project.clientName.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-bold text-slate-300 text-sm">{project.clientName}</span>
                            <span className="text-xs text-slate-500">{timeAgo(msg.created_at)}</span>
                          </div>
                          <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-sm text-sm text-slate-300">{msg.message}</div>
                        </div>
                      </div>
                    );
                  })
                )}
                {isClientTyping && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {project.clientName ? project.clientName.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-sm text-sm text-slate-300 w-fit flex gap-1.5 items-center h-10">
                      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900/80">
                <div className="relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleMessageChange}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSendMessage(e); } }}
                    placeholder="Type a message..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-full py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white hover:bg-indigo-600 transition-colors shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4 translate-x-px" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
        @media (max-width: 440px) {
          .animate-\[fadeIn_0.3s_ease-out\] { padding: 1rem; }
        }
      `}</style>

      {/* Toast Notification */}
      <div className={`fixed bottom-6 right-6 left-6 sm:left-auto sm:w-96 z-[9999] transform transition-all duration-500 ease-out ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
        <div className={`bg-slate-900/95 backdrop-blur-md border ${toastMessage.type === 'success' ? 'border-emerald-500/30 shadow-emerald-500/10' : 'border-rose-500/30 shadow-rose-500/10'} shadow-2xl rounded-2xl p-4 pr-10 flex items-start gap-3.5 relative`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${toastMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
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

export default ProjectDetail;
