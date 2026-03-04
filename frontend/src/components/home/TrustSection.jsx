import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Umbrella, Scale, Check } from 'lucide-react';

const trustFeatures = [
  {
    icon: Shield,
    stat: '100%',
    title: 'Verified Community',
    description: 'Every member is verified through institutional email or diplomatic credentials',
  },
  {
    icon: Lock,
    stat: '256-bit',
    title: 'End-to-End Encryption',
    description: 'All communications and data are protected with enterprise-grade security',
  },
  {
    icon: Umbrella,
    stat: '$2M',
    title: 'Insurance Coverage',
    description: 'Every swap is backed by comprehensive insurance from Clements',
  },
  {
    icon: Scale,
    stat: 'Legal',
    title: 'Arbitration Framework',
    description: 'Private dispute resolution designed for the diplomatic community',
  },
];

const verificationMethods = [
  '@un.org domains',
  '@worldbank.org',
  '@imf.org',
  'UN Laissez-Passer',
  'Diplomatic ID',
];

export default function TrustSectionLight() {
  return (
    <section className="py-24 px-6 bg-white text-slate-900 overflow-hidden relative">
      {/* Subtle background element for texture */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 md:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 mb-4">
            <span className="text-indigo-600 font-bold tracking-[0.2em] uppercase text-[10px]">The Diplomatic Vault</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extralight tracking-tighter mb-6">
            Institutional-Grade <span className="italic font-serif text-slate-700">Protection</span>
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-base font-light">
            Security protocols designed specifically for the international civil service. 
            Because trust is our most valuable asset.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {trustFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group bg-slate-50/50 p-8 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500"
            >
              <div className="text-4xl font-bold text-indigo-600 mb-4 tracking-tighter group-hover:scale-110 transition-transform origin-left">
                {feature.stat}
              </div>
              <div className="flex items-center gap-2 mb-3">
                <feature.icon className="w-4 h-4 text-slate-400" />
                <h3 className="text-lg font-semibold text-slate-800 tracking-tight">{feature.title}</h3>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed font-light">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-indigo-900 rounded-[2.5rem] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl"
        >
          {/* Decorative background circle */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          
          <h3 className="text-2xl font-light mb-10 text-center tracking-tight">
            Accepted <span className="italic font-serif opacity-80">Verification</span> Methods
          </h3>
          
          <div className="flex flex-wrap justify-center gap-3">
            {verificationMethods.map((method, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/10 transition-colors hover:bg-white/20"
              >
                <div className="w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-emerald-900" strokeWidth={3} />
                </div>
                <span className="text-sm font-medium tracking-wide">{method}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}