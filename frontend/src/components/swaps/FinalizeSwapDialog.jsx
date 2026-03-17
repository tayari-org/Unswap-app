import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { format } from 'date-fns';
import {
  CheckCircle, FileText, Shield, Key, Building, Download,
  MapPin, Phone, Mail, Lock, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { notifySwapCompleted } from '../notifications/notificationHelpers';

export default function FinalizeSwapDialog({ open, onOpenChange, swapRequest, user, property }) {
  const queryClient = useQueryClient();
  const [keyHandoffMethod, setKeyHandoffMethod] = useState('');
  const [lockboxCode, setLockboxCode] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const finalizeSwapMutation = useMutation({
    mutationFn: async () => {
      // Generate insurance certificate
      const insuranceCert = `https://insurance.clementsworldwide.com/cert/${swapRequest.id}`;

      // Update swap request with finalization details
      await api.entities.SwapRequest.update(swapRequest.id, {
        insurance_certificate_url: insuranceCert,
        status: 'pending_guest_approval',
        key_handoff_method: keyHandoffMethod,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
        special_instructions: specialInstructions,
        finalized_at: new Date().toISOString()
      });

      // Send finalization details email to guest
      await api.integrations.Core.SendEmail({
        to: swapRequest.requester_email,
        subject: `Finalize Your Swap: ${swapRequest.property_title}`,
        body: `
          <h2>Swap Finalization Details</h2>
          <p>Hello ${swapRequest.requester_name || swapRequest.requester_email},</p>
          <p>${swapRequest.host_name || swapRequest.host_email} has provided the finalization details for your swap.</p>
          
          <h3>Property Details</h3>
          <p><strong>Property:</strong> ${swapRequest.property_title}</p>
          <p><strong>Check-in:</strong> ${swapRequest.check_in}</p>
          <p><strong>Check-out:</strong> ${swapRequest.check_out}</p>
          
          <h3>Key Handoff</h3>
          <p><strong>Method:</strong> ${keyHandoffMethod === 'in_person' ? 'In Person' : keyHandoffMethod === 'lockbox' ? 'Lockbox' : keyHandoffMethod === 'property_manager' ? 'Property Manager' : keyHandoffMethod === 'doorman' ? 'Doorman' : 'Neighbor'}</p>
          ${lockboxCode ? `<p><strong>Lockbox Code:</strong> ${lockboxCode}</p>` : ''}
          
          <h3>Emergency Contact</h3>
          <p><strong>Name:</strong> ${emergencyContactName}</p>
          <p><strong>Phone:</strong> ${emergencyContactPhone}</p>
          
          ${specialInstructions ? `<h3>Special Instructions</h3><p>${specialInstructions.replace(/\n/g, '<br>')}</p>` : ''}
          
          <h3>Insurance Coverage</h3>
          <p>Comprehensive insurance coverage will be activated upon your approval.</p>
          <p><a href="${insuranceCert}">View Insurance Certificate</a></p>
          
          <p>Please log in to UNswap to review and approve these details to complete the swap.</p>
        `
      });

      // Send finalization request notification to guest
      await api.entities.Notification.create({
        user_email: swapRequest.requester_email,
        type: 'swap_finalization',
        title: 'Finalize Your Swap',
        message: `${swapRequest.host_name || swapRequest.host_email} has provided finalization details for ${swapRequest.property_title}. Please review and approve.`,
        link: '/MySwaps?tab=outgoing',
        related_id: swapRequest.id,
        sender_name: swapRequest.host_name || swapRequest.host_email,
        sender_email: swapRequest.host_email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-swaps']);
      toast.success('✓ Finalization details sent to guest for approval');
      onOpenChange(false);
    }
  });

  const isComplete = keyHandoffMethod && emergencyContactName && emergencyContactPhone;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-none border-0 shadow-2xl p-0">
        <DialogHeader className="p-12 border-b bg-stone-50/80">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-[2px] bg-unswap-blue-deep" />
            <p className="text-unswap-blue-deep font-bold tracking-[0.5em] uppercase text-[10px]">Finalize Details</p>
          </div>
          <DialogTitle className="text-5xl font-extralight text-slate-900 tracking-tighter leading-none mb-6">
            Finalize <span className="italic font-serif">Stay Details.</span>
          </DialogTitle>
          <DialogDescription className="text-[13px] text-slate-500 font-light max-w-xl leading-relaxed">
            Please provide the final logistics and contact information for the guest to finalize the swap.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-12 p-12">
          {/* Phase Indicator */}
          <div className="flex items-center justify-between bg-stone-50 p-8 border border-slate-100 rounded-none shadow-inner">
            {[
              { icon: Shield, label: 'SECURITY ✓', done: true },
              { icon: FileText, label: 'WAIVER ✓', done: true },
              { icon: Key, label: 'CONCIERGE', done: false },
              { icon: Building, label: 'INSURANCE', done: false }
            ].map((phase, i) => (
              <div key={i} className="flex flex-col items-center gap-3 group">
                <div className={`w-12 h-12 rounded-none rotate-45 border flex items-center justify-center transition-all duration-500 ${phase.done 
                  ? 'bg-unswap-blue-deep border-unswap-blue-deep text-white shadow-lg' 
                  : 'bg-white border-slate-200 text-slate-300'
                }`}>
                  <phase.icon className={`w-5 h-5 -rotate-45 ${phase.done ? 'text-white' : 'text-slate-300'}`} />
                </div>
                <p className={`text-[9px] font-bold tracking-widest mt-2 ${phase.done ? 'text-unswap-blue-deep' : 'text-slate-400'}`}>{phase.label}</p>
              </div>
            ))}
          </div>

          {/* Key Handoff */}
          <div>
          {/* Key Handoff */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 font-semibold">Key Handoff</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { value: 'in_person', label: 'In Person', desc: 'Direct exchange' },
                { value: 'lockbox', label: 'Lockbox', desc: 'Secure digital access' },
                { value: 'property_manager', label: 'Staff', desc: 'Building management' },
                { value: 'doorman', label: 'Concierge', desc: 'Lobby pickup' },
                { value: 'neighbor', label: 'Neighbor', desc: 'Trusted contact' }
              ].map((method) => (
                <label
                  key={method.value}
                  className={`flex items-start gap-4 p-5 rounded-none cursor-pointer transition-all duration-300 border ${keyHandoffMethod === method.value 
                    ? 'border-unswap-blue-deep bg-unswap-blue-deep/5 shadow-md' 
                    : 'border-slate-100 bg-stone-50/50 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-none border flex items-center justify-center transition-colors ${keyHandoffMethod === method.value ? 'border-unswap-blue-deep bg-unswap-blue-deep' : 'border-slate-300 bg-white'}`}>
                    {keyHandoffMethod === method.value && <div className="w-1.5 h-1.5 bg-white rounded-none" />}
                  </div>
                  <input
                    type="radio"
                    name="keyHandoff"
                    value={method.value}
                    checked={keyHandoffMethod === method.value}
                    onChange={(e) => setKeyHandoffMethod(e.target.value)}
                    className="hidden"
                  />
                  <div>
                    <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest leading-none mb-2">{method.label}</p>
                    <p className="text-[11px] text-slate-500 font-light">{method.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <AnimatePresence>
              {keyHandoffMethod === 'lockbox' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 overflow-hidden"
                >
                  <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2 block">Lockbox Code</Label>
                  <Input
                    type="text"
                    value={lockboxCode}
                    onChange={(e) => setLockboxCode(e.target.value)}
                    placeholder="Enter 4-6 digit numeric code"
                    className="h-12 rounded-none border-slate-200 bg-white focus:ring-0 focus:border-slate-400"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </div>

          <Separator />

          {/* Emergency Contact */}
          <div className="space-y-8 pt-6 border-t border-slate-50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 font-semibold">Emergency Contact</Label>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Contact Name</Label>
                <Input
                  type="text"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="Full Name"
                  className="h-12 rounded-none border-slate-200 bg-white focus:ring-0 focus:border-slate-400"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Phone Number</Label>
                <Input
                  type="tel"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  placeholder="+ International format"
                  className="h-12 rounded-none border-slate-200 bg-white focus:ring-0 focus:border-slate-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Special Instructions</Label>
              <Textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Include critical building protocols, digital credentials, security procedures..."
                rows={4}
                className="rounded-none border-slate-200 bg-white focus:ring-0 focus:border-slate-400 resize-none p-4"
              />
            </div>
          </div>

          <Separator />

          {/* Insurance & Legal Status */}
          <div className="grid lg:grid-cols-2 gap-6 pt-6 border-t border-slate-50">
            <div className="bg-blue-50/50 border border-blue-100 p-8 rounded-none">
              <div className="flex items-start gap-4">
                <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-900 mb-4">Insurance Coverage</h4>
                  <ul className="space-y-3 text-[11px] text-blue-800/80 font-light leading-relaxed uppercase tracking-widest">
                    <li className="flex items-center gap-2">
                       <div className="w-1 h-1 bg-blue-400 rounded-full" />
                       Asset Protection: $2M USD
                    </li>
                    <li className="flex items-center gap-2">
                       <div className="w-1 h-1 bg-blue-400 rounded-full" />
                       Guarantee: $350/Night
                    </li>
                    <li className="flex items-center gap-2 opacity-50">
                       <div className="w-1 h-1 bg-blue-400 rounded-full" />
                       Clements Worldwide Integrated
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-stone-50/50 border border-slate-100 p-8 rounded-none">
              <div className="flex items-start gap-4">
                <FileText className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-900 mb-4">Terms & Agreements</h4>
                  <p className="text-[11px] text-slate-500 font-light leading-relaxed mb-4">
                    The following legal instruments will be notarized upon finalization:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['Arbitration Agreement', 'Verification Bond', 'Safe Passage Cert'].map(tag => (
                      <span key={tag} className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-white border border-slate-100 text-slate-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-12 flex border-t border-slate-100 bg-stone-50/50 gap-8">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-none h-16 text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 hover:text-slate-900 transition-colors"
          >
            Cancel
          </Button>
          <Button
            onClick={() => finalizeSwapMutation.mutate()}
            disabled={!isComplete || finalizeSwapMutation.isPending}
            className={`flex-1 rounded-none h-16 text-[10px] font-bold uppercase tracking-[0.5em] transition-all shadow-xl ${!isComplete || finalizeSwapMutation.isPending
                ? 'bg-slate-100 text-slate-300'
                : 'bg-unswap-blue-deep text-white hover:bg-slate-900 active:scale-95'
              }`}
          >
            {finalizeSwapMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-3 animate-spin" />
                Authorizing...
              </>
            ) : (
              'Finalize Stay'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}