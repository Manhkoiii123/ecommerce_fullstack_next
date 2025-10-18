"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface StoreStatusChartProps {
  data: {
    active: number;
    pending: number;
    banned: number;
    disabled: number;
  };
}

export const StoreStatusChart = ({ data }: StoreStatusChartProps) => {
  const chartData = [
    { name: "Active", value: data.active, color: "#22c55e" },
    { name: "Pending", value: data.pending, color: "#eab308" },
    { name: "Banned", value: data.banned, color: "#ef4444" },
    { name: "Disabled", value: data.disabled, color: "#64748b" },
  ];

  const total = data.active + data.pending + data.banned + data.disabled;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          Store Status Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) =>
                  `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <span className="text-sm font-medium">Active</span>
            <span className="text-lg font-bold">{data.active}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <span className="text-sm font-medium">Pending</span>
            <span className="text-lg font-bold">{data.pending}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
            <span className="text-sm font-medium">Banned</span>
            <span className="text-lg font-bold">{data.banned}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-lg">
            <span className="text-sm font-medium">Disabled</span>
            <span className="text-lg font-bold">{data.disabled}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
