import React, { useState } from 'react';
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
        link: '/MySwaps',
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Finalize Your Swap
          </DialogTitle>
          <DialogDescription>
            Send finalization details to guest for approval
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Phase Indicator */}
          <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                {[
                  { icon: Shield, label: 'Security ✓', done: true },
                  { icon: FileText, label: 'Waiver ✓', done: true },
                  { icon: Key, label: 'Concierge', done: false },
                  { icon: Building, label: 'Insurance', done: false }
                ].map((phase, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      phase.done ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}>
                      <phase.icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xs mt-1 text-slate-700">{phase.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Key Handoff */}
          <div>
            <Label className="text-base font-semibold">Key Handoff Method *</Label>
            <p className="text-sm text-slate-600 mb-3">How will your guest access the property?</p>
            
            <div className="space-y-2">
              {[
                { value: 'in_person', label: 'In Person', desc: 'Meet guest personally' },
                { value: 'lockbox', label: 'Lockbox', desc: 'Secure key storage with code' },
                { value: 'property_manager', label: 'Property Manager', desc: 'Through property management' },
                { value: 'doorman', label: 'Doorman/Concierge', desc: 'Pick up from building staff' },
                { value: 'neighbor', label: 'Trusted Neighbor', desc: 'Collect from neighbor' }
              ].map((method) => (
                <label
                  key={method.value}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition ${
                    keyHandoffMethod === method.value ? 'border-amber-500 bg-amber-50' : 'border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="keyHandoff"
                    value={method.value}
                    checked={keyHandoffMethod === method.value}
                    onChange={(e) => setKeyHandoffMethod(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{method.label}</p>
                    <p className="text-sm text-slate-600">{method.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {keyHandoffMethod === 'lockbox' && (
              <div className="mt-3">
                <Label>Lockbox Code</Label>
                <Input
                  type="text"
                  value={lockboxCode}
                  onChange={(e) => setLockboxCode(e.target.value)}
                  placeholder="Enter 4-6 digit code"
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Emergency Contact */}
          <div>
            <Label className="text-base font-semibold">Emergency Contact *</Label>
            <p className="text-sm text-slate-600 mb-3">Who should the guest contact for urgent issues?</p>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label>Full Name</Label>
                <Input
                  type="text"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="John Doe"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <Label>Special Instructions (Optional)</Label>
            <Textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Alarm codes, parking details, wifi password, plant care, etc."
              rows={4}
              className="mt-1"
            />
          </div>

          <Separator />

          {/* Insurance Activation */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Automatic Insurance Activation</h4>
                  <p className="text-sm text-blue-800 mb-3">
                    Upon finalization, Clements Worldwide will automatically activate comprehensive coverage:
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Property damage protection: up to $2,000,000</li>
                    <li>• Guest cancellation coverage: up to $350/night</li>
                    <li>• 24/7 claims support</li>
                    <li>• Coverage period: {swapRequest.check_in} to {swapRequest.check_out}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Digital Housing Authorization Preview */}
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-900">Digital Housing Authorization</h4>
                <FileText className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-sm text-slate-600 mb-3">
                Both parties will receive a comprehensive document including:
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Property addresses
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Host contacts
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Arbitration agreement
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Insurance certificate
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Back
          </Button>
          <Button 
            onClick={() => finalizeSwapMutation.mutate()}
            disabled={!isComplete || finalizeSwapMutation.isPending}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600"
          >
            {finalizeSwapMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Send for Guest Approval
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}