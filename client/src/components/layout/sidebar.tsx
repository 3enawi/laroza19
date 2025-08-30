import { Link, useLocation } from "wouter";
import { Gem, Home, Package, TrendingUp, RotateCcw, BarChart } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [location] = useLocation();

  const navigation = [
    { name: "لوحة التحكم", href: "/dashboard", icon: Home },
    { name: "إدارة المخزون", href: "/inventory", icon: Package },
    { name: "المبيعات", href: "/sales", icon: TrendingUp },
    { name: "المرتجعات", href: "/returns", icon: RotateCcw },
    { name: "المحاسبة", href: "/accounting", icon: BarChart },
  ];

  return (
    <nav className="w-64 bg-card border-l border-border shadow-lg">
      <div className="p-6 border-b border-border">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1">
            <img 
              src="/logo.png" 
              alt="شعار لاروزا" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">لاروزا</h1>
            <p className="text-sm text-muted-foreground">LAROZA</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">نظام إدارة المتجر الداخلي</p>
      </div>
      
      {/* Navigation Menu */}
      <div className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground sidebar-active"
                    : "hover:bg-muted"
                )}
                data-testid={`nav-${item.name.replace(/\s+/g, '-')}`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
