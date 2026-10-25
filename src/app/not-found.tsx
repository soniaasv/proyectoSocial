import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-ink-3">Error 404</p>
      <h1 className="text-3xl font-semibold tracking-tight">Esta calle no lleva a ningún lado</h1>
      <p className="text-ink-2">La página que buscas no existe o cambió de lugar.</p>
      <Link href="/" className="rounded-full bg-brand px-5 py-3 font-medium text-brand-ink">
        Volver al inicio
      </Link>
    </div>
  );
}
