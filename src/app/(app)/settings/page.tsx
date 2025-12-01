"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { Loader2, LogOut, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

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
const MOVIE_STATUS_LABEL: Record<string, string> = {
  wishlist: "Wishlist",
  owned: "Owned",
  watched: "Watched",
};
type ExportColumnKey =
  | "title"
  | "status"
  | "release_year"
  | "rating"
  | "genres"
  | "synopsis";
type ExportColumn = {
  key: ExportColumnKey;
  header: string;
  width: number;
  align: "center" | "left";
};

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
  const [isExportingPdf, setIsExportingPdf] = useState(false);

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

  const handleExportPdf = async () => {
    if (!userId) {
      toast.error("You must be logged in to export your collection.");
      return;
    }

    setIsExportingPdf(true);
    try {
      const { data, error } = await supabase
        .from("movies")
        .select("title, status, release_year, rating, synopsis, genres")
        .eq("profile_id", userId)
        .order("title", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      const movies = (data ?? []) as Array<{
        title: string | null;
        status: string | null;
        release_year: number | null;
        rating?: number | null;
        synopsis?: string | null;
        genres?: Array<{ name?: string } | string> | null;
      }>;

      const doc = new jsPDF({ unit: "pt", format: "letter", orientation: "landscape" });
      const now = new Date();
      const safeUsername = username?.trim() || "RetroDex User";
      const safeEmail = email?.trim() || "Unknown email";
      const fontFamily = "helvetica";

      const startY = 60;
      const lineHeight = 16;
      const rowPadding = 8;
      const rowGap = 4;
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      const columns: ExportColumn[] = [
        { key: "title", header: "Title", width: 150, align: "center" },
        { key: "status", header: "Status", width: 80, align: "center" },
        { key: "release_year", header: "Year", width: 60, align: "center" },
        { key: "rating", header: "Rating", width: 70, align: "center" },
        { key: "genres", header: "Genres", width: 110, align: "center" },
        { key: "synopsis", header: "Synopsis", width: 140, align: "left" },
      ];
      const tableWidth = columns.reduce((sum, column) => sum + column.width, 0);
      const marginX = Math.max((pageWidth - tableWidth) / 2, 40);
      const bottomMargin = pageHeight - 60;

      doc.setFontSize(18);
      doc.setFont(fontFamily, "bold");
      doc.text("RetroDex Collection Export", marginX, startY);

      doc.setFontSize(12);
      doc.setFont(fontFamily, "normal");
      doc.text(`Generated: ${now.toLocaleString()}`, marginX, startY + 24);
      doc.text(`User: ${safeUsername}`, marginX, startY + 40);
      doc.text(`Email: ${safeEmail}`, marginX, startY + 56);

      let cursorY = startY + 80;

      const ensureSpace = (neededHeight: number) => {
        if (cursorY + neededHeight > bottomMargin) {
          doc.addPage();
          cursorY = 60;
          drawHeaderRow();
        }
      };

      const splitToLines = (text: string, width: number): string[] => {
        const result = doc.splitTextToSize(text, width);
        return Array.isArray(result) ? result : [result];
      };

      const drawHeaderRow = () => {
        doc.setFont(fontFamily, "bold");
        doc.setFontSize(11);
        let columnX = marginX;
        columns.forEach((column) => {
          const headerHeight = lineHeight + rowPadding;
          const rowTop = cursorY - rowPadding;
          const textY = rowTop + headerHeight / 2;
          doc.rect(columnX, rowTop, column.width, headerHeight);
          const headerX =
            column.align === "center"
              ? columnX + column.width / 2
              : columnX + 8;
          doc.text(column.header, headerX, textY, {
            align: column.align === "center" ? "center" : "left",
            baseline: "middle",
          });
          columnX += column.width;
        });
        doc.setFont(fontFamily, "normal");
        cursorY += lineHeight + rowGap;
      };

      drawHeaderRow();

      if (!movies.length) {
        ensureSpace(lineHeight);
        doc.text("No movies in your collection yet.", marginX, cursorY);
      } else {
        movies.forEach((movie) => {
          const rowValues: Record<ExportColumnKey, string> = {
            title: movie.title?.trim() || "Untitled movie",
            status:
              MOVIE_STATUS_LABEL[movie.status ?? ""] ?? "Unknown",
            release_year: movie.release_year ? String(movie.release_year) : "—",
            rating:
              typeof movie.rating === "number" && movie.rating > 0
                ? `${movie.rating} / 5`
                : "—",
            genres: (movie.genres ?? [])
              .map((genre) =>
                typeof genre === "string"
                  ? genre
                  : genre?.name ?? undefined
              )
              .filter((name): name is string => Boolean(name))
              .join(", ") || "—",
            synopsis: movie.synopsis?.trim() || "No synopsis available.",
          };

          const columnTexts = columns.map((column) =>
            splitToLines(rowValues[column.key], column.width - 12)
          );
          const maxLines = Math.max(...columnTexts.map((lines) => lines.length));
          const rowHeight = Math.max(maxLines * lineHeight + rowPadding, lineHeight + rowPadding);

          ensureSpace(rowHeight + rowGap);

          let columnX = marginX;
          columnTexts.forEach((lines: string[], index) => {
            const columnDef = columns[index];
            const columnWidth = columnDef.width;
            const rowTop = cursorY - rowPadding;
            doc.rect(columnX, rowTop, columnWidth, rowHeight);
            const blockHeight = lines.length * lineHeight;
            let textY = rowTop + (rowHeight - blockHeight) / 2 + lineHeight / 2;
            lines.forEach((line: string) => {
              if (columnDef.align === "center") {
                doc.text(line, columnX + columnWidth / 2, textY, {
                  align: "center",
                  baseline: "middle",
                });
              } else {
                doc.text(line, columnX + 8, textY, {
                  baseline: "middle",
                });
              }
              textY += lineHeight;
            });
            columnX += columnWidth;
          });

          cursorY += rowHeight + rowGap;
        });
      }

      const filename = `retro-dex-collection-${now
        .toISOString()
        .slice(0, 10)}.pdf`;
      doc.save(filename);
      toast.success("PDF export ready.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We could not generate the PDF.";
      toast.error(message);
    } finally {
      setIsExportingPdf(false);
    }
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

        <Card className="border border-slate-800 bg-slate-900/40">
          <CardHeader>
            <CardTitle>Export Collection</CardTitle>
            <CardDescription>Download your collection data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between text-sm"
              disabled
            >
              <span className="flex items-center gap-2">
                <Download className="size-4" aria-hidden="true" />
                Export as JSON
              </span>
              <span className="text-xs text-muted-foreground">Soon</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between text-sm"
              disabled
            >
              <span className="flex items-center gap-2">
                <Download className="size-4" aria-hidden="true" />
                Export as CSV
              </span>
              <span className="text-xs text-muted-foreground">Soon</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full justify-start gap-2 text-sm"
              onClick={handleExportPdf}
              disabled={isExportingPdf || isLoadingProfile}
            >
              {isExportingPdf ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="size-4" aria-hidden="true" />
              )}
              <span>{isExportingPdf ? "Generating PDF…" : "Generate PDF Report"}</span>
            </Button>
          </CardContent>
        </Card>

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
