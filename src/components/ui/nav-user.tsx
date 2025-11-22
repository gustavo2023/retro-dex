"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronsUpDown, LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/client";
import { logout } from "@/app/(auth)/login/actions";

export interface NavUserProps {
  user: {
    username: string;
    email: string;
    avatar_url?: string | null;
  };
}

const BUCKET_NAME = "profile-pictures";

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar();
  const supabase = createClient();

  // State for the secure signed URL of the avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Logic to fetch the signed URL from Supabase Storage
  const downloadImage = useCallback(
    async (path: string) => {
      try {
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(path, 60 * 60); // Valid for 1 hour

        if (error) throw error;
        setAvatarUrl(data.signedUrl);
      } catch (error) {
        console.error("Error downloading avatar:", error);
      }
    },
    [supabase.storage]
  );

  // Trigger fetch when user prop changes
  useEffect(() => {
    if (user.avatar_url) {
      downloadImage(user.avatar_url);
    } else {
      setAvatarUrl(null);
    }
  }, [user.avatar_url, downloadImage]);

  // Generate Initials (e.g. "MC" for Movie Collector)
  const initials = user.username
    ? user.username.substring(0, 2).toUpperCase()
    : user.email.substring(0, 2).toUpperCase();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer" asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-slate-800"
            >
              <Avatar className="h-8 w-8 rounded-lg border border-slate-700">
                <AvatarImage src={avatarUrl || ""} alt={user.username} />
                <AvatarFallback className="rounded-lg bg-slate-800 text-amber-500 font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-slate-200">
                  {user.username}
                </span>
                <span className="truncate text-xs text-slate-400">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-slate-500" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg border-slate-800 bg-slate-900 text-slate-200"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg border border-slate-700">
                  <AvatarImage src={avatarUrl || ""} alt={user.username} />
                  <AvatarFallback className="rounded-lg bg-slate-800 text-amber-500">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user.username}
                  </span>
                  <span className="truncate text-xs text-slate-400">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-slate-800" />

            <DropdownMenuItem
              className="text-red-400 focus:bg-red-950/30 focus:text-red-400 cursor-pointer"
              onClick={() => logout()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
