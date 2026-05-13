
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
  className,
  iconClassName
}: InfoCardProps) => {
  return (
    <Card className={cn("relative overflow-hidden border-none shadow-premium bg-card group transition-all duration-300 hover:shadow-premium-hover", className)}>
      {/* Decorative gradient corner */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[100px] -mr-4 -mt-4 transition-all duration-500 group-hover:bg-primary/10 group-hover:scale-110" />
      
      <CardContent className="pt-6 relative z-10">
        <div className="flex items-start gap-4">
          <div className={cn("flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 shadow-inner shrink-0 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105", iconClassName)}>
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h4 className="font-display font-bold text-base text-foreground tracking-tight">{title}</h4>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              {description}
            </p>
            {badges && badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {badges.map((badge) => (
                  <span 
                    key={badge} 
                    className="inline-flex items-center rounded-lg border border-primary/10 bg-primary/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary"
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
