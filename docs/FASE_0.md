# Fase 0 — Plan de arquitectura: Menú AR, pedidos en mesa y cobros (Argentina), un sitio por restaurante

Documento de planificación · v0.2 (sitio individual por restaurante) · 3 de noviembre de 2026 · Solo decisiones, esquema y riesgos (sin código de aplicación)

## 1. Objetivo y alcance

Definir, antes de escribir código, cuatro cosas: la estructura del monorepo, el esquema de base de datos, el flujo del dinero y los riesgos. La Fase 1 no arranca hasta que se respondan las decisiones abiertas de la sección 11.

**Cambio de enfoque (v0.2):** deja de ser una plataforma SaaS multicliente. Cada restaurante recibe su propio sitio, con su propia base de datos y despliegue, y se vende como servicio de desarrollo. El dueño modifica carta, precios, mesas y modelos 3D desde su dashboard. La lógica de mesas, pedidos, propinas, pagos y WebAR no cambia; desaparecen los tenants, las suscripciones y la landing B2B.

**Fuera de alcance de esta fase:** implementación, diseño visual, contenido del sitio público.

## 2. Supuestos

- Un restaurante por instalación: cada cliente tiene su propio sitio, base de datos y despliegue. No hay cuentas multicliente ni autogestión de altas.
- Se vende como servicio de desarrollo (pago único y, opcionalmente, mantenimiento). No hay suscripción dentro del sistema.
- Un solo país y moneda: Argentina, ARS, idioma es-AR.
- El restaurante administra su carta, mesas, precios y modelos 3D desde su propio dashboard, sin tocar código.
- El comensal no se registra: opera con una sesión anónima de mesa.
- El personal (dueño, gerente, caja, cocina) se autentica con email y contraseña o proveedor social.
- Todo precio guardado es final, con impuestos incluidos, en centavos (enteros).
- Las afirmaciones legales y fiscales de este documento son de diseño técnico y deben ser validadas por un contador o abogado (marcadas como TODO\_LEGAL).

## 3. Estructura del monorepo

```
.
├─ apps/
│  ├─ web/          # Next.js (App Router, TS, Tailwind)
│  │  └─ app/
│  │     ├─ (sitio)/            # home del restaurante, legales
│  │     ├─ (dashboard)/admin/  # carta, 3D, MP, mesas/QR, usuarios
│  │     ├─ (menu)/             # menú cliente WebAR (?t=tokenMesa)
│  │     └─ (kds)/kds/          # panel cocina / caja
│  └─ api/          # NestJS: REST + Socket.io + webhooks
│     └─ src/modules/ {auth, settings, menu, tables, orders, payments,
│                      tips, receipts, assets3d, realtime, audit}
├─ packages/
│  ├─ shared/       # zod schemas, tipos, money, tips, máquinas de estado
│  ├─ db/           # migraciones SQL, seeds, tipos generados
│  └─ config/       # eslint, tsconfig, preset de tailwind
├─ restaurant.config.ts   # marca, colores, textos, estaciones, defaults de propina
├─ infra/           # docker-compose (postgres), CI, plantilla de despliegue
└─ docs/            # ADRs y este plan
```

**Reglas del monorepo**

- `shared` no importa de `web` ni de `api`.
- Toda lógica de dinero e impuestos vive en `shared/money` con tests unitarios; nunca se calcula en componentes de UI.
- Cada decisión importante queda como ADR corto en `docs/`.

## 4. Arquitectura

**Tres capas separadas en `web`:** sitio público del restaurante (home y legales), dashboard del dueño y menú cliente. Comparten solo `shared` y el cliente de API; el menú no comparte componentes de UI con el sitio público para mantenerse liviano.

**Configuración por instalación**

- Cada restaurante tiene su propio despliegue, dominio y variables de entorno.
- Marca, colores y textos base viven en `restaurant.config`; lo que el dueño debe poder cambiar (opciones de propina, horarios, datos del local) vive en la fila única `restaurant_settings`.
- Una sola base de código plantilla: las mejoras se publican como versiones etiquetadas y se aplican a cada instalación.

**Responsabilidades**

- `api` (NestJS) es el único que escribe en la base. `web` no accede a Postgres directamente.
- **Aislamiento:** la base pertenece a un solo restaurante, así que desaparece el riesgo de fuga entre clientes. Aun así se deja RLS activada con denegación por defecto y sin acceso directo desde el navegador; el comensal llega a su sesión de mesa solo a través de la API.
- Socket.io con rooms por estación (cocina, barra, caja). Redis adapter solo si se agregan instancias de la API; con una alcanza la memoria del proceso.
- Almacenamiento de modelos 3D e imágenes en storage de objetos con URLs firmadas y CDN.

**Estado compartido de la mesa:** la fuente de verdad es la base de datos; Socket.io solo notifica cambios. Al reconectar, el cliente pide el estado completo (resincronización), nunca depende de eventos perdidos.

## 5. Modelo de datos

Convenciones: `id` UUID, `created_at` y `updated_at`, borrado lógico donde importe auditoría, dinero en `*_cents` (bigint). Sin `tenant_id`: la base pertenece a un solo restaurante.

### 5.1 Configuración y personal

| Tabla | Campos clave | Notas |
| --- | --- | --- |
| restaurant\_settings | name, cuit, timezone, brand (jsonb), tip\_options (jsonb), tip\_destination\_mode, open\_hours | Fila única, editable desde el dashboard |
| users | auth\_id, email, name, role | role: owner, manager, cashier, kitchen |
| audit\_log | actor\_id, action, entity, entity\_id, diff, ip | Acciones del dashboard y cambios de dinero |

### 5.2 Salón y carta

| Tabla | Campos clave | Notas |
| --- | --- | --- |
| tables | label, qr\_version, active | `qr_version` permite rotar QR |
| table\_sessions | table\_id, status, opened\_at, closed\_at, session\_secret\_hash | Una sesión abierta por mesa a la vez |
| guests | table\_session\_id, display\_name (opcional), device\_hash | Sin datos personales por defecto |
| menu\_categories | name, position, active | Editable por el dueño |
| menu\_items | category\_id, name, description, price\_cents, allergens (text\[\]), station, available, asset\_id | Precio final con impuestos; editable por el dueño |
| menu\_item\_options | item\_id, name, price\_delta\_cents | Variantes y extras |
| assets\_3d | glb\_url, usdz\_url, poster\_url, size\_bytes, real\_scale (jsonb), status | status: uploaded, validating, ready, failed |

### 5.3 Pedidos

| Tabla | Campos clave | Notas |
| --- | --- | --- |
| orders | table\_session\_id, status, placed\_at, cancel\_reason | draft, placed, accepted, in\_progress, ready, served, cancelled |
| order\_items | order\_id, menu\_item\_id, guest\_id, qty, unit\_price\_cents, notes, status, station | Snapshot del precio al pedir |

### 5.4 Pagos, propinas y comprobantes

| Tabla | Campos clave | Notas |
| --- | --- | --- |
| mp\_credentials | mode (oauth o token propio), mp\_user\_id, access\_token\_enc, refresh\_token\_enc, expires\_at, scopes, status | Fila única; cifrado en reposo; nunca va al cliente |
| payments | table\_session\_id, mp\_preference\_id, mp\_payment\_id, status, consumption\_cents, tip\_cents, total\_cents, idempotency\_key | total = consumo + propina, con CHECK en base |
| payment\_allocations | payment\_id, order\_item\_id, amount\_cents | Cuenta dividida: qué paga cada pago |
| tips\_ledger | payment\_id, amount\_cents, destination\_ref, status, credited\_at, distributed\_at | Propina separada del consumo, con su propio ciclo de vida |
| receipts | payment\_id, code (no adivinable), issued\_at, redeemed\_at, redeemed\_by | QR y código de barras que valida la caja una sola vez |
| webhook\_events | provider, event\_id (único), payload, received\_at, processed\_at, error | Idempotencia y reproceso |
| fiscal\_documents | payment\_id, provider, status, cae, number | Stub para facturación electrónica futura |

### 5.5 Servicio del desarrollador (fuera del sistema)

No hay tablas de planes ni de suscripciones. El cobro del desarrollo y del mantenimiento opcional se gestiona por fuera del sistema, con contrato y factura propios.

### 5.6 Reglas de integridad y RLS

- RLS activada con denegación por defecto como defensa en profundidad; la API usa un rol de base de datos sin bypass.
- Acceso del comensal: solo a su `table_session` vigente, validado por token de mesa más secreto de sesión; nunca por un `mesa=X` plano.
- Restricciones: un solo `table_session` abierto por mesa (índice único parcial); `payments.total_cents = consumption_cents + tip_cents`; suma de `payment_allocations` no excede el subtotal del ítem.
- Índices mínimos: `(status)` en orders, `(table_session_id)` en order\_items, `event_id` único en webhook\_events.

## 6. Flujo del dinero

Hay tres flujos independientes que nunca se mezclan.

```
FLUJO 1 · VENTAS
Comensal → Checkout MP (credenciales de la cuenta MP del propio restaurante) → Cuenta MP del restaurante
          El desarrollador no toca estos fondos.

FLUJO 2 · PROPINAS (Decreto 731/2024)
Comensal elige propina → ítem separado en el cobro → tips_ledger
          → cuenta destino de propinas → puesta a disposición del personal

FLUJO 3 · SERVICIO DEL DESARROLLADOR (fuera del sistema)
Restaurante → pago único de desarrollo (+ mantenimiento opcional) → factura del desarrollador
          No pasa por la plataforma ni por los cobros a comensales.
```

### 6.1 Propinas: decisión de diseño

El decreto establece que la propina no integra la remuneración, que debe acreditarse de inmediato o en el menor plazo posible en una cuenta asignada a ese fin y que, si el comercio intermedia, debe poner los montos a disposición de los trabajadores. Por eso la propina se modela como flujo propio y no como parte de la venta. Dos opciones:

- **Opción A (recomendada para MVP):** un solo cobro con dos conceptos (consumo y propina) hacia la cuenta MP del restaurante. La separación es contable: `tips_ledger` registra cada propina, su estado y su distribución al personal. Simple para el comensal, pero el restaurante debe canalizar luego la propina a la cuenta destinada.
- **Opción B:** dos cobros distintos, el segundo hacia una cuenta de propinas configurada por el restaurante. Más fiel a la idea de cuenta dedicada, pero agrega fricción y una segunda conexión OAuth.

Los porcentajes 10, 15, 20 y personalizado son un default de UX configurable en `restaurants.tip_options`. La propina es siempre voluntaria, nunca viene preseleccionada y se muestra por separado del total de consumo. TODO\_LEGAL: validar con contador la opción elegida y el tratamiento de la cuenta de propinas.

### 6.2 Máquina de estados de un pago

`created → pending → approved | rejected | cancelled → refunded | charged_back`

- Las transiciones se aplican solo desde un webhook verificado más una consulta activa a la API de Mercado Pago. El redirect del navegador del comensal nunca confirma un pago.
- Cada webhook se guarda en `webhook_events` con `event_id` único antes de procesarse; reintentos de MP no duplican efectos.
- Un job de conciliación revisa pagos en `pending` y compara contra MP para cubrir webhooks perdidos.

### 6.3 Cuenta dividida

- El comensal elige qué ítems paga (o una porción) y se crea un `payment` con sus `payment_allocations`.
- Para evitar doble cobro: reserva de ítems con expiración corta al iniciar el checkout, liberada si el pago falla o vence.
- La mesa se cierra cuando la suma de allocations aprobadas cubre el total del pedido.

### 6.4 Comprobante QR y código de barras

- Tras `approved`, se emite un `receipt` con código aleatorio no adivinable, renderizado como QR y Code128.
- La caja lo escanea; el sistema valida y marca `redeemed_at` una sola vez (segundo escaneo = alerta).
- Es un comprobante operativo, no una factura. Quién emite la factura al consumidor final es una decisión abierta (sección 11).

### 6.5 Conexión con Mercado Pago

- Dos modos posibles (decisión abierta): OAuth, donde el restaurante autoriza la aplicación y el sistema nunca ve su clave secreta, o credenciales propias (access token de producción) cargadas en la instalación y guardadas cifradas. Con una sola cuenta por instalación las credenciales propias son más simples; OAuth evita manipular claves ajenas.
- Tokens cifrados en reposo; si se usa OAuth, refresco programado antes del vencimiento. Si falla, el sistema pasa a `reconnect_required` y se muestra «pagar en caja».
- No inventar endpoints ni campos: toda llamada se implementa contra la documentación oficial vigente y se cita en comentarios.

## 7. Flujos críticos

**A. Escaneo de QR y sesión de mesa**

1. El QR contiene `/?t=<token>` en el dominio del restaurante; el token es un JWT firmado con `kid`, `table_id` y `qr_version`.
2. El servidor valida firma y versión; si no hay sesión abierta para la mesa, la crea; devuelve una cookie de sesión de mesa.
3. Los demás comensales de la mesa se unen a la misma sesión y ven el carrito compartido en tiempo real.

**B. Pedido a cocina**

1. Los comensales arman el pedido; al confirmar se pasa de `draft` a `placed` (hasta ese momento se puede cancelar sin costo).
2. La API emite el evento a la room de la estación; el KDS muestra la comanda con alerta visual y sonora.
3. Cocina cambia estados; el comensal ve el avance.

**C. Pago**

1. El comensal elige ítems y propina y la API crea el `payment` y la preferencia en MP con las credenciales del restaurante.
2. El comensal paga en MP; el webhook verificado actualiza el estado.
3. Se emite el `receipt` y se notifica a la caja por Socket.io.

## 8. Seguridad y roles

| Capacidad | owner | manager | cashier | kitchen | comensal |
| --- | --- | --- | --- | --- | --- |
| Configurar Mercado Pago | ✔ |  |  |  |  |
| Editar carta y modelos 3D | ✔ | ✔ |  |  |  |
| Generar y rotar QR | ✔ | ✔ |  |  |  |
| Ver KDS y cambiar estados | ✔ | ✔ | ✔ | ✔ |  |
| Validar comprobantes | ✔ | ✔ | ✔ |  |  |
| Ver reportes de ventas y propinas | ✔ | ✔ |  |  |  |
| Pedir y pagar en su mesa |  |  |  |  | ✔ |

**Controles transversales:** rate limiting por IP y por mesa; validación con zod en todos los bordes; CORS restringido; secretos fuera del repo; logs sin datos personales; cabeceras de seguridad; verificación de firma en webhooks.

## 9. KDS y tiempo real

- Alertas sonoras: los navegadores bloquean el audio sin gesto del usuario, por eso el KDS inicia con un botón «Activar sonido» y muestra un indicador permanente de estado de audio.
- Reconexión automática con backoff y resincronización completa del estado al volver.
- Estaciones configurables (cocina, barra, caja) y filtros por estación.
- Indicador visible de conexión caída; si el KDS se desconecta más de N segundos, alerta al gerente.
- Escala: una sola instancia de la API alcanza para un local; Redis adapter solo si se agregan instancias.

## 10. Pipeline WebAR

- Visor: `<model-viewer>` con `.glb` para Android y `.usdz` para iOS (Quick Look en Safari).
- Validaciones al subir: peso objetivo menor a 5 MB, polígonos razonables, texturas comprimidas, escala 1:1 declarada y verificada contra dimensiones reales del plato.
- Optimización: compresión Draco o meshopt y texturas KTX2 o WebP.
- Póster de carga y carga diferida: el menú debe ser usable sin abrir AR.
- Fallback: navegadores embebidos (Instagram, WhatsApp) y dispositivos sin soporte muestran imagen o vista 360 con aviso de «abrir en navegador».
- Estados del asset: `uploaded → validating → ready | failed`, con mensajes de error entendibles en el dashboard.

## 11. Cumplimiento y decisiones abiertas

### 11.1 Cumplimiento (implicancia técnica)

| Norma | Implicancia técnica | Estado |
| --- | --- | --- |
| Decreto 731/2024 (propinas) | Propina separada, ledger propio, cuenta destino configurable, nunca como remuneración | TODO\_LEGAL: validar opción A o B; el cumplimiento frente al personal es del restaurante y el sistema solo le da la herramienta |
| Ley 25.326 (datos personales) | Datos mínimos solo al pagar, consentimiento y política visibles, sin PII en logs, derechos de acceso y supresión | TODO\_LEGAL: el restaurante es responsable de su base de datos y el desarrollador actúa como encargado del tratamiento; reflejarlo en el contrato y revisar inscripción |
| Ley 24.240 (consumidor) | Precios finales visibles, alérgenos por plato, cancelación antes de confirmar la comanda | TODO\_LEGAL: el botón de arrepentimiento apunta a contratación a distancia y probablemente no aplica al consumo en mesa; validar |
| Facturación fiscal (ARCA) | Interfaz `FiscalInvoiceProvider` vacía; el comprobante QR no es factura | Decisión abierta; tu factura por el servicio es independiente |
| Contrato de servicio | Alcance, soporte, propiedad del código y de los datos, hosting y mantenimiento | TODO\_LEGAL: redactar con un abogado |

### 11.2 Decisiones abiertas (necesito tu respuesta)

1. **Propinas:** ¿opción A (un cobro, separación contable) u opción B (dos cobros, cuenta dedicada)?
2. **Facturación al consumidor:** ¿la emite el POS del restaurante, la integra el sistema o queda fuera del MVP?
3. **Modelo de ingresos:** ¿pago único más mantenimiento mensual opcional, o solo pago único?
4. **Mercado Pago:** ¿OAuth o credenciales propias del restaurante cargadas en su instalación?
5. **Hosting y propiedad:** ¿dominio, hosting y base de datos en cuentas del cliente, o tuyas con traspaso? ¿Quién paga la infraestructura mensual?
6. **Actualizaciones:** ¿cómo se aplican mejoras a cada instalación (versión etiquetada con despliegue manual o dentro de un contrato de mantenimiento)?
7. **Autenticación del personal:** ¿Supabase Auth o implementación propia en NestJS?
8. **Modelos 3D:** ¿los provee el restaurante o ofreces el servicio de digitalización?

## 12. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Cobro duplicado en cuenta dividida | Alto | Reserva de ítems con expiración, idempotency keys, constraint de suma |
| Webhooks perdidos o repetidos | Alto | Tabla `webhook_events` idempotente, conciliación periódica |
| Credenciales o token de MP vencidos en servicio | Alto | Refresco anticipado (si OAuth), estado `reconnect_required`, modo «pagar en caja» |
| Instalaciones que divergen de la plantilla | Alto | Una sola base de código, personalización solo vía `restaurant.config` y settings, versiones etiquetadas |
| Trabajo de mantener varias instalaciones | Medio | Despliegue automatizado por cliente, checklist de alta, mantenimiento opcional contratado |
| Pérdida de datos del restaurante | Alto | Backups automáticos diarios y prueba de restauración |
| Cambio normativo sobre propinas | Medio | Lógica aislada en `shared/tips`, opciones en `restaurant_settings` |
| Modelos 3D pesados o fallidos en móviles | Medio | Límites de peso, póster, fallback sin AR |
| KDS sin audio o sin conexión | Alto | Activación explícita de sonido, reconexión y alerta de desconexión |
| QR copiado o adivinado | Medio | Token firmado, rotación por `qr_version`, sesión de mesa con secreto |
| Facturación fiscal sin resolver | Alto | Decisión temprana, interfaz de proveedor lista |

## 13. Criterio de salida de la Fase 0

- Se respondieron como mínimo las decisiones 1, 2 y 3.
- Se aprobó el esquema de la sección 5 y el flujo del dinero de la sección 6.
- Siguiente paso: Fase 1 (base del monorepo, migraciones, RLS por defecto y plantilla de configuración por restaurante).
