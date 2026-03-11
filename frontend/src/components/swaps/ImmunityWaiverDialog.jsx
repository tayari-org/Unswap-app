import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { FileText, AlertCircle, CheckCircle, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ImmunityWaiverDialog({ open, onOpenChange, swapRequest, user, onComplete }) {
  const queryClient = useQueryClient();
  const [agreed, setAgreed] = useState(false);
  const [understood, setUnderstood] = useState(false);

  const signWaiverMutation = useMutation({
    mutationFn: async () => {
      // Update user's verification record
      const verification = await api.entities.Verification.filter({
        user_email: user?.email
      });

      if (verification?.[0]) {
        await api.entities.Verification.update(verification[0].id, {
          immunity_waiver_signed: true,
          immunity_waiver_signed_at: new Date().toISOString()
        });
      }

      // Update swap request status
      await api.entities.SwapRequest.update(swapRequest.id, {
        status: 'approved'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-verification']);
      queryClient.invalidateQueries(['my-swaps']);
      toast.success('Waiver signed successfully');
      onComplete?.();
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-none border-0 shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-10 border-b bg-slate-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-px bg-blue-500/20" />
            <p className="text-blue-600 font-bold tracking-[0.4em] uppercase text-[9px]">Legal Framework</p>
          </div>
          <DialogTitle className="text-3xl font-extralight text-slate-900 tracking-tighter leading-tight">
            Immunity <span className="italic font-serif">Waiver.</span>
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm font-light mt-4 leading-relaxed">
            By proceeding with this swap, you acknowledge and agree to the institutional framework governing cross-border residential exchanges.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Why this is needed:</p>
                  <p>
                    The Vienna Convention on Diplomatic Relations (VCDR) grants immunity to international
                    civil servants. This waiver ensures property disputes can be resolved fairly through
                    arbitration, protecting both parties.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="border rounded-lg p-6 bg-slate-50 max-h-80 overflow-y-auto">
            <div className="space-y-4 text-sm text-slate-700">
              <h3 className="font-semibold text-base text-slate-900">PRIVATE ARBITRATION AND IMMUNITY WAIVER AGREEMENT</h3>

              <p>
                This agreement ("Agreement") is entered into between the parties participating in a home
                exchange facilitated by UNswap ("Platform").
              </p>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">1. ACKNOWLEDGMENT OF STATUS</h4>
                <p>
                  Both parties acknowledge that they may hold positions with international organizations
                  granting them immunity and privileges under the Vienna Convention on Diplomatic Relations
                  (VCDR) or similar conventions.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">2. LIMITED WAIVER OF IMMUNITY</h4>
                <p>
                  For the sole purpose of resolving property damage disputes arising from this home exchange,
                  both parties hereby waive any immunity from legal process that would otherwise prevent the
                  enforcement of arbitration decisions or judgments related to property damage claims.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">3. BINDING ARBITRATION</h4>
                <p>
                  The parties agree to resolve all disputes related to property damage through binding
                  arbitration administered by a neutral third-party arbitrator selected by the Platform.
                  The arbitration shall be conducted under the rules of [Arbitration Institution].
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">4. SCOPE OF AGREEMENT</h4>
                <p>
                  This waiver applies exclusively to:
                </p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Property damage claims up to $2,000,000 USD</li>
                  <li>Claims directly related to this specific home exchange</li>
                  <li>Enforcement of arbitration decisions</li>
                </ul>
                <p className="mt-2">
                  This waiver does NOT extend to criminal matters, personal injury claims, or matters
                  unrelated to the property exchange.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">5. INSURANCE COVERAGE</h4>
                <p>
                  Both parties acknowledge that the exchange is covered by comprehensive property insurance
                  provided by Clements Worldwide, with coverage up to $2,000,000 USD for property damage.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">6. PROFESSIONAL OBLIGATIONS</h4>
                <p>
                  Nothing in this agreement shall be construed to waive immunity related to official duties,
                  professional conduct, or matters covered by the VCDR outside the scope of this property exchange.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">7. GOVERNING LAW</h4>
                <p>
                  This Agreement shall be governed by and construed in accordance with international arbitration
                  standards and the substantive law of [Jurisdiction], without giving effect to any choice or
                  conflict of law provision.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">8. SEVERABILITY</h4>
                <p>
                  If any provision of this Agreement is found to be unenforceable or invalid, the remaining
                  provisions shall continue in full force and effect.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-300">
                <p className="text-xs text-slate-500">
                  Last updated: January 2026 | Version 1.2
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Checkbox
                id="understood"
                checked={understood}
                onCheckedChange={setUnderstood}
                className="mt-1"
              />
              <Label htmlFor="understood" className="text-sm cursor-pointer">
                I have read and understood this agreement, including the limited scope of the immunity waiver
              </Label>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Checkbox
                id="agreed"
                checked={agreed}
                onCheckedChange={setAgreed}
                className="mt-1"
              />
              <Label htmlFor="agreed" className="text-sm cursor-pointer">
                I agree to resolve property disputes through binding arbitration and waive diplomatic immunity
                solely for the purpose of enforcing such arbitration decisions
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => signWaiverMutation.mutate()}
            disabled={!agreed || !understood || signWaiverMutation.isPending}
            className="bg-slate-900 hover:bg-slate-800"
          >
            {signWaiverMutation.isPending ? 'Signing...' : 'Sign & Accept'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}