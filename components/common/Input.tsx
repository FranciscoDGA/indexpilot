'use client';

import React from 'react';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = '', ...props }, ref) => (
  <input
    ref={ref}
    className={`
      flex w-full px-4 py-2 text-base
      border border-input rounded-md
      bg-background text-foreground
      placeholder:text-muted-foreground
      focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
      disabled:opacity-50 disabled:cursor-not-allowed
      ${className}
    `}
    {...props}
  />
));

Input.displayName = 'Input';
