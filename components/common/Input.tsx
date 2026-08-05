'use client';

import React from 'react';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = '', ...props }, ref) => (
  <input
    ref={ref}
    className={`
      flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2
      text-sm text-foreground
      placeholder:text-muted-foreground
      focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1
      disabled:cursor-not-allowed disabled:opacity-50
      file:border-0 file:bg-transparent file:text-sm file:font-medium
      ${className}
    `}
    {...props}
  />
));

Input.displayName = 'Input';
