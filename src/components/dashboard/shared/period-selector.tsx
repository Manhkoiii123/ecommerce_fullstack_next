"use client";

import { useState, useEffect } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface PeriodSelectorProps {
  selectedYear: number;
  selectedMonth: number;
  onPeriodChange: (year: number, month: number) => void;
  className?: string;
}

export const PeriodSelector = ({
  selectedYear,
  selectedMonth,
  onPeriodChange,
  className,
}: PeriodSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const handleMonthChange = (month: number) => {
    onPeriodChange(selectedYear, month);
    setIsOpen(false);
  };

  const handleYearChange = (year: number) => {
    onPeriodChange(year, selectedMonth);
    setIsOpen(false);
  };

  const formatDisplayText = () => {
    return `${monthNames[selectedMonth - 1]} ${selectedYear}`;
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Calendar className="h-4 w-4 text-muted-foreground" />

      {/* Month Selector */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[200px] justify-start text-left font-normal",
              !selectedMonth && "text-muted-foreground"
            )}
          >
            {formatDisplayText()}
            <ChevronDown className="ml-auto h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            <div className="grid grid-cols-3 gap-2">
              {monthNames.map((month, index) => (
                <Button
                  key={index}
                  variant={selectedMonth === index + 1 ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleMonthChange(index + 1)}
                  className="text-xs"
                >
                  {month}
                </Button>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t">
              <div className="text-sm font-medium mb-2 text-center">
                Select Year
              </div>
              <div className="grid grid-cols-3 gap-2">
                {years.map((year) => (
                  <Button
                    key={year}
                    variant={selectedYear === year ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleYearChange(year)}
                    className="text-xs"
                  >
                    {year}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
