"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface WeeklyRevenueData {
  day: string | number;
  revenue: number;
}

interface WeeklyRevenueChartInnerProps {
  data: WeeklyRevenueData[];
  isDaily?: boolean;
}

const WeeklyRevenueChartInner = ({
  data,
  isDaily = false,
}: WeeklyRevenueChartInnerProps) => {
  const formatRevenue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const formatXAxisLabel = (value: string | number) => {
    if (isDaily) {
      return `Day ${value}`;
    }
    return value;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          // @ts-ignore
          tickFormatter={formatXAxisLabel}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          fontSize={12}
          tickFormatter={formatRevenue}
        />
        <Tooltip
          formatter={(value: number) => [
            `$${value.toLocaleString()} `,
            "Revenue",
          ]}
          labelStyle={{ color: "#374151" }}
          labelFormatter={(label) => {
            if (isDaily) {
              return `Day ${label}`;
            }
            return label;
          }}
        />
        <Bar
          dataKey="revenue"
          fill="#3b82f6"
          radius={[4, 4, 0, 0]}
          maxBarSize={50}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default WeeklyRevenueChartInner;
