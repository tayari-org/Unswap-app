import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/logo.png';
import {
  Home, Search, List, LayoutDashboard, Settings, MessageSquare, Shield,
  Menu, X, User, LogIn, LogOut, Coins, ChevronDown, Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import NotificationCenter from './components/notifications/NotificationCenter';

const navItems = [
  { name: 'Home', path: 'Home', icon: Home },
  { name: 'Find Properties', path: 'FindProperties', icon: Search },
];

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => api.auth.me(),
    retry: false,
  });

  const isAdmin = user?.role === 'admin';
  const isVerified = isAdmin || user?.verification_status === 'verified';
  const showVerifiedUI = user && isVerified;

  // Fetch messages for unread count
  const { data: messages = [] } = useQuery({
    queryKey: ['all-messages', user?.email],
    queryFn: () => api.entities.Message.filter({
      $or: [{ sender_email: user?.email }, { recipient_email: user?.email }]
    }, '-created_date', 500),
    enabled: !!user?.email,
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHomePage = currentPageName === 'Home';

  const unreadMessagesCount = messages.filter(m =>
    m.recipient_email === user?.email && !m.is_read
  ).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      {/* Navigation */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled || !isHomePage
        ? 'bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm'
        : 'bg-transparent'
        }`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Refined Architectural Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-3 group">
              <img
                src={logo}
                alt="UNswap"
                className="w-9 h-9 object-contain transition-transform duration-500 group-hover:scale-110"
              />
              <div className="flex flex-col items-start leading-none pt-1">
                <span className={`text-2xl font-extralight tracking-[-0.05em] transition-colors duration-500 ${scrolled || !isHomePage ? 'text-slate-900' : 'text-white'}`}>
                  UN<span className="italic font-serif">swap</span>
                </span>
                <div className={`w-6 h-px mt-0.5 transition-colors duration-500 ${scrolled || !isHomePage ? 'bg-unswap-blue-deep/20' : 'bg-white/20'}`} />
              </div>
            </Link>

            {/* Desktop Navigation - Minimalist High-Contrast */}
            <nav className="hidden lg:flex items-center gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={createPageUrl(item.path)}
                  className={`px-4 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-[0.15em] transition-all duration-300 ${currentPageName === item.path
                    ? scrolled || !isHomePage
                      ? 'text-unswap-blue-deep bg-blue-50'
                      : 'text-white bg-white/10'
                    : scrolled || !isHomePage
                      ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {item.name}
                </Link>
              ))}
              {showVerifiedUI && (
                <>
                  <Link
                    to={createPageUrl('MyListings')}
                    className={`px-4 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-[0.15em] transition-all duration-300 ${currentPageName === 'MyListings'
                      ? scrolled || !isHomePage
                        ? 'text-unswap-blue-deep bg-blue-50'
                        : 'text-white bg-white/10'
                      : scrolled || !isHomePage
                        ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    My Listings
                  </Link>
                  <Link
                    to={createPageUrl('MySwaps')}
                    className={`px-4 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-[0.15em] transition-all duration-300 ${currentPageName === 'MySwaps'
                      ? scrolled || !isHomePage
                        ? 'text-unswap-blue-deep bg-blue-50'
                        : 'text-white bg-white/10'
                      : scrolled || !isHomePage
                        ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    My Swaps
                  </Link>
                </>
              )}
              {isAdmin && (
                <Link
                  to={createPageUrl('AdminDashboard')}
                  className={`px-4 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-[0.15em] flex items-center gap-2 transition-all duration-300 ${currentPageName === 'AdminDashboard'
                    ? 'bg-amber-500/10 text-amber-600'
                    : scrolled || !isHomePage
                      ? 'text-amber-500/60 hover:text-amber-600 hover:bg-amber-50'
                      : 'text-amber-300/60 hover:text-amber-300 hover:bg-amber-400/5'
                    }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </Link>
              )}
            </nav>

            {/* Right Side - Functional Precision */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  {/* Notifications */}
                  <div className={scrolled || !isHomePage ? 'text-slate-900' : 'text-white'}>
                    <NotificationCenter user={user} />
                  </div>

                  {/* Messages */}
                  <Link to={createPageUrl('Messages')}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-9 w-9 rounded-lg transition-colors ${scrolled || !isHomePage ? 'text-slate-900 hover:bg-slate-100' : 'text-white hover:bg-white/10'}`}
                    >
                      <div className="relative">
                        <MessageSquare className="w-5 h-5" />
                        {unreadMessagesCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                            {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                          </span>
                        )}
                      </div>
                    </Button>
                  </Link>

                  {/* Points - Institutional Credit */}
                  <div className={`hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-lg border transition-all duration-500 ${scrolled || !isHomePage ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'
                    }`}>
                    <Coins className={`w-3.5 h-3.5 ${scrolled || !isHomePage ? 'text-unswap-blue-deep' : 'text-amber-300'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-widest leading-none">{user.guest_points || 500} PTS</span>
                  </div>

                  {/* User Menu - Prestigious Profile Trigger */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-3 focus:outline-none group">
                        <div className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all duration-500 group-hover:shadow-lg ${scrolled || !isHomePage ? 'border-slate-200' : 'border-white/20'}`}>
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400">
                              <User className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <ChevronDown className={`w-3 h-3 hidden md:block transition-all duration-500 group-hover:translate-y-0.5 ${scrolled || !isHomePage ? 'text-slate-400' : 'text-white/60'
                          }`} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 rounded-xl border-slate-200 shadow-2xl p-0 overflow-hidden">
                      <div className="p-6 bg-slate-50/50">
                        <p className="font-extralight text-slate-900 text-lg tracking-tight truncate">{user.username || user.full_name}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate mt-1">{user.email}</p>
                        <div className="mt-4">
                          <Badge variant="outline" className={`rounded-none border-0 px-2 py-0.5 font-bold tracking-[0.2em] uppercase text-[8px] ${isVerified
                            ? 'bg-unswap-blue-deep/10 text-unswap-blue-deep'
                            : 'bg-amber-100 text-amber-700'
                            }`}>
                            {isVerified ? '✓ Verified' : 'Pending Verification'}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-2 bg-white">
                        <DropdownMenuItem asChild className="rounded-none focus:bg-slate-50 py-3 cursor-pointer">
                          <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3">
                            <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Dashboard</span>
                          </Link>
                        </DropdownMenuItem>
                        {showVerifiedUI && (
                          <DropdownMenuItem asChild className="rounded-none focus:bg-slate-50 py-3 cursor-pointer">
                            <Link to={createPageUrl('MyListings')} className="flex items-center gap-3">
                              <List className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">My Listings</span>
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild className="rounded-none focus:bg-slate-50 py-3 cursor-pointer">
                          <Link to={createPageUrl('Settings')} className="flex items-center gap-3">
                            <Settings className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Settings</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-100" />
                        <DropdownMenuItem
                          onClick={() => api.auth.logout()}
                          className="rounded-none focus:bg-rose-50 py-3 cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <LogOut className="w-3.5 h-3.5 text-rose-400 group-hover:text-rose-600" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600">Log Out</span>
                          </div>
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="hidden md:flex items-center gap-4">
                  <Button
                    variant="ghost"
                    onClick={() => api.auth.redirectToLogin()}
                    className={`rounded-lg font-semibold text-[11px] uppercase tracking-[0.15em] transition-colors ${scrolled || !isHomePage ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                  >
                    Log In
                  </Button>
                  <Button
                    onClick={() => api.auth.redirectToLogin()}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 h-10 text-[11px] font-semibold uppercase tracking-[0.15em] shadow-lg shadow-blue-600/20 transition-all"
                  >
                    Sign Up
                  </Button>
                </div>
              )}

              {/* Mobile Menu Button - Architectural refinement */}
              <Button
                variant="ghost"
                size="icon"
                className={`lg:hidden h-9 w-9 rounded-lg transition-colors ${scrolled || !isHomePage ? 'text-slate-900 hover:bg-slate-100' : 'text-white hover:bg-white/10'}`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu - Prestigious Slide-down */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-2xl overflow-hidden"
            >
              <nav className="p-6 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={createPageUrl(item.path)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-5 py-4 transition-all duration-300 ${currentPageName === item.path
                      ? 'bg-slate-50 border-l-4 border-unswap-blue-deep text-unswap-blue-deep'
                      : 'text-slate-500 hover:bg-slate-50'
                      }`}
                  >
                    <item.icon className="w-4 h-4 capitalize" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">{item.name}</span>
                  </Link>
                ))}
                {showVerifiedUI && (
                  <>
                    <Link
                      to={createPageUrl('MyListings')}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-4 px-5 py-4 transition-all duration-300 ${currentPageName === 'MyListings'
                        ? 'bg-slate-50 border-l-4 border-unswap-blue-deep text-unswap-blue-deep'
                        : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                      <List className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase tracking-widest">My Listings</span>
                    </Link>
                    <Link
                      to={createPageUrl('MySwaps')}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-4 px-5 py-4 transition-all duration-300 ${currentPageName === 'MySwaps'
                        ? 'bg-slate-50 border-l-4 border-unswap-blue-deep text-unswap-blue-deep'
                        : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase tracking-widest">My Swaps</span>
                    </Link>
                  </>
                )}
                {isAdmin && (
                  <Link
                    to={createPageUrl('AdminDashboard')}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-4 px-5 py-4 text-amber-600 hover:bg-amber-50"
                  >
                    <Shield className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">Admin Dashboard</span>
                  </Link>
                )}

                {!user && (
                  <div className="pt-8 mt-6 border-t border-slate-100 flex flex-col gap-4">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        api.auth.redirectToLogin();
                      }}
                      className="justify-start h-14 rounded-none font-bold text-[10px] uppercase tracking-widest text-slate-600 hover:bg-slate-50"
                    >
                      <LogIn className="w-4 h-4 mr-3 text-slate-400" />
                      Log In
                    </Button>
                    <Button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        api.auth.redirectToLogin();
                      }}
                      className="w-full bg-unswap-blue-deep hover:bg-slate-900 text-white h-14 rounded-none text-xs font-bold uppercase tracking-[0.3em] shadow-xl"
                    >
                      Sign Up
                    </Button>
                  </div>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content - Precise offset */}
      <main className={isHomePage ? '' : 'pt-20'}>
        {children}
      </main>

      {/* Footer - Institutional Legacy Styling */}
      {
        currentPageName !== 'Home' && (
          <footer className="bg-slate-900 text-white py-20 px-6 border-t border-white/5">
            <div className="max-w-7xl mx-auto">
              <div className="grid md:grid-cols-4 gap-16">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <img
                      src={logo}
                      alt="UNswap"
                      className="w-10 h-10 object-contain grayscale brightness-200"
                    />
                    <span className="text-2xl font-extralight tracking-tighter">UN<span className="italic font-serif">swap</span></span>
                  </div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-[0.15em] leading-loose">
                    A secure home exchange network for international civil servants.
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-unswap-blue-deep mb-8">Platform</h4>
                  <div className="space-y-4 text-[10px] font-medium uppercase tracking-widest text-slate-400">
                    <Link to={createPageUrl('FindProperties')} className="block hover:text-white transition-colors">Find Properties</Link>
                    {showVerifiedUI && (
                      <>
                        <Link to={createPageUrl('MyListings')} className="block hover:text-white transition-colors">List Your Property</Link>
                        <Link to={createPageUrl('Dashboard')} className="block hover:text-white transition-colors">Dashboard</Link>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-unswap-blue-deep mb-8">Support</h4>
                  <div className="space-y-4 text-[10px] font-medium uppercase tracking-widest text-slate-400">
                    <a href="#" className="block hover:text-white transition-colors">Help Center</a>
                    <a href="#" className="block hover:text-white transition-colors">Trust & Safety</a>
                    <a href="#" className="block hover:text-white transition-colors">Contact Us</a>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-unswap-blue-deep mb-8">Legal</h4>
                  <div className="space-y-4 text-[10px] font-medium uppercase tracking-widest text-slate-400">
                    <a href="#" className="block hover:text-white transition-colors">Terms of Service</a>
                    <a href="#" className="block hover:text-white transition-colors">Privacy Policy</a>
                    <a href="#" className="block hover:text-white transition-colors">Insurance Info</a>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/5 mt-20 pt-8 text-center text-[9px] font-bold uppercase tracking-[0.4em] text-slate-500">
                © {new Date().getFullYear()} UNswap. All rights reserved. Built by staff, for staff.
              </div>
            </div>
          </footer>
        )
      }
    </div >
  );
}