# 🎬 Filmoteca Notifier

[![CI](https://github.com/angelespejo/filmoteca-notifier/actions/workflows/ci.yml/badge.svg)](https://github.com/angelespejo/filmoteca-notifier/actions/workflows/ci.yml)
[![GHCR](https://img.shields.io/badge/ghcr.io-angelespejo%2Ffilmoteca--notifier-blue)](https://github.com/angelespejo/filmoteca-notifier/pkgs/container/filmoteca-notifier)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Notificador **no oficial** de la programación de la **Filmoteca Española (Cine Doré)**.

- Scraping ligero con `fetch` + `node-html-parser`: **sin navegador, sin Playwright y sin Chromium**.
- Notificaciones por **email** y/o **Gotify**.
- Salida en `text`, `json`, `table`, `markdown` o `csv`.
- Guardado opcional de resultados y del PDF mensual.
- Comando `server` para cron y Docker/Podman.

> No está afiliado, patrocinado ni respaldado por la Filmoteca Española, el Ministerio de Cultura
> ni las plataformas de venta de entradas.

## Índice

- [Características](#características)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Inicio rápido](#inicio-rápido)
- [CLI](#cli)
- [Formatos de salida](#formatos-de-salida)
- [Configuración](#configuración)
- [Notificaciones](#notificaciones)
- [Almacenamiento opcional](#almacenamiento-opcional)
- [Docker y Podman](#docker-y-podman)
- [Biblioteca](#biblioteca)
- [Solución de problemas](#solución-de-problemas)
- [Desarrollo](#desarrollo)
- [Seguridad](#seguridad)
- [Licencia](#licencia)

## Características

- Extrae los próximos días de cartelera desde la web pública.
- Filtra por fecha en `Europe/Madrid`.
- Incluye título, directores, sinopsis, hora, estado, categoría y enlaces.
- Evita duplicados y limita la paginación.
- Permite elegir el formato de salida.
- Envía email y Gotify de forma independiente: si un canal falla, el otro continúa.
- Cron con zona horaria configurable.
- Modo interactivo `ask`.
- Almacenamiento opcional por comando y ejecución.

## Requisitos

- Node.js `>=22.9`
- pnpm `>=11`
- Docker o Podman, solo si quieres usar contenedores

## Instalación

### Opción A — Local

```bash
git clone https://github.com/angelespejo/filmoteca-notifier.git
cd filmoteca-notifier
pnpm install
cp .env.example .env
```

Edita `.env` con tus credenciales. No necesitas navegador.

### Opción B — Docker

```bash
docker pull ghcr.io/angelespejo/filmoteca-notifier:latest
docker run --rm ghcr.io/angelespejo/filmoteca-notifier:latest --help
```

Para configurar el daemon:

```bash
docker run -d \
  --name filmoteca-notifier \
  --restart unless-stopped \
  --env-file .env \
  -e DATA_DIR=/app/data \
  -v "$PWD/data:/app/data" \
  ghcr.io/angelespejo/filmoteca-notifier:latest
```

También puedes construirlo localmente:

```bash
docker build -t filmoteca-notifier .
docker run --rm filmoteca-notifier --help
```

### Opción C — Podman

```bash
podman pull ghcr.io/angelespejo/filmoteca-notifier:latest
podman run --rm ghcr.io/angelespejo/filmoteca-notifier:latest --help
```

Daemon:

```bash
podman run -d \
  --name filmoteca-notifier \
  --restart unless-stopped \
  --env-file .env \
  -e DATA_DIR=/app/data \
  -v "$PWD/data:/app/data" \
  ghcr.io/angelespejo/filmoteca-notifier:latest
```

Build local:

```bash
podman build -t filmoteca-notifier .
```

### Docker Compose / Podman Compose

```bash
cp .env.example .env
docker compose up -d
# o:
podman compose up -d
```

El `docker-compose.yml` usa `env_file: .env` y monta `./data` en `/app/data`.
Si quieres usar la imagen publicada en lugar de construirla, cambia `build: .` por:

```yaml
image: ghcr.io/angelespejo/filmoteca-notifier:latest
```

## Inicio rápido

```bash
pnpm scrape          # scrape manual, solo consola
pnpm ask             # scrape interactivo
pnpm start           # daemon con cron y notificaciones
pnpm cli:help        # ayuda general
pnpm start --help    # ayuda del subcomando server
```

La imagen Docker arranca por defecto con:

```text
server --res markdown
```

## CLI

Los subcomandos son obligatorios:

```text
filmoteca-notifier server [opciones]
filmoteca-notifier manual [opciones]
filmoteca-notifier ask [opciones]
filmoteca-notifier help [server|manual|ask]
filmoteca-notifier --version
```

| Comando | Descripción |
|---|---|
| `server` | Daemon con cron y notificaciones. Es el comando de Docker. |
| `manual` | Scrapea y muestra el resultado, sin notificaciones. |
| `ask` | Scrapea preguntando si imprimir y/o notificar. |
| `help` | Ayuda general o de un subcomando. |

Opciones:

```text
--res <formato>   text | json | table | markdown | csv
--no-program      Omite el programa y no descarga el PDF
--print           En ask, imprime sin preguntar
--notify          En ask, notifica sin preguntar
-h, --help        Ayuda
-V, --version     Versión
```

`--help` muestra también el funding y la URL de issues.

## Formatos de salida

```bash
filmoteca-notifier manual --res text
filmoteca-notifier manual --res json
filmoteca-notifier manual --res table
filmoteca-notifier manual --res markdown
filmoteca-notifier manual --res csv

filmoteca-notifier ask --print --res json
filmoteca-notifier server --res json
```

- `text`: formato de consola con colores si la terminal lo permite.
- `json`: array JSON de `ScrapedDay`.
- `table`: tabla compacta con `Info` y `Compra`.
- `markdown`: títulos anidados por día y película.
- `csv`: una película por fila, con cabeceras en español.

Los enlaces aparecen en todos los formatos.

`--no-program` elimina el programa del output y **no descarga el PDF**, pero sí guarda
`{timestamp}-info.{ext}`.

## Configuración

Todas las variables están documentadas en [`.env.example`](.env.example).

| Variable | Descripción |
|---|---|
| `CRON` | Expresión cron. Por defecto `0 0 * * *`. |
| `CRON_TIMEZONE` | Zona horaria del cron. Por defecto `Europe/Madrid`. |
| `RUN_ON_START` | Scrape inicial al arrancar. Por defecto `true`. |
| `DATA_DIR` | Carpeta opcional para guardar resultados y PDF. |
| `SMTP_HOST` / `SMTP_PORT` | Servidor SMTP. |
| `SMTP_USER` / `SMTP_PASS` | Autenticación SMTP. Opcional para relays locales. |
| `EMAIL_FROM` / `EMAIL_TO` | Remitente y destinatarios. |
| `GOTIFY_URL` / `GOTIFY_TOKEN` | Servidor y token de Gotify. |

`CRON_TIMEZONE` solo afecta al cron. El cálculo de los próximos días de cartelera usa
siempre `Europe/Madrid`, porque el cine está en Madrid.

### Ejemplos de cron

```env
# Todos los días a medianoche
CRON=0 0 * * *

# Laborables a las 17:00
CRON=0 17 * * 1-5

# Dos veces al día
CRON=0 9,18 * * *
```

## Notificaciones

### Email

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-cuenta@gmail.com
SMTP_PASS=tu-app-password
EMAIL_FROM=tu-cuenta@gmail.com
EMAIL_TO=destino@example.com
```

Para Gmail usa una **app password**, no tu contraseña normal.

### Gotify

```env
GOTIFY_URL=http://gotify:80
GOTIFY_TOKEN=tu-token
```

Puedes activar solo email, solo Gotify o ambos. Si uno falla, el otro se intenta igualmente.

## Almacenamiento opcional

```env
DATA_DIR=./data
```

Cada ejecución guarda:

```text
./data/
├── server/
│   ├── 2026-11-24T08-00-00-000Z-info.json
│   └── 2026-11-24T08-00-00-000Z-programa.pdf
├── manual/
│   └── ...
└── ask/
    └── ...
```

- Carpeta: `DATA_DIR/{server|manual|ask}`.
- Información: `{timestamp}-info.{ext}`.
- PDF: `{timestamp}-programa.pdf`.
- `text` y `table` usan `.txt`; `markdown` usa `.md`.
- Si `DATA_DIR` no está definido, no se escribe nada.
- Los errores de guardado o descarga son warnings no fatales.

## Docker y Podman

La imagen:

- Usa Alpine.
- No incluye Chromium ni Playwright.
- Ejecuta como usuario `node`.
- Arranca con `server --res markdown`.
- Publica en `ghcr.io/angelespejo/filmoteca-notifier`.

Comandos útiles:

```bash
# Ayuda
docker run --rm ghcr.io/angelespejo/filmoteca-notifier:latest --help

# Scrape manual a JSON
docker run --rm --env-file .env ghcr.io/angelespejo/filmoteca-notifier:latest \
  manual --res json

# Guardar datos en el host
docker run --rm \
  --env-file .env \
  -e DATA_DIR=/app/data \
  -v "$PWD/data:/app/data" \
  ghcr.io/angelespejo/filmoteca-notifier:latest manual

# Daemon
docker compose up -d
```

Podman es equivalente sustituyendo `docker` por `podman`.

## Biblioteca

La API reutilizable está en `src/lib.ts` y se compila a `dist/lib.js`:

```ts
import { scrapeFilmoteca, loadConfig, emailEnabled, notifyDays } from "./dist/lib.js";

const days = await scrapeFilmoteca();
const config = loadConfig();

if (emailEnabled(config)) {
  await notifyDays(days, config);
}
```

También exporta `scrapeAndStore`, `saveScrapeResult`, `formatScrapedDays`, notificadores,
scheduler y tipos.

## Solución de problemas

### No se envían emails

- Revisa `SMTP_HOST`, `SMTP_PORT`, `EMAIL_FROM` y `EMAIL_TO`.
- En Gmail usa app password.
- Comprueba que el puerto no está bloqueado.

### Gotify no responde

- Verifica `GOTIFY_URL` y `GOTIFY_TOKEN`.
- Comprueba que el contenedor puede acceder a la URL de Gotify.

### No se guarda nada

- `DATA_DIR` debe estar definido.
- En Docker, monta `/app/data` y define `DATA_DIR=/app/data`.

### El cron no se ejecuta a la hora esperada

- Revisa `CRON_TIMEZONE`.
- El cálculo de fechas de cartelera sigue en `Europe/Madrid`.

### `.env` no se carga

- En local, ejecuta los scripts de `package.json`, que usan `--env-file-if-exists`.
- En Docker, usa `--env-file` o `env_file` en Compose.

## Desarrollo

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm bench:scrape
```

Tests con `node:test`, sin frameworks adicionales.

## Seguridad

- No subas `.env` ni `data/` al repositorio.
- Rota cualquier credencial que haya podido quedar expuesta.
- El scraper limita tamaños de respuesta y restringe paginación/programa a sus dominios.
- Consulta [SECURITY.md](SECURITY.md).

## Licencia

[MIT](LICENSE).

Dependencias: consulta [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Funding y bugs

- Funding: https://github.com/sponsors/angelespejo
- Issues: https://github.com/angelespejo/filmoteca-notifier/issues
