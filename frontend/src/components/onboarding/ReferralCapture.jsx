import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ReferralCapture({ user }) {
  const [referralCode, setReferralCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validReferrer, setValidReferrer] = useState(null);

  // Check URL for referral code
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
      validateReferralCode(refCode);
    }
  }, []);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => api.entities.User.list(),
  });

  const validateReferralCode = async (code) => {
    if (!code) {
      setValidReferrer(null);
      return;
    }

    setIsValidating(true);
    const referrer = allUsers.find(u => u.referral_code === code.toUpperCase());
    setValidReferrer(referrer || false);
    setIsValidating(false);
  };

  const applyReferralMutation = useMutation({
    mutationFn: async () => {
      if (!validReferrer) return;

      // Update current user with referred_by
      await api.auth.updateMe({ referred_by: referralCode.toUpperCase() });

      // Create referral record
      await api.entities.Referral.create({
        referrer_email: validReferrer.email,
        referrer_name: validReferrer.full_name,
        referrer_code: referralCode.toUpperCase(),
        referred_email: user.email,
        referred_name: user.full_name,
        status: 'pending',
      });

      // Award welcome bonus to new user
      await api.entities.GuestPointTransaction.create({
        user_email: user.email,
        transaction_type: 'earned_bonus',
        points: 500,
        balance_after: (user.guest_points || 500) + 500,
        description: 'Welcome bonus for joining via referral',
      });

      await api.auth.updateMe({ 
        guest_points: (user.guest_points || 500) + 500 
      });
    },
    onSuccess: () => {
      toast.success('Referral applied! You earned 500 bonus points!');
    },
  });

  // Skip if user already has a referrer
  if (user.referred_by) {
    return null;
  }

  return (
    <Card className="border-2 border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-amber-600" />
          Have a Referral Code?
        </CardTitle>
        <CardDescription>
          Enter a referral code to earn 500 bonus GuestPoints
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="referral-code">Referral Code</Label>
          <div className="flex gap-2">
            <Input
              id="referral-code"
              value={referralCode}
              onChange={(e) => {
                setReferralCode(e.target.value.toUpperCase());
                if (e.target.value.length >= 4) {
                  validateReferralCode(e.target.value);
                }
              }}
              placeholder="Enter code..."
              className="font-mono uppercase"
            />
            <Button
              onClick={() => applyReferralMutation.mutate()}
              disabled={!validReferrer || applyReferralMutation.isPending}
            >
              Apply
            </Button>
          </div>
        </div>

        {validReferrer && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-900">
                Valid referral from {validReferrer.full_name}
              </p>
              <p className="text-xs text-green-700">
                You'll earn 500 bonus points when you apply this code
              </p>
            </div>
          </div>
        )}

        {validReferrer === false && referralCode && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">Invalid referral code</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}