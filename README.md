# Landing · Jon Aristu, entrenador de golf en Pamplona

Sitio estático: `index.html` + `styles.css` + `main.js`. Sin frameworks ni build. Súbelo tal cual a cualquier hosting (Netlify, Vercel, Cloudflare Pages, un FTP).

## Antes de publicar: datos de ejemplo que hay que sustituir

Todo lo que sigue es placeholder. Busca y reemplaza en `index.html`:

| Qué | Dónde | Valor actual |
|---|---|---|
| Nombre del entrenador | todo el HTML, JSON-LD, footer | `Jon Aristu` |
| Dominio | `<link rel="canonical">`, OG, JSON-LD, `sitemap.xml`, `robots.txt` | `https://www.jonaristugolf.es/` |
| Teléfono / WhatsApp | JSON-LD, sección Contacto | `+34600000000` |
| Email | JSON-LD, sección Contacto | `hola@jonaristugolf.es` |
| Instagram | JSON-LD, Contacto | `@jonaristugolf` |
| Dirección y coordenadas | JSON-LD (`address`, `geo`), sección Ubicación, iframe del mapa | `Ctra. de ejemplo, km 3` |
| Precios y duraciones | tabla `.scorecard` y `makesOffer` del JSON-LD | ver tabla |
| Titulaciones | lista `.creds` | placeholders plausibles |
| Testimonios | sección Libro de firmas | inventados |
| Formulario | `action` del `<form>` | `https://formspree.io/f/TU_ID` (crea el form en formspree.io o cambia a Netlify Forms). Mientras siga el `TU_ID`, el envío no falla en silencio: muestra un aviso pidiendo contacto por email o WhatsApp |
| Foto | `.about__photo` | ilustración de relleno; sustituir por `<img src="assets/jon.webp" width="900" height="1100" alt="…" loading="lazy">` |
| Imagen social | `og.jpg` (1200×630) | **hecha**, generada con la tipografía y la paleta del sitio. Regenerable, ver abajo |
| Icono iOS | `apple-touch-icon.png` (180×180) | **hecho** |
| Legales | `privacidad.html`, `aviso-legal.html` | **hechos**, con los huecos marcados en cursiva: `[NIF pendiente]`, `[dirección pendiente]`, proveedores de hosting y de formulario, plazo de validez de los bonos |
| Reseñas del JSON-LD | nodo `#clase-individual` → `review` | son los tres testimonios inventados de la sección «Libro de firmas». **Sustitúyelos por reseñas reales o bórralos**: marcar reseñas falsas es motivo de acción manual de Google |

> Las páginas legales son una base sólida, no un dictamen jurídico. Antes de publicar, que las revise quien lleve la asesoría.

## SEO ya resuelto en el código

- `title` y `meta description` con la intención de búsqueda («clases de golf en Pamplona»), `canonical`, Open Graph y Twitter Card con imagen real y `alt`.
- JSON-LD con `WebSite`, `LocalBusiness` + `SportsActivityLocation` (dirección, geo, horarios), `OfferCatalog` con un `Service` por tipo de clase, `Person` y `FAQPage`. Los textos de las FAQ coinciden **literalmente** con los del HTML: si editas uno, edita el otro o Google descarta el rich result.
- HTML semántico: un solo `h1`, `h2` por sección, `address`, `table` con `caption`, `details/summary` para las FAQ.
- `scroll-margin-top` en las secciones, para que la barra fija no tape el titular al saltar por un ancla.
- `sitemap.xml` (con las tres páginas) y `robots.txt`.

## Rendimiento

- **Tipografías autohospedadas** en `fonts/` (woff2, subconjuntos latin y latin-ext, variables salvo IBM Plex Mono). Cero peticiones a `fonts.googleapis.com`: se ahorra la cadena `preconnect` → CSS → woff2 que bloqueaba el render. Los dos cortes de la primera pantalla van con `<link rel="preload">`.
- Sin librerías ni build.
- El iframe de Google Maps no se inserta hasta que el usuario pulsa «Cargar el mapa»: ni petición ni cookie de terceros por defecto.
- El `ResizeObserver` que recalcula el trazado de la bola solo reconstruye si el ancho o el alto del documento han cambiado de verdad; antes saltaba en cada aparición de sección.
- Animación en `transform`, y todo respeta `prefers-reduced-motion`.

## Accesibilidad

- Foco visible global con `:focus-visible` (contorno rojo bandera, verde claro sobre los fondos oscuros).
- Menú móvil: cierra con `Escape` devolviendo el foco al botón, cierra al pulsar fuera, no deja escapar el tabulador mientras está abierto y se cierra solo al volver a escritorio.
- Los contadores animados del hero son `aria-hidden`; el valor final va en un `.sr-only` para que el lector de pantalla lea «Más de 300» y no una ristra de números cambiantes.
- El enlace de la sección activa se marca con `aria-current` mientras haces scroll.
- El CTA fijo de móvil añade `padding-bottom` al `body` para no taparte el pie.
- Formulario: mensajes de error en español asociados con `aria-describedby`, `aria-invalid`, foco al primer campo con problema y estado de envío en un `role="status"`.

## Privacidad y cumplimiento

- Casilla de consentimiento expreso (RGPD art. 6.1.a) obligatoria para enviar el formulario, con enlace a la política.
- Cláusula informativa resumida bajo el botón de envío.
- Sin cookies propias ni analítica. La única carga de terceros —el mapa— está tras un clic informado.
- Si algún día añades analítica, necesitarás banner de consentimiento y actualizar `privacidad.html`.

### Regenerar `og.jpg`

Se generó con Chrome en modo headless a partir de un HTML con la paleta y las tipografías del sitio. Para rehacerla, monta un HTML de 1200×630 y:

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --hide-scrollbars --window-size=1200,630 --screenshot=og.png file://$PWD/og-source.html
sips -s format jpeg -s formatOptions 82 og.png --out og.jpg
```

Pendiente fuera del código: dar de alta la ficha de **Google Business Profile** (es lo que más pesa para búsquedas locales), enlazarla desde la web y conseguir reseñas ahí.

## Cómo funciona la bola

`main.js` calcula un trazado SVG que sale del tee de la libreta del hero, baja por los márgenes alternando lado en cada sección (cruza siempre por los huecos entre secciones) y termina en el hoyo del green final. La bola viaja al 62 % de la altura de la ventana según el scroll; al llegar al final cae en el hoyo, ondea la bandera y aparece «¡Hoyo en uno!».

Para cambiar el lado por el que pasa en una sección: atributo `data-waypoint="left|right"` en el `.hole__grid` de esa sección.

## Green final

El hoyo es una elipse con borde y labio delantero; al llegar, la bola del scroll se hunde en el hoyo y desaparece.

`.finish__green` lleva la clase `is-turf`: césped hecho solo con CSS (ruido SVG estirado en vertical como briznas, rayas de siega y dos capas de briznas en primer plano que se mecen). Quita la clase para volver al verde plano con rayas. Si algún día hay foto real de césped, sustituye la capa `url("data:image/svg+xml…")` por la imagen.
