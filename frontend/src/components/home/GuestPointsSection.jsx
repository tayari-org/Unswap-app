import React from 'react';
import { motion } from 'framer-motion';
import { Coins, ShieldCheck, Home, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SmartCreditsSectionDark() {
  return (
    <section className="py-24 px-6 bg-[#05080F] relative overflow-hidden">
      {/* Subtle Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-stretch">
          
          {/* 1. LIST YOUR RESIDENCE - THE ASSET SIDE */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="group bg-white/[0.03] backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/10 hover:border-blue-500/30 transition-all duration-500 flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-8 border border-blue-500/20">
                <Home className="w-7 h-7 text-blue-400" />
              </div>

              <h3 className="text-2xl md:text-3xl font-extralight text-white mb-4 tracking-tighter">
                Register Your <span className="italic font-serif text-blue-100/80">Residence</span>
              </h3>

              <p className="text-slate-400 mb-8 leading-relaxed font-light">
                Unlock the value of your primary residence during rotations or R&R. Earn Smart Credits or secure reciprocal stays within our vetted circle.
              </p>

              <ul className="space-y-4 mb-10">
                {[
                  'Earn Smart Credits for every validated night',
                  'Access the global Directory of Sovereign Assets',
                  'Inviolability Guarantee & $2M Coverage',
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-4 text-slate-300 text-sm">
                    <ShieldCheck className="w-5 h-5 text-blue-500/50" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <Link to={createPageUrl('MyListings')} className="w-full">
              <Button className="w-full h-14 bg-white text-black hover:bg-blue-50 font-bold rounded-xl transition-all group">
                Register Listing
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          {/* 2. THE CREDIT SYSTEM - THE CURRENCY SIDE */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-600/20 to-indigo-900/20 backdrop-blur-2xl rounded-3xl p-8 md:p-12 border border-blue-500/20 flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-8 border border-white/10">
                <Zap className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-2xl md:text-3xl font-extralight text-white mb-4 tracking-tighter">
                The <span className="italic font-serif text-blue-100/80">Smart Credit</span> Protocol
              </h3>

              <p className="text-slate-300 mb-10 leading-relaxed font-light">
                Non-reciprocal exchange powered by institutional trust. Book stays instantly using your credit balance—calculated by property grade and duty station demand.
              </p>

              <div className="grid grid-cols-3 gap-4 mb-10">
                {[
                  { value: '500', label: 'Vault Entry' },
                  { value: '200', label: 'Avg Night' },
                  { value: 'S-Tier', label: 'Security' },
                ].map((stat, i) => (
                  <div key={i} className="text-center p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="text-2xl font-bold text-white tracking-tighter">{stat.value}</div>
                    <div className="text-[10px] text-blue-400 uppercase tracking-widest font-bold mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <Button variant="outline" className="w-full h-14 border-white/20 bg-transparent text-white hover:bg-white/5 rounded-xl font-bold">
              Access Directory
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>

        {/* STATS ROW - THE PROOF */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12"
        >
          {[
            { value: '98%', label: 'Trust Index' },
            { value: '< 12h', label: 'Response Protocol' },
            { value: '4.9/5', label: 'Asset Rating' },
            { value: '45+', label: 'Active Missions' },
          ].map((stat, index) => (
            <div key={index} className="text-center py-8 bg-white/[0.02] rounded-2xl border border-white/5">
              <div className="text-2xl font-light text-white tracking-tighter">{stat.value}</div>
              <div className="text-[10px] tracking-[0.2em] font-bold text-slate-500 uppercase mt-2">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}