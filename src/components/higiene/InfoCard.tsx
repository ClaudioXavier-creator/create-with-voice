
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface InfoCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badges?: string[];
  className?: string;
  iconClassName?: string;
}

export const InfoCard = ({ 
  icon: Icon, 
  title, 
  description, 
  badges,
  className = "border-primary/20 bg-primary/5",
  iconClassName = "text-primary"
}: InfoCardProps) => {
  return (
    <Card className={className}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <Icon className={`w-6 h-6 mt-0.5 ${iconClassName}`} />
          <div>
            <h4 className="font-display font-semibold text-sm">{title}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {description}
            </p>
            {badges && badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {badges.map((badge) => (
                  <span 
                    key={badge} 
                    className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
