import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  ClipboardList, 
  Car, 
  File, 
  Users, 
  HardHat,
  BarChart4, 
  Settings, 
  Menu
} from "lucide-react";
import frostysLogo from "../../../src/assets/frostys-logo.png";

export function Sidebar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'admin';

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <div className="md:hidden fixed top-0 left-0 z-20 p-4">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMobileMenu}
          className="bg-white"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-10 w-64 bg-white border-r border-neutral-200 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-24 flex items-center px-4 border-b border-neutral-200">
          <div 
            onClick={() => window.location.href = "/"}  
            className="cursor-pointer w-full"
          >
            <div className="flex flex-col items-center">
              <img 
                src={frostysLogo} 
                alt="Frosty's Ice Blasting Solutions" 
                className="h-14 object-contain" 
              />
              <div className="text-center mt-1">
                <div className="font-bold text-primary text-sm">Frosty's</div>
                <div className="text-xs text-neutral-700">Ice Blasting Solutions</div>
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-6rem)]">
          <div className="px-3 py-4">
            <nav className="space-y-1">
              <NavItem 
                href="/" 
                icon={<LayoutDashboard className="h-5 w-5" />} 
                label="Dashboard" 
                isActive={location === '/'} 
              />
              <NavItem 
                href="/jobs" 
                icon={<ClipboardList className="h-5 w-5" />} 
                label="Jobs" 
                isActive={location.startsWith('/jobs')} 
              />
              <NavItem 
                href="/vehicle-inspections" 
                icon={<Car className="h-5 w-5" />} 
                label="Vehicle Inspections" 
                isActive={location.startsWith('/vehicle-inspections')} 
              />
              <NavItem 
                href="/invoices" 
                icon={<File className="h-5 w-5" />} 
                label="Invoices" 
                isActive={location.startsWith('/invoices')} 
              />
              <NavItem 
                href="/customers" 
                icon={<Users className="h-5 w-5" />} 
                label="Customers" 
                isActive={location.startsWith('/customers')} 
              />
              
              {/* Admin-only navigation items */}
              {isAdmin && (
                <>
                  <NavItem 
                    href="/staff" 
                    icon={<HardHat className="h-5 w-5" />} 
                    label="Staff" 
                    isActive={location.startsWith('/staff')} 
                  />
                  <NavItem 
                    href="/reports" 
                    icon={<BarChart4 className="h-5 w-5" />} 
                    label="Reports" 
                    isActive={location.startsWith('/reports')} 
                  />
                </>
              )}
              
              <NavItem 
                href="/settings" 
                icon={<Settings className="h-5 w-5" />} 
                label="Settings" 
                isActive={location.startsWith('/settings')} 
              />
            </nav>
          </div>
        </ScrollArea>
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-0"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  const [, navigate] = useLocation();
  
  return (
    <div 
      onClick={() => navigate(href)}
      className={cn(
        "flex items-center px-3 py-2 rounded-md group cursor-pointer",
        isActive 
          ? "text-primary bg-neutral-100" 
          : "text-neutral-800 hover:bg-neutral-100"
      )}
    >
      <span className="mr-3">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
