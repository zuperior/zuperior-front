"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div
      className={cn(
        "relative",
        sizeClasses[size],
        className
      )}
    >
      {/* Outer spinning ring */}
      <div
        className="absolute inset-0 border-4 border-primary/20 rounded-full"
        style={{
          borderTopColor: "transparent",
          borderRightColor: "transparent",
        }}
      />
      {/* Inner spinning gradient */}
      <motion.div
        className="absolute inset-0 border-4 border-transparent rounded-full"
        style={{
          borderTopColor: "hsl(var(--primary))",
          borderRightColor: "hsl(var(--primary))",
        }}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}

interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <div className={cn("flex gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-2 w-2 rounded-full bg-current"
          animate={{
            y: [0, -8, 0],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export function PageLoader({ message = "Loading...", fullScreen = true }: PageLoaderProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <div className="absolute inset-0 animate-ping rounded-full opacity-20 bg-primary" />
        <LoadingSpinner size="lg" className="text-primary" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-sm font-medium text-muted-foreground"
      >
        {message}
      </motion.p>
      <LoadingDots />
    </div>
  );

  if (!fullScreen) return content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      {content}
    </div>
  );
}

interface CardLoaderProps {
  className?: string;
  message?: string;
}

export function CardLoader({ className, message = "Loading..." }: CardLoaderProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 py-12", className)}>

      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-8 bg-purple-500 rounded"
            animate={{
              scaleY: [0.4, 1, 0.4]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.15
            }}
          />
        ))}
      </div>

      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}

interface ButtonLoaderProps {
  className?: string;
  text?: string;
}

export function ButtonLoader({ className, text }: ButtonLoaderProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LoadingSpinner size="sm" />
      {text && <span>{text}</span>}
    </div>
  );
}

// Pulse animation for skeleton loading
export function PulseLoader({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn("bg-muted rounded-md", className)}
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

