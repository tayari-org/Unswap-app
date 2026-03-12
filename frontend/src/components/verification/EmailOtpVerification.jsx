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
      <Card className="border-blue-100 bg-blue-50/30 rounded-none shadow-sm transition-all hover:shadow-md">
        <CardContent className="p-8">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-white border border-blue-100 rounded-none flex items-center justify-center shadow-sm">
              <Check className="w-6 h-6 text-unswap-blue-deep" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-unswap-blue-deep mb-1">Email Verified</p>
              <p className="text-lg font-light tracking-tight text-slate-900">{verifiedEmail}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none border-stone-200 shadow-xl overflow-hidden group bg-white">
      <CardHeader className="p-8 border-b border-stone-50">
        <CardTitle className="flex items-center gap-3">
          <div className="w-8 h-px bg-unswap-blue-deep/20" />
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-unswap-blue-deep">Step 1: Email Verification</span>
        </CardTitle>
        <CardDescription className="text-[10px] uppercase tracking-widest text-stone-400 mt-2 ml-11 leading-relaxed">
          Verify your official institutional email address to unlock diplomatic features.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!otpSent ? (
          <>
            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Official Email Address</Label>
              <Input
                type="email"
                value={officialEmail}
                onChange={(e) => {
                  setOfficialEmail(e.target.value);
                  setEmailError('');
                }}
                placeholder="name@un.org"
                className={`h-12 rounded-none border-stone-200 focus-visible:ring-unswap-blue-deep bg-stone-50/30 transition-all font-mono text-sm ${emailError ? 'border-red-300 bg-red-50/20' : ''}`}
              />
              {emailError ? (
                <div className="p-4 bg-red-50/50 border border-red-100 rounded-none animate-in fade-in slide-in-from-top-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-red-600 leading-relaxed">{emailError}</p>
                </div>
              ) : (
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-300 mt-2">
                  Protocols: un.org // undp.org // who.int // worldbank.org
                </p>
              )}
            </div>
            <Button
              onClick={handleSendOtp}
              disabled={sendOtpMutation.isPending || !officialEmail}
              className="w-full h-14 bg-unswap-blue-deep hover:bg-slate-900 text-white rounded-none text-[10px] font-bold uppercase tracking-[0.3em] transition-all shadow-xl group border-none"
            >
              {sendOtpMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
              ) : (
                <><Send className="w-3 h-3 mr-2 transition-transform group-hover:translate-x-1" /> Send Verification Code</>
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-none mb-8 animate-in fade-in duration-700">
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 bg-white border border-blue-100 rounded-none flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Mail className="w-5 h-5 text-unswap-blue-deep" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-unswap-blue-deep mb-2">Check your email</p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    We've sent a 6-digit verification code to <span className="font-bold text-slate-900">{officialEmail}</span>. Please enter it below to verify your account.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="text-center space-y-4">
                <Label className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">Enter Verification Code</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otpCode}
                    onChange={setOtpCode}
                  >
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} className="w-12 h-16 border-stone-200 rounded-none text-xl font-light focus:border-unswap-blue-deep bg-stone-50/30" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              <Button
                onClick={handleVerifyOtp}
                disabled={verifyOtpMutation.isPending || otpCode.length !== 6}
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none text-[10px] font-bold uppercase tracking-[0.3em] transition-all shadow-xl"
              >
                {verifyOtpMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                ) : (
                  <><Check className="w-4 h-4 mr-2" /> Verify Code</>
                )}
              </Button>
            </div>

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
                <div className="text-[10px] font-bold uppercase tracking-widest">Resend Code</div>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}