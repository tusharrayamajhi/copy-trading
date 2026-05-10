"use client";

import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ArrowRightLeft, Menu } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuth } from "./AuthProvider";
import { useWallet } from "@solana/wallet-adapter-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/trader", label: "Trader" },
  { href: "/investor", label: "Investor" },
] as const;

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function Navbar() {
  const mounted = useIsClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, login, logout, isLoading } = useAuth();
  const { publicKey } = useWallet();

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/25">
            <ArrowRightLeft className="size-5 text-primary" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            CopyCatt
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open menu"
                />
              }
            >
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100vw,20rem)]">
              <SheetHeader>
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <Separator className="my-4" />
              <div className="flex flex-col gap-1">
                {navLinks.map((item) => (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className="justify-start"
                    render={<Link href={item.href} />}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {mounted ? (
            <div className="flex items-center gap-2">
              {!publicKey ? (
                <WalletMultiButton className="!h-9 !rounded-lg !bg-primary !px-4 !text-sm !font-medium !text-primary-foreground hover:!bg-primary/90" />
              ) : !user ? (
                <Button onClick={login} disabled={isLoading} className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  {isLoading ? "Loading..." : "Sign In"}
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground hidden md:block">
                    {user.walletAddress.slice(0, 4)}...{user.walletAddress.slice(-4)}
                  </div>
                  <Button variant="outline" size="sm" onClick={logout} className="h-9">
                    Log Out
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-9 w-[150px] animate-pulse rounded-lg bg-muted" />
          )}
        </div>
      </div>
    </nav>
  );
}
