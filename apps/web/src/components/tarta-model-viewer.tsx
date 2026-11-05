'use client';

import '@google/model-viewer';

export default function TartaModelViewer({
  onError,
}: {
  onError: () => void;
}) {
  return (
    <model-viewer
      src="/models/tarta.glb"
      ios-src="/models/tarta.usdz"
      ar
      ar-modes="webxr scene-viewer quick-look"
      ar-scale="fixed"
      camera-controls
      disable-zoom
      auto-rotate
      interaction-prompt="auto"
      shadow-intensity="1"
      exposure="1"
      alt="Modelo 3D de una tarta"
      onError={onError}
      className="block min-h-0 w-full flex-1 bg-[radial-gradient(ellipse_at_center,_#fff_0%,_#f4eee3_75%)]"
    >
      <button
        slot="ar-button"
        className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ember px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
      >
        Ver Tarta en mi mesa
      </button>
    </model-viewer>
  );
}
