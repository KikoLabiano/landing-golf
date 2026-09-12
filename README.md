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
| Formulario | `action` del `<form>` | `https://formspree.io/f/TU_ID` (crea el form en formspree.io o cambia a Netlify Forms) |
| Foto | `.about__photo` | ilustración de relleno; sustituir por `<img src="assets/jon.webp" width="900" height="1100" alt="…" loading="lazy">` |
| Imagen social | `og.jpg` (1200×630) en la raíz | no existe todavía |
| Icono iOS | `apple-touch-icon.png` (180×180) | no existe todavía |
| Legales | `privacidad.html`, `aviso-legal.html` | no existen todavía |

## SEO ya resuelto en el código

- `title` y `meta description` con la intención de búsqueda («clases de golf en Pamplona»), `canonical`, Open Graph y Twitter Card.
- JSON-LD con `LocalBusiness` + `SportsActivityLocation` (dirección, geo, horarios, ofertas), `Person` y `FAQPage`.
- HTML semántico: un solo `h1`, `h2` por sección, `address`, `table` con `caption`, `details/summary` para las FAQ.
- `sitemap.xml` y `robots.txt`.
- Rendimiento: sin librerías, fuentes con `display=swap` y `preconnect`, mapa con `loading="lazy"`, animación en `transform` (no fuerza reflow), respeta `prefers-reduced-motion`.

Pendiente fuera del código: dar de alta la ficha de **Google Business Profile** (es lo que más pesa para búsquedas locales), enlazarla desde la web y conseguir reseñas ahí.

## Cómo funciona la bola

`main.js` calcula un trazado SVG que sale del tee de la libreta del hero, baja por los márgenes alternando lado en cada sección (cruza siempre por los huecos entre secciones) y termina en el hoyo del green final. La bola viaja al 62 % de la altura de la ventana según el scroll; al llegar al final cae en el hoyo, ondea la bandera y aparece «¡Hoyo en uno!».

Para cambiar el lado por el que pasa en una sección: atributo `data-waypoint="left|right"` en el `.hole__grid` de esa sección.

## Green final

El hoyo es una elipse con borde y labio delantero; al llegar, la bola del scroll se hunde en el hoyo y desaparece.

`.finish__green` lleva la clase `is-turf`: césped hecho solo con CSS (ruido SVG estirado en vertical como briznas, rayas de siega y dos capas de briznas en primer plano que se mecen). Quita la clase para volver al verde plano con rayas. Si algún día hay foto real de césped, sustituye la capa `url("data:image/svg+xml…")` por la imagen.
