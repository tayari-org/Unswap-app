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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-amber-600" />
          </div>
          <DialogTitle className="text-center">Verification Required</DialogTitle>
          <DialogDescription className="text-center">
            To {action}, you need to complete your professional verification first.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-900 text-sm">Diplomatic Shield Protection</p>
              <p className="text-slate-500 text-xs">Access $2M insurance coverage</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-900 text-sm">Trusted Network Access</p>
              <p className="text-slate-500 text-xs">Connect with verified UN/IO colleagues</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-900 text-sm">Full Platform Features</p>
              <p className="text-slate-500 text-xs">List properties, send requests, earn credits</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Link to={createPageUrl('Settings') + '?tab=verification'} className="w-full">
            <Button className="w-full bg-amber-500 hover:bg-amber-600">
              Complete Verification
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}