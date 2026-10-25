import Link from "next/link";
import { NAVEGACION, SITE } from "@/lib/site";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-plane">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[2fr_1fr_1fr]">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 font-semibold">
            <Logo className="h-7 w-7" />
            {SITE.nombre}
          </div>
          <p className="max-w-md text-sm text-ink-2">
            Proyecto ciudadano e independiente de Navojoa, Sonora. No sustituye al Ayuntamiento: mide, prioriza y
            transparenta para que las decisiones sobre nuestras calles sean más justas.
          </p>
          <p className="text-sm text-ink-2">
            ¿Viste un bache? Repórtalo también al Ayuntamiento por WhatsApp:{" "}
            <a className="font-medium text-ink underline underline-offset-2" href={`https://wa.me/${SITE.whatsappAyuntamiento}`}>
              642 157 1356
            </a>
          </p>
        </div>
        <nav aria-label="Secciones" className="space-y-2 text-sm">
          <p className="font-medium">Secciones</p>
          <ul className="space-y-1.5 text-ink-2">
            {NAVEGACION.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-2 text-sm">
          <p className="font-medium">Datos y código abiertos</p>
          <ul className="space-y-1.5 text-ink-2">
            <li>
              <a href={SITE.repo} className="hover:text-ink">
                Código en GitHub
              </a>
            </li>
            <li>INEGI · CONAPO · DENUE</li>
            <li>
              Mapa ©{" "}
              <a href="https://www.openstreetmap.org/copyright" className="hover:text-ink">
                OpenStreetMap
              </a>{" "}
              ·{" "}
              <a href="https://openfreemap.org" className="hover:text-ink">
                OpenFreeMap
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
