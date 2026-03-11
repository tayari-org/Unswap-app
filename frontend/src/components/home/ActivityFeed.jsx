import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Home, UserCheck, Star, Activity } from 'lucide-react';

const activityIcons = {
  swap_completed: ArrowLeftRight,
  new_listing: Home,
  new_member: UserCheck,
  verification_approved: UserCheck,
  review_posted: Star,
};

const activityColors = {
  swap_completed: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  new_listing: 'bg-slate-50 text-slate-600 border-slate-200',
  new_member: 'bg-blue-50 text-blue-600 border-blue-100',
  verification_approved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  review_posted: 'bg-indigo-50 text-indigo-600 border-indigo-100',
};

export default function ActivityFeed({ activities = [] }) {
  const displayActivities = activities.length > 0 ? activities : [
    { id: 1, activity_type: 'swap_completed', description: 'P-4 (Geneva) \u21c4 P-3 (New York) Swap Secured', created_date: new Date().toISOString() },
    { id: 2, activity_type: 'new_listing', description: 'New Secure Residence: Gigiri, Nairobi (UNON)', created_date: new Date().toISOString() },
    { id: 3, activity_type: 'new_member', description: 'WHO Personnel (Bangkok) joined the Vault', created_date: new Date().toISOString() },
    { id: 4, activity_type: 'swap_completed', description: 'Diplomatic Mission Complete: D-1 (Vienna)', created_date: new Date().toISOString() },
  ];

  return (
    <section className="py-12 px-6 bg-white border-y border-slate-100 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white">
            <Activity className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Live Network Feed</span>
          </div>
          <div className="h-px flex-grow bg-slate-100" />
        </motion.div>

        {/* Scrolling Ticker */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-white via-white/80 to-transparent z-10" />

          <motion.div
            animate={{ x: [0, -1500] }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            className="flex gap-6 items-center"
          >
            {[...displayActivities, ...displayActivities, ...displayActivities].map((activity, index) => {
              const Icon = activityIcons[activity.activity_type] || ArrowLeftRight;
              const style = activityColors[activity.activity_type] || 'bg-slate-50 text-slate-600 border-slate-100';

              return (
                <div
                  key={index}
                  className={`flex-shrink-0 flex items-center gap-4 px-6 py-3 rounded-xl border ${style} shadow-sm bg-white/50 backdrop-blur-sm group hover:border-indigo-400 transition-colors cursor-default`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900 whitespace-nowrap tracking-tight">
                      {activity.description}
                    </span>
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 font-medium">
                      {activity.activity_type.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="w-1 h-1 rounded-full bg-slate-200 ml-2" />
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}