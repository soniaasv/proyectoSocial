"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Algo salió mal</h1>
      <p className="text-ink-2">Tuvimos un problema al cargar esta página. Intenta de nuevo en un momento.</p>
      <button type="button" onClick={reset} className="rounded-full bg-brand px-5 py-3 font-medium text-brand-ink">
        Reintentar
      </button>
    </div>
  );
}
