import React, { useState, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CalendarDays } from 'lucide-react';

export default function BlockDateDialog({ open, onOpenChange, propertyId, ownerEmail, initialDates }) {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState(initialDates || { from: undefined, to: undefined });
  const [formData, setFormData] = useState({
    reason: 'other',
    notes: '',
  });

  useEffect(() => {
    if (initialDates) {
      setDateRange(initialDates);
    }
  }, [initialDates]);

  const blockDateMutation = useMutation({
    mutationFn: (data) => api.entities.BlockedDate.create({
      ...data,
      property_id: propertyId,
      owner_email: ownerEmail,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['blocked-dates']);
      toast.success('Dates blocked successfully');
      setDateRange({ from: undefined, to: undefined });
      setFormData({ reason: 'other', notes: '' });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!dateRange?.from || !dateRange?.to) {
      toast.error('Please select both start and end dates');
      return;
    }
    blockDateMutation.mutate({
      start_date: format(dateRange.from, 'yyyy-MM-dd'),
      end_date: format(dateRange.to, 'yyyy-MM-dd'),
      ...formData,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Block Dates</DialogTitle>
          <DialogDescription>
            Make your property unavailable for specific dates
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="mb-2 flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Select Date Range
            </Label>
            {dateRange?.from && (
              <div className="mb-3 p-2 bg-slate-50 rounded-lg text-sm text-center">
                <span className="font-medium">
                  {format(dateRange.from, 'MMM dd, yyyy')}
                  {dateRange.to && ` → ${format(dateRange.to, 'MMM dd, yyyy')}`}
                </span>
              </div>
            )}
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              disabled={(date) => date < new Date()}
              className="rounded-md border mx-auto"
            />
          </div>

          <div>
            <Label>Reason</Label>
            <Select value={formData.reason} onValueChange={(value) => setFormData({ ...formData, reason: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="personal_use">Personal Use</SelectItem>
                <SelectItem value="already_booked">Already Booked</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notes (Optional)</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional details..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={blockDateMutation.isPending}>
              Block Dates
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}