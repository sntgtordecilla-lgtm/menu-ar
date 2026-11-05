'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const TartaModelViewer = dynamic(() => import('./tarta-model-viewer'), {
  ssr: false,
  loading: () => (
    <div
      aria-label="Cargando modelo 3D"
      className="min-h-0 w-full flex-1 animate-pulse bg-stone-100"
    />
  ),
});

export function TartaArModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [modelError, setModelError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }
    setModelError(false);
  }, [isOpen]);

  function closeModal() {
    dialogRef.current?.close();
    setIsOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-4 rounded-full border border-ember/25 bg-orange-50 px-4 py-2 text-sm font-semibold text-ember transition hover:bg-orange-100"
      >
        Ver Tarta en AR 3D
      </button>
      {isOpen && (
        <dialog
          ref={dialogRef}
          aria-labelledby="tarta-ar-title"
          onClose={() => setIsOpen(false)}
          onClick={(event) => {
            if (event.target === dialogRef.current) {
              closeModal();
            }
          }}
          className="fixed inset-0 m-0 h-dvh max-h-dvh w-full max-w-none overflow-hidden bg-ink/70 p-0 backdrop:bg-ink/70"
        >
          <div className="flex h-dvh w-full items-center justify-center sm:p-6">
            <section className="flex h-dvh w-full flex-col overflow-hidden bg-paper shadow-2xl sm:h-[min(90dvh,52rem)] sm:max-w-3xl sm:rounded-3xl">
              <div className="flex shrink-0 items-start justify-between gap-4 px-5 pb-3 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-7 sm:pt-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ember">
                    Experiencia interactiva
                  </p>
                  <h2 id="tarta-ar-title" className="mt-1 text-2xl font-semibold">
                    Tarta en 3D
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Cerrar vista 3D"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-200 text-xl text-ink transition hover:bg-stone-100"
                >
                  ×
                </button>
              </div>

              <p className="mx-5 mb-3 w-fit shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 sm:mx-7">
                Proyectado a tamaño real (Escala 1:1)
              </p>

              {modelError ? (
                <div
                  role="alert"
                  className="mx-5 flex min-h-0 flex-1 items-center justify-center rounded-2xl bg-stone-100 p-6 text-center text-sm text-stone-600 sm:mx-7"
                >
                  No pudimos cargar el modelo 3D. Revisá tu conexión e intentá
                  de nuevo.
                </div>
              ) : (
                <TartaModelViewer onError={() => setModelError(true)} />
              )}

              <p className="shrink-0 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 text-center text-xs leading-5 text-stone-600 sm:px-7 sm:pb-6">
                Apunta al suelo o mesa y mueve el celular en círculos para ver
                la tarta en su tamaño real.
              </p>
            </section>
          </div>
        </dialog>
      )}
    </>
  );
}
