import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { AvatarUI } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/logo.png';
import {
  Home, Search, List, LayoutDashboard, Settings, MessageSquare, Shield,
  Menu, X, User, LogIn, LogOut, Coins, ChevronDown, Bell, ArrowLeftRight
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
    <div className="min-h-screen bg-[#F8FAFC] font-display">
      {/* Navigation */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled || !isHomePage
        ? 'bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm'
        : 'bg-transparent'
        }`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Refined Architectural Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-2.5 group">
              <img
                src={logo}
                alt="UNswap"
                className="h-10 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
              />
              <span className={`text-xl font-light tracking-tight transition-colors ${scrolled || !isHomePage ? 'text-slate-900' : 'text-white'}`}>UN<span className="italic font-serif">swap</span></span>
            </Link>

            {/* Desktop Navigation - Minimalist High-Contrast */}
            <nav className="hidden lg:flex items-center gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={createPageUrl(item.path)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-sm border-b-2 text-[13px] tracking-wide transition-all duration-300 ${currentPageName === item.path
                    ? scrolled || !isHomePage
                      ? 'border-unswap-blue-deep text-unswap-blue-deep font-semibold'
                      : 'border-white text-white font-semibold'
                    : scrolled || !isHomePage
                      ? 'border-transparent text-slate-500 font-medium hover:text-slate-900 hover:border-slate-300'
                      : 'border-transparent text-white/60 font-medium hover:text-white hover:border-white/30'
                    }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.name}
                </Link>
              ))}
              {user && (
                <Link
                  to={createPageUrl('Dashboard')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-sm border-b-2 text-[13px] tracking-wide transition-all duration-300 ${currentPageName === 'Dashboard'
                    ? scrolled || !isHomePage
                      ? 'border-unswap-blue-deep text-unswap-blue-deep font-semibold'
                      : 'border-white text-white font-semibold'
                    : scrolled || !isHomePage
                      ? 'border-transparent text-slate-500 font-medium hover:text-slate-900 hover:border-slate-300'
                      : 'border-transparent text-white/60 font-medium hover:text-white hover:border-white/30'
                    }`}
                >
                  <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                  Dashboard
                </Link>
              )}
              {user && (
                <>
                  <Link
                    to={createPageUrl('MyListings')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-sm border-b-2 text-[13px] tracking-wide transition-all duration-300 ${currentPageName === 'MyListings'
                      ? scrolled || !isHomePage
                        ? 'border-unswap-blue-deep text-unswap-blue-deep font-semibold'
                        : 'border-white text-white font-semibold'
                      : scrolled || !isHomePage
                        ? 'border-transparent text-slate-500 font-medium hover:text-slate-900 hover:border-slate-300'
                        : 'border-transparent text-white/60 font-medium hover:text-white hover:border-white/30'
                      }`}
                  >
                    <List className="w-4 h-4 flex-shrink-0" />
                    My Listings
                  </Link>
                  <Link
                    to={createPageUrl('MySwaps')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-sm border-b-2 text-[13px] tracking-wide transition-all duration-300 ${currentPageName === 'MySwaps'
                      ? scrolled || !isHomePage
                        ? 'border-unswap-blue-deep text-unswap-blue-deep font-semibold'
                        : 'border-white text-white font-semibold'
                      : scrolled || !isHomePage
                        ? 'border-transparent text-slate-500 font-medium hover:text-slate-900 hover:border-slate-300'
                        : 'border-transparent text-white/60 font-medium hover:text-white hover:border-white/30'
                      }`}
                  >
                    <ArrowLeftRight className="w-4 h-4 flex-shrink-0" />
                    My Swaps
                  </Link>
                </>
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

                  {/* Messages - verified only */}
                  {user && (
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
                  )}

                  {/* Points - Institutional Credit */}
                  <Link 
                    to={createPageUrl('Dashboard') + '?tab=guest-points'}
                    className={`hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-lg border transition-all duration-500 hover:shadow-md ${scrolled || !isHomePage ? 'bg-slate-50 border-slate-200 text-slate-900 group/points hover:border-unswap-blue-deep/30' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    <Coins className={`w-3.5 h-3.5 transition-transform duration-500 group-hover/points:scale-110 ${scrolled || !isHomePage ? 'text-unswap-blue-deep' : 'text-amber-300'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-widest leading-none">{user.guest_points ?? 500} PTS</span>
                  </Link>

                  {/* User Menu - Prestigious Profile Trigger */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-3 focus:outline-none group">
                        <div className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all duration-500 group-hover:shadow-lg ${scrolled || !isHomePage ? 'border-slate-200' : 'border-white/20'}`}>
                          <AvatarUI user={user} className="w-full h-full text-[12px]" imgClassName="transition-transform duration-700 group-hover:scale-110" />
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
                        {isAdmin && (
                          <DropdownMenuItem asChild className="rounded-none focus:bg-amber-50 py-3 cursor-pointer">
                            <Link to={createPageUrl('AdminDashboard')} className="flex items-center gap-3">
                              <Shield className="w-3.5 h-3.5 text-amber-400" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Admin Dashboard</span>
                            </Link>
                          </DropdownMenuItem>
                        )}
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
                <div className="hidden md:flex items-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => api.auth.redirectToLogin()}
                    className={`rounded-sm font-medium text-[13px] tracking-wide transition-colors ${scrolled || !isHomePage ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                  >
                    <LogIn className="w-4 h-4 mr-1.5" />
                    Log In
                  </Button>
                  <Link
                    to="/login?tab=register"
                    className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 h-9 text-[13px] font-medium tracking-wide shadow-lg shadow-blue-600/20 transition-all"
                  >
                    Sign Up
                  </Link>
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
              <nav className="p-4 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={createPageUrl(item.path)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-sm border-l-[3px] transition-all duration-300 ${currentPageName === item.path
                      ? 'border-unswap-blue-deep bg-blue-50/60 text-unswap-blue-deep'
                      : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-[13px] font-medium tracking-wide">{item.name}</span>
                  </Link>
                ))}
                {user && (
                  <Link
                    to={createPageUrl('Dashboard')}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-sm border-l-[3px] transition-all duration-300 ${currentPageName === 'Dashboard'
                      ? 'border-unswap-blue-deep bg-blue-50/60 text-unswap-blue-deep'
                      : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                    <span className="text-[13px] font-medium tracking-wide">Dashboard</span>
                  </Link>
                )}
                {user && (
                  <>
                    <Link
                      to={createPageUrl('MyListings')}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-sm border-l-[3px] transition-all duration-300 ${currentPageName === 'MyListings'
                        ? 'border-unswap-blue-deep bg-blue-50/60 text-unswap-blue-deep'
                        : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                      <List className="w-4 h-4 flex-shrink-0" />
                      <span className="text-[13px] font-medium tracking-wide">My Listings</span>
                    </Link>
                    <Link
                      to={createPageUrl('MySwaps')}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-sm border-l-[3px] transition-all duration-300 ${currentPageName === 'MySwaps'
                        ? 'border-unswap-blue-deep bg-blue-50/60 text-unswap-blue-deep'
                        : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                      <ArrowLeftRight className="w-4 h-4 flex-shrink-0" />
                      <span className="text-[13px] font-medium tracking-wide">My Swaps</span>
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
                      className="justify-start h-12 rounded-lg font-medium text-[13px] tracking-wide text-slate-600 hover:bg-slate-50"
                    >
                      <LogIn className="w-4 h-4 mr-3 text-slate-400" />
                      Log In
                    </Button>
                    <Link
                      to="/login?tab=register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center w-full bg-unswap-blue-deep hover:bg-slate-900 text-white h-12 rounded-lg text-[13px] font-medium tracking-wide shadow-xl"
                    >
                      Sign Up
                    </Link>
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

      {/* Footer */}
      {
        !['Home', 'Messages', 'Dashboard', 'AdminDashboard', 'MyListings', 'MySwaps', 'Settings', 'HostProfile', 'GuestDashboard'].includes(currentPageName) && (
          <footer className="bg-[#05080f] border-t border-white/5 pt-24 pb-12 px-6">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
                <div className="col-span-2">
                  <div className="flex items-center gap-3 mb-6">
                    <img
                      src={logo}
                      alt="UNswap Logo"
                      className="w-10 h-10 grayscale brightness-200"
                    />
                    <span className="text-xl font-bold tracking-tighter text-white uppercase">UNSWAP</span>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-sm font-light">
                    The exclusive mobility protocol for the international civil service.
                    Securing home exchanges across 193 member states.
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] tracking-[0.3em] uppercase text-blue-500 font-bold mb-6">Platform</h4>
                  <ul className="space-y-4 text-sm font-light text-slate-400">
                    <li><Link to={createPageUrl('FindProperties')} className="hover:text-white transition-colors">Asset Discovery</Link></li>
                    {showVerifiedUI && (
                      <>
                        <li><Link to={createPageUrl('MyListings')} className="hover:text-white transition-colors">List Residence</Link></li>
                        <li><Link to={createPageUrl('Dashboard')} className="hover:text-white transition-colors">Mission Control</Link></li>
                      </>
                    )}
                  </ul>
                </div>

                <div>
                  <h4 className="text-[10px] tracking-[0.3em] uppercase text-blue-500 font-bold mb-6">Governance</h4>
                  <ul className="space-y-4 text-sm font-light text-slate-400">
                    <li><a href="#" className="hover:text-white transition-colors">Security Protocol</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Arbitration</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Insurance Policy</a></li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-[10px] tracking-[0.3em] uppercase text-blue-500 font-bold mb-6">Agency</h4>
                  <ul className="space-y-4 text-sm font-light text-slate-400">
                    <li><a href="#" className="hover:text-white transition-colors">Staff Innovation</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Directory</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Press Office</a></li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 gap-4">
                <div className="text-[10px] tracking-widest text-slate-600 uppercase font-mono">
                  © {new Date().getFullYear()} UNswap Protocol // Inviolability Ensured
                </div>
                <div className="flex gap-8 text-[10px] tracking-widest text-slate-600 uppercase font-mono">
                  <a href="#" className="hover:text-blue-500 transition-colors">Privacy</a>
                  <a href="#" className="hover:text-blue-500 transition-colors">Terms</a>
                  <a href="#" className="hover:text-blue-500 transition-colors">Nodes</a>
                </div>
              </div>
            </div>
          </footer>
        )
      }
    </div >
  );
}