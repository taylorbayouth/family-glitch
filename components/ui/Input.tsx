'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends Omit<HTMLMotionProps<'input'>, 'size' | 'onChange'> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      leftIcon,
      rightIcon,
      size = 'md',
      disabled,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const sizes = {
      sm: 'px-4 py-2 text-sm min-h-[40px]',
      md: 'px-6 py-3 text-base min-h-[52px]',
      lg: 'px-8 py-4 text-lg min-h-[64px]',
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-mono text-steel-400 mb-2 uppercase tracking-wider">
            {label}
          </label>
        )}

        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-steel-500 pointer-events-none z-10">
              {leftIcon}
            </div>
          )}

          {/* Input field */}
          <motion.input
            ref={ref}
            className={cn(
              'w-full font-sans bg-void-light border-2 rounded-control',
              'text-frost placeholder:text-steel-600',
              'transition-all duration-200 outline-none',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              leftIcon ? 'pl-12' : '',
              rightIcon ? 'pr-12' : '',
              sizes[size],
              error
                ? 'border-alert focus:border-alert focus:shadow-[0_0_20px_rgba(255,59,92,0.3)]'
                : isFocused
                ? 'border-glitch shadow-glow'
                : 'border-steel-700 hover:border-steel-600',
              className
            )}
            disabled={disabled}
            onFocus={(e) => {
              setIsFocused(true);
              if (props.onFocus) {
                props.onFocus(e as any);
              }
            }}
            onBlur={(e) => {
              setIsFocused(false);
              if (props.onBlur) {
                props.onBlur(e as any);
              }
            }}
            whileTap={{ scale: disabled ? 1 : 0.995 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 17,
            }}
            {...props}
          />

          {/* Right icon */}
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-steel-500 pointer-events-none z-10">
              {rightIcon}
            </div>
          )}

          {/* Focus glow effect */}
          {isFocused && !error && (
            <motion.div
              className="absolute inset-0 rounded-control border-2 border-glitch pointer-events-none"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </div>

        {/* Error message */}
        {error && (
          <motion.p
            className="text-alert text-sm font-mono mt-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
