"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import {
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
  LayoutDashboard,
  LogOut,
  Settings2,
  CircleUserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/directory", label: "Directory" },
  { href: "/events", label: "Events" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/feed", label: "Feed" },
  { href: "/pricing", label: "Pricing" },
];

const SLOGAN = "VERIFIED BUSINESS NETWORK";

type HeaderUser = {
  email: string;
  displayName: string;
  isAdmin: boolean;
} | null;

export function SiteHeaderClient({
  user,
  signOutAction,
}: {
  user: HeaderUser;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLink = (item: { href: string; label: string }, mobile = false) => {
    const active = pathname?.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        onClick={mobile ? () => setMobileOpen(false) : undefined}
        className={cn(
          mobile
            ? "block border-b border-border py-4 font-display text-base font-semibold text-petroleum transition-colors hover:text-emerald-dark dark:text-foreground"
            : "group relative py-2 font-display text-[14px] font-semibold text-petroleum/85 transition-colors hover:text-petroleum dark:text-foreground/85 dark:hover:text-foreground",
          active && !mobile && "text-petroleum dark:text-foreground",
        )}
      >
        {item.label}
        {!mobile ? (
          <span
            className={cn(
              "absolute -bottom-0.5 left-1/2 h-[2px] -translate-x-1/2 bg-gradient-to-r from-emerald-brand to-emerald-dark transition-[width] duration-300 ease-out",
              active ? "w-full" : "w-0 group-hover:w-full",
            )}
          />
        ) : null}
      </Link>
    );
  };

  return (
    <div className="sticky top-0 z-50">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[60] focus:rounded-md focus:bg-petroleum focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      {/* Hairline accent */}
      <div className="h-[2px] bg-gradient-to-r from-emerald-brand via-emerald-brand/40 to-transparent" />

      {/* Utility bar */}
      <div
        className={cn(
          "hidden overflow-hidden transition-all duration-300 md:block",
          scrolled ? "max-h-0 opacity-0" : "max-h-12 opacity-100",
        )}
      >
        <div className="bg-gradient-to-r from-petroleum-deep via-petroleum to-petroleum-deep text-white/85">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2.5 text-[12.5px] tracking-wide lg:px-12">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-3.5 text-emerald-brand" aria-hidden />
              Every organization on this network is compliance-verified
            </span>
            <a
              href="https://compliance.truvis.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60 transition-colors hover:text-emerald-brand"
            >
              compliance.truvis.tech
            </a>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <header
        className={cn(
          "border-b border-border/80 backdrop-blur-md transition-all duration-300",
          scrolled
            ? "bg-background/80 py-2.5"
            : "bg-background py-4",
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-12">
          {/* Logo lockup */}
          <Link
            href="/"
            aria-label="TRUVIS — Verified Business Network"
            className="group flex items-center gap-4 rounded-md"
          >
            <Image
              src="/brand/logo.png"
              alt=""
              width={scrolled ? 36 : 44}
              height={scrolled ? 36 : 44}
              className="shrink-0 object-contain transition-all duration-300 group-hover:-rotate-3"
              priority
            />
            <span className="h-10 w-px bg-gradient-to-b from-transparent via-border to-transparent" aria-hidden />
            <span className="text-left leading-none">
              <span className="flex items-baseline gap-1.5">
                <span
                  className={cn(
                    "font-display font-extrabold tracking-[0.06em] text-petroleum transition-all duration-300 dark:text-foreground",
                    scrolled ? "text-[21px]" : "text-[25px]",
                  )}
                >
                  TRUVIS
                </span>
                <span className="hidden -translate-y-0.5 text-[10px] font-semibold tracking-[0.22em] text-emerald-brand sm:inline-block">
                  ®
                </span>
              </span>
              <span className="mt-1.5 flex items-center gap-2">
                <span className="h-px w-5 bg-emerald-brand" aria-hidden />
                <span className="text-[9px] font-semibold tracking-[0.28em] text-muted-foreground">
                  {SLOGAN}
                </span>
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
            {NAV_ITEMS.map((item) => navLink(item))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <Dropdown.Root>
                <Dropdown.Trigger asChild>
                  <button
                    className="flex cursor-pointer items-center gap-2 rounded-full border border-border py-1.5 pl-2 pr-3 text-sm font-medium transition-colors hover:bg-secondary"
                    aria-label="Account menu"
                  >
                    <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-petroleum to-petroleum-deep text-[11px] font-bold text-white">
                      {user.displayName.slice(0, 1).toUpperCase() || "U"}
                    </span>
                    <span className="hidden max-w-32 truncate md:inline">
                      {user.displayName}
                    </span>
                  </button>
                </Dropdown.Trigger>
                <Dropdown.Portal>
                  <Dropdown.Content
                    align="end"
                    sideOffset={8}
                    className="z-[60] w-56 rounded-lg border border-border bg-card p-1.5 shadow-[0_12px_32px_-8px_rgba(2,48,89,0.18)]"
                  >
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      {user.email}
                    </div>
                    <Dropdown.Item asChild>
                      <Link
                        href="/dashboard"
                        className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-medium outline-none transition-colors hover:bg-emerald-brand/[0.08] focus:bg-emerald-brand/[0.08]"
                      >
                        <LayoutDashboard className="size-4 text-emerald-dark" aria-hidden />
                        Dashboard
                      </Link>
                    </Dropdown.Item>
                    {user.isAdmin ? (
                      <Dropdown.Item asChild>
                        <Link
                          href="/admin"
                          className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-medium outline-none transition-colors hover:bg-emerald-brand/[0.08] focus:bg-emerald-brand/[0.08]"
                        >
                          <Settings2 className="size-4 text-emerald-dark" aria-hidden />
                          Administration
                        </Link>
                      </Dropdown.Item>
                    ) : null}
                    <Dropdown.Separator className="my-1 h-px bg-border" />
                    <Dropdown.Item asChild>
                      <button
                        onClick={() => signOutAction()}
                        className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium outline-none transition-colors hover:bg-destructive/10 focus:bg-destructive/10"
                      >
                        <LogOut className="size-4" aria-hidden />
                        Sign out
                      </button>
                    </Dropdown.Item>
                  </Dropdown.Content>
                </Dropdown.Portal>
              </Dropdown.Root>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden items-center gap-1.5 font-display text-[14px] font-semibold text-petroleum/85 transition-colors hover:text-petroleum md:inline-flex dark:text-foreground/85"
                >
                  <CircleUserRound className="size-4" aria-hidden />
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="group relative hidden items-center gap-2.5 rounded-[6px] bg-gradient-to-r from-emerald-dark to-emerald-deeper py-3 pl-6 pr-5 font-display text-[12px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_6px_20px_-6px_rgba(16,185,129,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-6px_rgba(16,185,129,0.55)] active:translate-y-0 md:inline-flex"
                >
                  Get Listed
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
                  <span className="pointer-events-none absolute inset-0 rounded-[6px] ring-1 ring-white/20" aria-hidden />
                </Link>
              </>
            )}

            {/* Mobile menu */}
            <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
              <Dialog.Trigger asChild>
                <button
                  className="cursor-pointer rounded-md p-2.5 text-petroleum lg:hidden dark:text-foreground"
                  aria-label={mobileOpen ? "Close menu" : "Open menu"}
                >
                  {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-petroleum-deep/40 backdrop-blur-sm lg:hidden" />
                <Dialog.Content
                  aria-describedby={undefined}
                  className="fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto bg-background p-6 shadow-2xl lg:hidden"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <Dialog.Title className="font-display text-sm font-bold tracking-[0.2em] text-petroleum dark:text-foreground">
                      MENU
                    </Dialog.Title>
                    <Dialog.Close asChild>
                      <button
                        className="cursor-pointer rounded-md p-2 text-muted-foreground"
                        aria-label="Close menu"
                      >
                        <X className="size-5" />
                      </button>
                    </Dialog.Close>
                  </div>
                  <nav aria-label="Mobile" className="flex flex-col">
                    {NAV_ITEMS.map((item) => navLink(item, true))}
                    <div className="mt-6 flex flex-col gap-3">
                      {user ? (
                        <>
                          <Link
                            href="/dashboard"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-[6px] bg-gradient-to-r from-emerald-dark to-emerald-deeper px-6 py-3.5 font-display text-[12px] font-bold uppercase tracking-[0.16em] text-white"
                          >
                            <LayoutDashboard className="size-4" aria-hidden />
                            Dashboard
                          </Link>
                          {user.isAdmin ? (
                            <Link
                              href="/admin"
                              className="inline-flex w-full items-center justify-center gap-2 rounded-[6px] border border-border px-6 py-3 text-sm font-semibold"
                            >
                              Administration
                            </Link>
                          ) : null}
                          <button
                            onClick={() => signOutAction()}
                            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-[6px] border border-border px-6 py-3 text-sm font-semibold text-muted-foreground"
                          >
                            <LogOut className="size-4" aria-hidden />
                            Sign out
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            href="/signup"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-[6px] bg-gradient-to-r from-emerald-dark to-emerald-deeper px-6 py-3.5 font-display text-[12px] font-bold uppercase tracking-[0.16em] text-white"
                          >
                            Get Listed
                            <ArrowRight className="size-4" aria-hidden />
                          </Link>
                          <Link
                            href="/login"
                            className="inline-flex w-full items-center justify-center rounded-[6px] border border-border px-6 py-3 text-sm font-semibold"
                          >
                            Sign in
                          </Link>
                        </>
                      )}
                    </div>
                    <div className="mt-8 border-t border-border pt-6">
                      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-petroleum dark:text-foreground">
                        {SLOGAN}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Every organization is verified through{" "}
                        <a
                          href="https://compliance.truvis.tech"
                          className="font-medium text-emerald-dark"
                        >
                          Truvis Compliance
                        </a>
                        .
                      </p>
                    </div>
                  </nav>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      </header>
    </div>
  );
}
