import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Shield, CheckCircle, Lock, FileKey, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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

export default function SecurityChecklistDialog({ open, onOpenChange, property, onComplete }) {
  const queryClient = useQueryClient();
  const [checklist, setChecklist] = useState({
    separate_workspace: property?.security_checklist?.separate_workspace || false,
    secure_wifi: property?.security_checklist?.secure_wifi || false,
    locked_storage: property?.security_checklist?.locked_storage || false,
    building_security: property?.security_checklist?.building_security || false,
    safe_available: property?.security_checklist?.safe_available || false,
  });

  const updatePropertyMutation = useMutation({
    mutationFn: async () => {
      await api.entities.Property.update(property.id, {
        security_checklist: checklist
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-properties']);
      toast.success('Security checklist updated');
      onComplete?.();
    }
  });

  const isComplete = Object.values(checklist).filter(Boolean).length >= 3;

  const items = [
    {
      key: 'separate_workspace',
      title: 'Separated Professional Space',
      description: 'Work area is distinct from personal living spaces'
    },
    {
      key: 'secure_wifi',
      title: 'Secure WiFi Network',
      description: 'WPA2/WPA3 encrypted network with strong password'
    },
    {
      key: 'locked_storage',
      title: 'Locked Storage Available',
      description: 'Secure closet or cabinet for sensitive materials'
    },
    {
      key: 'building_security',
      title: 'Building Security',
      description: 'Doorman, security desk, or controlled access'
    },
    {
      key: 'safe_available',
      title: 'Safe Available',
      description: 'In-unit safe for documents and valuables'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-none border-0 shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-10 border-b bg-slate-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-px bg-amber-500/20" />
            <p className="text-amber-600 font-bold tracking-[0.4em] uppercase text-[9px]">Asset Security</p>
          </div>
          <DialogTitle className="text-3xl font-extralight text-slate-900 tracking-tighter leading-tight">
            Security <span className="italic font-serif">Protocol.</span>
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm font-light mt-4 leading-relaxed">
            Complete the mandatory security checklist to ensure institutional standards are met before stay commencement.
          </DialogDescription>
        </DialogHeader>

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <p className="text-sm text-amber-900">
              <strong>Why this matters:</strong> International staff often work with sensitive materials.
              This checklist helps ensure a secure environment that protects both professional obligations
              and personal privacy.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-3 py-4">
          {items.map((item) => (
            <div key={item.key} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-slate-50">
              <Checkbox
                id={item.key}
                checked={checklist[item.key]}
                onCheckedChange={(checked) =>
                  setChecklist(prev => ({ ...prev, [item.key]: checked }))
                }
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor={item.key} className="font-medium cursor-pointer">
                  {item.title}
                </Label>
                <p className="text-sm text-slate-600 mt-1">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {isComplete && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <p className="text-sm text-emerald-900 font-medium">
              Security requirements met! Your property is ready for diplomatic guests.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => updatePropertyMutation.mutate()}
            disabled={!isComplete || updatePropertyMutation.isPending}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            {updatePropertyMutation.isPending ? 'Saving...' : 'Confirm & Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}