import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Save, AlertCircle, Lock, Trash2, Link as LinkIcon } from 'lucide-react';
import { format, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import { toast } from 'sonner';
import BlockDateDialog from '../calendar/BlockDateDialog';
import CalendarSyncDialog from '../calendar/CalendarSyncDialog';

export default function AvailabilityCalendar({ properties, swapRequests }) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.id || '');
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableTo, setAvailableTo] = useState('');
  const [minimumStay, setMinimumStay] = useState('');
  const [maximumStay, setMaximumStay] = useState('');
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState(null);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => api.auth.me(),
  });

  const { data: blockedDates = [] } = useQuery({
    queryKey: ['blocked-dates', selectedPropertyId],
    queryFn: () => api.entities.BlockedDate.filter({ property_id: selectedPropertyId }),
    enabled: !!selectedPropertyId,
  });

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  // Get booked dates for selected property
  const bookedDates = swapRequests
    .filter(s => 
      s.property_id === selectedPropertyId && 
      (s.status === 'approved' || s.status === 'completed')
    )
    .map(s => ({
      from: parseISO(s.check_in),
      to: parseISO(s.check_out),
      guest: s.requester_name
    }));

  // Update property availability
  const updateAvailabilityMutation = useMutation({
    mutationFn: (data) => api.entities.Property.update(selectedPropertyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['host-properties'] });
      toast.success('Availability updated successfully');
    },
    onError: () => {
      toast.error('Failed to update availability');
    }
  });

  const handleSaveAvailability = () => {
    if (!selectedPropertyId) return;

    updateAvailabilityMutation.mutate({
      available_from: availableFrom || null,
      available_to: availableTo || null,
      minimum_stay: minimumStay ? parseInt(minimumStay) : null,
      maximum_stay: maximumStay ? parseInt(maximumStay) : null,
    });
  };

  // Load property data when selection changes
  React.useEffect(() => {
    if (selectedProperty) {
      setAvailableFrom(selectedProperty.available_from || '');
      setAvailableTo(selectedProperty.available_to || '');
      setMinimumStay(selectedProperty.minimum_stay?.toString() || '');
      setMaximumStay(selectedProperty.maximum_stay?.toString() || '');
    }
  }, [selectedProperty]);

  const isDateBooked = (date) => {
    return bookedDates.some(booking => 
      isWithinInterval(date, { start: booking.from, end: booking.to })
    );
  };

  const isDateBlocked = (date) => {
    return blockedDates.some(blocked => {
      const start = parseISO(blocked.start_date);
      const end = parseISO(blocked.end_date);
      return isWithinInterval(date, { start, end });
    });
  };

  const deleteBlockedDateMutation = useMutation({
    mutationFn: (id) => api.entities.BlockedDate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['blocked-dates']);
      toast.success('Blocked dates removed');
    },
  });

  return (
    <div className="space-y-6">
      {/* Property Selector */}
      {properties.length > 1 && (
        <Card>
          <CardContent className="pt-6">
            <Label htmlFor="property-select">Select Property</Label>
            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
              <SelectTrigger id="property-select" className="mt-2">
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map(property => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Availability Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Availability Settings
            </CardTitle>
            <CardDescription>
              Set your property's available dates and booking requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="available-from">Available From</Label>
                <Input
                  id="available-from"
                  type="date"
                  value={availableFrom}
                  onChange={(e) => setAvailableFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="available-to">Available To</Label>
                <Input
                  id="available-to"
                  type="date"
                  value={availableTo}
                  onChange={(e) => setAvailableTo(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-stay">Minimum Stay (nights)</Label>
                <Input
                  id="min-stay"
                  type="number"
                  min="1"
                  value={minimumStay}
                  onChange={(e) => setMinimumStay(e.target.value)}
                  placeholder="e.g., 3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-stay">Maximum Stay (nights)</Label>
                <Input
                  id="max-stay"
                  type="number"
                  min="1"
                  value={maximumStay}
                  onChange={(e) => setMaximumStay(e.target.value)}
                  placeholder="e.g., 30"
                />
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                Leave dates empty for flexible availability. Booked dates will be blocked automatically.
              </p>
            </div>

            <div className="space-y-2">
              <Button
                onClick={handleSaveAvailability}
                disabled={updateAvailabilityMutation.isPending}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Availability
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowSyncDialog(true)}
                className="w-full"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Calendar Sync
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Booking Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Interactive Calendar</CardTitle>
            <CardDescription>
              Click dates to manage availability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <Calendar
                mode="range"
                selected={selectedDateRange}
                onSelect={(range) => {
                  setSelectedDateRange(range);
                  if (range?.from && range?.to) {
                    setShowBlockDialog(true);
                  }
                }}
                numberOfMonths={1}
                className="rounded-md border"
                modifiers={{
                  booked: (date) => isDateBooked(date),
                  blocked: (date) => isDateBlocked(date)
                }}
                modifiersStyles={{
                  booked: {
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    fontWeight: 'bold'
                  },
                  blocked: {
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    textDecoration: 'line-through'
                  }
                }}
                disabled={(date) => isDateBooked(date)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-amber-100 border border-amber-300" />
                  <span className="text-slate-600">Booked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
                  <span className="text-slate-600">Blocked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-white border-2 border-slate-900" />
                  <span className="text-slate-600">Available</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                <p className="font-medium mb-1">Quick Block:</p>
                <p>Select a date range on the calendar to block those dates instantly.</p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setSelectedDateRange(null);
                setShowBlockDialog(true);
              }}
              className="w-full"
            >
              <Lock className="w-4 h-4 mr-2" />
              Block Specific Dates
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Bookings</CardTitle>
          <CardDescription>
            Confirmed bookings for {selectedProperty?.title || 'this property'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bookedDates.length > 0 ? (
            <div className="space-y-3">
              {bookedDates
                .sort((a, b) => a.from - b.from)
                .map((booking, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{booking.guest}</p>
                      <p className="text-sm text-slate-600">
                        {format(booking.from, 'MMM d, yyyy')} - {format(booking.to, 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {Math.ceil((booking.to - booking.from) / (1000 * 60 * 60 * 24))} nights
                    </Badge>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No upcoming bookings</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blocked Dates List */}
      {blockedDates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Blocked Dates</CardTitle>
            <CardDescription>
              Dates you've manually blocked from booking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {blockedDates
                .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
                .map((blocked) => (
                  <div key={blocked.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Lock className="w-4 h-4 text-red-600" />
                        <p className="font-medium text-slate-900">
                          {format(parseISO(blocked.start_date), 'MMM d, yyyy')} - {format(parseISO(blocked.end_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <p className="text-sm text-slate-600 capitalize">{blocked.reason.replace('_', ' ')}</p>
                      {blocked.notes && (
                        <p className="text-sm text-slate-500 mt-1">{blocked.notes}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteBlockedDateMutation.mutate(blocked.id)}
                      className="text-red-600 hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <BlockDateDialog
        open={showBlockDialog}
        onOpenChange={setShowBlockDialog}
        propertyId={selectedPropertyId}
        ownerEmail={user?.email}
        initialDates={selectedDateRange}
      />

      <CalendarSyncDialog
        open={showSyncDialog}
        onOpenChange={setShowSyncDialog}
        propertyId={selectedPropertyId}
        property={selectedProperty}
      />
    </div>
  );
}