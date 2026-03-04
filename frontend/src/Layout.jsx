import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/logo.png';
import {
  Home, Search, List, LayoutDashboard, Settings, MessageSquare, Shield,
  Menu, X, User, LogIn, LogOut, Coins, ChevronDown
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled || !isHomePage
        ? 'bg-white/95 backdrop-blur-sm shadow-sm'
        : 'bg-transparent'
        }`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <img
                src={logo}
                alt="UNswap"
                className="w-10 h-10"
              />
              <span className={`text-xl font-bold ${scrolled || !isHomePage ? 'text-slate-900' : 'text-white'
                }`}>
                UNswap
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={createPageUrl(item.path)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentPageName === item.path
                    ? scrolled || !isHomePage
                      ? 'bg-slate-100 text-slate-900'
                      : 'bg-white/20 text-white'
                    : scrolled || !isHomePage
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                >
                  {item.name}
                </Link>
              ))}
              {showVerifiedUI && (
                <>
                  <Link
                    to={createPageUrl('MyListings')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentPageName === 'MyListings'
                      ? scrolled || !isHomePage
                        ? 'bg-slate-100 text-slate-900'
                        : 'bg-white/20 text-white'
                      : scrolled || !isHomePage
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    My Listings
                  </Link>
                  <Link
                    to={createPageUrl('MySwaps')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentPageName === 'MySwaps'
                      ? scrolled || !isHomePage
                        ? 'bg-slate-100 text-slate-900'
                        : 'bg-white/20 text-white'
                      : scrolled || !isHomePage
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    My Swaps
                  </Link>
                </>
              )}
              {isAdmin && (
                <Link
                  to={createPageUrl('AdminDashboard')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${currentPageName === 'AdminDashboard'
                    ? scrolled || !isHomePage
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-amber-500/20 text-amber-300'
                    : scrolled || !isHomePage
                      ? 'text-amber-600 hover:bg-amber-50'
                      : 'text-amber-400 hover:bg-amber-500/10'
                    }`}
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Link>
              )}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {/* Notifications */}
                  <div className={scrolled || !isHomePage ? 'text-slate-600' : 'text-white'}>
                    <NotificationCenter user={user} />
                  </div>

                  {/* Messages */}
                  <Link to={createPageUrl('Messages')}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`relative ${scrolled || !isHomePage ? 'text-slate-600' : 'text-white'}`}
                    >
                      <MessageSquare className="w-5 h-5" />
                      {(() => {
                        const unreadCount = messages.filter(m =>
                          m.recipient_email === user?.email && !m.is_read
                        ).length;
                        return unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        );
                      })()}
                    </Button>
                  </Link>

                  {/* Points */}
                  <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full ${scrolled || !isHomePage ? 'bg-amber-50 text-amber-700' : 'bg-white/10 text-white'
                    }`}>
                    <Coins className="w-4 h-4" />
                    <span className="text-sm font-semibold">{user.guest_points || 500}</span>
                  </div>

                  {/* User Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-2 border-white">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <ChevronDown className={`w-4 h-4 hidden md:block ${scrolled || !isHomePage ? 'text-slate-400' : 'text-white/60'
                          }`} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-3 py-2">
                        <p className="font-medium text-slate-900">{user.username || user.full_name}</p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                        <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isVerified
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                          }`}>
                          {isVerified ? '✓ Verified' : 'Pending Verification'}
                        </span>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl('Dashboard')} className="cursor-pointer">
                          <LayoutDashboard className="w-4 h-4 mr-2" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      {showVerifiedUI && (
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl('MyListings')} className="cursor-pointer">
                            <List className="w-4 h-4 mr-2" />
                            My Listings
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl('Settings')} className="cursor-pointer">
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => api.auth.logout()}
                        className="text-red-600 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Log Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => api.auth.redirectToLogin()}
                    className={scrolled || !isHomePage ? 'text-slate-600' : 'text-white'}
                  >
                    Log In
                  </Button>
                  <Button
                    onClick={() => api.auth.redirectToLogin()}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    Unlock Access
                  </Button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className={`md:hidden ${scrolled || !isHomePage ? 'text-slate-600' : 'text-white'}`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-slate-200"
            >
              <nav className="px-6 py-4 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={createPageUrl(item.path)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg ${currentPageName === item.path
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                ))}
                {showVerifiedUI && (
                  <>
                    <Link
                      to={createPageUrl('MyListings')}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg ${currentPageName === 'MyListings'
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      <List className="w-5 h-5" />
                      My Listings
                    </Link>
                    <Link
                      to={createPageUrl('MySwaps')}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg ${currentPageName === 'MySwaps'
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      <MessageSquare className="w-5 h-5" />
                      My Swaps
                    </Link>
                  </>
                )}
                {isAdmin && (
                  <Link
                    to={createPageUrl('AdminDashboard')}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-amber-600 hover:bg-amber-50"
                  >
                    <Shield className="w-5 h-5" />
                    Admin Dashboard
                  </Link>
                )}

                {!user && (
                  <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        api.auth.redirectToLogin();
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 justify-start h-auto font-medium"
                    >
                      <LogIn className="w-5 h-5 text-slate-400" />
                      Log In
                    </Button>
                    <Button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        api.auth.redirectToLogin();
                      }}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white py-6 text-base font-semibold shadow-lg shadow-amber-200"
                    >
                      Unlock Access
                    </Button>
                  </div>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className={isHomePage ? '' : 'pt-16'}>
        {children}
      </main>

      {/* Footer */}
      {
        currentPageName !== 'Home' && (
          <footer className="bg-slate-900 text-white py-12 px-6">
            <div className="max-w-7xl mx-auto">
              <div className="grid md:grid-cols-4 gap-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <img
                      src={logo}
                      alt="UNswap"
                      className="w-10 h-10"
                    />
                    <span className="text-xl font-bold">UNswap</span>
                  </div>
                  <p className="text-slate-400 text-sm">
                    A secure home exchange network for international civil servants.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Platform</h4>
                  <div className="space-y-2 text-sm text-slate-400">
                    <Link to={createPageUrl('FindProperties')} className="block hover:text-white">Find Properties</Link>
                    {showVerifiedUI && (
                      <>
                        <Link to={createPageUrl('MyListings')} className="block hover:text-white">List Your Property</Link>
                        <Link to={createPageUrl('Dashboard')} className="block hover:text-white">Dashboard</Link>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Support</h4>
                  <div className="space-y-2 text-sm text-slate-400">
                    <a href="#" className="block hover:text-white">Help Center</a>
                    <a href="#" className="block hover:text-white">Trust & Safety</a>
                    <a href="#" className="block hover:text-white">Contact Us</a>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Legal</h4>
                  <div className="space-y-2 text-sm text-slate-400">
                    <a href="#" className="block hover:text-white">Terms of Service</a>
                    <a href="#" className="block hover:text-white">Privacy Policy</a>
                    <a href="#" className="block hover:text-white">Insurance Info</a>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-500">
                © {new Date().getFullYear()} UNswap. All rights reserved. Built by staff, for staff.
              </div>
            </div>
          </footer>
        )
      }
    </div >
  );
}