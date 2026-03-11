import React from 'react';
import { motion } from 'framer-motion';
import { Coins, ShieldCheck, Home, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SmartCreditsSectionDark() {
  return (
    <section className="py-24 px-6 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start mb-20 gap-12">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-px bg-unswap-blue-deep/20" />
              <p className="text-unswap-blue-deep/60 font-bold tracking-[0.4em] uppercase text-[10px]">The Community</p>
            </div>
            <h2 className="text-4xl md:text-6xl font-extralight text-slate-900 tracking-tighter leading-tight mb-8">
              The <span className="italic font-serif">GuestPoints</span> <br />
              System.
            </h2>
            <p className="text-slate-500 text-lg font-light leading-relaxed">
              Every home swap is powered by our community-curated GuestPoints, ensuring fair and secure exchange.
            </p>
          </div>

          <div className="flex-shrink-0">
            <div className="p-8 bg-white border border-slate-200 shadow-2xl relative">
              <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-blue-500 mb-4">Current Status</div>
              <div className="text-4xl font-extralight text-slate-900 tracking-tighter mb-2">Invitation Only</div>
              <div className="text-slate-400 text-xs font-light tracking-wide">Standard membership is currently restricted.</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-1 px-1 bg-slate-200 border border-slate-200 shadow-2xl">
          {[
            {
              title: "Priority Booking",
              desc: "Priority access to high-demand residences in core locations.",
              icon: ShieldCheck
            },
            {
              title: "Reduced Fees",
              desc: "Significant fee reductions for early community members.",
              icon: Coins
            },
            {
              title: "Full Insurance",
              desc: "Comprehensive $2M insurance coverage for all swaps.",
              icon: Home
            },
            {
              title: "Direct Support",
              desc: "Dedicated support for cross-border swap security and logistics.",
              icon: Zap
            }
          ].map((perk, i) => (
            <div key={i} className="bg-white p-16 hover:bg-slate-50 transition-all duration-700 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50/50 -mr-12 -mt-12 rounded-full scale-0 group-hover:scale-100 transition-transform duration-1000" />
              <perk.icon className="w-7 h-7 text-unswap-blue-deep/30 mb-8 group-hover:text-unswap-blue-deep group-hover:scale-110 transition-all duration-500" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-900 mb-6">{perk.title}</h3>
              <p className="text-slate-400 text-sm font-light leading-relaxed max-w-xs">{perk.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}