import React from 'react';
import { Shield, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function VerifiedBadge({ 
  size = 'default', 
  showText = true,
  variant = 'default',
  className = ''
}) {
  const sizes = {
    sm: 'w-3 h-3',
    default: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const iconSize = sizes[size] || sizes.default;

  if (variant === 'icon') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`inline-flex items-center justify-center w-6 h-6 bg-emerald-100 rounded-full ${className}`}>
              <Shield className={`${iconSize} text-emerald-600`} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Verified Staff Member</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'minimal') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Shield className={`${iconSize} text-emerald-600 ${className}`} />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Verified Staff Member</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Badge className={`bg-emerald-100 text-emerald-700 border-emerald-200 ${className}`}>
      <Shield className={`${iconSize} mr-1`} />
      {showText && 'Verified'}
    </Badge>
  );
}