import { api } from '@/api/apiClient';

/**
 * Helper functions to award points for various actions
 */

export const awardPoints = async (userEmail, type, amount, description, relatedId = null) => {
  try {
    // Get current user points
    const user = await api.auth.me();
    const currentPoints = user.guest_points || 500;
    const newBalance = currentPoints + amount;

    // Create transaction record
    await api.entities.GuestPointTransaction.create({
      user_email: userEmail,
      transaction_type: type,
      points: amount,
      balance_after: newBalance,
      description,
      related_id: relatedId,
    });

    // Update user balance
    await api.auth.updateMe({ guest_points: newBalance });

    return { success: true, newBalance };
  } catch (error) {
    console.error('Failed to award points:', error);
    return { success: false, error };
  }
};

export const POINT_REWARDS = {
  COMPLETED_STAY: { amount: 100, type: 'earned_stay', description: 'Completed stay' },
  REFERRAL: { amount: 200, type: 'earned_referral', description: 'Successful referral' },
  REVIEW: { amount: 25, type: 'earned_review', description: 'Left a review' },
  VERIFICATION: { amount: 50, type: 'earned_verification', description: 'Verified identity' },
  WELCOME_BONUS: { amount: 500, type: 'earned_bonus', description: 'Welcome bonus' },
  RATING_BONUS: { amount: 50, type: 'earned_bonus', description: 'High rating bonus' },
};

export const awardCompletedStayPoints = async (swapRequest) => {
  return await awardPoints(
    swapRequest.requester_email,
    POINT_REWARDS.COMPLETED_STAY.type,
    POINT_REWARDS.COMPLETED_STAY.amount,
    `Completed stay at ${swapRequest.property_title}`,
    swapRequest.id
  );
};

export const awardReferralPoints = async (referrerEmail, referredEmail) => {
  return await awardPoints(
    referrerEmail,
    POINT_REWARDS.REFERRAL.type,
    POINT_REWARDS.REFERRAL.amount,
    `Referred ${referredEmail}`,
    referredEmail
  );
};

export const awardReviewPoints = async (userEmail, reviewId) => {
  return await awardPoints(
    userEmail,
    POINT_REWARDS.REVIEW.type,
    POINT_REWARDS.REVIEW.amount,
    'Left a review',
    reviewId
  );
};

export const awardVerificationPoints = async (userEmail) => {
  return await awardPoints(
    userEmail,
    POINT_REWARDS.VERIFICATION.type,
    POINT_REWARDS.VERIFICATION.amount,
    'Verified identity'
  );
};