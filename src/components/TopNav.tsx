import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, GraduationCap, LogOut, Menu, User, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type NavLeaf = { title: string; url: string };
type NavGroup = { title: string; url?: string; children?: NavLeaf[] };

const navGroups: NavGroup[] = [
  { title: "Home", url: "/" },
  {
    title: "About",
    children: [
      { title: "About TASSA", url: "/about" },
      { title: "Almanac", url: "/almanac" },
      { title: "Contact", url: "/contact" },
    ],
  },
  {
    title: "Results",
    children: [
      { title: "View Results", url: "/results" },
      { title: "Submit Results", url: "/submit-results" },
    ],
  },
  {
    title: "Schools",
    children: [
      { title: "Register School", url: "/registration" },
      { title: "Confirm Participation", url: "/participation" },
      { title: "Registered Schools", url: "/registered-schools" },
      { title: "Payment Status", url: "/payment-status" },
    ],
  },
  { title: "Store", url: "/store" },
];

export function TopNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const isActive = (url?: string) => !!url && (url === "/" ? pathname === "/" : pathname.startsWith(url));
  const groupActive = (g: NavGroup) =>
    isActive(g.url) || (g.children?.some((c) => isActive(c.url)) ?? false);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary-foreground/10 bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto flex h-16 items-center gap-3 px-3 sm:px-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-primary-foreground/20 bg-primary-foreground/10 transition-colors group-hover:bg-primary-foreground/15">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="font-bold text-sm">TASSA</span>
            <span className="text-[10px] opacity-70">Socratic Schools</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1 ml-4 flex-1">
          {navGroups.map((g) =>
            g.children ? (
              <DropdownMenu key={g.title}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "relative inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-primary-foreground/10",
                      groupActive(g) && "bg-primary-foreground/15"
                    )}
                  >
                    {g.title}
                    <ChevronDown className="h-3.5 w-3.5" />
                    {groupActive(g) && (
                      <span className="absolute -bottom-0 left-3 right-3 h-0.5 bg-accent rounded-full" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[200px]">
                  {g.children.map((c) => (
                    <DropdownMenuItem key={c.url} asChild>
                      <NavLink to={c.url} className="cursor-pointer">
                        {c.title}
                      </NavLink>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <NavLink
                key={g.title}
                to={g.url!}
                end={g.url === "/"}
                className={({ isActive }) =>
                  cn(
                    "relative px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-primary-foreground/10",
                    isActive && "bg-primary-foreground/15"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {g.title}
                    {isActive && (
                      <span className="absolute -bottom-0 left-3 right-3 h-0.5 bg-accent rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
            )
          )}

          {user && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-primary-foreground/10",
                  isActive && "bg-primary-foreground/15"
                )
              }
            >
              Admin
            </NavLink>
          )}
        </nav>

        {/* Right side actions (desktop) */}
        <div className="hidden lg:flex items-center gap-2 ml-auto">
          {user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </Button>
          ) : (
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25"
            >
              <Link to="/auth">
                <User className="h-4 w-4 mr-2" /> Login
              </Link>
            </Button>
          )}
        </div>

        {/* Mobile trigger */}
        <div className="lg:hidden ml-auto">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground gap-2"
              >
                <Menu className="h-5 w-5" />
                <span className="text-sm font-medium">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[88vw] sm:w-[360px] bg-card text-card-foreground p-0 border-l">
              <div className="flex items-center justify-between px-4 h-16 border-b border-border bg-primary text-primary-foreground">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  <span className="font-bold">TASSA Menu</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen(false)}
                  className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <nav className="overflow-y-auto h-[calc(100dvh-4rem)] py-2">
                {navGroups.map((g) => (
                  <div key={g.title} className="px-2 py-1">
                    {g.url ? (
                      <NavLink
                        to={g.url}
                        end={g.url === "/"}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            "block px-3 py-2.5 rounded-md text-sm font-semibold text-foreground hover:bg-accent hover:text-accent-foreground",
                            isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                          )
                        }
                      >
                        {g.title}
                      </NavLink>
                    ) : (
                      <>
                        <p className="px-3 pt-3 pb-1 text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                          {g.title}
                        </p>
                        <div className="flex flex-col">
                          {g.children!.map((c) => (
                            <NavLink
                              key={c.url}
                              to={c.url}
                              onClick={() => setMobileOpen(false)}
                              className={({ isActive }) =>
                                cn(
                                  "block px-3 py-2.5 rounded-md text-sm text-foreground hover:bg-accent hover:text-accent-foreground",
                                  isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                                )
                              }
                            >
                              {c.title}
                            </NavLink>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {user && (
                  <div className="px-2 py-1">
                    <p className="px-3 pt-3 pb-1 text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                      Admin
                    </p>
                    <NavLink
                      to="/admin"
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "block px-3 py-2.5 rounded-md text-sm text-foreground hover:bg-accent hover:text-accent-foreground",
                          isActive && "bg-primary text-primary-foreground"
                        )
                      }
                    >
                      Admin Panel
                    </NavLink>
                  </div>
                )}

                <div className="border-t border-border mt-3 p-3">
                  {user ? (
                    <Button variant="outline" className="w-full" onClick={signOut}>
                      <LogOut className="h-4 w-4 mr-2" /> Sign out
                    </Button>
                  ) : (
                    <Button asChild className="w-full">
                      <Link to="/auth" onClick={() => setMobileOpen(false)}>
                        <User className="h-4 w-4 mr-2" /> Login
                      </Link>
                    </Button>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}