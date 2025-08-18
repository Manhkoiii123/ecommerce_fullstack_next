"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, CheckCircle, Clock } from "lucide-react";

interface ConversionRateStats {
  completedOrders: number;
  totalOrders: number;
  conversionRate: number;
}

interface ConversionRateCardProps {
  stats: ConversionRateStats;
}

export const ConversionRateCard = ({ stats }: ConversionRateCardProps) => {
  const getConversionColor = (rate: number) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-yellow-600";
    if (rate >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getConversionBadgeVariant = (rate: number) => {
    if (rate >= 80) return "default";
    if (rate >= 60) return "secondary";
    if (rate >= 40) return "outline";
    return "destructive";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5" />
          Order Conversion Rate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Conversion Rate */}
        <div className="text-center">
          <div className="text-4xl font-bold mb-2">
            <span className={getConversionColor(stats.conversionRate)}>
              {stats.conversionRate}%
            </span>
          </div>
          <Badge variant={getConversionBadgeVariant(stats.conversionRate)}>
            {stats.conversionRate >= 80
              ? "Excellent"
              : stats.conversionRate >= 60
              ? "Good"
              : stats.conversionRate >= 40
              ? "Average"
              : "Needs Improvement"}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Completion Progress</span>
            <span className="font-medium">{stats.conversionRate}%</span>
          </div>
          <Progress value={stats.conversionRate} className="h-3" />
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">
              {stats.completedOrders}
            </div>
            <p className="text-sm text-green-700">Completed</p>
          </div>

          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalOrders}
            </div>
            <p className="text-sm text-blue-700">Total Orders</p>
          </div>
        </div>

        {/* Insights */}
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Improvement Suggestions:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {stats.conversionRate < 80 && (
              <>
                <li>• Optimize order processing workflow</li>
                <li>• Improve customer service</li>
                <li>• Monitor and quickly handle delayed orders</li>
              </>
            )}
            {stats.conversionRate >= 80 && (
              <li>• Maintain current service quality</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
