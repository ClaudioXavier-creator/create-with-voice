import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  icon?: LucideIcon;
  title: string;
  description: string;
}

export default function PageHeader({ icon: Icon, title, description }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        {Icon && (
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
        <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
      </div>
      <p className={`text-muted-foreground ${Icon ? "ml-[52px]" : ""}`}>{description}</p>
    </div>
  );
}
