import React, { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

export default function ImageAttachment({ src, onRemove, isPreview = false }) {
  if (isPreview) {
    return (
      <div className="relative inline-block">
        <img 
          src={src} 
          alt="Attachment preview" 
          className="h-16 w-16 object-cover rounded-lg border border-slate-200"
        />
        <button
          onClick={onRemove}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="relative group">
          <img 
            src={src} 
            alt="Attached image" 
            className="max-w-[200px] max-h-[200px] object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
            <ZoomIn className="w-6 h-6 text-white" />
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl p-2">
        <img src={src} alt="Full size" className="w-full h-auto rounded-lg" />
      </DialogContent>
    </Dialog>
  );
}