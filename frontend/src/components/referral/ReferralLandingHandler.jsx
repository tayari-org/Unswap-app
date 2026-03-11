import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { toast } from 'sonner';

/**
 * Drop this component anywhere (e.g. Home page) to silently capture
 * a ?ref=CODE query parameter and apply it to the logged-in user.
 */
export default function ReferralLandingHandler() {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');

    const { data: user } = useQuery({
        queryKey: ['current-user'],
        queryFn: async () => {
            const isAuth = await api.auth.isAuthenticated();
            if (!isAuth) return null;
            return api.auth.me();
        },
        staleTime: 60000,
    });

    // Safely resolve the referral code to a referrer — no need to list all users
    const { data: referrer } = useQuery({
        queryKey: ['resolve-ref-code', refCode],
        queryFn: () => api.referrals.resolveCode(refCode),
        enabled: !!refCode && !!user && !user.referred_by,
        retry: false,
    });

    const applyMutation = useMutation({
        mutationFn: async ({ referrer, code }) => {
            // Mark current user as referred
            await api.auth.updateMe({ referred_by: code });

            // Create referral record
            await api.entities.Referral.create({
                referrer_email: referrer.email,
                referred_email: user.email,
                referred_name: user.full_name || null,
                referred_user_status: 'registered',
            });

            // Award 500 welcome bonus to new user
            const newPoints = (user.guest_points || 500) + 500;
            await api.auth.updateMe({ guest_points: newPoints });
            await api.entities.GuestPointTransaction.create({
                user_email: user.email,
                transaction_type: 'earned_bonus',
                points: 500,
                balance_after: newPoints,
                description: `Welcome bonus – referred by ${referrer.full_name || referrer.email}`,
            });
        },
        onSuccess: () => {
            toast.success('🎁 Referral applied! You earned 500 bonus GuestPoints.');
            // Remove ?ref from URL without reloading
            const url = new URL(window.location.href);
            url.searchParams.delete('ref');
            window.history.replaceState({}, '', url.toString());
        },
        onError: () => {
            // Silently fail — don't show error for invalid/expired codes
        },
    });

    useEffect(() => {
        if (!refCode || !user || user.referred_by || !referrer) return;
        if (referrer.email !== user.email) {
            applyMutation.mutate({ referrer, code: refCode.toUpperCase() });
        }
    }, [refCode, user, referrer]);

    return null;
}
