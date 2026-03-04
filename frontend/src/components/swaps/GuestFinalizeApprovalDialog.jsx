import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { CheckCircle, Shield, Key, Phone, FileText, Loader2 } from 'lucide-react';
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
          if ((currentUser.guest_points || 0) < (swapRequest.total_points || 0)) {
            throw new Error(`Insufficient points. You have ${currentUser.guest_points || 0} but need ${swapRequest.total_points || 0} points.`);
          }
        }

        // Transfer guest points if applicable
        if (swapRequest.swap_type === 'guestpoints') {
          await api.functions.invoke('transferGuestPoints', {
            swapRequestId: swapRequest.id
          });
        }

        // Update swap status to completed
        await api.entities.SwapRequest.update(swapRequest.id, {
          status: 'completed',
          completed_at: new Date().toISOString(),
          guest_agreed_to_terms: true
        });

        // Create activity log
        await api.entities.ActivityLog.create({
          activity_type: 'swap_completed',
          description: `Swap completed: ${swapRequest.property_title}`,
          is_public: true
        });

        // Notify host that guest approved
        await api.entities.Notification.create({
          user_email: swapRequest.host_email,
          type: 'swap_approved',
          title: 'Swap Finalized',
          message: `${swapRequest.requester_name || swapRequest.requester_email} has approved the finalization of your swap at ${swapRequest.property_title}. Swap is now complete!`,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-amber-600" />
            Review & Approve Swap Finalization
          </DialogTitle>
          <DialogDescription>
            Host has provided finalization details. Review and approve to complete the swap.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Key Handoff Method */}
          {swapRequest.key_handoff_method && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Key className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Key Handoff Method</h4>
                    <p className="text-sm text-slate-600">
                      {swapRequest.key_handoff_method === 'lockbox' && 'Encrypted Lockbox'}
                      {swapRequest.key_handoff_method === 'concierge' && 'Building Concierge'}
                      {swapRequest.key_handoff_method === 'mission' && 'Mission-Based Pickup'}
                      {swapRequest.key_handoff_method === 'personal' && 'Personal Handoff'}
                    </p>
                    {swapRequest.lockbox_code && (
                      <p className="text-sm text-slate-700 mt-2">
                        <strong>Code:</strong> {swapRequest.lockbox_code}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Emergency Contact */}
          {(swapRequest.emergency_contact_name || swapRequest.emergency_contact_phone) && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Emergency Contact</h4>
                    {swapRequest.emergency_contact_name && (
                      <p className="text-sm text-slate-600"><strong>Name:</strong> {swapRequest.emergency_contact_name}</p>
                    )}
                    {swapRequest.emergency_contact_phone && (
                      <p className="text-sm text-slate-600"><strong>Phone:</strong> {swapRequest.emergency_contact_phone}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Special Instructions */}
          {swapRequest.special_instructions && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-slate-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Special Instructions</h4>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{swapRequest.special_instructions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Insurance Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Insurance Coverage Activated</h4>
                  <p className="text-sm text-blue-800">
                    Upon approval, comprehensive insurance coverage will be activated for this swap.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Terms Agreement */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-600" />
                  Swap Agreement Document
                </h4>
                <p className="text-sm text-slate-700">
                  By approving this swap, you agree to:
                </p>
                <ul className="text-sm text-slate-700 space-y-1 ml-4">
                  <li>• Respect the property and follow all house rules</li>
                  <li>• Use the provided emergency contact for urgent issues only</li>
                  <li>• Maintain insurance coverage throughout the stay</li>
                  <li>• Report any damages or issues immediately</li>
                  <li>• Comply with check-in/check-out times</li>
                  <li>• Resolve disputes through UNswap arbitration process</li>
                </ul>
                <div className="flex items-start gap-3 pt-2 border-t border-amber-200">
                  <Checkbox 
                    id="terms" 
                    checked={agreedToTerms}
                    onCheckedChange={setAgreedToTerms}
                  />
                  <label 
                    htmlFor="terms" 
                    className="text-sm font-medium text-slate-900 cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I have read and agree to the swap terms and conditions
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => rejectFinalizeMutation.mutate()}
            disabled={rejectFinalizeMutation.isPending}
            className="flex-1"
          >
            {rejectFinalizeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Request Changes
          </Button>
          <Button 
            onClick={() => approveFinalizeMutation.mutate()}
            disabled={approveFinalizeMutation.isPending || !agreedToTerms}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600"
          >
            {approveFinalizeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve & Complete
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}