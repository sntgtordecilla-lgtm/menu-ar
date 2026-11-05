import { formatARS, RestaurantMenuSchema } from '@menu-ar/shared';
import { notFound } from 'next/navigation';
import { TartaArModal } from '../../components/tarta-ar-modal';

export const dynamic = 'force-dynamic';

interface MenuPageProps {
  params: { slug: string };
}

async function loadMenu(slug: string) {
  const apiUrl = (process.env.API_URL ?? 'http://localhost:3000').replace(
    /\/+$/,
    '',
  );
  const response = await fetch(
    `${apiUrl}/restaurants/${encodeURIComponent(slug)}/menu`,
    { cache: 'no-store' },
  );

  if (response.status === 404) {
    notFound();
  }
  if (!response.ok) {
    throw new Error(`La API respondió con el estado ${response.status}.`);
  }

  return RestaurantMenuSchema.parse(await response.json());
}

export default async function MenuPage({ params }: MenuPageProps) {
  const { restaurant, categories } = await loadMenu(params.slug);
  const primaryColor = restaurant.brand.primaryColor;

  return (
    <main className="min-h-screen bg-paper">
      <header className="relative overflow-hidden bg-ink text-white">
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-32 h-80 w-80 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: primaryColor }}
        />
        <div className="relative mx-auto flex max-w-5xl flex-col gap-10 px-5 pb-12 pt-8 sm:px-8 sm:pb-16 sm:pt-10">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
              Menú digital
            </span>
            <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/75">
              Buenos Aires · ARS
            </span>
          </div>
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-orange-200">
              Hecho para disfrutar
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
              {restaurant.name}
            </h1>
            {restaurant.brand.tagline && (
              <p className="mt-4 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
                {restaurant.brand.tagline}
              </p>
            )}
          </div>
          <a
            href="#carta"
            className="w-fit rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
            style={{ backgroundColor: primaryColor }}
          >
            Explorar la carta <span aria-hidden="true">↓</span>
          </a>
        </div>
      </header>

      <div
        className="h-1"
        style={{ backgroundColor: restaurant.brand.secondaryColor }}
      />

      <section
        id="carta"
        aria-labelledby="menu-heading"
        className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16"
      >
        <div className="mb-9 flex flex-col gap-2 sm:mb-12">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ember">
            Nuestra selección
          </p>
          <h2 id="menu-heading" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            La carta
          </h2>
        </div>

        {categories.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 bg-white/70 p-6 text-stone-600">
            Estamos preparando nuestra carta. Volvé a visitarnos pronto.
          </p>
        ) : (
          <div className="space-y-12">
            {categories.map((category) => (
              <section key={category.id} aria-labelledby={`category-${category.id}`}>
                <div className="mb-5 flex items-center gap-4">
                  <h3
                    id={`category-${category.id}`}
                    className="text-xl font-semibold tracking-tight"
                  >
                    {category.name}
                  </h3>
                  <span className="h-px flex-1 bg-stone-200" />
                </div>
                {category.items.length === 0 ? (
                  <p className="text-sm text-stone-500">
                    No hay platos disponibles en esta categoría por el momento.
                  </p>
                ) : (
                  <ul className="grid gap-4 sm:grid-cols-2">
                    {category.items.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-2xl border border-stone-100 bg-white p-5 shadow-card sm:p-6"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <h4 className="font-semibold leading-6">{item.name}</h4>
                          <span className="shrink-0 font-semibold tabular-nums text-ember">
                            {formatARS(item.priceCents)}
                          </span>
                        </div>
                        {item.description && (
                          <p className="mt-2 text-sm leading-6 text-stone-600">
                            {item.description}
                          </p>
                        )}
                        {item.allergens && item.allergens.length > 0 && (
                          <p className="mt-3 text-xs text-stone-500">
                            Alérgenos: {item.allergens.join(', ')}
                          </p>
                        )}
                        {item.name
                          .normalize('NFD')
                          .replace(/\p{Diacritic}/gu, '')
                          .toLocaleLowerCase('es-AR')
                          .includes('tarta') && (
                            <TartaArModal />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-stone-200 px-5 py-7 text-center text-xs text-stone-500">
        Precios expresados en pesos argentinos (ARS).
      </footer>
    </main>
  );
}
