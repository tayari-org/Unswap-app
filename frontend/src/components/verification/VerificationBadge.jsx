import React from 'react';
import { Shield, CheckCircle, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function VerificationBadge({ verification, size = 'default', showLabel = true }) {
  if (!verification || verification.status !== 'approved') return null;

  const getVerificationInfo = () => {
    switch (verification.verification_level) {
      case 'staff':
        return {
          icon: Shield,
          label: 'Institutional Staff',
          color: 'bg-unswap-blue-deep/5 text-unswap-blue-deep border-unswap-blue-deep/20',
          description: 'Verified international organization staff member',
        };
      case 'trusted':
        return {
          icon: CheckCircle,
          label: 'Trust Accredited',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          description: 'Highest trust level with comprehensive verification signals',
        };
      case 'verified':
        return {
          icon: Shield,
          label: 'Identity Verified',
          color: 'bg-slate-50 text-slate-600 border-slate-200',
          description: 'Authentication via government-issued credentials',
        };
      default:
        return null;
    }
  };

  const info = getVerificationInfo();
  if (!info) return null;

  const Icon = info.icon;
  const iconSize = size === 'small' ? 'w-3 h-3' : 'w-4 h-4';
  const textSize = size === 'small' ? 'text-xs' : 'text-sm';

  const badgeContent = (
    <Badge variant="outline" className={`${info.color} border rounded-none ${textSize} font-bold uppercase tracking-[0.2em] py-1.5 px-3 shadow-sm transition-all hover:shadow-md`}>
      <Icon className={`${iconSize} ${showLabel ? 'mr-3' : ''} opacity-60`} />
      {showLabel && info.label}
    </Badge>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex">{badgeContent}</div>
        </TooltipTrigger>
        <TooltipContent className="rounded-none border-slate-100 shadow-2xl p-6 bg-white max-w-xs">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-px bg-unswap-blue-deep/20" />
              <p className="text-unswap-blue-deep/60 font-bold tracking-[0.4em] uppercase text-[8px]">Accreditation</p>
            </div>
            <div>
              <p className="text-sm font-light text-slate-900 tracking-tight">{info.label}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 leading-relaxed">{info.description}</p>
            </div>

            <div className="pt-4 border-t border-slate-50 space-y-2">
              {verification.email_verified && (
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1 h-1 bg-emerald-500/40" /> Secure Email Verified
                </p>
              )}
              {verification.phone_verified && (
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1 h-1 bg-emerald-500/40" /> Bio-Communication Sync
                </p>
              )}
              {verification.social_profiles_verified?.linkedin && (
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1 h-1 bg-emerald-500/40" /> LinkedIn Professional Link
                </p>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}