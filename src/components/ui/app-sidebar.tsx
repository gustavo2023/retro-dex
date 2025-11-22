"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavUser, type NavUserProps } from "@/components/ui/nav-user";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/utils/supabase/client";
import { Library, Compass, LayoutDashboard, Settings } from "lucide-react";

const primaryItems = [
  {
    href: "/",
    label: "Mi Colección",
    icon: Library,
  },
  {
    href: "/discover",
    label: "Explorar",
    icon: Compass,
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
];

const secondaryItems = [
  {
    href: "/settings",
    label: "Ajustes",
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const supabase = createClient();
  const [userProfile, setUserProfile] = useState<NavUserProps["user"] | null>(
    null
  );
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  useEffect(() => {
    let isMounted = true;

    async function loadUserProfile() {
      setIsLoadingProfile(true);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (userError || !user) {
        setUserProfile(null);
        setIsLoadingProfile(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .single();

      if (!isMounted) return;

      setUserProfile({
        username:
          profileData?.username ?? user.email?.split("@")[0] ?? "Usuario",
        email: user.email ?? "",
        avatar_url: profileData?.avatar_url ?? null,
      });
      setIsLoadingProfile(false);
    }

    loadUserProfile();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="border-b border-border/60 px-4 pb-5 pt-6">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/video-player-icon.png"
            alt="RetroDex App Icon in amber yellow and blue colors"
            width={36}
            height={36}
            priority
          />
          {state !== "collapsed" && (
            <h1 className="text-2xl font-semibold text-amber-500">RetroDex</h1>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="mt-4 px-2">
          <SidebarGroupLabel className="sr-only">Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {primaryItems.map((item) => (
                <SidebarMenuItem
                  key={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className="mb-2"
                >
                  <SidebarMenuButton
                    asChild
                    className={`rounded-2xl px-4 py-6 text-base transition-colors duration-200 cursor-pointer ${
                      isActive(item.href)
                        ? "bg-amber-500 text-primary-foreground shadow-lg shadow-amber-500/25 hover:bg-amber-400"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    }`}
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      {state !== "collapsed" && (
                        <span className="text-lg font-medium">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto px-2">
          <SidebarGroupLabel className="sr-only">
            Preferencias
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    className={`rounded-2xl px-4 py-6 text-base transition-colors duration-200 cursor-pointer ${
                      isActive(item.href)
                        ? "bg-amber-500 text-primary-foreground shadow-lg shadow-amber-500/25 hover:bg-amber-400"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    }`}
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      {state !== "collapsed" && (
                        <span className="text-lg font-medium">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {userProfile && <NavUser user={userProfile} />}
        {!userProfile && isLoadingProfile && (
          <div className="rounded-2xl border border-border/60 p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
