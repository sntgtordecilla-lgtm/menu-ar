'use client';

export default function MenuError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-5">
      <section
        aria-labelledby="menu-error-heading"
        className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-7 text-center shadow-card"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ember">
          Menú no disponible
        </p>
        <h1 id="menu-error-heading" className="mt-3 text-2xl font-semibold">
          No pudimos cargar la carta
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Revisá que la API esté activa y que <code>API_URL</code> apunte al
          servicio correcto. Después, podés volver a intentar.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full bg-ember px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Reintentar
        </button>
      </section>
    </main>
  );
}
