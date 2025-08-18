"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface CountdownTimerProps {
  endDate: Date;
  onExpire?: () => void;
  className?: string;
  showLabels?: boolean;
  variant?: "default" | "compact" | "minimal";
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer({
  endDate,
  onExpire,
  className = "",
  showLabels = true,
  variant = "default",
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setIsExpired(true);
        onExpire?.();
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        };
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds };
    };

    // Calculate immediately
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate, onExpire]);

  if (isExpired) {
    return (
      <div className={`text-center ${className}`}>
        <span className="text-red-500 font-semibold">Flash Sale Ended!</span>
      </div>
    );
  }

  const renderTimeUnit = (
    value: number,
    label: string,
    isCompact: boolean = false
  ) => {
    if (variant === "minimal") {
      return (
        <span className="text-sm text-muted-foreground">
          {value.toString().padStart(2, "0")}
        </span>
      );
    }

    if (variant === "compact") {
      return (
        <div className="text-center">
          <div className="text-lg font-bold text-red-600">
            {value.toString().padStart(2, "0")}
          </div>
          {showLabels && (
            <div className="text-xs text-muted-foreground uppercase">
              {label.charAt(0)}
            </div>
          )}
        </div>
      );
    }

    // Default variant
    return (
      <div className="text-center">
        <div className="text-2xl font-bold text-red-600">
          {value.toString().padStart(2, "0")}
        </div>
        {showLabels && (
          <div className="text-sm text-muted-foreground capitalize">
            {label}
          </div>
        )}
      </div>
    );
  };

  if (variant === "minimal") {
    return (
      <div className={`flex items-center gap-1 text-sm ${className}`}>
        {renderTimeUnit(timeLeft.days, "days", true)}
        <span className="text-muted-foreground">:</span>
        {renderTimeUnit(timeLeft.hours, "hours", true)}
        <span className="text-muted-foreground">:</span>
        {renderTimeUnit(timeLeft.minutes, "minutes", true)}
        <span className="text-muted-foreground">:</span>
        {renderTimeUnit(timeLeft.seconds, "seconds", true)}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-center gap-4">
          {renderTimeUnit(timeLeft.days, "days")}
          <div className="text-2xl font-bold text-muted-foreground">:</div>
          {renderTimeUnit(timeLeft.hours, "hours")}
          <div className="text-2xl font-bold text-muted-foreground">:</div>
          {renderTimeUnit(timeLeft.minutes, "minutes")}
          <div className="text-2xl font-bold text-muted-foreground">:</div>
          {renderTimeUnit(timeLeft.seconds, "seconds")}
        </div>
      </CardContent>
    </Card>
  );
}
