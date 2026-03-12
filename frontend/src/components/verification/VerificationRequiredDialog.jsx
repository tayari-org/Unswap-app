import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Shield, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function VerificationRequiredDialog({ open, onOpenChange, action = 'access this feature' }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 rounded-none border-0 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-10 border-b bg-slate-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-px bg-amber-500/20" />
            <p className="text-amber-600 font-bold tracking-[0.4em] uppercase text-[9px]">Security Protocol</p>
          </div>
          <DialogTitle className="text-3xl font-extralight text-slate-900 tracking-tighter leading-tight">
            Accreditation <span className="italic font-serif">Required.</span>
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm font-light mt-4 leading-relaxed">
            To {action}, complete your institutional verification. This ensures the integrity and security of the UNswap global network.
          </DialogDescription>
        </DialogHeader>

        <div className="p-10 space-y-4">
          {[
            { title: "Diplomatic Shield Protection", desc: "Access $2M institutional insurance coverage" },
            { title: "Trusted Network Access", desc: "Connect with verified global colleagues" },
            { title: "Full Platform Privilege", desc: "List properties and authorize secure exchanges" }
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4 p-5 bg-white border border-slate-100 shadow-sm leading-6">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="font-bold text-slate-900 text-[10px] uppercase tracking-widest">{item.title}</p>
                <p className="text-slate-500 text-xs font-light tracking-tight mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="p-10 border-t bg-slate-50/50 flex flex-col gap-4 sm:flex-col">
          <Link to={createPageUrl('Settings') + '?tab=verification'} className="w-full">
            <Button className="w-full h-14 rounded-none bg-unswap-blue-deep hover:bg-slate-900 text-white shadow-xl text-[10px] font-bold uppercase tracking-[0.4em] transition-all">
              Initialize Professional Accreditation
              <ArrowRight className="w-4 h-4 ml-3" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full h-14 rounded-none text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 hover:text-slate-900 transition-colors"
          >
            Acknowledge & Dismiss
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}