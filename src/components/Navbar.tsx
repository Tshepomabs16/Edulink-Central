import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { GraduationCap, Menu, X, LogOut, LayoutDashboard, Upload } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, isAdmin, isTutor, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const dashPath = isAdmin ? "/admin" : isTutor ? "/tutor" : "/dashboard";

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 glass-strong">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-accent shadow-glow">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-bold text-foreground">EduConnect</span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate(dashPath)}>
                <LayoutDashboard className="mr-1 h-4 w-4" />
                Dashboard
              </Button>
              {(isTutor || isAdmin) && (
                <Button variant="ghost" size="sm" onClick={() => navigate(isTutor ? "/tutor" : "/admin")}>
                  <Upload className="mr-1 h-4 w-4" />
                  Upload
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-1 h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Sign In</Button>
              <Button variant="hero" size="sm" onClick={() => navigate("/signup")}>Get Started</Button>
            </>
          )}
        </div>

        {/* Mobile */}
        <button className="md:hidden text-foreground" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-border/50 glass p-4 md:hidden">
          <div className="flex flex-col gap-2">
            {user ? (
              <>
                <Button variant="ghost" className="justify-start" onClick={() => { navigate(dashPath); setMenuOpen(false); }}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </Button>
                <Button variant="ghost" className="justify-start" onClick={() => { handleSignOut(); setMenuOpen(false); }}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="justify-start" onClick={() => { navigate("/login"); setMenuOpen(false); }}>Sign In</Button>
                <Button variant="hero" className="justify-start" onClick={() => { navigate("/signup"); setMenuOpen(false); }}>Get Started</Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
