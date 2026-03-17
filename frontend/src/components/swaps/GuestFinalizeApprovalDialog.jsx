import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { CheckCircle, Shield, Key, Phone, FileText, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function GuestFinalizeApprovalDialog({ open, onOpenChange, swapRequest, user }) {
  const queryClient = useQueryClient();
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  if (!swapRequest) return null;

  const approveFinalizeMutation = useMutation({
    mutationFn: async () => {
      try {
        // Check if guest has enough points
        if (swapRequest.swap_type === 'guestpoints') {
          const currentUser = await api.auth.me();
          if ((currentUser.guest_points ?? 500) < (swapRequest.total_points || 0)) {
            throw new Error(`Insufficient points. You have ${currentUser.guest_points ?? 500} but need ${swapRequest.total_points || 0} points.`);
          }
        }

        // Update swap status to guest_agreed
        await api.entities.SwapRequest.update(swapRequest.id, {
          status: 'guest_agreed',
          guest_agreed_at: new Date().toISOString(),
          guest_agreed_to_terms: true
        });

        // Create activity log
        await api.entities.ActivityLog.create({
          activity_type: 'swap_completed',
          description: `Swap completed: ${swapRequest.property_title}`,
          is_public: true
        });

        // Notify host that guest approved and wants to finalize
        await api.entities.Notification.create({
          user_email: swapRequest.host_email,
          type: 'swap_approved',
          title: 'Guest Agreed to Finalize',
          message: `${swapRequest.requester_name || swapRequest.requester_email} has agreed to the conditions for the swap at ${swapRequest.property_title} and is ready to finalize. Please mark as complete to finish the process.`,
          link: '/MySwaps',
          related_id: swapRequest.id,
          sender_name: swapRequest.requester_name || swapRequest.requester_email,
          sender_email: swapRequest.requester_email
        });
      } catch (err) {
        console.error('Finalization error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-swaps'] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast.success('✓ Swap finalized and points transferred!');
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast.error(error.message || 'Failed to finalize swap');
    }
  });

  const rejectFinalizeMutation = useMutation({
    mutationFn: async () => {
      await api.entities.SwapRequest.update(swapRequest.id, {
        status: 'approved'
      });

      await api.entities.Notification.create({
        user_email: swapRequest.host_email,
        type: 'system',
        title: 'Finalization Not Approved',
        message: `${swapRequest.requester_name || swapRequest.requester_email} declined to finalize. Please contact them.`,
        link: '/MySwaps',
        related_id: swapRequest.id,
        sender_name: swapRequest.requester_name || swapRequest.requester_email,
        sender_email: swapRequest.requester_email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-swaps']);
      toast.info('Request sent back to host');
      onOpenChange(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-none border-0 shadow-2xl p-0">
        <DialogHeader className="p-12 border-b bg-stone-50/80">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-[2px] bg-unswap-blue-deep" />
            <p className="text-unswap-blue-deep font-bold tracking-[0.5em] uppercase text-[10px]">Finalize Details</p>
          </div>
          <DialogTitle className="text-5xl font-extralight text-slate-900 tracking-tighter leading-none mb-6">
            Review & Approve <span className="italic font-serif">Swap Finalization</span>
          </DialogTitle>
          <DialogDescription className="text-[13px] text-slate-500 font-light max-w-xl leading-relaxed">
            Host has provided finalization details. Review and approve to complete the swap.
          </DialogDescription>
        </DialogHeader>

        <div className="p-12 space-y-12">
          {/* Key Handoff Method */}
          {swapRequest.key_handoff_method && (
            <div className="bg-stone-50/50 border border-slate-100 p-8 rounded-none shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-none bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Key className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4 block">Key Handoff Method</h4>
                  <p className="text-sm font-light text-slate-900 mb-4 uppercase tracking-widest">
                    {swapRequest.key_handoff_method === 'lockbox' && 'Encrypted Lockbox'}
                    {swapRequest.key_handoff_method === 'concierge' && 'Building Concierge'}
                    {swapRequest.key_handoff_method === 'mission' && 'Mission-Based Pickup'}
                    {swapRequest.key_handoff_method === 'personal' && 'Personal Handoff'}
                  </p>
                  {swapRequest.lockbox_code && (
                    <div className="mt-4 p-4 border border-amber-100 bg-amber-50/30 rounded-none">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Code</p>
                      <p className="text-lg font-mono tracking-[0.2em] text-amber-900">{swapRequest.lockbox_code}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Emergency Contact */}
          {(swapRequest.emergency_contact_name || swapRequest.emergency_contact_phone) && (
            <div className="bg-stone-50/50 border border-slate-100 p-8 rounded-none shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-none bg-blue-600/10 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4 block">Emergency Contact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {swapRequest.emergency_contact_name && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</p>
                        <p className="text-sm font-light text-slate-900">{swapRequest.emergency_contact_name}</p>
                      </div>
                    )}
                    {swapRequest.emergency_contact_phone && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone</p>
                        <p className="text-sm font-light text-slate-900">{swapRequest.emergency_contact_phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Special Instructions */}
          {swapRequest.special_instructions && (
            <div className="bg-stone-50/50 border border-slate-100 p-8 rounded-none shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-none bg-slate-600/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-slate-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4 block">Special Instructions</h4>
                  <p className="text-sm font-light text-slate-600 leading-relaxed whitespace-pre-wrap">{swapRequest.special_instructions}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8 border-t border-slate-50 pt-10">
            {/* Insurance Info */}
            <div className="bg-blue-50/30 border border-blue-100 p-8 rounded-none">
              <div className="flex items-start gap-4">
                <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-900 mb-4">Insurance Coverage Activated</h4>
                  <p className="text-[11px] text-blue-800/80 font-light leading-relaxed uppercase tracking-widest">
                    Upon approval, comprehensive insurance coverage will be activated for this swap.
                  </p>
                </div>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="bg-stone-50/50 border border-slate-100 p-8 rounded-none">
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-900">Swap Agreement Document</h4>
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>
                
                <p className="text-[11px] text-slate-500 font-light leading-relaxed mb-4">
                  By approving this swap, you agree to:
                </p>
                <div className="space-y-3">
                  {[
                    'Respect the property and follow all house rules',
                    'Use emergency contact for urgent issues only',
                    'Maintain insurance coverage throughout stay',
                    'Report any damages or issues immediately',
                    'Comply with check-in/check-out times'
                  ].map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                       <div className="w-1 h-1 bg-slate-300 rounded-full" />
                       <span className="text-[10px] text-slate-600 uppercase tracking-widest font-light">{rule}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-6 border-t border-slate-50 mt-6">
                  <Checkbox 
                    id="terms" 
                    checked={agreedToTerms}
                    onCheckedChange={setAgreedToTerms}
                    className="rounded-none border-slate-300 data-[state=checked]:bg-unswap-blue-deep data-[state=checked]:border-unswap-blue-deep"
                  />
                  <label 
                    htmlFor="terms" 
                    className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I have read and agree to the swap terms and conditions
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-12 border-t border-slate-100 bg-stone-50/50 flex gap-8">
          <Button 
            variant="ghost" 
            onClick={() => rejectFinalizeMutation.mutate()}
            disabled={rejectFinalizeMutation.isPending}
            className="flex-1 rounded-none h-16 text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 hover:text-slate-900 transition-colors"
          >
            {rejectFinalizeMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
            Request Changes
          </Button>
          <Button 
            onClick={() => approveFinalizeMutation.mutate()}
            disabled={approveFinalizeMutation.isPending || !agreedToTerms}
            className={`flex-1 rounded-none h-16 text-[10px] font-bold uppercase tracking-[0.5em] transition-all shadow-xl ${!agreedToTerms || approveFinalizeMutation.isPending
              ? 'bg-slate-100 text-slate-300'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
            }`}
          >
            {approveFinalizeMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-3 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5 mr-3 opacity-60" />
                Agree & Finalize
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}