"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LinksService } from "@/lib/api/links.service";
import { ApiError } from "@/lib/api/client";
import type { LinkResponseDto, LinkUsageResponseDto } from "@/types/api";
import { IconPlus, IconSearch, IconFilter, IconClock, IconSparkles } from "@tabler/icons-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { LinkTable } from "@/components/link-table";
import { UpgradeDialog } from "@/components/upgrade-dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { daysUntilExpiry, isExpired } from "@/lib/link-expiry";
import { PRICING } from "@/lib/pricing";

export default function LinksPage() {
  const [links, setLinks] = useState<LinkResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [usage, setUsage] = useState<LinkUsageResponseDto | null>(null);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<string | undefined>();
  const [editTarget, setEditTarget] = useState<LinkResponseDto | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LinkResponseDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openUpgrade = (message?: string) => {
    setUpgradeMessage(message);
    setIsUpgradeOpen(true);
  };

  const refreshUsage = () => {
    LinksService.getUsage()
      .then(setUsage)
      .catch(() => {});
  };

  const atFreeLimit = !!usage && !usage.premium && usage.used >= usage.limit;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const [data, usageData] = await Promise.all([
          LinksService.getLinks(0, 100),
          LinksService.getUsage().catch(() => null),
        ]);
        if (!cancelled) {
          setLinks(data.content || []);
          setUsage(usageData);
        }
      } catch {
        if (!cancelled) {
          toast.error("Failed to load links.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    setIsCreating(true);
    try {
      const response = await LinksService.createLink({
        originalUrl: newUrl,
        customSlug: customSlug.trim() || undefined,
      });
      setLinks((prev) => [response, ...prev]);
      setNewUrl("");
      setCustomSlug("");
      setIsCreateOpen(false);
      toast.success("Link created successfully.");
      refreshUsage();
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        setIsCreateOpen(false);
        refreshUsage();
        if (usage?.premium) {
          toast.error(err.message);
        } else {
          openUpgrade(err.message);
        }
      } else if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to create link.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditClick = (id: number) => {
    const link = links.find((item) => item.id === id);
    if (!link) return;

    if (!usage?.premium) {
      openUpgrade(
        "Fix a typo or move a page without breaking your link. Editing a link's destination is a Pro feature.",
      );
      return;
    }

    setEditTarget(link);
    setEditUrl(link.originalUrl);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    setIsSavingEdit(true);
    try {
      const updated = await LinksService.updateLink(editTarget.id, {
        originalUrl: editUrl,
      });
      setLinks((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success("Link updated.");
      setEditTarget(null);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to update link.");
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await LinksService.deleteLink(deleteTarget.id);
      setLinks((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      toast.success("Link deleted.");
      setDeleteTarget(null);
      refreshUsage();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to delete link.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredLinks = links.filter((link) => {
    const matchesSearch =
      link.originalUrl?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.shortUrl?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !isExpired(link.expiresAt)) ||
      (statusFilter === "expired" && isExpired(link.expiresAt));
    return matchesSearch && matchesStatus;
  });

  const expiredCount = links.filter((l) => isExpired(l.expiresAt)).length;
  const expiringSoonCount = links.filter(
    (l) => !!l.expiresAt && !isExpired(l.expiresAt) && daysUntilExpiry(l.expiresAt) <= 7,
  ).length;
  const showExpiryBanner =
    !!usage && !usage.premium && (expiredCount > 0 || expiringSoonCount > 0);

  const expiryBannerText = [
    expiredCount > 0
      ? `${expiredCount} of your links ${expiredCount === 1 ? "has" : "have"} expired.`
      : null,
    expiringSoonCount > 0
      ? `${expiringSoonCount} ${expiringSoonCount === 1 ? "link expires" : "links expire"} within 7 days.`
      : null,
    expiredCount > 0
      ? "Upgrade and they go live again, and they never expire."
      : "Upgrade to keep them forever.",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Links</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage your shortened links.
          </p>
        </div>

        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            if (open && atFreeLimit) {
              openUpgrade(
                `You've used all ${usage?.limit} free links this month. Upgrade to keep creating links, and keep them forever.`,
              );
              return;
            }
            setIsCreateOpen(open);
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <IconPlus className="h-4 w-4" />
              Create Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new link</DialogTitle>
              <DialogDescription>
                Paste your long URL below to generate a short link.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="originalUrl">Destination URL</Label>
                  <Input
                    id="originalUrl"
                    type="url"
                    placeholder="https://example.com/very-long-url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="customSlug">Custom slug</Label>
                    {!usage?.premium && (
                      <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                        Pro
                      </Badge>
                    )}
                  </div>
                  <Input
                    id="customSlug"
                    placeholder="my-link"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    readOnly={!usage?.premium}
                    onClick={() => {
                      if (!usage?.premium) {
                        openUpgrade(
                          "Custom slugs are a Pro feature. Pick a memorable address instead of a random code.",
                        );
                      }
                    }}
                    className={!usage?.premium ? "cursor-pointer bg-muted/50" : undefined}
                  />
                  <p className="text-xs text-muted-foreground">
                    {usage?.premium
                      ? "3-32 letters, numbers, hyphens or underscores. Leave blank for a random code."
                      : "Upgrade to choose your own famous short address."}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating} className="gap-1.5">
                  {isCreating ? (
                    <LoadingSpinner className="text-primary-foreground" />
                  ) : (
                    "Create"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {usage && !usage.premium && (
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {usage.used} of {usage.limit} free links used this month
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {`Resets ${format(new Date(usage.resetsAt), "MMM d")}. Pro includes up to ${PRICING.proLinksPerMonth.toLocaleString("en-US")} a month, and links that never expire.`}
              </p>
            </div>
            <Button
              size="sm"
              variant={atFreeLimit ? "default" : "outline"}
              className="shrink-0 gap-1.5"
              onClick={() => openUpgrade()}
            >
              <IconSparkles className="h-3.5 w-3.5" />
              {`Go Pro · $${PRICING.monthly}/mo`}
            </Button>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {showExpiryBanner && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <IconClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="flex-1 text-sm">{expiryBannerText}</p>
          <Button size="sm" className="shrink-0" onClick={() => openUpgrade()}>
            Keep my links
          </Button>
        </div>
      )}

      {!isLoading && links.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search links..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 text-sm"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as string)}
          >
            <SelectTrigger className="h-9 w-[140px] text-sm">
              <div className="flex items-center gap-2">
                <IconFilter className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && (
        <LinkTable
          links={filteredLinks.map((l) => ({
            id: l.id,
            shortUrl: l.shortUrl,
            originalUrl: l.originalUrl,
            clickCount: l.clickCount,
            expiresAt: l.expiresAt,
            createdAt: l.createdAt,
            status: isExpired(l.expiresAt) ? "expired" : "active",
          }))}
          onCopy={() => {
            toast.success("Copied to clipboard");
          }}
          onEdit={handleEditClick}
          onDelete={(id) => {
            const link = links.find((item) => item.id === id);
            if (link) setDeleteTarget(link);
          }}
        />
      )}

      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit destination</DialogTitle>
            <DialogDescription>
              The short link stays the same, so anything already shared keeps
              working.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit}>
            <div className="space-y-2 py-4">
              <Label htmlFor="editUrl">Destination URL</Label>
              <Input
                id="editUrl"
                type="url"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                required
              />
              {editTarget && (
                <p className="font-mono text-xs text-muted-foreground">
                  {editTarget.shortUrl}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditTarget(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSavingEdit} className="gap-1.5">
                {isSavingEdit ? (
                  <LoadingSpinner className="text-primary-foreground" />
                ) : (
                  "Save changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this link?</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `${deleteTarget.shortUrl} will stop redirecting immediately. This can't be undone.`
                : "This link will stop redirecting immediately."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Keep link
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <LoadingSpinner size="sm" />
              ) : (
                "Delete link"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UpgradeDialog
        open={isUpgradeOpen}
        onOpenChange={setIsUpgradeOpen}
        description={upgradeMessage}
      />
    </div>
  );
}
