"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

// Dynamic import for Recharts to avoid SSR issues
const ChartComponent = dynamic(() => import("./weekly-revenue-chart-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-80">
      <div className="text-muted-foreground">Đang tải biểu đồ...</div>
    </div>
  ),
});

interface WeeklyRevenueData {
  day: string | number;
  revenue: number;
}

interface WeeklyRevenueChartProps {
  data: WeeklyRevenueData[];
  title?: string;
  isDaily?: boolean;
}

export const WeeklyRevenueChart = ({
  data,
  title = "Doanh thu theo tuần",
  isDaily = false,
}: WeeklyRevenueChartProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80">
            <div className="text-muted-foreground">Loading chart...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartComponent data={data} isDaily={isDaily} />
      </CardContent>
    </Card>
  );
};
