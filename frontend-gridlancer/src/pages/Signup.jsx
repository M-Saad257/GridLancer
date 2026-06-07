import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Signup = () => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', desc: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(window.location.search);
  const plan = queryParams.get('plan') || 'Starter';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.target;
    const name = form.name.value;
    const email = form.email.value;
    const password = form.password.value;

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, plan })
      });

      const data = await response.json();

      if (response.ok) {
        // Auto-login newly registered user using real database info
        const userData = data.user || { id: Date.now(), name, email };
        sessionStorage.setItem('gridlancer_user', JSON.stringify(userData));

        setToastMessage({
          title: 'Account Created!',
          desc: data.message || 'Taking you to your dashboard...',
          type: 'success'
        });
        setShowToast(true);
        form.reset();
        
        setTimeout(() => {
           navigate(`/dashboard/${userData.id}`); 
        }, 1500);
      } else {
        setToastMessage({
          title: 'Registration Failed',
          desc: data.message || 'Something went wrong. Please try again.',
          type: 'error'
        });
        setShowToast(true);
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
        <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-white">Create your account</h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to={plan ? `/login?plan=${plan}` : "/login"} className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
            Sign in instead
          </Link>
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900 py-6 sm:py-8 px-4 shadow-2xl shadow-indigo-500/10 rounded-2xl sm:rounded-3xl sm:px-10 border border-slate-800">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300">
                Full Name
              </label>
              <div className="mt-1">
                <input id="name" name="name" type="text" required className="appearance-none block w-full px-4 py-3 border border-slate-700 rounded-xl shadow-sm placeholder-slate-500 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors bg-slate-950" placeholder="John Doe" />
              </div>
            </div>

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

            <div>
              <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/25 text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? 'Creating account...' : 'Get Started'}
              </button>
            </div>
            <p className="text-xs text-center text-slate-500 mt-4">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </div>
      </div>

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

export default Signup;
