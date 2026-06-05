import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import socket from '../socket';

// Tiny base64 notification sound (a subtle pop/ping)
const notificationSound = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU" + 'A'.repeat(500));

const ClientProjectDetail = ({ project, onBack, client }) => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', desc: '', type: 'success' });
  const [activeTab, setActiveTab] = useState('Overview');
  const [messages, setMessages] = useState([]);

  // Complaint modal states
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);

  // Complaint tracking states
  const [complaints, setComplaints] = useState([]);
  const [showComplaintsStatusModal, setShowComplaintsStatusModal] = useState(false);
  const [loadingComplaints, setLoadingComplaints] = useState(false);

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!complaintSubject.trim() || !complaintDesc.trim()) return;

    setIsSubmittingComplaint(true);
    try {
      await axios.post('http://localhost:5000/api/complaints', {
        client_id: client.id,
        freelancer_id: project.user_id,
        project_id: project.id,
        subject: complaintSubject,
        description: complaintDesc
      });
      setToastMessage({
        title: 'Report Submitted',
        desc: 'Your complaint has been filed with administration. They will review it shortly.',
        type: 'success'
      });
      setShowToast(true);
      setComplaintSubject('');
      setComplaintDesc('');
      setShowComplaintModal(false);
      if (project.freelancerPlan !== 'Starter') {
        fetchComplaints();
      }
    } catch (err) {
      console.error(err);
      setToastMessage({
        title: 'Submission Failed',
        desc: 'Could not submit complaint. Please try again.',
        type: 'error'
      });
      setShowToast(true);
    } finally {
      setIsSubmittingComplaint(false);
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  const fetchComplaints = () => {
    setLoadingComplaints(true);
    axios.get(`http://localhost:5000/api/projects/${project.id}/complaints?t=${Date.now()}`)
      .then(res => {
        setComplaints(res.data);
        setLoadingComplaints(false);
      })
      .catch(err => {
        console.error("Error fetching complaints:", err);
        setLoadingComplaints(false);
      });
  };

  useEffect(() => {
    if (project?.id && project.freelancerPlan !== 'Starter') {
      fetchComplaints();
      socket.on("project_details_updated", fetchComplaints);
      return () => {
        socket.off("project_details_updated", fetchComplaints);
      };
    }
  }, [project.id, project.freelancerPlan]);

  const [newMessage, setNewMessage] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isFreelancerTyping, setIsFreelancerTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const previousMessageCount = useRef(0);
  const lastTypingTimeRef = useRef(0);
  const [invoices, setInvoices] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [files, setFiles] = useState([]);

  // New features states
  const [milestones, setMilestones] = useState([]);
  const [revisionNote, setRevisionNote] = useState('');
  const [activeRevisionMsId, setActiveRevisionMsId] = useState(null);

  const [contracts, setContracts] = useState([]);
  const [digitalSignature, setDigitalSignature] = useState('');

  const [timeLogs, setTimeLogs] = useState([]);
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

  // Fetch time logs
  useEffect(() => {
    const fetchTimeLogs = () => {
      axios.get(`http://localhost:5000/api/time-entries/project/${project.id}?t=${Date.now()}`)
        .then(res => setTimeLogs(res.data))
        .catch(console.error);
    };

    if (activeTab === 'Time Tracking') {
      fetchTimeLogs();
      socket.on("project_details_updated", fetchTimeLogs);
      return () => {
        socket.off("project_details_updated", fetchTimeLogs);
      };
    }
  }, [activeTab, project.id]);

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

    if (activeTab === 'Activity') {
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

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/projects/${project.id}/messages?t=${Date.now()}`);
      const newMessages = res.data;

      // Play sound if new messages arrived from someone else
      if (previousMessageCount.current > 0 && newMessages.length > previousMessageCount.current) {
        const latestMessage = newMessages[newMessages.length - 1];
        if (latestMessage.sender_type !== 'client') {
          try {
            // In a real app with a real MP3, this would play smoothly. 
            // Using a dummy base64 for safety.
            notificationSound.play().catch(e => console.log('Audio play prevented by browser', e));
          } catch (e) { }
        }
      }

      setMessages(newMessages);
      previousMessageCount.current = newMessages.length;

      // Fetch typing status
      const typingRes = await axios.get(`http://localhost:5000/api/projects/${project.id}/typing?t=${Date.now()}`);
      setIsFreelancerTyping(typingRes.data.freelancer);

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
          if (msg.sender_type === 'client') return;

          try { notificationSound.play().catch(() => { }); } catch (e) { }
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
      axios.post(`http://localhost:5000/api/projects/${project.id}/typing`, { user_type: 'client' }).catch(() => { });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await axios.post(`http://localhost:5000/api/projects/${project.id}/messages`, {
        sender_type: 'client',
        sender_id: client.id,
        message: newMessage
      });

      const msgObj = {
        id: res.data.messageId,
        sender_type: 'client',
        sender_id: client.id,
        message: newMessage,
        created_at: new Date().toISOString()
      };

      const updatedMessages = [...messages, msgObj];
      setMessages(updatedMessages);
      previousMessageCount.current = updatedMessages.length;
      setNewMessage('');
    } catch (err) {
      console.error("Error sending message", err);
    }
  };

  const handleViewPDF = async (inv) => {
    try {
      const userRes = await axios.get(`http://localhost:5000/api/users/${project.user_id}`);
      if (userRes.data.plan === 'Starter') {
        setToastMessage({
          title: 'Invoice Limit',
          desc: 'PDF Invoice export is restricted because your freelancer is on the Starter plan. They need to upgrade to Pro/Agency to unlock PDF invoice downloads.',
          type: 'error'
        });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 6000);
        return;
      }
    } catch (e) {
      console.error("Failed to check freelancer subscription plan:", e);
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

    const freelancerName = project.freelancerName || 'GridLancer Freelancer';
    const freelancerEmail = 'freelancer@gridlancer.com'; // Default or from project if available
    const clientName = client?.name || project.clientName || 'GridLancer Client';
    const clientEmail = client?.email || 'client@gridlancer.com';

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${inv.id} - ${inv.title} | GridLancer</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
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

  const handlePayInvoice = async (invoice) => {
    if (!window.confirm(`Are you sure you want to securely pay $${parseFloat(invoice.amount).toFixed(2)} for "${invoice.title}"?`)) return;
    try {
      await axios.put(`http://localhost:5000/api/invoices/${invoice.id}`, { status: 'Paid' });
      setInvoices(invoices.map(inv => inv.id === invoice.id ? { ...inv, status: 'Paid' } : inv));

      // Show success toast immediately
      setToastMessage({
        title: 'Payment Successful',
        desc: `Securely paid $${parseFloat(invoice.amount).toFixed(2)} for "${invoice.title}".`,
        type: 'success'
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);

      // Try to send a chat message about the payment (non-blocking)
      try {
        const msg = `Payment Sent: $${parseFloat(invoice.amount).toFixed(2)} for "${invoice.title}"`;
        const res = await axios.post(`http://localhost:5000/api/projects/${project.id}/messages`, {
          sender_type: 'client',
          sender_id: client.id,
          message: msg
        });

        setMessages(prev => [...prev, {
          id: res.data.messageId,
          sender_type: 'client',
          sender_id: client.id,
          message: msg,
          created_at: new Date().toISOString()
        }]);
        previousMessageCount.current += 1;
      } catch (msgErr) {
        // Message failed (e.g. Starter plan), but payment was successful
        console.log('Payment chat notification skipped:', msgErr.response?.data?.message || msgErr.message);
      }
    } catch (err) {
      console.error("Payment failed", err);
      setToastMessage({
        title: 'Payment Failed',
        desc: 'Failed to process payment. Please try again.',
        type: 'error'
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  const handleStartMeeting = async () => {
    if (project.freelancerPlan === 'Starter') {
      setToastMessage({
        title: '🔒 Starter Limit',
        desc: 'Video calling is locked because your freelancer is on the Starter plan. Ask them to upgrade to Pro/Agency to unlock it.',
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
        senderName: client?.name || "Client",
        senderType: 'client'
      });

      window.open(`https://meet.jit.si/${roomName}`, '_blank');
    } catch (err) {
      console.error("Failed to generate secure meeting room:", err);
      const roomName = `gridlancer-project-fallback-${project.id}`;
      socket.emit("start_meeting", {
        projectId: project.id,
        projectTitle: project.title || project.name,
        roomName: roomName,
        senderName: client?.name || "Client",
        senderType: 'client'
      });
      window.open(`https://meet.jit.si/${roomName}`, '_blank');
    }
  };

  const handleApproveMilestone = async (milestoneId) => {
    try {
      await axios.put(`http://localhost:5000/api/milestones/${milestoneId}/status`, {
        status: 'Approved',
        user_id: client.id
      });
      setToastMessage({ title: 'Approved', desc: 'Milestone approved and marked complete!', type: 'success' });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      axios.get(`http://localhost:5000/api/milestones/project/${project.id}`)
        .then(res => setMilestones(res.data));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestMilestoneRevision = async (e) => {
    e.preventDefault();
    if (!revisionNote.trim() || !activeRevisionMsId) return;
    try {
      await axios.put(`http://localhost:5000/api/milestones/${activeRevisionMsId}/status`, {
        status: 'Revision Requested',
        note: revisionNote,
        user_id: client.id
      });
      setToastMessage({ title: 'Revision Requested', desc: 'Revision details sent to freelancer.', type: 'success' });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      setRevisionNote('');
      setActiveRevisionMsId(null);

      axios.get(`http://localhost:5000/api/milestones/project/${project.id}`)
        .then(res => setMilestones(res.data));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignContract = async (contractId) => {
    if (!digitalSignature.trim()) return;
    try {
      await axios.put(`http://localhost:5000/api/contracts/${contractId}/status`, {
        status: 'Accepted',
        digital_signature: digitalSignature,
        client_id: client.id
      });
      setDigitalSignature('');
      setToastMessage({ title: 'Contract Signed', desc: 'You have signed this contract successfully.', type: 'success' });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      axios.get(`http://localhost:5000/api/contracts/project/${project.id}`)
        .then(res => setContracts(res.data));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectContract = async (contractId) => {
    if (!window.confirm("Are you sure you want to reject this contract?")) return;
    try {
      await axios.put(`http://localhost:5000/api/contracts/${contractId}/status`, {
        status: 'Rejected',
        client_id: client.id
      });
      setToastMessage({ title: 'Contract Rejected', desc: 'You have rejected this contract proposal.', type: 'success' });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      axios.get(`http://localhost:5000/api/contracts/project/${project.id}`)
        .then(res => setContracts(res.data));
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
            <div className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Project</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">{project.title || project.name}</h2>
          </div>
        </div>
        <div className="flex flex-nowrap items-center gap-3 w-full sm:w-auto sm:ml-auto">
          <button
            onClick={handleStartMeeting}
            className="flex-1 sm:flex-none px-4 py-2 bg-indigo-650 hover:bg-indigo-550 border border-indigo-500/30 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-500/5 flex items-center justify-center gap-1.5"
          >
            📹 Start Meeting
          </button>
          <button
            onClick={() => setShowComplaintModal(true)}
            className="flex-1 sm:flex-none px-4 py-2 bg-rose-500/15 hover:bg-rose-500 border border-rose-500/30 text-rose-450 hover:text-white text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-500/5 flex items-center justify-center gap-1.5"
          >
            🚩 Report
          </button>
          <button
            onClick={() => setShowComplaintsStatusModal(true)}
            className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-350 hover:text-white text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
          >
            📋 Status
          </button>
          <div className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-[10px] sm:text-sm font-bold uppercase tracking-wider text-center flex items-center justify-center ${project.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
            project.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
              'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
            {project.status}
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row flex-1 gap-6 min-h-0 xl:overflow-hidden pb-4 xl:pb-0 custom-scrollbar">
        {/* Project Content */}
        <div className={`${project.freelancerPlan === 'Starter' ? 'flex-1' : 'flex-[3]'} bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 flex flex-col shadow-xl relative xl:overflow-hidden shrink-0`}>
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${project.color || 'from-indigo-500 to-purple-500'}`}></div>

          {/* Tabs */}
          <div className="flex gap-2 sm:gap-6 border-b border-slate-800 mb-6 overflow-x-auto pb-2 custom-scrollbar">
            {['Overview', 'Activity', 'Files & Assets', 'Milestones', 'Contracts', 'Time Tracking', 'Activity Feed', 'Invoices'].map(tab => (
              <div
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-xs sm:text-sm font-bold cursor-pointer transition-colors relative whitespace-nowrap ${activeTab === tab ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-t-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>}
              </div>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 xl:overflow-y-auto overflow-visible pr-2 custom-scrollbar">
            {activeTab === 'Overview' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">Project Description</h3>
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-slate-300 leading-relaxed">
                    {project.description || 'No description provided for this project.'}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                  {/* Progress Card */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Project Progress</div>
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                      <span className="text-3xl font-extrabold text-white">{project.progress}%</span>
                      <div className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider shrink-0 ${project.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : project.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        {project.status || 'Pending'}
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-auto">
                      <div className={`h-full bg-gradient-to-r ${project.color || 'from-indigo-500 to-purple-500'}`} style={{ width: `${project.progress}%` }}></div>
                    </div>
                  </div>

                  {/* Financials Card */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Financial Overview</div>
                    <div className="text-3xl font-extrabold text-white mb-1 truncate">
                      ${parseFloat(project.totalPaid || 0).toFixed(2)}
                    </div>
                    <div className="text-xs font-medium text-slate-400 mb-3">Total Paid to Date</div>
                    <div className="mt-auto">
                      {project.unpaidCount > 0 ? (
                        <span className="inline-block px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                          {project.unpaidCount} Pending Invoice{project.unpaidCount > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                          All Invoices Paid
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Timeline Card */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4">Timeline Details</div>

                    <div className="mb-4">
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Project Created</div>
                      <div className="text-white font-medium flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="truncate">{project.created_at ? new Date(project.created_at).toLocaleDateString() : 'Unknown Date'}</span>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Target Deadline</div>
                      <div className="text-white font-medium flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="truncate">{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Not Set'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Activity' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-white">Project Activity & Tasks</h3>
                  <div className="text-sm font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-lg">
                    Current Progress: {project.progress}%
                  </div>
                </div>

                <div className="space-y-3">
                  {tasks.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 italic border border-dashed border-slate-800 rounded-2xl">Your freelancer hasn't set up any tasks yet.</div>
                  ) : (
                    tasks.map(task => (
                      <div key={task.id} className={`p-4 rounded-xl border flex items-center justify-between transition-all ${task.is_completed ? 'bg-slate-900/50 border-emerald-500/20' : 'bg-slate-950 border-slate-800'}`}>
                        <div className="flex items- gap-4">
                          <div className={`w-6 h-6 rounded border flex items-center justify-center ${task.is_completed ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-600 bg-slate-900'}`}>
                            {task.is_completed && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <span className={`font-medium ${task.is_completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                            {task.title}
                            {task.weight > 0 && <span className="ml-3 px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-400 border border-slate-700">{task.weight}%</span>}
                          </span>
                        </div>
                        {task.is_completed && (
                          <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Completed</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Files & Assets' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">Project Files</h3>
                </div>

                {files.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-10 bg-slate-950 rounded-2xl border border-slate-800 border-dashed">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4"><svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg></div>
                    <h3 className="text-xl font-bold text-white mb-2">No Files Yet</h3>
                    <p className="text-slate-400 mb-6 max-w-md">Your freelancer hasn't uploaded any deliverables or assets here yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {files.map(file => (
                      <div key={file.id} className="bg-slate-950 items-center border border-slate-800 rounded-xl p-4 flex items-start gap-4 hover:border-slate-700 transition-colors group">
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
                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a href={`http://localhost:5000/uploads/${file.filename}`} target='_blank' download className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Milestones' && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-xl font-bold text-white mb-6">Project Milestones</h3>

                {activeRevisionMsId && (
                  <form onSubmit={handleRequestMilestoneRevision} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 animate-[fadeIn_0.2s_ease-out]">
                    <h4 className="text-sm font-bold text-rose-450 uppercase">Request Revision Feedback</h4>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">What needs to be changed?</label>
                      <textarea required rows="3" placeholder="Provide specific feedback on deliverables..." value={revisionNote} onChange={e => setRevisionNote(e.target.value)} className="w-full px-4 py-3 bg-slate-900 border border-slate-850 rounded-xl text-white text-xs outline-none focus:border-indigo-500 transition-colors" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => { setActiveRevisionMsId(null); setRevisionNote(''); }} className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 text-xs font-bold rounded-xl transition-all">Cancel</button>
                      <button type="submit" className="px-5 py-2 bg-rose-500 hover:bg-rose-650 text-white rounded-xl text-xs font-bold transition-all shadow-md">Request Revision</button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {milestones.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 italic border border-dashed border-slate-800 rounded-2xl">No milestones created for this project yet.</div>
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
                            {ms.amount && <span className="text-indigo-400">Amount: ${ms.amount}</span>}
                            <span className="uppercase tracking-wider px-2 py-0.5 bg-slate-900 border border-slate-850 rounded text-slate-400">{ms.status}</span>
                          </div>
                        </div>

                        <div className="shrink-0 flex gap-2 w-full md:w-auto justify-end">
                          {ms.status === 'Pending Review' && (
                            <>
                              <button
                                onClick={() => setActiveRevisionMsId(ms.id)}
                                className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-450 hover:text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                              >
                                Request Revision
                              </button>
                              <button
                                onClick={() => handleApproveMilestone(ms.id)}
                                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow shadow-emerald-500/20"
                              >
                                Approve Deliverable
                              </button>
                            </>
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
                <h3 className="text-xl font-bold text-white mb-6">Digital Contracts</h3>

                <div className="space-y-3">
                  {contracts.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 italic border border-dashed border-slate-800 rounded-2xl">No contract drafted yet. Agreements sent by your freelancer will show up here.</div>
                  ) : (
                    contracts.map(cnt => (
                      <div key={cnt.id} className="bg-slate-950 border border-slate-850 rounded-xl p-5 space-y-4 hover:border-slate-800 transition-colors">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-white text-sm">{cnt.title}</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">Sent on {new Date(cnt.created_at).toLocaleDateString()}</p>
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
                            <p className="text-slate-350 whitespace-pre-wrap leading-relaxed">{cnt.scope}</p>
                          </div>
                          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Terms</span>
                            <p className="text-slate-350 whitespace-pre-wrap leading-relaxed">{cnt.terms}</p>
                          </div>
                          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Payment</span>
                            <p className="text-slate-350 whitespace-pre-wrap leading-relaxed">{cnt.payment_terms}</p>
                          </div>
                        </div>

                        {cnt.status === 'Pending' && (
                          <div className="pt-4 border-t border-slate-900 flex flex-col sm:flex-row gap-4 items-center justify-between">
                            <div className="flex-1 w-full">
                              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sign Digitally (Type full name)</label>
                              <input required type="text" placeholder="Type your name to sign..." value={digitalSignature} onChange={e => setDigitalSignature(e.target.value)} className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-indigo-500 transition-colors" />
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto shrink-0 pt-4 sm:pt-0">
                              <button onClick={() => handleRejectContract(cnt.id)} className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-rose-400 text-xs font-bold rounded-xl transition-all cursor-pointer">Reject</button>
                              <button onClick={() => handleSignContract(cnt.id)} className="flex-1 sm:flex-none px-5 py-2.5 bg-indigo-500 hover:bg-indigo-650 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-500/25 cursor-pointer">Sign & Accept</button>
                            </div>
                          </div>
                        )}

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
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">Time Tracking Logs</h3>
                    <p className="text-xs text-slate-450 mt-0.5">Review freelancer hours tracked on this project.</p>
                  </div>
                  
                  {timeLogs.length > 0 && (
                    <div className="text-sm font-bold text-slate-400 bg-slate-850 border border-slate-800 px-3 py-1 rounded-lg">
                      Total Tracked: <span className="text-indigo-400">{(timeLogs.reduce((acc, log) => acc + log.duration, 0) / 3600).toFixed(2)} hrs</span>
                    </div>
                  )}
                </div>

                <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-4">Worker</th>
                        <th className="p-4">Description</th>
                        <th className="p-4">Duration</th>
                        <th className="p-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {timeLogs.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="p-10 text-center text-slate-500 italic">No tracked hours reported yet.</td>
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
                    <div className="text-slate-500 italic text-xs pl-2">No activity timeline records.</div>
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
                          <div className="absolute -left-10 top-0.5 w-8 h-8 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center text-xs shadow-md group-hover:border-indigo-500 transition-colors">
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
                <h3 className="text-xl font-bold text-white mb-6">Invoices</h3>
                <div className="space-y-4">
                  {invoices.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 italic">No invoices created yet.</div>
                  ) : (
                    invoices.map(inv => (
                      <div key={inv.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex justify-between items-center group">
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="text-white font-bold text-lg">{inv.title}</div>
                            {project.freelancerPlan !== 'Starter' && (
                              <button
                                onClick={() => handleViewPDF(inv)}
                                className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="View PDF Invoice"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                PDF
                              </button>
                            )}
                          </div>
                          <div className="text-slate-400 text-sm mt-1">{new Date(inv.created_at).toLocaleDateString()}</div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-2xl font-extrabold text-white">${parseFloat(inv.amount).toFixed(2)}</div>
                          <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase text-center flex items-center gap-3 ${inv.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {inv.status}
                            {inv.status === 'Pending' && (
                              <button
                                onClick={() => handlePayInvoice(inv)}
                                className="px-3 py-1 bg-indigo-500 text-white rounded text-[10px] hover:bg-indigo-600 transition-colors cursor-pointer shadow-lg"
                              >
                                Pay Now
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Freelancer Discussion Sidebar */}
        {project.freelancerPlan !== 'Starter' && (
          <div className="flex-[1.5] bg-slate-900 border border-slate-800 rounded-3xl flex flex-col shadow-xl overflow-hidden min-w-[300px] shrink-0 h-[80vh] xl:h-auto">
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Project Discussion</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  Real-time Chat Active
                </p>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
              {isLoadingMessages ? (
                <div className="text-slate-400 text-sm text-center">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-slate-500 text-sm text-center">No messages yet. Say hello to your freelancer!</div>
              ) : (
                messages.map(msg => {
                  const isClient = msg.sender_type === 'client';
                  return isClient ? (
                    <div key={msg.id} className="flex gap-4 flex-row-reverse animate-[fadeIn_0.3s_ease-out]">
                      <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {client.image ? <img src={client.image} alt="You" className="w-full h-full object-cover rounded-full" /> : 'You'}
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xs text-slate-500">{timeAgo(msg.created_at)}</span>
                          <span className="font-bold text-indigo-400 text-sm">You</span>
                        </div>
                        <div className="bg-indigo-500 text-white p-3 rounded-2xl rounded-tr-sm text-sm shadow-lg shadow-indigo-500/20">
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div key={msg.id} className="flex gap-4 animate-[fadeIn_0.3s_ease-out]">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 overflow-hidden">
                        {project.freelancerImage ? (
                          <img src={project.freelancerImage} alt={project.freelancerName} className="w-full h-full object-cover" />
                        ) : (
                          project.freelancerName ? project.freelancerName.charAt(0).toUpperCase() : 'F'
                        )}
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-bold text-slate-300 text-sm">{project.freelancerName || 'Freelancer'}</span>
                          <span className="text-xs text-slate-500">{timeAgo(msg.created_at)}</span>
                        </div>
                        <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-sm text-sm text-slate-300">
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {isFreelancerTyping && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    F
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
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
          </div>
        )}
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
      `}</style>

      {/* Toast Notification */}
      <div className={`fixed bottom-8 right-8 z-50 transform transition-all duration-500 ease-out ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
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

      {showComplaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full relative z-10 text-white shadow-2xl">
            <button
              onClick={() => setShowComplaintModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 p-2 rounded-full transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="mb-6">
              <span className="text-[10px] bg-rose-500/10 text-rose-455 px-2.5 py-1 rounded border border-rose-500/20 font-bold uppercase tracking-wider">Report System</span>
              <h2 className="text-xl font-bold text-white mt-2">Report Freelancer</h2>
              <p className="text-xs text-slate-400 mt-1">
                Complain about <strong className="text-white">{project.freelancerName || 'Freelancer'}</strong> to the system administrators.
              </p>
            </div>

            <form onSubmit={handleSubmitComplaint} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Subject / Reason</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Delayed milestones, unresponsive, quality issues"
                  value={complaintSubject}
                  onChange={(e) => setComplaintSubject(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm animate-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description / Details</label>
                <textarea
                  required
                  rows="5"
                  placeholder="Please provide full details, dates, and why you are reporting this freelancer..."
                  value={complaintDesc}
                  onChange={(e) => setComplaintDesc(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all resize-none text-sm"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowComplaintModal(false)}
                  className="flex-1 py-3 bg-slate-850 hover:bg-slate-800 text-slate-350 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingComplaint || !complaintSubject.trim() || !complaintDesc.trim()}
                  className="flex-1 py-3 bg-rose-650 hover:bg-rose-550 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center shadow shadow-rose-500/20"
                >
                  {isSubmittingComplaint ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLAINT STATUS MODAL */}
      {showComplaintsStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full relative z-10 max-h-[85vh] overflow-y-auto custom-scrollbar text-white shadow-2xl">
            <button
              onClick={() => setShowComplaintsStatusModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 p-2 rounded-full transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-white">Report Tracking & Status</h2>
              <p className="text-xs text-slate-400 mt-2">Monitor filed complaints and review admin feedback.</p>
            </div>

            {project.freelancerPlan === 'Starter' ? (
              /* STARTER LOCK SCREEN FOR COMPLAINT TRACKING */
              <div className="py-12 px-6 bg-slate-950/40 border border-slate-800 rounded-2xl flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-6 border border-rose-500/20 shadow-lg shadow-rose-500/5 animate-pulse">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Complaint Status Tracking is Locked</h3>
                <p className="text-xs text-slate-450 max-w-md leading-relaxed mb-6">
                  Your freelancer is currently on the <strong className="text-rose-400">Starter Plan</strong>. Detailed complaint status tracking and custom admin messages are only available for freelancers on <strong className="text-indigo-400">Pro</strong> & <strong className="text-purple-400">Agency</strong> plans.
                </p>
                <div className="text-xs text-slate-400 italic bg-slate-950 border border-slate-850 px-4 py-2.5 rounded-xl">
                  Ask your freelancer to upgrade their plan to enable status tracking for you!
                </div>
              </div>
            ) : (
              /* ACTIVE COMPLAINT TRACKING FOR PRO / AGENCY */
              <div className="space-y-4">
                {loadingComplaints ? (
                  <div className="py-12 text-center text-xs text-slate-500 italic">Loading complaints...</div>
                ) : complaints.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 italic">No complaints filed for this project.</div>
                ) : (
                  <div className="space-y-4">
                    {complaints.map((comp) => (
                      <div
                        key={comp.id}
                        className="p-5 rounded-2xl border bg-slate-950/40 border-slate-800 transition-all"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block">CASE #{comp.id}</span>
                            <h4 className="text-sm font-bold text-slate-200 mt-0.5">{comp.subject}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${comp.status === 'Resolved'
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse'
                              }`}>
                              {comp.status}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-850/60 mb-3">{comp.description}</p>

                        {comp.status === 'Resolved' && comp.admin_response && (
                          <div className="bg-indigo-950/20 border border-indigo-500/15 rounded-xl p-4 mb-3">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">Admin Response</span>
                            <p className="text-xs text-slate-350 whitespace-pre-wrap leading-relaxed">{comp.admin_response}</p>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-3 pt-3 border-t border-slate-850/40">
                          <span>Filed: {new Date(comp.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientProjectDetail;
