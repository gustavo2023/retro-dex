"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowLeftToLine,
  ArrowRightToLine,
  Popcorn,
  Clapperboard,
  ChartColumnDecreasing,
  Bolt,
} from "lucide-react";
import {
  SidebarProvider,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { Toaster } from "@/components/ui/sonner";

function SidebarToggleButton() {
  const { state, toggleSidebar, isMobile, openMobile } = useSidebar();
  const isCollapsed = isMobile ? !openMobile : state === "collapsed";
  const Icon = isCollapsed ? ArrowRightToLine : ArrowLeftToLine;
  const label = isCollapsed ? "Expandir menú" : "Contraer menú";

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label={label}
      className="rounded-full bg-background/80 px-4 py-2 text-amber-500 shadow-sm cursor-pointer hover:text-primary transition"
    >
      <Icon className="h-5 w-5" />
      <span className="sr-only">{label}</span>
    </button>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pageTitle = useMemo(() => {
    if (!pathname || pathname === "/") return "My Collection";
    if (pathname.startsWith("/discover")) return "Explore";
    if (pathname.startsWith("/dashboard")) return "Dashboard";
    if (pathname.startsWith("/settings")) return "Settings";
    return "Main Panel";
  }, [pathname]);

  const PageIcon = useMemo(() => {
    if (!pathname || pathname === "/") return Popcorn;
    if (pathname.startsWith("/discover")) return Clapperboard;
    if (pathname.startsWith("/dashboard")) return ChartColumnDecreasing;
    if (pathname.startsWith("/settings")) return Bolt;
    return Popcorn;
  }, [pathname]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="p-4">
        <header className="mb-6 space-y-2">
          <div className="flex items-center gap-3">
            <SidebarToggleButton />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-6"
            />
            <div className="flex items-center gap-2 text-amber-500">
              <PageIcon className="h-6 w-6" aria-hidden />
              <h2 className="text-2xl font-semibold">{pageTitle}</h2>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <Toaster richColors position="top-right" />
      </SidebarInset>
    </SidebarProvider>
  );
}
