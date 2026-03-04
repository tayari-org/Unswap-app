import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Calendar, Copy, ExternalLink, Link as LinkIcon, CheckCircle2 } from 'lucide-react';

export default function CalendarSyncDialog({ open, onOpenChange, propertyId, property }) {
  const [icalUrl, setIcalUrl] = useState('');
  const [calendarName, setCalendarName] = useState('');
  const [provider, setProvider] = useState('other');
  const queryClient = useQueryClient();

  // Generate iCal feed URL for this property
  const exportUrl = `${window.location.origin}/api/ical/${propertyId}`;

  const updatePropertyMutation = useMutation({
    mutationFn: (data) => api.entities.Property.update(propertyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['properties']);
      toast.success('Calendar sync updated');
    },
  });

  const handleImportCalendar = () => {
    if (!icalUrl.trim()) {
      toast.error('Please enter a valid iCal URL');
      return;
    }

    const externalCalendars = property?.external_calendars || [];
    updatePropertyMutation.mutate({
      external_calendars: [...externalCalendars, { 
        url: icalUrl,
        name: calendarName || 'External Calendar',
        provider: provider,
        added_at: new Date().toISOString(),
        last_synced: new Date().toISOString()
      }],
      calendar_sync_enabled: true
    });
    setIcalUrl('');
    setCalendarName('');
    setProvider('other');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Calendar Sync
          </DialogTitle>
          <DialogDescription>
            Connect external calendars to keep your availability in sync
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Calendar */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900">Export to Other Calendars</h3>
            <p className="text-sm text-slate-600">
              Copy this URL and add it to your Google Calendar, Outlook, or other calendar apps
            </p>
            
            <div className="flex gap-2">
              <Input
                value={exportUrl}
                readOnly
                className="bg-slate-50 font-mono text-xs"
              />
              <Button
                variant="outline"
                onClick={() => copyToClipboard(exportUrl)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                Google Calendar
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                Apple Calendar
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                Outlook
              </Badge>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>How to sync:</strong> Copy the URL above, then in your calendar app, 
                add a new calendar from URL/subscription. Your bookings will appear automatically.
              </p>
            </div>
          </div>

          {/* Import Calendar */}
          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-semibold text-slate-900">Import External Calendar</h3>
            <p className="text-sm text-slate-600">
              Import bookings from Airbnb, Booking.com, or other platforms to avoid double bookings
            </p>
            
            <div className="space-y-3">
              <div>
                <Label>Calendar Name</Label>
                <Input
                  placeholder="My Google Calendar"
                  value={calendarName}
                  onChange={(e) => setCalendarName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Provider</Label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">Google Calendar</SelectItem>
                    <SelectItem value="outlook">Outlook Calendar</SelectItem>
                    <SelectItem value="airbnb">Airbnb</SelectItem>
                    <SelectItem value="booking_com">Booking.com</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>iCal/WebCal URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="https://calendar.google.com/calendar/ical/..."
                    value={icalUrl}
                    onChange={(e) => setIcalUrl(e.target.value)}
                  />
                  <Button onClick={handleImportCalendar} disabled={updatePropertyMutation.isPending}>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Imported Calendars */}
            {property?.external_calendars && property.external_calendars.length > 0 && (
              <div className="space-y-2 mt-4">
                <Label>Connected Calendars ({property.external_calendars.length})</Label>
                {property.external_calendars.map((cal, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-slate-900">
                          {cal.name || 'External Calendar'}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {cal.provider || 'other'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 font-mono truncate">
                        {cal.url}
                      </p>
                      {cal.last_synced && (
                        <p className="text-xs text-slate-500 mt-1">
                          Last synced: {new Date(cal.last_synced).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = property.external_calendars.filter((_, i) => i !== index);
                        updatePropertyMutation.mutate({ 
                          external_calendars: updated,
                          calendar_sync_enabled: updated.length > 0
                        });
                      }}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              <strong>Pro Tip:</strong> Enable calendar sync to automatically block dates when you have 
              bookings on other platforms, preventing double bookings.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}