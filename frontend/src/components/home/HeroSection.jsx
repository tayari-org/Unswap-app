import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Shield, Globe, ArrowRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function HeroSection({ user }) {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className="relative h-screen min-h-[650px] max-h-[900px] flex items-center justify-center overflow-hidden bg-[#05080f] px-6">

      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=2000"
          alt="Diplomatic Hub"
          className="w-full h-full object-cover opacity-40 grayscale-[0.5]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05080f]/80 via-[#05080f]/60 to-[#05080f]" />
      </div>

      <div className="max-w-5xl mx-auto w-full relative z-10 flex flex-col items-center text-center">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6 backdrop-blur-md"
        >
          <Shield className="w-3 h-3 text-blue-400" />
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-blue-100/80">
            Institutional Mobility Protocol
          </span>
        </motion.div>

        {/* Title — properly scaled, not zoomed */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extralight tracking-tighter text-white leading-[1.1] mb-6"
        >
          Secure Home Exchange for <br />
          <span className="italic font-serif text-blue-200/90">Global Civil Servants.</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm md:text-base lg:text-lg text-slate-400 font-light max-w-2xl mb-10 leading-relaxed"
        >
          The exclusive, peer-to-peer network connecting verified staff from the UN,
          World Bank, and international agencies across 193 member states.
        </motion.p>

        {/* Action Cluster */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-12"
        >
          <Link to={createPageUrl('FindProperties')}>
            <Button className="h-12 px-8 bg-blue-600 text-white hover:bg-blue-500 rounded-xl font-medium text-base shadow-lg shadow-blue-900/20 transition-all group border-none">
              Explore Properties
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          <Button
            variant="outline"
            onClick={() => {
              const howItWorks = document.getElementById('how-it-works');
              howItWorks?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="h-12 px-8 border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-xl font-medium text-base backdrop-blur-md"
          >
            <Globe className="w-4 h-4 mr-2 text-blue-400" />
            How it Works
          </Button>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="pt-8 border-t border-white/5 flex flex-wrap justify-center gap-x-10 gap-y-4"
        >
          {['Verified Agencies', 'Lloyd\u2019s Insured', 'Encrypted'].map((text, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1 h-1 bg-blue-500 rounded-full" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{text}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        style={{ opacity }}
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-500 opacity-50"
      >
        <ChevronDown className="w-5 h-5" />
      </motion.div>
    </section>
  );
}