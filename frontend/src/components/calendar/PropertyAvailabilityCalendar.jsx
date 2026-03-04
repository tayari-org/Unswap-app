import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { addDays, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Lock, CheckCircle } from 'lucide-react';

export default function PropertyAvailabilityCalendar({ propertyId, onDateSelect }) {
  const [selectedDates, setSelectedDates] = useState({ from: null, to: null });

  const { data: property } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: async () => {
      const properties = await api.entities.Property.list();
      return properties.find(p => p.id === propertyId);
    },
    enabled: !!propertyId,
  });

  const { data: swapRequests = [] } = useQuery({
    queryKey: ['property-bookings', propertyId],
    queryFn: () => api.entities.SwapRequest.filter({
      property_id: propertyId,
      status: { $in: ['approved', 'video_scheduled', 'completed'] }
    }),
    enabled: !!propertyId,
  });

  const { data: blockedDates = [] } = useQuery({
    queryKey: ['blocked-dates', propertyId],
    queryFn: () => api.entities.BlockedDate.filter({ property_id: propertyId }),
    enabled: !!propertyId,
  });

  const isDateBlocked = (date) => {
    // Check property-wide availability
    if (property?.available_from && property?.available_to) {
      const availFrom = parseISO(property.available_from);
      const availTo = parseISO(property.available_to);
      if (!isWithinInterval(date, { start: availFrom, end: availTo })) {
        return true;
      }
    }

    // Check existing bookings
    const isBooked = swapRequests.some(request => {
      const checkIn = parseISO(request.check_in);
      const checkOut = parseISO(request.check_out);
      return isWithinInterval(date, { start: checkIn, end: checkOut });
    });

    if (isBooked) return true;

    // Check blocked dates
    const isBlocked = blockedDates.some(blocked => {
      const start = parseISO(blocked.start_date);
      const end = parseISO(blocked.end_date);
      return isWithinInterval(date, { start, end });
    });

    return isBlocked;
  };

  const handleDateSelect = (date) => {
    if (isDateBlocked(date)) return;

    if (!selectedDates.from || (selectedDates.from && selectedDates.to)) {
      // Start new selection
      setSelectedDates({ from: date, to: null });
    } else {
      // Complete selection
      if (date < selectedDates.from) {
        setSelectedDates({ from: date, to: selectedDates.from });
      } else {
        setSelectedDates({ from: selectedDates.from, to: date });
      }
      
      if (onDateSelect) {
        onDateSelect({
          from: date < selectedDates.from ? date : selectedDates.from,
          to: date < selectedDates.from ? selectedDates.from : date
        });
      }
    }
  };

  const modifiers = {
    blocked: (date) => isDateBlocked(date),
    selected: (date) => {
      if (selectedDates.from && selectedDates.to) {
        return isWithinInterval(date, { start: selectedDates.from, end: selectedDates.to });
      }
      return selectedDates.from && isSameDay(date, selectedDates.from);
    },
  };

  const modifiersStyles = {
    blocked: {
      backgroundColor: '#f1f5f9',
      color: '#94a3b8',
      textDecoration: 'line-through',
      cursor: 'not-allowed',
    },
    selected: {
      backgroundColor: '#f59e0b',
      color: 'white',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Select Your Dates
        </CardTitle>
        <CardDescription>
          Choose your check-in and check-out dates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="single"
          selected={selectedDates.from}
          onDayClick={handleDateSelect}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          disabled={(date) => date < new Date() || isDateBlocked(date)}
          className="rounded-md border"
        />

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-500 rounded"></div>
            <span className="text-slate-600">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-200 rounded"></div>
            <span className="text-slate-600">Not available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-slate-900 rounded"></div>
            <span className="text-slate-600">Today</span>
          </div>
        </div>

        {/* Selection Summary */}
        {selectedDates.from && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm font-medium text-amber-900">
              {selectedDates.to ? (
                <>
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Selected: {selectedDates.from.toLocaleDateString()} - {selectedDates.to.toLocaleDateString()}
                </>
              ) : (
                <>
                  Check-in: {selectedDates.from.toLocaleDateString()}
                  <br />
                  <span className="text-xs text-amber-700">Select check-out date</span>
                </>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}