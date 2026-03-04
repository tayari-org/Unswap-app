import React, { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { toast } from 'sonner';

// This component handles the referral reward logic when a property is verified
export default function PropertyVerificationReward({ propertyId, ownerEmail }) {
  const { data: user } = useQuery({
    queryKey: ['user', ownerEmail],
    queryFn: async () => {
      const users = await api.entities.User.list();
      return users.find(u => u.email === ownerEmail);
    },
    enabled: !!ownerEmail,
  });

  const { data: referral } = useQuery({
    queryKey: ['referral', ownerEmail],
    queryFn: () => api.entities.Referral.filter({
      referred_email: ownerEmail,
      status: { $in: ['pending', 'property_listed'] }
    }).then(refs => refs[0]),
    enabled: !!ownerEmail && !!user?.referred_by,
  });

  const processReferralRewardMutation = useMutation({
    mutationFn: async () => {
      if (!referral || referral.status === 'completed') return;

      const REFERRAL_REWARD = 1000;

      // Update referral status
      await api.entities.Referral.update(referral.id, {
        status: 'completed',
        property_id: propertyId,
        reward_amount: REFERRAL_REWARD,
        reward_paid: true,
        completed_at: new Date().toISOString(),
      });

      // Get referrer
      const users = await api.entities.User.list();
      const referrer = users.find(u => u.email === referral.referrer_email);

      if (referrer) {
        // Award points to referrer
        await api.entities.GuestPointTransaction.create({
          user_email: referrer.email,
          transaction_type: 'earned_referral',
          points: REFERRAL_REWARD,
          balance_after: (referrer.guest_points || 0) + REFERRAL_REWARD,
          description: `Referral bonus for ${user.full_name}`,
          related_id: referral.id,
        });

        // Update referrer's points and stats
        await api.entities.User.update(referrer.id, {
          guest_points: (referrer.guest_points || 0) + REFERRAL_REWARD,
          total_referrals: (referrer.total_referrals || 0) + 1,
          referral_earnings: (referrer.referral_earnings || 0) + REFERRAL_REWARD,
        });

        // Create notification for referrer
        await api.entities.Notification.create({
          user_email: referrer.email,
          type: 'system',
          title: 'Referral Reward Earned! 🎉',
          message: `${user.full_name} just listed their first property. You've earned ${REFERRAL_REWARD} GuestPoints!`,
          link: '/host-dashboard?tab=referrals',
        });
      }
    },
  });

  // Check if property was just verified and trigger reward
  useEffect(() => {
    if (referral && !referral.reward_paid && propertyId) {
      processReferralRewardMutation.mutate();
    }
  }, [referral, propertyId]);

  return null; // This is a logic-only component
}