import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, ChevronDown, UserCircle, Settings, LogOut } from "lucide-react";
import frostysLogo from "../../../src/assets/frostys-logo.png";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (!user?.fullName) return "U";
    
    const nameParts = user.fullName.split(" ");
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  // Check if we're on mobile
  const isMobile = useIsMobile();

  return (
    <header className="h-18 border-b border-neutral-200 bg-white px-6 flex items-center justify-between">
      <div className="flex items-center">
        {isMobile && (
          <div 
            className="flex items-center mr-3 md:hidden cursor-pointer" 
            onClick={() => navigate("/")}
          >
            <img 
              src={frostysLogo} 
              alt="Frosty's Ice Blasting Solutions" 
              className="h-10 mr-2 object-contain" 
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-primary">Frosty's</span>
              <span className="text-[10px] text-neutral-600">Ice Blasting Solutions</span>
            </div>
          </div>
        )}
        <h1 className="text-xl font-bold text-neutral-800">{title}</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {/* Notification indicator - for future implementation */}
              {/* <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span> */}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-4 text-center">
              <p className="text-sm text-neutral-600">No new notifications</p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="pl-1">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarFallback className="bg-primary text-white">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-neutral-800 mr-1 hidden md:inline-block">
                {user?.fullName || "User"}
              </span>
              <ChevronDown className="h-4 w-4 text-neutral-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => navigate("/profile")}
            >
              <UserCircle className="h-4 w-4 mr-2" />
              Your Profile
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => navigate("/settings")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer text-red-600 focus:text-red-600" 
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {logoutMutation.isPending ? "Logging out..." : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
