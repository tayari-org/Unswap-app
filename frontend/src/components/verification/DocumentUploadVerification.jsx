import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { FileText, Upload, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const DOCUMENT_TYPES = [
  { value: 'un_laissez_passer', label: 'UN Laissez-Passer' },
  { value: 'diplomatic_id', label: 'Diplomatic ID Card' },
  { value: 'staff_id', label: 'Staff ID Card' },
  { value: 'employment_letter', label: 'Employment Confirmation Letter' },
  { value: 'other', label: 'Other Official Document' }
];

export default function DocumentUploadVerification({ user, emailVerified, existingVerification }) {
  const queryClient = useQueryClient();
  const [documentType, setDocumentType] = useState('');
  const [documentFile, setDocumentFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const isPending = existingVerification?.status === 'pending';
  const isApproved = existingVerification?.status === 'approved' || user?.verification_status === 'verified';

  const submitVerificationMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);

      // Check if user already has a pending or approved verification
      const existingVerifications = await api.entities.Verification.filter({
        user_email: user?.email,
        status: { $in: ['pending', 'approved'] }
      });

      if (existingVerifications.length > 0) {
        setUploading(false);
        toast.error('You already have a verification request in progress');
        return false;
      }

      // Upload document
      const { file_url } = await api.integrations.Core.UploadFile({ file: documentFile });

      // Create verification record
      await api.entities.Verification.create({
        user_id: user?.id,
        user_email: user?.email,
        user_name: user?.full_name,
        verification_type: 'document_manual',
        document_type: documentType,
        document_url: file_url,
        organization: user?.organization,
        staff_grade: user?.staff_grade,
        duty_station: user?.duty_station,
        is_email_verified: true,
        status: 'pending'
      });

      // Update user status to pending (not verified yet)
      await api.auth.updateMe({ verification_status: 'pending' });

      setUploading(false);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-verification']);
      queryClient.invalidateQueries(['current-user']);
      toast.success('Documents submitted for review. We\'ll notify you within 24-48 hours.');
    },
    onError: () => {
      setUploading(false);
      toast.error('Failed to submit verification');
    }
  });

  const handleSubmit = () => {
    if (!documentType) {
      toast.error('Please select a document type');
      return;
    }
    if (!documentFile) {
      toast.error('Please upload a document');
      return;
    }
    submitVerificationMutation.mutate();
  };

  if (isApproved) {
    return (
      <Card className="border-emerald-100 bg-emerald-50/20 rounded-none shadow-sm transition-all hover:shadow-md">
        <CardContent className="p-8">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-white border border-emerald-100 rounded-none flex items-center justify-center shadow-sm">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-emerald-600 mb-1">Documents Verified</p>
              <p className="text-lg font-light tracking-tight text-slate-900 uppercase">Fully Verified</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isPending) {
    return (
      <Card className="border-blue-100 bg-blue-50/30 rounded-none shadow-sm">
        <CardContent className="p-8">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-white border border-blue-100 rounded-none flex items-center justify-center shadow-sm">
              <Loader2 className="w-6 h-6 text-unswap-blue-deep animate-spin" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-unswap-blue-deep mb-1">Verification Pending</p>
              <p className="text-sm text-slate-500 font-light leading-relaxed">Your documents are currently being reviewed. This usually takes <span className="font-bold">24-48 hours</span>.</p>
            </div>
          </div>
          {existingVerification?.reviewer_notes && (
            <div className="mt-6 p-5 bg-white border border-blue-100 rounded-none">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-900 mb-2">Reviewer Notes:</p>
              <p className="text-xs text-slate-600 font-light leading-relaxed italic">{existingVerification.reviewer_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`rounded-none border-slate-200 shadow-xl overflow-hidden group transition-all duration-700 ${!emailVerified ? 'grayscale opacity-40 select-none' : ''}`}>
      <CardHeader className="p-8 border-b border-slate-50">
        <CardTitle className="flex items-center gap-3">
          <div className="w-8 h-px bg-unswap-blue-deep/20" />
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-unswap-blue-deep">Step 2: Identity Verification</span>
        </CardTitle>
        <CardDescription className="text-[10px] uppercase tracking-widest text-slate-400 mt-2 ml-11 leading-relaxed">
          Please upload a copy of your UN/Organization ID or diplomatic passport.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!emailVerified && (
          <div className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-none mb-4">
            <AlertCircle className="w-4 h-4 text-unswap-blue-deep/40" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Please complete email verification first</p>
          </div>
        )}

        <div className="space-y-4">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Document Type</Label>
          <Select value={documentType} onValueChange={setDocumentType} disabled={!emailVerified}>
            <SelectTrigger className="h-12 rounded-none border-slate-200 bg-slate-50/30 focus-visible:ring-unswap-blue-deep text-[10px] font-bold uppercase tracking-widest">
              <SelectValue placeholder="Select document type..." />
            </SelectTrigger>
            <SelectContent className="rounded-none border-slate-200">
              {DOCUMENT_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value} className="text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50">
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Upload Document</Label>
          <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-none transition-all duration-500 ${emailVerified
            ? 'border-slate-200 cursor-pointer hover:border-unswap-blue-deep hover:bg-slate-50/50'
            : 'border-slate-100 cursor-not-allowed'
            }`}>
            {documentFile ? (
              <div className="text-center animate-in zoom-in duration-500">
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-none flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Check className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">{documentFile.name}</span>
                <p className="text-[9px] font-medium uppercase tracking-widest text-slate-400 mt-2 italic">Key registered. Click to re-upload.</p>
              </div>
            ) : (
              <div className="text-center group-hover:scale-105 transition-transform">
                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Select File</span>
                <p className="text-[9px] font-medium uppercase tracking-widest text-slate-300 mt-2">Accepted formats: PDF, JPG, PNG</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              disabled={!emailVerified}
              onChange={(e) => setDocumentFile(e.target.files?.[0])}
            />
          </label>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!emailVerified || !documentType || !documentFile || uploading}
          className="w-full h-14 bg-unswap-blue-deep hover:bg-slate-900 text-white rounded-none text-[10px] font-bold uppercase tracking-[0.3em] transition-all shadow-xl border-none outline-none"
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
          ) : (
            <><Upload className="w-3 h-3 mr-2" /> Submit for Verification</>
          )}
        </Button>

        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-300 text-center leading-relaxed">
          Your documents are stored securely and won't be shared with third parties.
        </p>
      </CardContent>
    </Card>
  );
}