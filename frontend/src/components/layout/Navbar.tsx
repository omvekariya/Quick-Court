import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type Role = "user" | "owner" | "admin";

const navByRole: Record<Role, { label: string; to: string }[]> = {
  user: [
    { label: "Home", to: "/" },
    { label: "Venues", to: "/venues" },
    { label: "My Bookings", to: "/my-bookings" },
    { label: "Profile", to: "/profile" },
  ],
  owner: [
    { label: "Dashboard", to: "/owner/dashboard" },
    { label: "Venues", to: "/owner/venues" },
    { label: "Courts", to: "/owner/courts" },
    { label: "Time Slots", to: "/owner/time-slots" },
    { label: "Bookings", to: "/owner/bookings" },
    { label: "Profile", to: "/profile" },
  ],
  admin: [
    { label: "Dashboard", to: "/admin/dashboard" },
    { label: "Facility Approval", to: "/admin/facility-approval" },
    { label: "Users", to: "/admin/users" },
    { label: "Profile", to: "/profile" },
  ],
};

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [role, setRole] = useState<Role>(() =>
    (localStorage.getItem("qc_role") as Role) || "user"
  );
  
  useEffect(() => {
    if (user) {
      setRole(user.role);
    }
    localStorage.setItem("qc_role", role);
  }, [role, user]);

  const links = useMemo(() => navByRole[role], [role]);

  const brand = (
    <Link to="/" className="flex items-center gap-2">
      <span className="text-lg font-extrabold tracking-tight bg-clip-text text-transparent bg-[var(--gradient-primary)]">
        QuickCourt
      </span>
    </Link>
  );

  const NavLinks = () => (
    <ul className="flex items-center gap-4">
      {links.map((l) => (
        <li key={l.to}>
          <NavLink
            to={l.to}
            end
            className={({ isActive }) =>
              `text-sm ${isActive ? "text-primary font-semibold" : "text-foreground/80 hover:text-foreground"}`
            }
          >
            {l.label}
          </NavLink>
        </li>
      ))}
    </ul>
  );

  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profileImage} alt={user?.fullName} />
            <AvatarFallback>
              {user?.fullName?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.fullName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <nav className="container mx-auto h-14 px-4 flex items-center justify-between">
        {brand}

        <div className="hidden md:flex items-center gap-6">
          <NavLinks />
          {user ? (
            <UserMenu />
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link to="/auth/login">Login</Link>
              </Button>
              <Button variant="hero" size="sm" asChild>
                <Link to="/auth/signup">Sign up</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="mt-8 flex flex-col gap-4">
                <NavLinks />
                {user ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 p-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profileImage} alt={user.fullName} />
                        <AvatarFallback>
                          {user.fullName?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.fullName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Button variant="ghost" onClick={logout} className="justify-start">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" asChild className="w-full">
                      <Link to="/auth/login">Login</Link>
                    </Button>
                    <Button variant="hero" asChild className="w-full">
                      <Link to="/auth/signup">Sign up</Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
