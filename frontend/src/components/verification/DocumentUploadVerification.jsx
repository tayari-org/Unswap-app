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
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-emerald-900">Fully Verified</p>
              <p className="text-sm text-emerald-700">Your identity has been verified</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isPending) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
            </div>
            <div>
              <p className="font-semibold text-amber-900">Verification Pending</p>
              <p className="text-sm text-amber-700">Your documents are being reviewed. This usually takes 24-48 hours.</p>
            </div>
          </div>
          {existingVerification?.reviewer_notes && (
            <div className="mt-4 p-3 bg-white rounded-lg border border-amber-200">
              <p className="text-sm text-slate-700">
                <span className="font-medium">Note:</span> {existingVerification.reviewer_notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={!emailVerified ? 'opacity-60' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-600" />
          Step 2: Upload Official Documents
        </CardTitle>
        <CardDescription>
          Upload your official ID or employment document for manual verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!emailVerified && (
          <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg text-sm text-slate-600">
            <AlertCircle className="w-4 h-4" />
            Please complete email verification first
          </div>
        )}

        <div>
          <Label>Document Type</Label>
          <Select value={documentType} onValueChange={setDocumentType} disabled={!emailVerified}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Upload Document</Label>
          <label className={`flex items-center justify-center w-full h-32 mt-1 border-2 border-dashed rounded-lg transition-colors ${
            emailVerified 
              ? 'border-slate-300 cursor-pointer hover:border-amber-500' 
              : 'border-slate-200 cursor-not-allowed'
          }`}>
            {documentFile ? (
              <div className="text-center">
                <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <span className="text-sm text-emerald-600 font-medium">{documentFile.name}</span>
                <p className="text-xs text-slate-500 mt-1">Click to change</p>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-sm text-slate-500">Click to upload document</span>
                <p className="text-xs text-slate-400 mt-1">PDF, JPG, or PNG up to 10MB</p>
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
          className="w-full bg-amber-500 hover:bg-amber-600"
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
          ) : (
            <><Upload className="w-4 h-4 mr-2" /> Submit for Verification</>
          )}
        </Button>

        <p className="text-xs text-slate-500 text-center">
          Your documents are encrypted and securely stored. We only use them for identity verification.
        </p>
      </CardContent>
    </Card>
  );
}