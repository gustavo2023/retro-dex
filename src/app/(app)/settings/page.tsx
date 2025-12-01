"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { Loader2, LogOut, Upload } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/utils/supabase/client";
import { logout } from "@/app/(auth)/login/actions";

const MAX_AVATAR_SIZE_BYTES = 3 * 1024 * 1024; // 3MB safeguard
const PROFILE_EVENT = "retro-profile-updated";

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [initialUsername, setInitialUsername] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isLoggingOut, startLogout] = useTransition();

  const emitProfileEvent = useCallback((detail: {
    username?: string;
    avatarUrl?: string | null;
  }) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(PROFILE_EVENT, { detail }));
  }, []);

  useEffect(() => {
    let isSubscribed = true;

    const loadProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw new Error(userError.message);
        }

        if (!user) {
          toast.error("You must be logged in to load your settings.");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", user.id)
          .single();

        if (profileError) {
          throw new Error(profileError.message);
        }

        if (!isSubscribed) return;

        setUserId(user.id);
        setEmail(user.email ?? "");
        setUsername(profile?.username ?? "");
        setInitialUsername(profile?.username ?? "");
        setAvatarUrl(profile?.avatar_url ?? null);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load your profile.";
        toast.error(message);
      } finally {
        if (isSubscribed) {
          setIsLoadingProfile(false);
        }
      }
    };

    loadProfile();

    return () => {
      isSubscribed = false;
    };
  }, [supabase]);

  const initials = (username || email || "?")
    .trim()
    .slice(0, 2)
    .toUpperCase();

  const isSaveDisabled =
    isLoadingProfile ||
    isSaving ||
    username.trim().length === 0 ||
    username.trim() === initialUsername.trim();

  const handleProfileSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) {
      toast.error("No active session.");
      return;
    }

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      toast.error("Please provide a username.");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ username: trimmedUsername })
        .eq("id", userId);

      if (error) {
        throw new Error(error.message);
      }

      setInitialUsername(trimmedUsername);
      emitProfileEvent({ username: trimmedUsername });
      toast.success("Profile updated.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save profile.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      if (!userId) {
        toast.error("No active session.");
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file.");
        event.target.value = "";
        return;
      }

      if (file.size > MAX_AVATAR_SIZE_BYTES) {
        toast.error("The avatar must be 3MB or smaller.");
        event.target.value = "";
        return;
      }

      setIsUploadingAvatar(true);

      try {
        const fileExtension = file.name.split(".").pop() ?? "png";
        const fileName = `avatar-${Date.now()}.${fileExtension}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("profile-pictures")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from("profile-pictures")
          .getPublicUrl(filePath);

        if (!publicUrlData?.publicUrl) {
          throw new Error("Failed to resolve public avatar URL.");
        }

        const { error: profileUpdateError } = await supabase
          .from("profiles")
          .update({ avatar_url: publicUrlData.publicUrl })
          .eq("id", userId);

        if (profileUpdateError) {
          throw new Error(profileUpdateError.message);
        }

        setAvatarUrl(publicUrlData.publicUrl);
        emitProfileEvent({ avatarUrl: publicUrlData.publicUrl });
        toast.success("Avatar updated.");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to upload avatar.";
        toast.error(message);
      } finally {
        setIsUploadingAvatar(false);
        event.target.value = "";
      }
    },
    [emitProfileEvent, supabase, userId]
  );

  const handleLogout = () => {
    startLogout(async () => {
      try {
        await logout();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to log out.";
        toast.error(message);
      }
    });
  };

  return (
    <section className="space-y-6">
      <form onSubmit={handleProfileSave}>
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Update your display information. Email is read-only and provided
              by Supabase Auth.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingProfile ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="md:col-span-2 space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-24 w-24 rounded-full" />
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="display-name">Username</Label>
                  <Input
                    id="display-name"
                    placeholder="RetroFan92"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} disabled />
                </div>
                <div className="md:col-span-2 space-y-3">
                  <Label>Avatar</Label>
                  <div className="flex flex-wrap items-center gap-4">
                    <Avatar className="size-24">
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt="Profile avatar" />
                      ) : null}
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Upload a square JPG, PNG, or WEBP file (max 3MB).
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          className="cursor-pointer"
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingAvatar}
                        >
                          {isUploadingAvatar ? (
                            <>
                              <Loader2 className="mr-2 size-4 animate-spin" />
                              Uploading…
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 size-4" />
                              Change avatar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="cursor-pointer" type="submit" disabled={isSaveDisabled}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Card className="border border-red-400/40 bg-red-900/10">
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
          <CardDescription>Manage your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="destructive"
            className="w-1/8 cursor-pointer"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Logging out…
              </>
            ) : (
              <>
                <LogOut className="mr-2 size-4" />
                Logout
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
