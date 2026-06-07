import React, { useEffect, useState } from 'react';
import Navbar from '../Global/Navbar';
import Footer from '../components/Footer';

const Contact = () => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', desc: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.target;
    const formData = new FormData(form);

    try {
      // Using the /ajax/ endpoint allows us to submit without being redirected
      const response = await fetch('https://formsubmit.co/ajax/msaadi3806@gmail.com', {
        method: 'POST',
        headers: { 
          'Accept': 'application/json'
        },
        body: formData
      });

      if (response.ok) {
        setToastMessage({
          title: 'Message Sent!',
          desc: "We'll get back to you as soon as possible.",
          type: 'success'
        });
        setShowToast(true);
        form.reset();
      } else {
        setToastMessage({
          title: 'Failed to Send',
          desc: 'Something went wrong. Please try again.',
          type: 'error'
        });
        setShowToast(true);
      }
    } catch (error) {
      console.error(error);
      setToastMessage({
        title: 'Error',
        desc: 'Something went wrong. Please try again.',
        type: 'error'
      });
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setShowToast(false), 5000); // Hide toast after 5 seconds
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-950 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <Navbar />

      <div className="flex-grow pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative z-10">
        <div className="max-w-3xl w-full bg-slate-900 p-5 sm:p-12 rounded-2xl sm:rounded-3xl shadow-2xl shadow-indigo-500/10 border border-slate-800 text-center">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-3 sm:mb-4">Contact Us</h1>
          <p className="text-sm sm:text-lg text-slate-400 mb-6 sm:mb-10 font-light">We'd love to hear from you. Please fill out the form below or reach out to us at support@gridlancer.com.</p>

          <form onSubmit={handleSubmit} className="space-y-6 text-left max-w-lg mx-auto">
            {/* FormSubmit config to prevent captcha redirection when possible */}
            <input type="hidden" name="_captcha" value="false" />
            <input type="hidden" name="_template" value="table" />

            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-300">Name</label>
              <input type="text" id="name" name="name" required className="mt-2 block w-full px-4 py-3 border border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-slate-500 bg-slate-950" placeholder="Your name" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-300">Email</label>
              <input type="email" id="email" name="email" required className="mt-2 block w-full px-4 py-3 border border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-slate-500 bg-slate-950" placeholder="you@example.com" />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-slate-300">Message</label>
              <textarea id="message" name="message" rows="5" required className="mt-2 block w-full px-4 py-3 border border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-slate-500 bg-slate-950 resize-none" placeholder="How can we help?"></textarea>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/30 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm sm:text-base">
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
      <Footer />

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

export default Contact;
