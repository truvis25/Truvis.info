"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import {
  ArrowRight,
  CircleUserRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings2,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/directory", label: "Directory" },
  { href: "/events", label: "Events" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/feed", label: "Feed" },
  { href: "/pricing", label: "Pricing" },
] as const;

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
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <div className="sticky top-0 z-50">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-petroleum focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      <header className="border-b border-border/90 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:px-10">
          <Link
            href="/"
            aria-label="TRUVIS.info home"
            className="flex shrink-0 items-center gap-3 rounded-lg"
          >
            <Image
              src="/brand/logo.png"
              alt=""
              width={42}
              height={42}
              priority
              className="size-[42px] object-contain"
            />
            <span className="leading-none">
              <span className="font-display text-[21px] font-extrabold tracking-[-0.025em] text-petroleum dark:text-white">
                TRUVIS<span className="text-emerald-brand">.info</span>
              </span>
              <span className="mt-1.5 block text-[8px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Verified business network
              </span>
            </span>
          </Link>

          <nav aria-label="Primary navigation" className="hidden items-center gap-7 lg:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "relative py-2 font-display text-[13px] font-semibold transition-colors",
                  isActive(item.href)
                    ? "text-petroleum dark:text-white"
                    : "text-muted-foreground hover:text-petroleum dark:hover:text-white",
                )}
              >
                {item.label}
                {isActive(item.href) ? (
                  <span
                    aria-hidden
                    className="absolute inset-x-0 -bottom-[20px] h-0.5 rounded-full bg-emerald-brand"
                  />
                ) : null}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle className="cursor-pointer rounded-lg p-2.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-petroleum dark:hover:text-white" />

            {user ? (
              <Dropdown.Root>
                <Dropdown.Trigger asChild>
                  <button
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card py-1.5 pl-1.5 pr-3 text-sm font-medium transition hover:bg-secondary"
                    aria-label="Open account menu"
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-petroleum font-display text-xs font-bold text-white">
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
                    sideOffset={10}
                    className="z-[70] w-60 rounded-xl border border-border bg-card p-2 shadow-[0_24px_60px_-24px_rgba(2,48,89,.42)]"
                  >
                    <div className="truncate px-3 py-2 text-xs text-muted-foreground">
                      {user.email}
                    </div>
                    <Dropdown.Item asChild>
                      <Link
                        href="/dashboard"
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium outline-none hover:bg-secondary focus:bg-secondary"
                      >
                        <LayoutDashboard className="size-4 text-emerald-brand" aria-hidden />
                        Dashboard
                      </Link>
                    </Dropdown.Item>
                    {user.isAdmin ? (
                      <Dropdown.Item asChild>
                        <Link
                          href="/admin"
                          className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium outline-none hover:bg-secondary focus:bg-secondary"
                        >
                          <Settings2 className="size-4 text-emerald-brand" aria-hidden />
                          Administration
                        </Link>
                      </Dropdown.Item>
                    ) : null}
                    <Dropdown.Separator className="my-1 h-px bg-border" />
                    <Dropdown.Item asChild>
                      <button
                        onClick={() => signOutAction()}
                        className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium outline-none hover:bg-destructive/10 focus:bg-destructive/10"
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
                  className="hidden items-center gap-2 px-2 py-2 font-display text-[13px] font-semibold text-petroleum transition hover:text-emerald-deeper md:inline-flex dark:text-white"
                >
                  <CircleUserRound className="size-4" aria-hidden />
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="hidden h-11 items-center justify-center gap-2 rounded-xl bg-petroleum px-5 font-display text-[13px] font-semibold text-white transition hover:bg-petroleum-light md:inline-flex"
                >
                  Get listed
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </>
            )}

            <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
              <Dialog.Trigger asChild>
                <button
                  className="cursor-pointer rounded-lg p-2.5 text-petroleum hover:bg-secondary lg:hidden dark:text-white"
                  aria-label="Open navigation menu"
                >
                  <Menu className="size-6" />
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[60] bg-petroleum-deep/45 backdrop-blur-sm lg:hidden" />
                <Dialog.Content
                  aria-describedby={undefined}
                  className="fixed inset-y-0 right-0 z-[70] w-full max-w-sm overflow-y-auto bg-background p-6 shadow-2xl lg:hidden"
                >
                  <div className="flex items-center justify-between border-b border-border pb-5">
                    <Dialog.Title className="font-display text-sm font-bold tracking-[0.16em] text-petroleum dark:text-white">
                      NAVIGATION
                    </Dialog.Title>
                    <Dialog.Close asChild>
                      <button
                        className="cursor-pointer rounded-lg p-2 text-muted-foreground hover:bg-secondary"
                        aria-label="Close navigation menu"
                      >
                        <X className="size-5" />
                      </button>
                    </Dialog.Close>
                  </div>

                  <nav aria-label="Mobile navigation" className="mt-4">
                    {NAV_ITEMS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={isActive(item.href) ? "page" : undefined}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center justify-between border-b border-border py-4 font-display text-base font-semibold",
                          isActive(item.href)
                            ? "text-emerald-deeper dark:text-emerald-brand"
                            : "text-petroleum dark:text-white",
                        )}
                      >
                        {item.label}
                        <ArrowRight className="size-4" aria-hidden />
                      </Link>
                    ))}
                  </nav>

                  <div className="mt-8 grid gap-3">
                    {user ? (
                      <>
                        <Link
                          href="/dashboard"
                          onClick={() => setMobileOpen(false)}
                          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-petroleum px-5 font-display text-sm font-semibold text-white"
                        >
                          <LayoutDashboard className="size-4" aria-hidden />
                          Dashboard
                        </Link>
                        {user.isAdmin ? (
                          <Link
                            href="/admin"
                            onClick={() => setMobileOpen(false)}
                            className="inline-flex h-12 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold"
                          >
                            Administration
                          </Link>
                        ) : null}
                        <button
                          onClick={() => signOutAction()}
                          className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold"
                        >
                          <LogOut className="size-4" aria-hidden />
                          Sign out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/signup"
                          onClick={() => setMobileOpen(false)}
                          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-petroleum px-5 font-display text-sm font-semibold text-white"
                        >
                          Get listed
                          <ArrowRight className="size-4" aria-hidden />
                        </Link>
                        <Link
                          href="/login"
                          onClick={() => setMobileOpen(false)}
                          className="inline-flex h-12 items-center justify-center rounded-xl border border-border px-5 font-display text-sm font-semibold"
                        >
                          Sign in
                        </Link>
                      </>
                    )}
                  </div>

                  <div className="mt-10 rounded-xl bg-secondary p-4 text-sm leading-6 text-muted-foreground">
                    Every listed organization is checked through{" "}
                    <a
                      href="https://compliance.truvis.tech"
                      className="font-semibold text-emerald-deeper dark:text-emerald-brand"
                    >
                      Truvis Compliance
                    </a>
                    .
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      </header>
    </div>
  );
}
