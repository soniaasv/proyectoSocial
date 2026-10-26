"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAVEGACION, SITE } from "@/lib/site";
import { Logo } from "./logo";

export function SiteHeader() {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const activo = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight" onClick={() => setAbierto(false)}>
          <Logo />
          <span className="text-lg">{SITE.nombre}</span>
        </Link>

        <nav aria-label="Principal" className="hidden flex-1 items-center gap-1 md:flex">
          {NAVEGACION.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={activo(item.href) ? "page" : undefined}
              className="rounded-md px-3 py-2 text-sm text-ink-2 transition-colors hover:bg-plane hover:text-ink aria-[current=page]:font-medium aria-[current=page]:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/reportar"
          className="ml-auto hidden rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-ink transition hover:opacity-90 md:inline-flex"
        >
          Reportar un bache
        </Link>

        <button
          type="button"
          className="ml-auto rounded-md p-2 text-ink-2 md:hidden"
          aria-expanded={abierto}
          aria-controls="menu-movil"
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setAbierto((v) => !v)}
        >
          {abierto ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {abierto && (
        <nav id="menu-movil" aria-label="Principal" className="border-t border-line bg-surface px-4 pb-4 md:hidden">
          <ul className="flex flex-col py-2">
            {NAVEGACION.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setAbierto(false)}
                  aria-current={activo(item.href) ? "page" : undefined}
                  className="block rounded-md px-3 py-3 text-base text-ink-2 aria-[current=page]:font-medium aria-[current=page]:text-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/reportar"
            onClick={() => setAbierto(false)}
            className="flex w-full justify-center rounded-md bg-brand px-4 py-3 font-medium text-brand-ink"
          >
            Reportar un bache
          </Link>
        </nav>
      )}
    </header>
  );
}
