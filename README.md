# menu-ar

## API local

La API NestJS carga la configuración del archivo `.env` ubicado en la raíz del
monorepo. Para usar PostgreSQL local, definí al menos estas variables:

```dotenv
DATABASE_URL=postgres://menu_ar_user:menu_ar_password@localhost:5432/menu_ar_db
RESTAURANT_SLUG=restaurante-ar
PORT=3000
```

`RESTAURANT_SLUG` identifica la instalación única servida por
`GET /restaurants/:slug`; `GET /restaurants/:slug/menu` entrega la carta
publicada para el sitio. La API también expone `GET /health`.

La aplicación web usa Next.js App Router y consulta el menú en el servidor. Su
configuración local va en `apps/web/.env.local`:

```dotenv
API_URL=http://localhost:3000
RESTAURANT_SLUG=restaurante-ar
```

Iniciá Next.js con `pnpm --filter "@menu-ar/web" run dev -- --port 3001` para
evitar conflictos con el puerto predeterminado de la API. El menú está
disponible en `/restaurante-ar` (o en la ruta indicada por `RESTAURANT_SLUG`).

La experiencia WebAR carga `apps/web/public/models/tarta.glb` para el visor y
Android, y `tarta.usdz` para AR Quick Look en iOS. Next.js sirve ambos como
estáticos del mismo origen y configura el MIME de USDZ para Quick Look. En
Vercel, desplegá `apps/web` como la aplicación Next.js del monorepo.
