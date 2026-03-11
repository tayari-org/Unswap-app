import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, MessageSquare, Video, Home, Star } from 'lucide-react';

const steps = [
  {
    icon: Shield,
    title: 'Diplomatic Vault Entry',
    description: 'Secure verification via institutional domain. Biometric validation ensures total community integrity.',
  },
  {
    icon: Search,
    title: 'Anchor Discovery',
    description: 'Filter by duty station proximity, swap duration, and mission-ready amenities.',
  },
  {
    icon: MessageSquare,
    title: 'Secure Connection',
    description: 'Initiate swap requests with verified colleagues through encrypted diplomatic channels.',
  },
  {
    icon: Video,
    title: 'Handshake Protocol',
    description: 'Establish mutual trust via a mandatory secure video briefing before finalization.',
  },
  {
    icon: Home,
    title: 'Execute Swap',
    description: 'Inviolability Guarantee active. $2M institutional insurance coverage deployed.',
  },
  {
    icon: Star,
    title: 'Protocol Review',
    description: 'Contribute to the collective trust score of the International Civil Service community.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-[#05080F] relative overflow-hidden">
      {/* Background visual texture */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#1e293b,transparent)] opacity-30" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="flex justify-center mb-4">
            <span className="px-4 py-1 rounded-full border border-blue-500/30 bg-blue-500/5 text-blue-400 text-[10px] font-bold tracking-[0.3em] uppercase">
              The Exchange Protocol
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extralight text-white tracking-tighter max-w-3xl mx-auto leading-tight">
            Institutional-grade security meets <br />
            <span className="italic font-serif text-blue-100/80">Staff-led innovation.</span>
          </h2>
        </motion.div>

        <div className="relative">
          {/* Subtle Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2" />

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative"
              >
                <div className="h-full bg-white/[0.02] border border-white/10 rounded-2xl p-8 backdrop-blur-sm hover:bg-white/[0.04] hover:border-blue-500/50 transition-all duration-500 shadow-2xl">

                  {/* Protocol Number */}
                  <div className="text-[10px] font-mono text-blue-500/50 mb-6 tracking-widest uppercase">
                    Protocol 00{index + 1}
                  </div>

                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                    <step.icon className="w-6 h-6 text-blue-400" />
                  </div>

                  <h3 className="text-xl font-medium text-white mb-4 tracking-tight">
                    {step.title}
                  </h3>

                  <p className="text-slate-400 font-light leading-relaxed text-sm">
                    {step.description}
                  </p>

                  {/* Decorative corner element */}
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-2 h-2 border-r border-b border-blue-500/50" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Trust Signal */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-20 text-center"
        >
          <p className="text-slate-500 text-xs font-mono uppercase tracking-[0.2em]">
            End-to-End Encrypted & Insured by Lloyd's of London
          </p>
        </motion.div>
      </div>
    </section>
  );
}