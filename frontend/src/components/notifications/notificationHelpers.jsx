import { api } from '@/api/apiClient';

// Check if user has notifications enabled for a specific type
async function shouldNotify(userEmail, notificationType) {
  try {
    const users = await api.entities.User.filter({ email: userEmail });
    const user = users[0];
    
    if (!user?.notification_preferences) return true;
    
    const prefs = user.notification_preferences;
    
    // Map notification types to preference keys
    const prefMap = {
      'swap_pending': 'new_booking_requests',
      'swap_approved': 'booking_confirmations',
      'swap_rejected': 'booking_confirmations',
      'swap_counter': 'booking_confirmations',
      'message': 'messages',
      'video_call': 'booking_confirmations',
      'system': 'system_updates',
      'property_match': 'system_updates'
    };
    
    const prefKey = prefMap[notificationType];
    return prefs[prefKey] !== false;
  } catch (error) {
    console.error('Error checking notification preferences:', error);
    return true; // Default to sending if check fails
  }
}

// Create in-app notification
export async function createNotification({
  userEmail,
  type,
  title,
  message,
  link,
  relatedId,
  senderName,
  senderEmail
}) {
  const shouldSend = await shouldNotify(userEmail, type);
  if (!shouldSend) return null;
  
  return api.entities.Notification.create({
    user_email: userEmail,
    type,
    title,
    message,
    link,
    related_id: relatedId,
    sender_name: senderName,
    sender_email: senderEmail,
    is_read: false
  });
}

// Send email notification
async function sendEmailNotification({
  recipientEmail,
  subject,
  body
}) {
  try {
    const shouldSend = await shouldNotify(recipientEmail, 'email');
    if (!shouldSend) return;
    
    await api.integrations.Core.SendEmail({
      to: recipientEmail,
      subject: `UNswap - ${subject}`,
      body
    });
  } catch (error) {
    console.error('Failed to send email notification:', error);
  }
}

// Combined notification (in-app + email)
async function sendFullNotification({
  userEmail,
  type,
  title,
  message,
  link,
  relatedId,
  senderName,
  senderEmail,
  emailSubject,
  emailBody
}) {
  // Send in-app notification
  await createNotification({
    userEmail,
    type,
    title,
    message,
    link,
    relatedId,
    senderName,
    senderEmail
  });
  
  // Send email notification
  await sendEmailNotification({
    recipientEmail: userEmail,
    subject: emailSubject || title,
    body: emailBody || message
  });
}

export async function notifyNewMessage({ recipientEmail, senderName, senderEmail, conversationId }) {
  const displayName = senderName || 'UNswap Member';
  return sendFullNotification({
    userEmail: recipientEmail,
    type: 'message',
    title: 'New Message',
    message: `${displayName} sent you a message`,
    link: `/Messages`,
    relatedId: conversationId,
    senderName: displayName,
    senderEmail,
    emailSubject: 'New Message',
    emailBody: `
      <h2>You have a new message on UNswap</h2>
      <p><strong>${displayName}</strong> sent you a message.</p>
      <p>Log in to UNswap to read and reply: <a href="${window.location.origin}/Messages">View Messages</a></p>
    `
  });
}

export async function notifySwapRequest({ hostEmail, requesterName, propertyTitle, swapRequestId }) {
  const displayName = requesterName || 'UNswap Member';
  return sendFullNotification({
    userEmail: hostEmail,
    type: 'swap_pending',
    title: 'New Swap Request',
    message: `${displayName} wants to swap for "${propertyTitle}"`,
    link: `/MySwaps?tab=incoming`,
    relatedId: swapRequestId,
    senderName: displayName,
    emailSubject: 'New Swap Request',
    emailBody: `
      <h2>You have a new swap request!</h2>
      <p><strong>${displayName}</strong> is interested in staying at your property "${propertyTitle}".</p>
      <p>Review and respond to the request: <a href="${window.location.origin}/MySwaps">View Swap Requests</a></p>
      <p>Quick response increases your acceptance rate and member trust.</p>
    `
  });
}

export async function notifySwapApproved({ requesterEmail, hostName, propertyTitle, swapRequestId }) {
  const displayName = hostName || 'UNswap Member';
  return sendFullNotification({
    userEmail: requesterEmail,
    type: 'swap_approved',
    title: 'Swap Request Approved!',
    message: `Your request for "${propertyTitle}" has been approved by ${displayName}`,
    link: `/MySwaps?tab=outgoing`,
    relatedId: swapRequestId,
    senderName: displayName,
    emailSubject: 'Swap Request Approved! 🎉',
    emailBody: `
      <h2>Great news! Your swap request has been approved</h2>
      <p><strong>${displayName}</strong> has accepted your request to stay at "${propertyTitle}".</p>
      <p><strong>Next Steps:</strong></p>
      <ul>
        <li>Complete the mandatory video call verification</li>
        <li>Review security checklists</li>
        <li>Sign the immunity waiver</li>
        <li>Finalize your swap details</li>
      </ul>
      <p>View your swap: <a href="${window.location.origin}/MySwaps">My Swaps</a></p>
    `
  });
}

export async function notifySwapRejected({ requesterEmail, hostName, propertyTitle, swapRequestId }) {
  const displayName = hostName || 'UNswap Member';
  return sendFullNotification({
    userEmail: requesterEmail,
    type: 'swap_rejected',
    title: 'Swap Request Declined',
    message: `Your request for "${propertyTitle}" was declined by ${displayName}`,
    link: `/MySwaps?tab=outgoing`,
    relatedId: swapRequestId,
    senderName: displayName,
    emailSubject: 'Swap Request Update',
    emailBody: `
      <h2>Swap Request Update</h2>
      <p>Your request for "${propertyTitle}" was declined by ${displayName}.</p>
      <p>Don't worry! There are many other great properties available:</p>
      <p><a href="${window.location.origin}/FindProperties">Browse Available Properties</a></p>
    `
  });
}

export async function notifySwapCounterProposal({ requesterEmail, hostName, propertyTitle, swapRequestId, newDates }) {
  const displayName = hostName || 'UNswap Member';
  return sendFullNotification({
    userEmail: requesterEmail,
    type: 'swap_counter',
    title: 'Counter-Proposal Received',
    message: `${displayName} sent a counter-proposal for "${propertyTitle}"`,
    link: `/MySwaps?tab=outgoing`,
    relatedId: swapRequestId,
    senderName: displayName,
    emailSubject: 'Counter-Proposal for Your Swap Request',
    emailBody: `
      <h2>Counter-Proposal Received</h2>
      <p><strong>${displayName}</strong> has proposed alternative dates for your request to stay at "${propertyTitle}".</p>
      ${newDates ? `<p><strong>Proposed Dates:</strong> ${newDates}</p>` : ''}
      <p>Review the counter-proposal and respond: <a href="${window.location.origin}/MySwaps">View Counter-Proposal</a></p>
    `
  });
}

export async function notifyVideoCallScheduled({ guestEmail, hostEmail, guestName, hostName, propertyTitle, scheduledTime, videoCallId }) {
  const guestMessage = `Video call scheduled with ${hostName} for "${propertyTitle}"`;
  const hostMessage = `Video call scheduled with ${guestName} for your property`;
  
  const formattedTime = new Date(scheduledTime).toLocaleString('en-US', { 
    dateStyle: 'full', 
    timeStyle: 'short' 
  });
  
  // Notify guest
  await sendFullNotification({
    userEmail: guestEmail,
    type: 'video_call',
    title: 'Video Call Scheduled',
    message: guestMessage,
    link: `/MySwaps?tab=video-calls`,
    relatedId: videoCallId,
    senderName: hostName,
    emailSubject: 'Video Call Scheduled - Action Required',
    emailBody: `
      <h2>Video Call Scheduled</h2>
      <p>Your mandatory verification video call with <strong>${hostName}</strong> has been scheduled.</p>
      <p><strong>Property:</strong> ${propertyTitle}</p>
      <p><strong>Date & Time:</strong> ${formattedTime}</p>
      <p><strong>Important:</strong> This video call is mandatory to complete your swap. Both parties must attend.</p>
      <p>Join the call: <a href="${window.location.origin}/MySwaps?tab=video-calls">View Video Calls</a></p>
      <p>Add to your calendar and set a reminder!</p>
    `
  });
  
  // Notify host
  await sendFullNotification({
    userEmail: hostEmail,
    type: 'video_call',
    title: 'Video Call Scheduled',
    message: hostMessage,
    link: `/MySwaps?tab=video-calls`,
    relatedId: videoCallId,
    senderName: guestName,
    emailSubject: 'Video Call Scheduled - Action Required',
    emailBody: `
      <h2>Video Call Scheduled</h2>
      <p>Your mandatory verification video call with <strong>${guestName}</strong> has been scheduled.</p>
      <p><strong>Property:</strong> ${propertyTitle}</p>
      <p><strong>Date & Time:</strong> ${formattedTime}</p>
      <p><strong>Important:</strong> This video call is mandatory to complete the swap. Both parties must attend.</p>
      <p>Join the call: <a href="${window.location.origin}/MySwaps?tab=video-calls">View Video Calls</a></p>
    `
  });
}

export async function notifyVideoCallReminder({ userEmail, otherPartyName, propertyTitle, scheduledTime, videoCallId }) {
  const timeUntil = new Date(scheduledTime) - new Date();
  const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
  
  return sendFullNotification({
    userEmail,
    type: 'video_call',
    title: 'Upcoming Video Call',
    message: `Video call with ${otherPartyName} starts in ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''}`,
    link: `/MySwaps?tab=video-calls`,
    relatedId: videoCallId,
    senderName: otherPartyName,
    emailSubject: `Reminder: Video Call in ${hoursUntil} Hour${hoursUntil !== 1 ? 's' : ''}`,
    emailBody: `
      <h2>Upcoming Video Call Reminder</h2>
      <p>Your video call with <strong>${otherPartyName}</strong> is coming up soon!</p>
      <p><strong>Property:</strong> ${propertyTitle}</p>
      <p><strong>Time:</strong> ${new Date(scheduledTime).toLocaleString()}</p>
      <p>Make sure you're ready to join: <a href="${window.location.origin}/MySwaps?tab=video-calls">Join Video Call</a></p>
    `
  });
}

export async function notifySwapCompleted({ guestEmail, hostEmail, propertyTitle, swapRequestId }) {
  const guestBody = `
    <h2>Swap Completed Successfully! 🎉</h2>
    <p>Your stay at "${propertyTitle}" has been completed.</p>
    <p><strong>Please leave a review</strong> to help other members and maintain trust in our community.</p>
    <p>Your feedback matters! <a href="${window.location.origin}/MySwaps">Leave a Review</a></p>
  `;
  
  const hostBody = `
    <h2>Swap Completed Successfully!</h2>
    <p>The guest's stay at your property "${propertyTitle}" has been completed.</p>
    <p><strong>Please leave a review</strong> about your guest to help maintain our trusted community.</p>
    <p><a href="${window.location.origin}/MySwaps">Leave a Review</a></p>
  `;
  
  // Notify guest
  await sendFullNotification({
    userEmail: guestEmail,
    type: 'swap_approved',
    title: 'Swap Completed - Leave a Review',
    message: `Your stay at "${propertyTitle}" is complete. Please leave a review!`,
    link: `/MySwaps?tab=completed`,
    relatedId: swapRequestId,
    emailSubject: 'Swap Completed - Leave a Review',
    emailBody: guestBody
  });
  
  // Notify host
  await sendFullNotification({
    userEmail: hostEmail,
    type: 'swap_approved',
    title: 'Swap Completed - Leave a Review',
    message: `The guest's stay at "${propertyTitle}" is complete. Please leave a review!`,
    link: `/MySwaps?tab=completed`,
    relatedId: swapRequestId,
    emailSubject: 'Swap Completed - Leave a Review',
    emailBody: hostBody
  });
}

export async function notifyPropertyMatch({ userEmail, propertyTitle, propertyId }) {
  return createNotification({
    userEmail,
    type: 'property_match',
    title: 'New Property Match!',
    message: `A new property "${propertyTitle}" matches your preferences`,
    link: `/PropertyDetails?id=${propertyId}`,
    relatedId: propertyId
  });
}