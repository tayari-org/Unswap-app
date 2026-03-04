import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, Home, CheckCircle, ArrowRight, ArrowLeft, 
  Mail, FileText, MapPin, Sparkles, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import ReferralCapture from './ReferralCapture';

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to UNswap',
    icon: Sparkles,
    description: 'Let\'s get you started with secure home exchanges'
  },
  {
    id: 'profile',
    title: 'Complete Your Profile',
    icon: User,
    description: 'Tell us about yourself and your organization'
  },
  {
    id: 'verification',
    title: 'Get Verified',
    icon: Shield,
    description: 'Verify your identity to build trust'
  },
  {
    id: 'listing',
    title: 'Create Your First Listing',
    icon: Home,
    description: 'List your property and start swapping'
  }
];

export default function OnboardingWizard({ user, open, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const completeOnboardingMutation = useMutation({
    mutationFn: () => api.auth.updateMe({ 
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['current-user']);
      toast.success('Welcome to UNswap! 🎉');
    }
  });

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    completeOnboardingMutation.mutate();
    onClose();
  };

  const handleNavigate = (path) => {
    completeOnboardingMutation.mutate();
    onClose();
    navigate(createPageUrl(path));
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const CurrentIcon = STEPS[currentStep].icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>

          {/* Progress bar */}
          <div className="px-8 pt-8 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">
                Step {currentStep + 1} of {STEPS.length}
              </span>
              <span className="text-sm text-slate-500">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step indicator */}
          <div className="flex justify-center gap-2 px-8 pb-6">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep 
                    ? 'bg-amber-500 w-6' 
                    : index < currentStep 
                    ? 'bg-emerald-500' 
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="px-8 pb-8"
            >
              {/* Welcome Step */}
              {currentStep === 0 && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-3">
                    Welcome to UNswap! 🏡
                  </h2>
                  <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
                    The trusted home exchange network for international civil servants. 
                    Let's get you set up in just a few steps.
                  </p>

                  <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                    {[
                      { icon: Shield, title: 'Secure & Verified', desc: 'All members are verified UN/IO staff' },
                      { icon: Home, title: 'Global Network', desc: 'Properties in 100+ duty stations worldwide' },
                      { icon: CheckCircle, title: 'Trusted Community', desc: 'Built by staff, for staff' }
                    ].map((feature, i) => (
                      <Card key={i} className="border-slate-200">
                        <CardContent className="p-6 text-center">
                          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <feature.icon className="w-6 h-6 text-amber-600" />
                          </div>
                          <h3 className="font-semibold text-slate-900 mb-1">{feature.title}</h3>
                          <p className="text-sm text-slate-600">{feature.desc}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Profile Step */}
              {currentStep === 1 && (
                <div className="max-w-2xl mx-auto space-y-6">
                  <ReferralCapture user={user} />
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Complete Your Profile</h2>
                    <p className="text-slate-600">
                      Help colleagues get to know you and build trust in the community
                    </p>
                  </div>

                  <Card className="border-slate-200 mb-6">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 mb-1">Personal Information</h3>
                            <p className="text-sm text-slate-600">Add your photo, bio, and contact details</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 mb-1">Professional Details</h3>
                            <p className="text-sm text-slate-600">Organization, duty station, and staff grade</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 mb-1">Preferences</h3>
                            <p className="text-sm text-slate-600">Set your notification and swap preferences</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-3">
                    <Button 
                      onClick={() => handleNavigate('Settings')}
                      className="flex-1 bg-amber-500 hover:bg-amber-600"
                    >
                      Set Up Profile Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Verification Step */}
              {currentStep === 2 && (
                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Get Verified</h2>
                    <p className="text-slate-600">
                      Verify your identity to unlock full access and build trust
                    </p>
                  </div>

                  <Card className="border-emerald-200 bg-emerald-50 mb-6">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-emerald-900 mb-3">Why verify?</h3>
                      <ul className="space-y-2 text-sm text-emerald-800">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          Send and receive swap requests
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          Get a verified badge on your profile
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          80% higher acceptance rate on requests
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          Access priority customer support
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 mb-6">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-slate-900 mb-4">Verification Process</h3>
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-amber-700">1</span>
                            </div>
                            <div className="w-px h-full bg-slate-200 mt-2"></div>
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2 mb-1">
                              <Mail className="w-4 h-4 text-slate-500" />
                              <h4 className="font-medium text-slate-900">Verify Official Email</h4>
                            </div>
                            <p className="text-sm text-slate-600">
                              We'll send a code to your UN/IO email address
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-amber-700">2</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="w-4 h-4 text-slate-500" />
                              <h4 className="font-medium text-slate-900">Upload ID Document</h4>
                            </div>
                            <p className="text-sm text-slate-600">
                              Staff ID, Laissez-Passer, or employment letter
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-3">
                    <Button 
                      onClick={() => handleNavigate('Settings')}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                    >
                      Start Verification
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Listing Step */}
              {currentStep === 3 && (
                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Home className="w-8 h-8 text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">List Your Property</h2>
                    <p className="text-slate-600">
                      Create your first listing and start exchanging homes
                    </p>
                  </div>

                  <Card className="border-slate-200 mb-6">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-slate-900 mb-4">What to include in your listing</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {[
                          { icon: MapPin, title: 'Location & Details', desc: 'Address, type, size' },
                          { icon: Home, title: 'Photos', desc: '5-10 clear photos' },
                          { icon: FileText, title: 'Description', desc: 'Amenities, features' },
                          { icon: Shield, title: 'Security Info', desc: 'Safety features' }
                        ].map((item, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                              <item.icon className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-slate-900 text-sm">{item.title}</h4>
                              <p className="text-xs text-slate-600">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-amber-200 bg-amber-50 mb-6">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-amber-900 mb-2">Pro Tips</h3>
                      <ul className="space-y-1 text-sm text-amber-800">
                        <li>• High-quality photos increase swap requests by 3x</li>
                        <li>• Detailed descriptions build trust with potential guests</li>
                        <li>• Highlight proximity to duty stations and amenities</li>
                        <li>• Keep your calendar updated for better matches</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <div className="flex gap-3">
                    <Button 
                      onClick={() => handleNavigate('MyListings')}
                      className="flex-1 bg-amber-500 hover:bg-amber-600"
                    >
                      Create Your Listing
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button 
                      onClick={handleComplete}
                      variant="outline"
                      className="flex-1"
                    >
                      Skip for Now
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between px-8 pb-8 pt-4 border-t border-slate-200">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="text-slate-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button
                onClick={handleNext}
                className="bg-slate-900 hover:bg-slate-800"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete Onboarding
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}