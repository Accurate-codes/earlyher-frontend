"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useLayoutEffect, useState } from "react";
import { useSessionControls } from "@/components/session/session-provider";
import { MenuIcon } from "@/components/ui/icons";
import { ui } from "@/content/en/ui";
import { useOnline, useSession } from "@/lib/hooks";
import { sessionStore } from "@/lib/session/session-store";

const links = [
  { href: "/", label: ui.nav.home },
  { href: "/concern", label: ui.nav.concern },
  { href: "/learn", label: ui.nav.learn },
  { href: "/healthcare", label: ui.nav.healthcare },
] as const;

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function ConnectivityBadge() {
  const online = useOnline();
  return (
    <span
      role="status"
      title={online ? undefined : ui.connectivity.offlineDetail}
      className="inline-flex items-center gap-2 rounded-full border border-line bg-white/80 px-3 py-1.5 text-sm font-medium text-ink-soft"
    >
      <span className={`size-2.5 rounded-full ${online ? "bg-emerald-500" : "bg-amber-500"}`} aria-hidden="true" />
      {online ? ui.connectivity.online : ui.connectivity.offline}
      {!online && <span className="sr-only">. {ui.connectivity.offlineDetail}</span>}
    </span>
  );
}

function NavLinks({ pathname, onNavigate, stacked }: { pathname: string | null; onNavigate?: () => void; stacked?: boolean }) {
  return (
    <>
      {links.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-12 items-center rounded-full px-4 text-base font-medium transition-colors ${
              stacked ? "w-full" : ""
            } ${active ? "bg-brand-100 text-brand-800" : "text-ink-soft hover:bg-brand-50 hover:text-ink"}`}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

function HeaderContent({ pathname }: { pathname: string | null }) {
  const { requestFinish } = useSessionControls();
  useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  // Finish is offered once there is something to clear or the person has left the welcome screen.
  const canFinish = sessionStore.hasData() || (pathname !== null && pathname !== "/");

  // Close the menu when this screen is hidden so it is not open on return.
  useLayoutEffect(() => () => setMenuOpen(false), [pathname]);

  return (
    <header className="relative z-20 border-b border-line/70 bg-canvas/85 backdrop-blur print:hidden">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" aria-label={`${ui.appName} — ${ui.common.home}`} className="shrink-0 rounded-full">
          <Image
            src="/brand/earlyher-logo.png"
            alt={ui.logoAlt}
            width={56}
            height={56}
            priority
            className="size-12 sm:size-14"
          />
        </Link>

        <nav aria-label="Main" className="mx-auto hidden items-center gap-1 lg:flex">
          <NavLinks pathname={pathname} />
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <ConnectivityBadge />
          {canFinish && (
            <button
              type="button"
              onClick={requestFinish}
              className="inline-flex min-h-12 items-center rounded-full bg-ink px-5 text-base font-semibold text-white shadow-soft hover:bg-brand-800"
            >
              {ui.common.finish}
            </button>
          )}
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
            className="grid size-12 place-items-center rounded-full border border-line bg-white text-ink lg:hidden"
          >
            <MenuIcon />
            <span className="sr-only">{ui.common.menu}</span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-menu"
          aria-label="Main"
          className="absolute inset-x-0 top-full flex flex-col gap-1 border-b border-line bg-canvas px-4 py-3 shadow-soft sm:px-6 lg:hidden"
        >
          <NavLinks pathname={pathname} onNavigate={() => setMenuOpen(false)} stacked />
        </nav>
      )}
    </header>
  );
}

function HeaderWithPathname() {
  return <HeaderContent pathname={usePathname()} />;
}

export function AppHeader() {
  return (
    <Suspense fallback={<HeaderContent pathname={null} />}>
      <HeaderWithPathname />
    </Suspense>
  );
}
