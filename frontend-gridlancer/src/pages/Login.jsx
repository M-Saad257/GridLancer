import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', desc: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Ban modal state
  const [banModal, setBanModal] = useState({
    show: false,
    userId: null,
    bannedUntil: null,
    unbanRequested: false
  });
  const [requestSending, setRequestSending] = useState(false);
  
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(window.location.search);
  const plan = queryParams.get('plan');

  const handleRequestUnban = async () => {
    setRequestSending(true);
    try {
      const response = await fetch(`http://localhost:5000/api/users/${banModal.userId}/request-unban`, {
        method: 'POST'
      });
      const data = await response.json();
      if (response.ok) {
        setBanModal(prev => ({ ...prev, unbanRequested: true }));
        setToastMessage({
          title: 'Request Submitted',
          desc: data.message || 'Unban request submitted successfully.',
          type: 'success'
        });
        setShowToast(true);
      } else {
        setToastMessage({
          title: 'Request Failed',
          desc: data.message || 'Failed to submit unban request.',
          type: 'error'
        });
        setShowToast(true);
      }
    } catch (error) {
      console.error(error);
      setToastMessage({
        title: 'Error',
        desc: 'Failed to submit unban request.',
        type: 'error'
      });
      setShowToast(true);
    } finally {
      setRequestSending(false);
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, plan })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('gridlancer_user', JSON.stringify(data.user));
        
        setToastMessage({
          title: 'Welcome back!',
          desc: data.message || 'Successfully signed in.',
          type: 'success'
        });
        setShowToast(true);
        form.reset();
        
        // Optional: Redirect to dashboard after short delay
        setTimeout(() => {
           navigate(`/dashboard/${data.user.id}`); 
        }, 1500);

      } else {
        if (response.status === 403 && data.banned) {
          setBanModal({
            show: true,
            userId: data.userId,
            bannedUntil: data.bannedUntil,
            unbanRequested: data.unbanRequested
          });
        } else {
          setToastMessage({
            title: 'Sign In Failed',
            desc: data.message || 'Invalid credentials. Please try again.',
            type: 'error'
          });
          setShowToast(true);
        }
      }
    } catch (error) {
      console.error(error);
      setToastMessage({
        title: 'Connection Error',
        desc: 'Could not connect to the server. Please check your backend.',
        type: 'error'
      });
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setShowToast(false), 5000); // Auto hide toast
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 px-2 sm:px-0">
        <Link to="/" className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">GridLancer</Link>
        <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-white">Sign in to your account</h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Or{' '}
          <Link to={plan ? `/signup?plan=${plan}` : "/signup"} className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
            start your 14-day free trial
          </Link>
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900 py-6 sm:py-8 px-4 shadow-2xl shadow-indigo-500/10 rounded-2xl sm:rounded-3xl sm:px-10 border border-slate-800">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email address
              </label>
              <div className="mt-1">
                <input id="email" name="email" type="email" required className="appearance-none block w-full px-4 py-3 border border-slate-700 rounded-xl shadow-sm placeholder-slate-500 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors bg-slate-950" placeholder="you@example.com" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="mt-1">
                <input id="password" name="password" type="password" required className="appearance-none block w-full px-4 py-3 border border-slate-700 rounded-xl shadow-sm placeholder-slate-500 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors bg-slate-950" placeholder="********" />
              </div>
            </div>

            <div className="flex justify-end">
              <div className="text-sm">
                <Link to="/client-login" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                  Are you a client? Login here
                </Link>
              </div>
            </div>

            <div>
              <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/25 text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>

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

      {/* BAN MODAL (MESSAGE BOX) */}
      {banModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-red-500/20 rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-md w-full text-center shadow-2xl relative text-white">
            <button 
              onClick={() => setBanModal(prev => ({ ...prev, show: false }))}
              className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 p-2 rounded-full transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/10">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            
            <h2 className="text-2xl font-black">Account Suspended</h2>
            <p className="text-xs text-slate-400 mt-2">
              Your freelancer dashboard has been temporarily deactivated by the administration.
            </p>

            <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl my-6">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Suspension Details</span>
              <div className="text-xs font-semibold text-red-400">
                Banned until: {banModal.bannedUntil ? new Date(banModal.bannedUntil).toLocaleString() : 'Permanent'}
              </div>
            </div>

            <div className="space-y-3">
              {banModal.unbanRequested ? (
                <div className="w-full py-3.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-405 text-xs font-bold rounded-xl flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-ping"></div>
                  Unban Request Under Review
                </div>
              ) : (
                <button
                  disabled={requestSending}
                  onClick={handleRequestUnban}
                  className="w-full py-3.5 bg-gradient-to-r from-red-500 to-indigo-650 hover:from-red-450 hover:to-indigo-600 text-white text-xs font-black transition-all cursor-pointer rounded-xl text-center shadow shadow-indigo-500/20"
                >
                  {requestSending ? 'Submitting Request...' : 'Request Unban'}
                </button>
              )}

              <button
                onClick={() => setBanModal(prev => ({ ...prev, show: false }))}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-750 text-slate-350 text-xs font-bold rounded-xl border border-slate-750 transition-all cursor-pointer"
              >
                Close Dialog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
