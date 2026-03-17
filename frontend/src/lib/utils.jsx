// src/lib/utils.jsx
import React, { useState } from 'react';
import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getInitials(name) {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

export function AvatarUI({ user, className, imgClassName = "" }) {
  const [imgError, setImgError] = useState(false);

  if (!user) return null;
  const name = user.full_name || user.username || user.email || '?';
  const sizeClass = className || "w-full h-full";

  if (user.avatar_url && !imgError) {
    return (
      <img 
        src={user.avatar_url} 
        alt={name} 
        className={cn("object-cover", sizeClass, imgClassName)}
        onError={() => setImgError(true)}
      />
    );
  }

  // Fallback to initials
  return (
    <div className={cn("flex items-center justify-center bg-unswap-blue-deep/10 text-unswap-blue-deep font-bold leading-none tracking-widest", sizeClass)}>
      {getInitials(name)}
    </div>
  );
}

 


export const isIframe = window.self !== window.top;
