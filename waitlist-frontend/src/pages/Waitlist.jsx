import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/apiClient.js';

export default function Waitlist() {
  const [mode, setMode] = useState('join'); // 'join', 'status', 'success'
  
  // Join Form fields
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');

  // Status Check fields 
  const [checkEmail, setCheckEmail] = useState('');

  const [status, setStatus] = useState('idle'); // idle, loading, error
  const [errorMessage, setErrorMessage] = useState('');
  
  const [waitlistCount, setWaitlistCount] = useState(null); // null = loading
  const [recentJoiners, setRecentJoiners] = useState([]);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    const errParam = params.get('error');

    if (ref) sessionStorage.setItem('unswap_referral_code', ref);
    if (errParam) {
        setErrorMessage(decodeURIComponent(errParam).replace(/\+/g, ' '));
        setMode('error');
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    api.waitlist.getCount().then(data => {
        if (typeof data.count === 'number') setWaitlistCount(data.count);
        if (Array.isArray(data.recentJoiners)) setRecentJoiners(data.recentJoiners);
    }).catch(() => setWaitlistCount(0));
  }, []);

  const handleInitiateJoin = async (e) => {
    e.preventDefault();
    if (!email || !name) return;
    setStatus('loading'); setErrorMessage('');
    const ref = sessionStorage.getItem('unswap_referral_code');

    try {
      await api.waitlist.initiateJoin({ email, name, organization, ref });
      setMode('success');
      setStatus('idle');
    } catch (err) {
      if (err.status === 409) {
          setMode('status');
          setCheckEmail(email);
          setErrorMessage('');
      } else {
          setErrorMessage(err.message || 'Failed to initiate signup');
          setMode('error');
      }
      setStatus('error');
    }
  };

  const handleCheckStatus = async (e) => {
    e.preventDefault();
    if (!checkEmail) return;
    setStatus('loading'); setErrorMessage('');

    try {
      const data = await api.waitlist.getStatus(checkEmail);
      if (data.found === false) {
        setErrorMessage("We couldn't find an account matching that email.");
        setStatus('error');
        return;
      }
      
      if (data.thank_you_url) {
          window.location.href = data.thank_you_url;
      } else {
          setErrorMessage('Dashboard link not found');
          setStatus('error');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Something went wrong.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B101E] flex items-center justify-center font-display p-6 relative">

      <AnimatePresence mode="wait">
        
        {/* ========================================= JOIN ========================================= */}
        {mode === 'join' && (
          <motion.div key="join" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
             {/* LEFT: Image */}
             <div className="hidden lg:block w-full aspect-[4/3] lg:aspect-auto lg:h-[500px] relative rounded-3xl overflow-hidden shadow-2xl group">
                 <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80" alt="Home Interior" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                 
                 {/* Decorative Overlay */}
                 <div className="absolute inset-0 bg-gradient-to-t from-[#0B101E]/90 via-[#0B101E]/40 to-transparent flex flex-col justify-end p-8 sm:p-10 pointer-events-none">
                     <div className="flex flex-col items-start gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                         <img src="/logo.png" alt="Unswap" className="h-28 w-auto object-contain " />
                     </div>
                 </div>
             </div>

             {/* RIGHT: Form */}
             <div className="w-full max-w-lg mx-auto lg:mx-0">
                 <div className="flex flex-col items-center justify-center gap-4 mb-8">
                     <img src="/logo.png" alt="Unswap Logo" className="h-32 w-auto object-contain" />
                 </div>
                 <p className="text-[#899BB1] text-sm mb-8 leading-relaxed">
                   A closed-loop home exchange ecosystem exclusively for verified staff of the UN, World Bank, IMF and other International Organizations.
                 </p>

                 <form onSubmit={handleInitiateJoin} className="space-y-4">
                     <div>
                         <h3 className="text-white text-sm font-medium mb-2 pl-1">Full Name <span className="text-red-500">*</span></h3>
                         <input
                             type="text"
                             value={name}
                             onChange={(e) => setName(e.target.value)}
                             placeholder="Enter your name"
                             required
                             className="w-full bg-transparent border border-[#2D3A53] rounded-xl px-5 py-3.5 text-white placeholder-[#5A6D88] focus:outline-none focus:border-[#3ABFF8] transition-colors"
                         />
                     </div>
                     <div>
                         <h3 className="text-white text-sm font-medium mb-2 pl-1">Email Address <span className="text-red-500">*</span></h3>
                         <input
                             type="email"
                             value={email}
                             onChange={(e) => setEmail(e.target.value)}
                             placeholder="Enter your email"
                             required
                             className="w-full bg-transparent border border-[#2D3A53] rounded-xl px-5 py-3.5 text-white placeholder-[#5A6D88] focus:outline-none focus:border-[#3ABFF8] transition-colors"
                         />
                     </div>

                     <div className="bg-[#131A2B] border border-[#232F46] rounded-xl p-5 mt-2">
                         <h3 className="text-white text-sm font-medium mb-3">Organization / Affiliation <span className="text-red-500">*</span></h3>
                         <select
                             value={organization}
                             onChange={(e) => setOrganization(e.target.value)}
                             required
                             className={`w-full bg-transparent border border-[#2D3A53] rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#3ABFF8] transition-colors appearance-none ${!organization ? 'text-[#5A6D88]' : 'text-white'}`}
                             style={{ background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23899BB1' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") no-repeat right 0.75rem center/1.5rem 1.5rem` }}
                         >
                            <option value="" disabled className="bg-[#0B101E] text-[#5A6D88]">Select your organization / affiliation</option>
                            {['United Nations', 'Specialized Agencies (WHO, ILO, UNESCO, etc.)', 'World Bank Group', 'International Monetary Fund (IMF)', 'Diplomatic Mission / Foreign Service', 'Other Intergovernmental Organization', 'I am a friend/family of an international employee whom I want to invite'].map(org => (
                                <option key={org} value={org} className="bg-[#0B101E] text-white py-2">{org}</option>
                            ))}
                         </select>
                     </div>

                     {errorMessage && <p className="text-red-400 text-sm mt-2">{errorMessage}</p>}

                     <button
                         type="submit"
                         disabled={status === 'loading'}
                         className="w-full bg-[#3ABFF8] hover:bg-[#38b7ed] text-[#0A101C] font-bold py-3.5 rounded-xl transition-all mt-4"
                     >
                         {status === 'loading' ? 'Loading...' : 'REQUEST ACCESS'}
                     </button>
                 </form>

                 {/* Social Proof */}
                 <div className="mt-10 flex flex-col items-center">
                    {waitlistCount === 0 ? (
                        <p className="text-sm text-[#899BB1]">Be the first to join!</p>
                    ) : waitlistCount !== null && (
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {recentJoiners.slice(0, 3).map((j, i) => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-[#0B101E] flex items-center justify-center text-[10px] font-bold text-white shadow-sm z-10">
                                        {j.initials}
                                    </div>
                                ))}
                                {waitlistCount > 3 && (
                                    <div className="w-8 h-8 z-0 rounded-full bg-[#1E293B] border-2 border-[#0B101E] flex items-center justify-center text-[10px] font-bold text-gray-300">
                                        +{waitlistCount - 3}
                                    </div>
                                )}
                            </div>
                            <span className="text-sm text-white font-medium">{waitlistCount} people have already joined!</span>
                        </div>
                    )}
                    <button 
                        onClick={() => { setMode('status'); setErrorMessage(''); }}
                        className="mt-4 text-[#899BB1] hover:text-white text-sm transition-colors"
                    >
                        Check your waitlist status →
                    </button>
                 </div>
             </div>
          </motion.div>
        )}

        {/* ========================================= SUCCESS (CHECK EMAIL) ========================================= */}
        {mode === 'success' && (
           <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center max-w-md w-full relative">
              <button 
                onClick={() => { setMode('join'); setEmail(''); setName(''); setOrganization(''); }}
                className="absolute -top-12 -left-4 sm:-left-12 text-[#899BB1] hover:text-white transition-colors flex items-center gap-2 text-sm"
              >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Back
              </button>

              <div className="w-14 h-14 rounded-2xl bg-[#1A2540] flex items-center justify-center mb-6 mt-2">
                <svg className="w-7 h-7 text-[#3ABFF8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Check your inbox</h2>
              <p className="text-[#899BB1] mb-1">We sent a confirmation link to</p>
              <p className="text-white font-semibold mb-2">{email}</p>
              <p className="text-[#899BB1] text-sm mb-8">Click the link to confirm your email and be redirected to your waitlist status dashboard.</p>
           </motion.div>
        )}

        {/* ========================================= ERROR SCREEN ========================================= */}
        {mode === 'error' && (
           <motion.div key="error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center max-w-md w-full relative">
              <button 
                onClick={() => { setMode('join'); setEmail(''); setName(''); setOrganization(''); setErrorMessage(''); }}
                className="absolute -top-12 -left-4 sm:-left-12 text-[#899BB1] hover:text-white transition-colors flex items-center gap-2 text-sm"
              >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Back
              </button>

              <div className="w-14 h-14 rounded-2xl bg-[#3F1626] flex items-center justify-center mb-6 mt-2">
                <svg className="w-7 h-7 text-[#F43F5E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Unable to connect</h2>
              <p className="text-[#899BB1] mb-8 leading-relaxed">
                  {errorMessage || 'Network error or the service is temporarily unavailable. Please try again later.'}
              </p>
              
              <button 
                onClick={() => { setMode('join'); setEmail(''); setName(''); setOrganization(''); setErrorMessage(''); }}
                className="w-full bg-[#1A2540] hover:bg-[#233152] text-white font-bold py-3.5 rounded-xl transition-all"
              >
                  Try Again
              </button>
           </motion.div>
        )}

        {/* ========================================= STATUS CHECKER ========================================= */}
        {mode === 'status' && (
           <motion.div key="status" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center text-center w-full max-w-lg mx-auto">
               <div className="flex flex-col items-center justify-center gap-4 mb-8">
                   <img src="/logo.png" alt="Unswap Logo" className="h-32 w-auto object-contain" />
               </div>
               <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-8 tracking-tight whitespace-nowrap">Check your waitlist status</h1>
               
               <form onSubmit={handleCheckStatus} className="w-full flex flex-col items-center gap-4">
                   <div className="w-full relative">
                      <input
                          type="email"
                          value={checkEmail}
                          onChange={(e) => {
                              setCheckEmail(e.target.value);
                              if (errorMessage) setErrorMessage('');
                          }}
                          placeholder="email@example.com"
                          required
                          className={`w-full bg-transparent border rounded-xl px-5 py-4 text-white focus:outline-none transition-colors ${checkEmail ? 'border-white focus:border-white' : 'border-[#2D3A53] focus:border-[#3ABFF8]'}`}
                      />
                   </div>

                   <button
                       type="submit"
                       disabled={status === 'loading'}
                       className="w-full bg-[#3ABFF8] hover:bg-[#38b7ed] text-[#0A101C] font-bold py-4 rounded-xl text-lg transition-all"
                   >
                       {status === 'loading' ? 'Loading...' : 'Check status'}
                   </button>
               </form>

               {errorMessage && (
                   <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-white text-sm mt-6 mb-2">
                       {errorMessage}
                   </motion.p>
               )}

               <button 
                  onClick={() => { setMode('join'); setErrorMessage(''); }}
                  className="mt-6 text-white hover:text-gray-200 text-sm transition-colors flex items-center"
               >
                   ← Back to waitlist
               </button>
           </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
