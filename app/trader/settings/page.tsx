"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Settings,
  Camera,
  ChevronLeft,
  Save,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

export default function TraderSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    avatarUrl: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/trader/profile");
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/");
            return;
          }
          throw new Error("Failed to fetch profile");
        }
        const data = await res.json();
        setProfile({
          name: data.name || "",
          bio: data.bio || "",
          avatarUrl: data.avatarUrl || "",
        });
      } catch (err) {
        toast.error("Error loading profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/trader/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => router.back()}
          >
            <ChevronLeft className="size-4" />
            Back to dashboard
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Trader Settings</h1>
        </div>
        <Button disabled={saving} onClick={handleSave} className="gap-2">
          {saving ? (
            <div className="size-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
          ) : (
            <Save className="size-4" />
          )}
          Save changes
        </Button>
      </div>

      <div className="grid gap-8">
        <Card className="ring-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="size-5 text-primary" />
              Public Identity
            </CardTitle>
            <CardDescription>
              This information will be visible to all potential investors.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative group">
                <div className="flex size-24 items-center justify-center rounded-2xl bg-muted ring-1 ring-border overflow-hidden">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="size-full object-cover" />
                  ) : (
                    <User className="size-10 text-muted-foreground" />
                  )}
                </div>
                <button className="absolute -bottom-2 -right-2 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-110">
                  <Camera className="size-4" />
                </button>
              </div>
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Diamond Hand Dan"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar">Avatar URL</Label>
                  <Input
                    id="avatar"
                    placeholder="https://imgur.com/..."
                    value={profile.avatarUrl}
                    onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Trading Strategy / Bio</Label>
              <Textarea
                id="bio"
                placeholder="Explain your risk management and strategy to attract investors..."
                className="min-h-[120px] resize-none"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5 ring-1 ring-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-5 text-primary" />
              Verification Status
            </CardTitle>
            <CardDescription>
              Verified traders get higher visibility in the discovery list.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-background/50 p-4">
              <AlertCircle className="mt-0.5 size-5 text-primary" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Automatic Verification</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your profile is automatically verified once you complete 10
                  profitable swaps and maintain a positive lifetime P&L.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
