import React from 'react';
import { format, isToday, isYesterday } from 'date-fns';

export default function DateSeparator({ date }) {
  const formatDate = (date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  return (
    <div className="flex items-center justify-center my-4">
      <div className="bg-slate-100 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">
        {formatDate(new Date(date))}
      </div>
    </div>
  );
}