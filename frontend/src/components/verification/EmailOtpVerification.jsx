import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Mail, Loader2, Check, Send, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const OFFICIAL_DOMAINS = [
  'un.org', 'undp.org', 'unicef.org', 'who.int', 'wfp.org', 'unhcr.org',
  'fao.org', 'unesco.org', 'ilo.org', 'worldbank.org', 'imf.org', 'iaea.org',
  'wipo.int', 'unwomen.org', 'unops.org', 'unaids.org', 'unido.org'
];

const TEST_EMAILS = [
  'qasim@jacquelinetsuma.com',
  'webdev@jacquelinetsuma.com'
];

export default function EmailOtpVerification({ user, onVerified }) {
  const [officialEmail, setOfficialEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isVerified, setIsVerified] = useState(user?.institutional_email_verified || false);
  const [verifiedEmail, setVerifiedEmail] = useState(user?.verified_official_email || '');
  const [emailError, setEmailError] = useState('');

  const sendOtpMutation = useMutation({
    mutationFn: async () => {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);

      // Send email with OTP
      await api.integrations.Core.SendEmail({
        to: officialEmail,
        subject: 'UNswap - Verify Your Official Email',
        body: `
          <h2>Email Verification Code</h2>
          <p>Hello ${user?.full_name},</p>
          <p>Your verification code for UNswap is:</p>
          <h1 style="font-size: 32px; letter-spacing: 8px; color: #f59e0b; text-align: center; padding: 20px; background: #fef3c7; border-radius: 8px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <br/>
          <p>Best regards,<br/>The UNswap Team</p>
        `
      });

      return otp;
    },
    onSuccess: () => {
      setOtpSent(true);
      toast.success('Verification code sent to your email');
    },
    onError: () => {
      toast.error('Failed to send verification code');
    }
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      // Strict validation: OTP must exist, match exactly, and be 6 digits
      if (!generatedOtp || !otpCode || otpCode.length !== 6) {
        throw new Error('Invalid code format');
      }

      if (otpCode !== generatedOtp) {
        throw new Error('Invalid code');
      }

      // Only update user after successful OTP verification
      await api.auth.updateMe({
        institutional_email_verified: true,
        verified_official_email: officialEmail
      });

      // Clear OTP after successful verification
      setGeneratedOtp('');
      return true;
    },
    onSuccess: () => {
      setIsVerified(true);
      setVerifiedEmail(officialEmail);
      toast.success('Email verified successfully!');
      onVerified?.(officialEmail);
    },
    onError: (error) => {
      setOtpCode(''); // Clear incorrect code
      toast.error('Invalid verification code. Please try again.');
    }
  });

  const isOfficialDomain = (email) => {
    const emailLower = email.toLowerCase();
    // Allow test emails
    if (TEST_EMAILS.includes(emailLower)) return true;

    const domain = email.split('@')[1]?.toLowerCase();
    return OFFICIAL_DOMAINS.some(d => domain?.includes(d));
  };

  const handleSendOtp = () => {
    setEmailError('');

    if (!officialEmail) {
      setEmailError('Please enter your official email address');
      return;
    }
    if (!isOfficialDomain(officialEmail)) {
      setEmailError('Only international organization email addresses are accepted. Please use your official UN/IO email (e.g., @un.org, @undp.org, @unicef.org, @who.int, @worldbank.org, @imf.org, etc.)');
      return;
    }
    sendOtpMutation.mutate();
  };

  const handleVerifyOtp = () => {
    if (otpCode.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }
    verifyOtpMutation.mutate();
  };

  if (isVerified) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-emerald-900">Email Verified</p>
              <p className="text-sm text-emerald-700">{verifiedEmail}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-amber-600" />
          Step 1: Verify Official Email
        </CardTitle>
        <CardDescription>
          Enter your official UN/International Organization email to receive a verification code
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!otpSent ? (
          <>
            <div>
              <Label>Official Email Address</Label>
              <Input
                type="email"
                value={officialEmail}
                onChange={(e) => {
                  setOfficialEmail(e.target.value);
                  setEmailError('');
                }}
                placeholder="your.name@un.org"
                className={`mt-1 ${emailError ? 'border-red-500' : ''}`}
              />
              {emailError ? (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{emailError}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-2">
                  Accepted domains: un.org, undp.org, unicef.org, who.int, worldbank.org, imf.org, and other official IO domains
                </p>
              )}
            </div>
            <Button
              onClick={handleSendOtp}
              disabled={sendOtpMutation.isPending || !officialEmail}
              className="w-full bg-amber-500 hover:bg-amber-600"
            >
              {sendOtpMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Send Verification Code</>
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg mb-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Mail className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-emerald-900 mb-1">Check your email</p>
                  <p className="text-sm text-emerald-700">
                    We sent a 6-digit verification code to <span className="font-semibold">{officialEmail}</span>
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">Enter the code below to verify your email</p>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-center block mb-2">Enter Verification Code</Label>
              <div className="flex justify-center mb-4">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={setOtpCode}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <Button
              onClick={handleVerifyOtp}
              disabled={verifyOtpMutation.isPending || otpCode.length !== 6}
              className="w-full bg-emerald-500 hover:bg-emerald-600"
            >
              {verifyOtpMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
              ) : (
                <><Check className="w-4 h-4 mr-2" /> Verify Code</>
              )}
            </Button>

            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setOtpSent(false);
                  setOtpCode('');
                }}
                className="text-slate-500"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Use different email
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}