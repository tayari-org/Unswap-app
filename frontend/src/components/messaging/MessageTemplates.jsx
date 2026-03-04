import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { FileText, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const templates = {
  booking: [
    {
      id: 'booking-confirm',
      title: 'Booking Confirmation',
      content: `Thank you for your booking request! I'm pleased to confirm your stay from [CHECK-IN DATE] to [CHECK-OUT DATE]. I'll send you the check-in instructions closer to your arrival date. Looking forward to hosting you!`
    },
    {
      id: 'booking-pending',
      title: 'Booking Under Review',
      content: `Thank you for your interest in my property! I've received your booking request and I'm reviewing the details. I'll get back to you within 24 hours. If you have any questions in the meantime, feel free to ask.`
    },
    {
      id: 'booking-declined',
      title: 'Booking Declined (Polite)',
      content: `Thank you for your interest in my property. Unfortunately, I'm unable to accommodate your request for the selected dates. I hope you find a suitable alternative, and perhaps we can connect for a future stay.`
    }
  ],
  checkin: [
    {
      id: 'checkin-instructions',
      title: 'Check-in Instructions',
      content: `Welcome! Here are your check-in details:

📍 Address: [FULL ADDRESS]
🔑 Access: [KEY/CODE DETAILS]
⏰ Check-in: After [TIME]
⏰ Check-out: Before [TIME]

🏠 Important Info:
- WiFi: [NETWORK] / Password: [PASSWORD]
- Parking: [DETAILS]
- Emergency contact: [PHONE]

Please let me know when you arrive safely!`
    },
    {
      id: 'arrival-reminder',
      title: 'Arrival Reminder',
      content: `Your stay begins tomorrow! Just a reminder that check-in is after [TIME]. I've sent the check-in instructions earlier. Please confirm your arrival time so I can ensure everything is ready for you.`
    },
    {
      id: 'early-checkin',
      title: 'Early Check-in Request',
      content: `I received your early check-in request for [TIME]. Let me check if the property will be ready by then and I'll get back to you shortly. If early check-in isn't possible, the property will definitely be ready by the standard check-in time of [STANDARD TIME].`
    }
  ],
  during: [
    {
      id: 'welcome-message',
      title: 'Welcome Message',
      content: `Welcome to [PROPERTY NAME]! I hope you had a smooth journey. Please don't hesitate to reach out if you need anything during your stay. Some local recommendations:

🍽️ Restaurants: [SUGGESTIONS]
🛒 Grocery: [NEAREST STORE]
🚕 Transport: [DETAILS]

Enjoy your stay!`
    },
    {
      id: 'issue-response',
      title: 'Issue Response',
      content: `Thank you for bringing this to my attention. I apologize for the inconvenience. I'm working on resolving this right away and will keep you updated. Your comfort is my priority.`
    },
    {
      id: 'checkout-reminder',
      title: 'Check-out Reminder',
      content: `Hope you're enjoying your stay! Just a friendly reminder that check-out is tomorrow at [TIME]. Please:
✓ Leave keys as instructed
✓ Turn off all lights/AC
✓ Take all belongings
✓ Lock the door

Safe travels!`
    }
  ],
  general: [
    {
      id: 'quick-response',
      title: 'Quick Response',
      content: `Thank you for your message! I'll get back to you shortly with more details.`
    },
    {
      id: 'property-inquiry',
      title: 'Property Inquiry Response',
      content: `Thank you for your interest in my property! I'd be happy to answer any questions you have. The property features [HIGHLIGHT AMENITIES]. What dates are you interested in?`
    },
    {
      id: 'thanks-review',
      title: 'Thank You for Review',
      content: `Thank you so much for taking the time to leave a review! It was a pleasure hosting you, and I'm glad you enjoyed your stay. You're welcome back anytime!`
    },
    {
      id: 'emergency-contact',
      title: 'Emergency Contact Info',
      content: `For any urgent matters during your stay:
🚨 Emergency services: [LOCAL NUMBER]
📞 My contact: [YOUR PHONE]
🏥 Nearest hospital: [ADDRESS]
👮 Police station: [ADDRESS]

For non-urgent questions, please message me here.`
    }
  ]
};

export default function MessageTemplates({ onSelectTemplate }) {
  const [open, setOpen] = useState(false);

  const handleSelect = (template) => {
    onSelectTemplate(template.content);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="text-slate-500 hover:text-slate-700"
        >
          <FileText className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Message Templates</SheetTitle>
          <SheetDescription>
            Quick responses for common inquiries
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          <div className="space-y-6 pr-4">
            {Object.entries(templates).map(([category, items]) => (
              <div key={category}>
                <h3 className="font-semibold text-slate-900 mb-3 capitalize">
                  {category === 'checkin' ? 'Check-in' : 
                   category === 'during' ? 'During Stay' : category}
                </h3>
                <div className="space-y-2">
                  {items.map((template) => (
                    <Card 
                      key={template.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleSelect(template)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 mb-2">
                              {template.title}
                            </p>
                            <p className="text-sm text-slate-600 line-clamp-2">
                              {template.content}
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="flex-shrink-0"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}