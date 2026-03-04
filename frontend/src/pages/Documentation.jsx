import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function Documentation() {
  const [copiedSection, setCopiedSection] = useState(null);

  const copyToClipboard = (text, section) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">UNswap Documentation</h1>
          <p className="text-lg text-slate-600">Complete PRD, Architecture, and User Journey Maps</p>
        </div>

        <Tabs defaultValue="prd" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="prd">PRD</TabsTrigger>
            <TabsTrigger value="architecture">Architecture</TabsTrigger>
            <TabsTrigger value="journeys">User Journeys</TabsTrigger>
          </TabsList>

          {/* PRD TAB */}
          <TabsContent value="prd" className="space-y-8">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-3xl font-bold mb-6 text-slate-900">Product Requirements Document</h2>
              
              <div className="prose prose-slate max-w-none space-y-6">
                <section>
                  <h3 className="text-2xl font-semibold text-slate-800 mb-3">Executive Summary</h3>
                  <p className="text-slate-700">UNswap is a secure home exchange platform designed specifically for international civil servants and diplomatic staff. It enables verified users to swap properties for Rest & Recuperation (R&R) leave and rotations, with built-in security, insurance, and trust mechanisms.</p>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold text-slate-800 mb-3">1. Product Vision</h3>
                  <p className="text-slate-700">Enable seamless, secure property exchanges for UN staff and international organization employees globally, reducing R&R accommodation costs while building a trusted community.</p>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold text-slate-800 mb-3">2. Problem Statement</h3>
                  <ul className="list-disc list-inside space-y-2 text-slate-700">
                    <li>High R&R accommodation costs for international staff</li>
                    <li>Limited affordable housing options during rotations</li>
                    <li>Lack of trust/safety mechanisms in existing platforms</li>
                    <li>No verification specifically for diplomatic staff</li>
                    <li>Difficulty finding properties aligned with duty stations</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold text-slate-800 mb-3">3. Target Users</h3>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <p className="font-semibold text-slate-800">Primary Users:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 ml-2">
                      <li>UN staff (P-1 to D-2, G-1 to G-7)</li>
                      <li>International organization employees</li>
                      <li>Diplomatic corps members</li>
                      <li>International development professionals</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold text-slate-800 mb-3">4. Core Features</h3>
                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-slate-800">4.1 Property Management</h4>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 mt-2">
                        <li>Listings with photos, amenities, duty station mapping</li>
                        <li>External calendar sync (Google, Outlook, Airbnb)</li>
                        <li>Security compliance checklist</li>
                        <li>Mobility-specific tags</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-semibold text-slate-800">4.2 User Verification</h4>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 mt-2">
                        <li>Multi-level: Basic → Verified → Trusted → Staff</li>
                        <li>Domain-based auto-verification (@un.org)</li>
                        <li>Manual document upload with biometric selfies</li>
                        <li>Social profile verification</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-semibold text-slate-800">4.3 Swap Request System</h4>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 mt-2">
                        <li>Reciprocal swaps & GuestPoints-based exchanges</li>
                        <li>Mandatory video vetting calls</li>
                        <li>Insurance certificate verification</li>
                        <li>Counter-proposal functionality</li>
                        <li>Multiple key handoff methods</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-amber-500 pl-4">
                      <h4 className="font-semibold text-slate-800">4.4 GuestPoints System</h4>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 mt-2">
                        <li>Earn: From stays, referrals, reviews, verification</li>
                        <li>Spend: Discounts, upgrades, perks</li>
                        <li>Default allocation: 500 points per new user</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-red-500 pl-4">
                      <h4 className="font-semibold text-slate-800">4.5 Subscription Plans</h4>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 mt-2">
                        <li>Limited: $50/year</li>
                        <li>Standard: $150/year (most popular)</li>
                        <li>Unlimited Pro: $300/year</li>
                        <li>Lifetime Access: $1,500 (one-time)</li>
                        <li>Founders' Waiver: Referral-based lifetime access</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold text-slate-800 mb-3">5. Success Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="font-semibold text-slate-800 mb-2">Business Metrics:</p>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm">
                        <li>500+ verified users (3 months)</li>
                        <li>100+ active listings (2 months)</li>
                        <li>95%+ user satisfaction</li>
                        <li>80%+ subscription adoption</li>
                      </ul>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="font-semibold text-slate-800 mb-2">User Metrics:</p>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm">
                        <li>90%+ verification completion</li>
                        <li>95%+ video call attendance</li>
                        <li>80%+ review submission</li>
                        <li>60%+ repeat swap rate</li>
                      </ul>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </TabsContent>

          {/* ARCHITECTURE TAB */}
          <TabsContent value="architecture" className="space-y-8">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-3xl font-bold mb-6 text-slate-900">Technical Architecture</h2>
              
              <div className="prose prose-slate max-w-none space-y-6">
                <section>
                  <h3 className="text-2xl font-semibold text-slate-800 mb-3">1. System Overview</h3>
                  <div className="bg-slate-50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                    <pre>{`Frontend (React)
    ↓
Base44 SDK / API Client
    ↓
Base44 Backend-as-a-Service
├─ Database (Entities)
├─ Backend Functions (Deno)
├─ Authentication
└─ Real-time Updates
    ↓
External Integrations
├─ Stripe (Payments)
├─ Daily.co (Video)
└─ Google/Outlook Calendar APIs`}</pre>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold text-slate-800 mb-3">2. Tech Stack</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <p className="font-semibold text-slate-800 mb-2">Frontend</p>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm">
                        <li>React 18</li>
                        <li>Tailwind CSS</li>
                        <li>React Query (state management)</li>
                        <li>Framer Motion (animations)</li>
                      </ul>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="font-semibold text-slate-800 mb-2">Backend</p>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm">
                        <li>Deno Deploy (serverless)</li>
                        <li>Base44 BaaS (database)</li>
                        <li>Base44 Auth (built-in)</li>
                      </ul>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="font-semibold text-slate-800 mb-2">Integrations</p>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm">
                        <li>Stripe (payments)</li>
                        <li>Daily.co (video)</li>
                        <li>Calendar APIs</li>
                      </ul>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="font-semibold text-slate-800 mb-2">Deployment</p>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm">
                        <li>Serverless functions</li>
                        <li>CDN for static assets</li>
                        <li>Auto-scaling DB</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold text-slate-800 mb-3">3. Database Schema (Key Entities)</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'User', fields: 'Extended built-in entity with subscription, points, referral data' },
                      { name: 'Property', fields: 'Listings with availability, amenities, owner info, swap preferences' },
                      { name: 'SwapRequest', fields: 'Exchange records with status, dates, video call tracking' },
                      { name: 'Message', fields: 'Real-time chat with threading, reactions, attachments' },
                      { name: 'VideoCall', fields: 'Vetting calls with Daily.co room IDs and attendance tracking' },
                      { name: 'PaymentTransaction', fields: 'Stripe integration with subscription tracking' },
                      { name: 'Verification', fields: 'Multi-level user verification with document uploads' },
                      { name: 'Review', fields: '5-star ratings with moderation and helpful metrics' },
                      { name: 'Referral', fields: 'Tracking referrer → referred user relationships and rewards' },
                      { name: 'PlatformSettings', fields: 'Admin configuration for plans, waivers, guarantees' },
                    ].map((entity) => (
                      <div key={entity.name} className="border-l-4 border-slate-300 pl-4 py-2">
                        <p className="font-semibold text-slate-800">{entity.name}</p>
                        <p className="text-slate-600 text-sm">{entity.fields}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold text-slate-800 mb-3">4. Backend Functions</h3>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                    <p className="font-semibold text-slate-800">Key Functions:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      <li><code>createStripeCheckoutSession</code> - Initialize payments</li>
                      <li><code>handleStripeWebhook</code> - Process Stripe events</li>
                      <li><code>syncSubscriptionPayments</code> - Verify completed payments</li>
                      <li><code>createDailyRoom</code> - Generate video call rooms</li>
                      <li><code>processReferralRewards</code> - Handle referral completions</li>
                      <li><code>completeSwap</code> - Finalize swap records</li>
                      <li><code>checkFirstYearSwapGuarantee</code> - Verify guarantee eligibility</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold text-slate-800 mb-3">5. Real-time Features</h3>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg space-y-2">
                    <p className="font-semibold text-slate-800">Base44 Subscriptions:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm">
                      <li>New messages in conversations</li>
                      <li>Swap request status changes</li>
                      <li>Notifications (real-time)</li>
                      <li>Review postings</li>
                      <li>User verification updates</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold text-slate-800 mb-3">6. Security Measures</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-l-4 border-red-500 pl-4">
                      <p className="font-semibold text-slate-800 mb-2">Authentication</p>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm">
                        <li>JWT tokens (Base44)</li>
                        <li>Session management</li>
                        <li>Role-based access control</li>
                      </ul>
                    </div>
                    <div className="border-l-4 border-amber-500 pl-4">
                      <p className="font-semibold text-slate-800 mb-2">Data Protection</p>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm">
                        <li>HTTPS encryption</li>
                        <li>Input validation</li>
                        <li>XSS protection</li>
                      </ul>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </TabsContent>

          {/* USER JOURNEYS TAB */}
          <TabsContent value="journeys" className="space-y-8">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-3xl font-bold mb-6 text-slate-900">User Journeys & Flows</h2>
              
              <div className="prose prose-slate max-w-none space-y-8">
                <section>
                  <h3 className="text-2xl font-semibold text-slate-800 mb-4">1. Host Journey: "Sarah's First Property Listing"</h3>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                      <p className="font-semibold text-slate-800 mb-2">Phase 1: Onboarding (Days 1-2)</p>
                      <p className="text-slate-700 text-sm">Sign up → Email verification → Profile setup → Document verification → Dashboard</p>
                      <p className="text-slate-600 text-xs mt-2">⏱️ ~5 minutes | Key metric: Email verification rate</p>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                      <p className="font-semibold text-slate-800 mb-2">Phase 2: Property Listing (Days 3-5)</p>
                      <p className="text-slate-700 text-sm">Create listing (multi-step form) → Calendar sync → Upload photos → Publish</p>
                      <p className="text-slate-600 text-xs mt-2">⏱️ ~20 minutes | Key metric: Publish rate</p>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                      <p className="font-semibold text-slate-800 mb-2">Phase 3: Incoming Requests (Days 6-15)</p>
                      <p className="text-slate-700 text-sm">View request → Check guest profile → Messaging → Schedule video call</p>
                      <p className="text-slate-600 text-xs mt-2">⏱️ ~30 min interaction | Key metric: Conversion to approved swap</p>
                    </div>

                    <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-lg">
                      <p className="font-semibold text-slate-800 mb-2">Phase 4: Video Vetting Call (Days 12-14)</p>
                      <p className="text-slate-700 text-sm">Schedule call → Pre-call checklist → Join Daily.co room → Post-call rating</p>
                      <p className="text-slate-600 text-xs mt-2">⏱️ 30-40 min call | Key metric: 95%+ completion rate</p>
                    </div>

                    <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg">
                      <p className="font-semibold text-slate-800 mb-2">Phase 5: Pre-Arrival Prep (Days 15-28)</p>
                      <p className="text-slate-700 text-sm">Verify insurance → Finalize key handoff → Exchange emergency contacts</p>
                      <p className="text-slate-600 text-xs mt-2">⏱️ Multiple touchpoints | Key metric: Insurance compliance 100%</p>
                    </div>

                    <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-lg">
                      <p className="font-semibold text-slate-800 mb-2">Phase 6: During Stay (May 15-22)</p>
                      <p className="text-slate-700 text-sm">In-app support → Real-time messaging → Issue resolution → Checkout</p>
                      <p className="text-slate-600 text-xs mt-2">⏱️ Ongoing | Key metric: Issue resolution time</p>
                    </div>

                    <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 p-4 rounded-lg">
                      <p className="font-semibold text-slate-800 mb-2">Phase 7: Post-Swap Review (Days 29-32)</p>
                      <p className="text-slate-700 text-sm">Receive review notification → Leave counter-review → Earn points</p>
                      <p className="text-slate-600 text-xs mt-2">⏱️ ~10 min | Key metric: 80%+ review completion</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold text-slate-800 mb-4">2. Guest Journey: "Raj's First Swap Request"</h3>
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-blue-500">
                      <p className="font-semibold text-slate-800 mb-2">Discovery Phase</p>
                      <p className="text-slate-700 text-sm">Home → Browse properties → Filter by location/dates/amenities → View details → Save favorite</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-green-500">
                      <p className="font-semibold text-slate-800 mb-2">Request Submission</p>
                      <p className="text-slate-700 text-sm">Click "Request Swap" → Confirm dates → Write personal message → Agree to terms → Submit</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-purple-500">
                      <p className="font-semibold text-slate-800 mb-2">Communication</p>
                      <p className="text-slate-700 text-sm">Receive approval notification → Start real-time messaging → Share documents → Build trust</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-amber-500">
                      <p className="font-semibold text-slate-800 mb-2">Video Vetting</p>
                      <p className="text-slate-700 text-sm">Schedule video call → Pre-call preparation → Join call on Daily.co → Discuss logistics</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-red-500">
                      <p className="font-semibold text-slate-800 mb-2">Finalization</p>
                      <p className="text-slate-700 text-sm">Verify host's insurance → Confirm key handoff → Exchange emergency contacts → Ready for stay</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-indigo-500">
                      <p className="font-semibold text-slate-800 mb-2">During & Post-Stay</p>
                      <p className="text-slate-700 text-sm">Check-in documentation → Real-time support → Checkout → Leave review → Earn points</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold text-slate-800 mb-4">3. Admin Dashboard Journey</h3>
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-lg space-y-4">
                    <p className="font-semibold text-slate-800">Daily Admin Tasks:</p>
                    <ul className="list-disc list-inside space-y-2 text-slate-700">
                      <li><strong>Overview Tab</strong>: Monitor KPIs (users, listings, swaps, revenue)</li>
                      <li><strong>Users Tab</strong>: Approve verifications, manage accounts, handle complaints</li>
                      <li><strong>Verifications Tab</strong>: Review document uploads, approve/reject applications</li>
                      <li><strong>Properties Tab</strong>: Moderate listings, flag non-compliance, manage featured properties</li>
                      <li><strong>Reviews Tab</strong>: Moderate reviews, remove spam/abuse, track helpful votes</li>
                      <li><strong>Settings Tab</strong>: Configure platform (launch status, subscription plans, referral rules)</li>
                      <li><strong>Activity Log</strong>: Audit trail of all platform actions for compliance</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold text-slate-800 mb-4">4. Key Conversion Flows</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="font-semibold text-slate-800 mb-2">Subscription Conversion</p>
                      <p className="text-slate-700 text-sm">Discover feature → Hit paywall → View plans → Stripe checkout → Verification email → Active subscription</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="font-semibold text-slate-800 mb-2">Referral Program</p>
                      <p className="text-slate-700 text-sm">Get referral code → Share link → Friend signs up → Friend completes swap → Host earns reward</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="font-semibold text-slate-800 mb-2">Verification Flow</p>
                      <p className="text-slate-700 text-sm">Sign up → Domain check → Auto-verify (or manual upload) → Profile boost → Can list/swap</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg">
                      <p className="font-semibold text-slate-800 mb-2">Payment Processing</p>
                      <p className="text-slate-700 text-sm">Select plan → Create Stripe session → User pays → Webhook received → Auto-sync subscription</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold text-slate-800 mb-4">5. Success Metrics</h3>
                  <div className="space-y-3">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="font-semibold text-slate-800 mb-2">✓ Onboarding</p>
                      <p className="text-slate-700 text-sm">Email verification: 95%+ | Document submission: 85%+ | First swap: &lt;14 days</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="font-semibold text-slate-800 mb-2">✓ Swap Lifecycle</p>
                      <p className="text-slate-700 text-sm">Video call completion: 95%+ | Review completion: 80%+ | Avg rating: 4.5+ stars</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="font-semibold text-slate-800 mb-2">✓ Monetization</p>
                      <p className="text-slate-700 text-sm">Subscription adoption: 50%+ | Renewal rate: 90%+ | Lifetime waiver: 15% of users</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg">
                      <p className="font-semibold text-slate-800 mb-2">✓ Trust & Safety</p>
                      <p className="text-slate-700 text-sm">Dispute rate: &lt;2% | Review flagging: &lt;5% | Suspensions: &lt;1%</p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="font-semibold text-amber-900 mb-2">📋 About This Documentation</h3>
          <p className="text-amber-800 text-sm">This page contains the complete PRD, technical architecture, and user journey maps for the UNswap platform. Use the tabs above to navigate between sections.</p>
        </div>
      </div>
    </div>
  );
}