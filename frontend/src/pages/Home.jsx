import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion, useScroll, useSpring } from 'framer-motion';
import logo from '@/assets/logo.png';

import HeroSection from '../components/home/HeroSection';
import FeaturedProperties from '../components/home/FeaturedProperties';
import HowItWorks from '../components/home/HowItWorks';
import TrustSection from '../components/home/TrustSection';
import GuestPointsSection from '../components/home/GuestPointsSection';
import ActivityFeed from '../components/home/ActivityFeed';

export default function Home() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const isAuth = await api.auth.isAuthenticated();
      if (!isAuth) return null;
      return api.auth.me();
    },
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['featured-assets'],
    queryFn: () => api.entities.Property.filter({ status: 'active', is_featured: true }, '-created_date', 6),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['protocol-logs'],
    queryFn: () => api.entities.ActivityLog.filter({ is_public: true }, '-created_date', 10),
  });

  return (
    <div className="min-h-screen bg-white selection:bg-blue-500/10">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-blue-600 origin-left z-50"
        style={{ scaleX }}
      />

      {/* Hero */}
      <HeroSection user={user} />

      {/* Main Content */}
      <main className="relative">
        <section className="bg-white">
          <FeaturedProperties properties={properties} />
        </section>

        <section className="bg-white">
          <HowItWorks />
        </section>

        <section className="bg-white">
          <TrustSection />
        </section>

        <section className="bg-slate-50 border-y border-slate-100">
          <GuestPointsSection />
        </section>

        <ActivityFeed activities={activities} />
      </main>

      {/* Footer */}
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

            {[
              { title: 'Platform', links: ['Asset Discovery', 'List Residence', 'Mission Control'] },
              { title: 'Governance', links: ['Security Protocol', 'Arbitration', 'Insurance Policy'] },
              { title: 'Agency', links: ['Staff Innovation', 'Directory', 'Press Office'] }
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-[10px] tracking-[0.3em] uppercase text-blue-500 font-bold mb-6">{col.title}</h4>
                <ul className="space-y-4 text-sm font-light text-slate-400">
                  {col.links.map(link => (
                    <li key={link}><a href="#" className="hover:text-white transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 gap-4">
            <div className="text-[10px] tracking-widest text-slate-600 uppercase font-mono">
              © 2026 UNswap Protocol // Inviolability Ensured
            </div>
            <div className="flex gap-8 text-[10px] tracking-widest text-slate-600 uppercase font-mono">
              <a href="#" className="hover:text-blue-500 transition-colors">Privacy</a>
              <a href="#" className="hover:text-blue-500 transition-colors">Terms</a>
              <a href="#" className="hover:text-blue-500 transition-colors">Nodes</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}