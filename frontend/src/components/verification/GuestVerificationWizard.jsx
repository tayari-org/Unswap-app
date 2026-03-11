import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, CheckCircle, Shield, Linkedin, Facebook, Phone, Mail } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { awardVerificationPoints } from '../points/PointsEarningHelper';

export default function GuestVerificationWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => api.auth.me(),
  });

  const [verificationData, setVerificationData] = useState({
    document_type: 'passport',
    document_url: '',
    selfie_url: '',
    phone_number: user?.phone_number || '',
    linkedin_url: '',
    facebook_url: '',
  });

  const createVerificationMutation = useMutation({
    mutationFn: async (data) => {
      const verification = await api.entities.Verification.create(data);

      // Award points for verification (will be credited upon approval)
      if (data.status === 'pending') {
        await awardVerificationPoints(data.user_email);
      }

      return verification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['verification']);
      queryClient.invalidateQueries(['current-user']);
      queryClient.invalidateQueries(['point-transactions']);
      toast.success('Verification submitted! +50 GuestPoints earned! 🎉');
      onComplete?.();
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (data) => api.auth.updateMe(data),
    onSuccess: () => queryClient.invalidateQueries(['current-user']),
  });

  const handleFileUpload = async (file, field) => {
    setUploading(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      setVerificationData(prev => ({ ...prev, [field]: file_url }));
      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    const verificationPayload = {
      user_email: user.email,
      user_name: user.full_name,
      verification_type: 'guest_document',
      verification_level: 'verified',
      document_type: verificationData.document_type,
      document_url: verificationData.document_url,
      selfie_url: verificationData.selfie_url,
      phone_number: verificationData.phone_number,
      phone_verified: false,
      email_verified: true,
      status: 'pending',
    };

    // Update user with social profiles
    await updateUserMutation.mutateAsync({
      phone_number: verificationData.phone_number,
      social_profiles: {
        linkedin: verificationData.linkedin_url,
        facebook: verificationData.facebook_url,
      },
    });

    // Create verification request
    await createVerificationMutation.mutateAsync(verificationPayload);
  };

  const progress = (step / 3) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Step Header */}
      <div className="p-10 border border-slate-100 bg-white mb-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 -mr-16 -mt-16 rounded-full opacity-50" />
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-px bg-unswap-blue-deep/20" />
          <p className="text-unswap-blue-deep/60 font-bold tracking-[0.4em] uppercase text-[9px]">Identity Verification</p>
        </div>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="text-3xl font-extralight text-slate-900 tracking-tighter leading-tight">Verify Your <span className="italic font-serif">Identity.</span></h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">Stage {step} of 3 — Verification Progress</p>
          </div>
          <div className="text-right">
            <p className="text-[20px] font-extralight text-slate-900 tracking-tighter">{Math.round(progress)}%</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Compliance</p>
          </div>
        </div>
        <Progress value={progress} className="h-1 rounded-none bg-slate-100" indicatorClassName="bg-unswap-blue-deep transition-all duration-1000" />
      </div>

      {/* Step 1: Document Upload */}
      {step === 1 && (
        <Card className="rounded-none border-slate-100 shadow-xl p-4">
          <CardHeader className="p-8">
            <CardTitle className="text-xl font-extralight tracking-tight text-slate-900">Document <span className="italic font-serif">Verification.</span></CardTitle>
            <CardDescription className="text-xs font-light text-slate-500 mt-2">
              Submit your institutional identification for secure cross-referencing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Credential Type</Label>
              <Select
                value={verificationData.document_type}
                onValueChange={(value) => setVerificationData(prev => ({ ...prev, document_type: value }))}
              >
                <SelectTrigger className="mt-1 h-14 rounded-none border-slate-100 focus:ring-unswap-blue-deep focus:ring-opacity-20 shadow-sm px-6">
                  <SelectValue className="font-light tracking-tight text-slate-900" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-slate-100">
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="national_id">National ID</SelectItem>
                  <SelectItem value="drivers_license">Driver's License</SelectItem>
                  <SelectItem value="un_laissez_passer">UN Laissez-Passer</SelectItem>
                  <SelectItem value="diplomatic_id">Diplomatic ID</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Upload Document (Front)</Label>
              <div className="mt-2 border-2 border-dashed rounded-lg p-8 text-center hover:border-slate-400 transition-colors">
                {verificationData.document_url ? (
                  <div className="space-y-3">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                    <p className="text-sm text-slate-600">Document uploaded</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVerificationData(prev => ({ ...prev, document_url: '' }))}
                    >
                      Change File
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm text-slate-600 mb-3">
                      Click to upload or drag and drop
                    </p>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e.target.files[0], 'document_url')}
                      disabled={uploading}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!verificationData.document_url || uploading}
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Selfie Verification */}
      {step === 2 && (
        <Card className="rounded-none border-slate-100 shadow-xl p-4">
          <CardHeader className="p-8">
            <CardTitle className="text-xl font-extralight tracking-tight text-slate-900">Photo <span className="italic font-serif">Validation.</span></CardTitle>
            <CardDescription className="text-xs font-light text-slate-500 mt-2">
              Upload a high-fidelity visual for identity synchronization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-slate-100 rounded-none p-12 text-center hover:border-unswap-blue-deep/30 transition-all duration-700 bg-slate-50/30">
              {verificationData.selfie_url ? (
                <div className="space-y-6">
                  <div className="w-32 h-32 rounded-none border border-slate-100 shadow-xl mx-auto overflow-hidden relative group">
                    <img
                      src={verificationData.selfie_url}
                      alt="Selfie"
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    />
                  </div>
                  <p className="text-[10px] font-bold text-unswap-blue-deep uppercase tracking-[0.3em]">Validation Active</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVerificationData(prev => ({ ...prev, selfie_url: '' }))}
                    className="text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900"
                  >
                    Reset Visual
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-white border border-slate-100 shadow-sm flex items-center justify-center mx-auto transition-transform hover:scale-110 duration-700">
                    <Camera className="w-6 h-6 text-slate-200" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol: Direct Photo Capture</p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files[0], 'selfie_url')}
                    disabled={uploading}
                    className="max-w-xs mx-auto h-12 rounded-none border-slate-100 bg-white"
                  />
                </div>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-100 p-6 rounded-none">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Submission Standards</p>
              <ul className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] space-y-2">
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-unswap-blue-deep/30" /> Direct frontal alignment</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-unswap-blue-deep/30" /> Institutional lighting conditions</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-unswap-blue-deep/30" /> Unobstructed facial features</li>
              </ul>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-50">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900"
              >
                Previous Stage
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!verificationData.selfie_url || uploading}
                className="rounded-none h-12 px-10 bg-unswap-blue-deep hover:bg-slate-900 text-[10px] font-bold uppercase tracking-[0.3em] shadow-xl text-white transition-all"
              >
                Proceed to Next Step
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Additional Verification */}
      {step === 3 && (
        <Card className="rounded-none border-slate-100 shadow-xl p-4">
          <CardHeader className="p-8">
            <CardTitle className="text-xl font-extralight tracking-tight text-slate-900">Additional <span className="italic font-serif">Verification.</span></CardTitle>
            <CardDescription className="text-xs font-light text-slate-500 mt-2">
              Enhance your institutional footprint with additional verification vectors.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-10">
            {/* Phone Number */}
            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-3">
                <Phone className="w-3.5 h-3.5 text-unswap-blue-deep/30" />
                Communication Vector
              </Label>
              <Input
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={verificationData.phone_number}
                onChange={(e) => setVerificationData(prev => ({ ...prev, phone_number: e.target.value }))}
                className="h-14 rounded-none border-slate-100 focus:ring-unswap-blue-deep shadow-sm px-6 font-light tracking-tight"
              />
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* Social Profiles */}
            <div className="space-y-6">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-900">Additional Info</h4>

              <div className="space-y-4">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-3">
                  <Linkedin className="w-3.5 h-3.5 text-unswap-blue-deep/30" />
                  Professional Network
                </Label>
                <Input
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  value={verificationData.linkedin_url}
                  onChange={(e) => setVerificationData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                  className="h-14 rounded-none border-slate-100 focus:ring-unswap-blue-deep shadow-sm px-6 font-light tracking-tight"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-3">
                  <Shield className="w-3.5 h-3.5 text-unswap-blue-deep/30" />
                  Secondary Authentication
                </Label>
                <Input
                  type="url"
                  placeholder="Institutional profile URL..."
                  value={verificationData.facebook_url}
                  onChange={(e) => setVerificationData(prev => ({ ...prev, facebook_url: e.target.value }))}
                  className="h-14 rounded-none border-slate-100 focus:ring-unswap-blue-deep shadow-sm px-6 font-light tracking-tight"
                />
              </div>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-100 p-8 rounded-none">
              <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5" />
                Submission Ready
              </p>
              <p className="text-[9px] font-bold text-emerald-700/60 uppercase tracking-[0.2em] leading-relaxed">
                Your verification will be reviewed within the next 24-48 hours.
                You will be notified once you are verified.
              </p>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-50">
              <Button
                variant="ghost"
                onClick={() => setStep(2)}
                className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900"
              >
                Previous Stage
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createVerificationMutation.isPending || uploading}
                className="rounded-none h-12 px-12 bg-emerald-600 hover:bg-slate-900 text-[10px] font-bold uppercase tracking-[0.3em] shadow-xl text-white transition-all"
              >
                {createVerificationMutation.isPending ? 'Processing...' : 'Submit Verification'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}