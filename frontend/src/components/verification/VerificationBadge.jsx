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
          icon: Star,
          label: 'UN Staff Verified',
          color: 'bg-amber-100 text-amber-700 border-amber-300',
          description: 'Verified UN or international organization staff member',
        };
      case 'trusted':
        return {
          icon: Shield,
          label: 'Trusted Guest',
          color: 'bg-green-100 text-green-700 border-green-300',
          description: 'Fully verified with multiple trust signals',
        };
      case 'verified':
        return {
          icon: CheckCircle,
          label: 'Verified',
          color: 'bg-blue-100 text-blue-700 border-blue-300',
          description: 'Identity verified with government-issued ID',
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
    <Badge variant="outline" className={`${info.color} border ${textSize} font-medium`}>
      <Icon className={`${iconSize} ${showLabel ? 'mr-1' : ''}`} />
      {showLabel && info.label}
    </Badge>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex">{badgeContent}</div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-xs">
            <p className="font-semibold mb-1">{info.label}</p>
            <p className="text-xs text-slate-600">{info.description}</p>
            {verification.email_verified && (
              <p className="text-xs text-slate-500 mt-1">✓ Email verified</p>
            )}
            {verification.phone_verified && (
              <p className="text-xs text-slate-500">✓ Phone verified</p>
            )}
            {verification.social_profiles_verified?.linkedin && (
              <p className="text-xs text-slate-500">✓ LinkedIn connected</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}