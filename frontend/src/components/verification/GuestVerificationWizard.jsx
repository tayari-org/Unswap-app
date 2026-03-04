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
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-slate-600">
          <span>Step {step} of 3</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Step 1: Document Upload */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              Identity Verification
            </CardTitle>
            <CardDescription>
              Upload a government-issued ID for verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Document Type</Label>
              <Select 
                value={verificationData.document_type}
                onValueChange={(value) => setVerificationData(prev => ({ ...prev, document_type: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
        <Card>
          <CardHeader>
            <CardTitle>Take a Selfie</CardTitle>
            <CardDescription>
              Upload a clear photo of yourself to verify your identity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-slate-400 transition-colors">
              {verificationData.selfie_url ? (
                <div className="space-y-3">
                  <img 
                    src={verificationData.selfie_url} 
                    alt="Selfie" 
                    className="w-32 h-32 rounded-full object-cover mx-auto"
                  />
                  <p className="text-sm text-slate-600">Selfie uploaded</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVerificationData(prev => ({ ...prev, selfie_url: '' }))}
                  >
                    Retake
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-600 mb-3">Upload a clear selfie</p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files[0], 'selfie_url')}
                    disabled={uploading}
                  />
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Tips for a good selfie:</strong> Face the camera directly, ensure good lighting, 
                remove glasses or hats, and match the expression in your ID photo.
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!verificationData.selfie_url || uploading}
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Additional Verification */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Verification (Optional)</CardTitle>
            <CardDescription>
              Add more verification methods to increase trust
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Phone Number */}
            <div>
              <Label className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </Label>
              <Input
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={verificationData.phone_number}
                onChange={(e) => setVerificationData(prev => ({ ...prev, phone_number: e.target.value }))}
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">
                We'll send a verification code to confirm
              </p>
            </div>

            <Separator />

            {/* Social Profiles */}
            <div className="space-y-4">
              <h4 className="font-medium text-slate-900">Connect Social Profiles</h4>
              
              <div>
                <Label className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-blue-600" />
                  LinkedIn Profile
                </Label>
                <Input
                  type="url"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={verificationData.linkedin_url}
                  onChange={(e) => setVerificationData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Facebook className="w-4 h-4 text-blue-500" />
                  Facebook Profile
                </Label>
                <Input
                  type="url"
                  placeholder="https://facebook.com/yourprofile"
                  value={verificationData.facebook_url}
                  onChange={(e) => setVerificationData(prev => ({ ...prev, facebook_url: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <p className="text-xs text-slate-500">
                Linking social profiles is optional but helps build trust with hosts
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>Almost done!</strong> Your verification will be reviewed within 24-48 hours.
                You'll receive an email once approved.
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createVerificationMutation.isPending || uploading}
              >
                Submit for Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}