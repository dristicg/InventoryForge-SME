"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Truck, 
  Factory,
  ArrowLeft
} from "lucide-react";

export default function SidebarNav() {
  const pathname = usePathname();

  // Don't show sidebar on the landing page
  if (pathname === "/") return null;

  const navItems = [
    { name: "Analytics", href: "/dashboard", icon: LayoutDashboard },
    { name: "Products", href: "/dashboard/products", icon: Package },
    { name: "Sales Orders", href: "/sales", icon: ShoppingCart },
    { name: "Purchases", href: "/purchases", icon: Truck },
    { name: "Manufacturing", href: "/manufacturing", icon: Factory },
  ];

  return (
    <div className="w-64 bg-slate-900 text-slate-300 h-screen flex flex-col pt-4 shadow-xl">
      <div className="px-6 pb-6 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg group-hover:scale-105 transition-transform">
            <Package size={20} />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">InventoryForge</span>
        </Link>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Menu</div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${
                isActive 
                  ? "bg-blue-600/10 text-blue-400" 
                  : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={18} className={isActive ? "text-blue-500" : "text-slate-400"} />
              {item.name}
              {item.name === "Manufacturing" && (
                <span className="ml-auto bg-slate-800 text-slate-400 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">Kanban</span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800">
         <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors px-2 py-2">
            <ArrowLeft size={16} />
            <span>Back to Website</span>
         </Link>
      </div>
    </div>
  );
}
