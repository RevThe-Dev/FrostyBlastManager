import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconColor?: string;
  trend?: {
    value: string;
    positive?: boolean;
    neutral?: boolean;
    icon: ReactNode;
  };
}

export function StatsCard({ title, value, icon, iconColor = "text-primary", trend }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-neutral-600">{title}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
          </div>
          <div className="bg-neutral-100 p-2 rounded-full">
            <div className={cn("w-5 h-5", iconColor)}>
              {icon}
            </div>
          </div>
        </div>
        
        {trend && (
          <p className={cn(
            "text-xs mt-2 flex items-center",
            trend.positive ? "text-green-600" : trend.neutral ? "text-amber-600" : "text-red-600"
          )}>
            <span className="mr-1">{trend.icon}</span>
            <span>{trend.value}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
