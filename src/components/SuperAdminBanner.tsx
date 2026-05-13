import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { canAccessLicenseAdmin } from "@/config/adminAccess";

interface Props {
  programa?: string;
}

export default function SuperAdminBanner({ programa }: Props) {
  const { user, roles } = useAuth();
  if (!canAccessLicenseAdmin(roles, user?.email)) return null;
  return (
    <div className="sticky top-0 z-50 w-full bg-primary text-primary-foreground shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ShieldCheck className="h-4 w-4" />
          Super Admin{programa ? ` · ${programa}` : ""} · central de gestão
        </div>
        <Link to="/admin">
          <Button size="sm" variant="secondary" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Super Admin (CRM)
          </Button>
        </Link>
      </div>
    </div>
  );
}
