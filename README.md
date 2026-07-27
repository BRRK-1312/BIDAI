# BIDAI · Norte de Portugal 2026

Mapa y planificador interactivo preparado para GitHub Pages.

## Publicación

Cada cambio subido a `main` ejecuta automáticamente el workflow `.github/workflows/pages.yml`. La web se genera como contenido estático y se publica en:

`https://brrk-1312.github.io/BIDAI/`

En GitHub hay que abrir **Settings → Pages** y seleccionar **GitHub Actions** como fuente de publicación.

## Dominio propio

Cuando se configure un dominio propio, cambia en `pages.yml`:

```yaml
NEXT_PUBLIC_BASE_PATH: /BIDAI
```

por:

```yaml
NEXT_PUBLIC_BASE_PATH: ""
```

Después añade el dominio en **Settings → Pages → Custom domain** y vuelve a ejecutar el workflow.

## Desarrollo local

```bash
npm install
npm run dev
```

## Compilación estática

```bash
NEXT_PUBLIC_BASE_PATH=/BIDAI npm run build
```

El resultado se genera en `out/`.
