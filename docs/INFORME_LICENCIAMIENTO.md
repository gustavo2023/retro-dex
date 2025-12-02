# Informe de Licenciamiento
**RetroDex**

Este documento detalla la licencia principal del proyecto, su compatibilidad con las librerías empleadas y los créditos necesarios para recursos de terceros.

---

## 1. Licencia del Proyecto

**Licencia seleccionada:** [MIT License](./LICENSE.md)

### Justificación
La licencia MIT mantiene a RetroDex en el ecosistema de software libre con un enfoque permisivo:

* **Libertad de uso:** Permite utilizar, modificar y redistribuir el código sin imponer obligaciones de copyleft, facilitando que la comunidad adapte RetroDex a otros catálogos o instancias privadas.
* **Compatibilidad:** La mayoría de dependencias del stack (Next.js, React, Supabase, Tailwind) también son MIT o licencias permisivas como ISC / Apache-2.0, lo que evita conflictos legales.
* **Colaboración ágil:** Al no exigir divulgación de derivados, empresas o instituciones pueden incorporar RetroDex en sus flujos internos sin fricciones, aumentando las probabilidades de recibir aportes voluntarios.

---

## 2. Matriz de Compatibilidad

La siguiente tabla resume las dependencias directas del proyecto, su licencia y si son compatibles con MIT.

| Dependencia | Versión | Licencia | ¿Compatible con MIT? |
| --- | --- | --- | --- |
| `next` | 16.0.3 | MIT | ✅ |
| `react` | 19.2.0 | MIT | ✅ |
| `react-dom` | 19.2.0 | MIT | ✅ |
| `@supabase/supabase-js` | ^2.81.1 | MIT | ✅ |
| `@supabase/ssr` | ^0.7.0 | MIT | ✅ |
| `@tanstack/react-query` | ^5.90.10 | MIT | ✅ |
| `tailwindcss` | ^4.0.0 | MIT | ✅ |
| `tailwind-merge` | ^3.4.0 | MIT | ✅ |
| `class-variance-authority` | ^0.7.1 | Apache-2.0 | ✅ |
| `clsx` | ^2.1.1 | MIT | ✅ |
| `date-fns` | ^4.1.0 | MIT | ✅ |
| `lucide-react` | ^0.554.0 | ISC | ✅ |
| `jspdf` | ^3.0.3 | MIT | ✅ |
| `papaparse` | ^5.5.3 | MIT | ✅ |
| `recharts` | ^2.15.4 | MIT | ✅ |
| `next-themes` | ^0.4.6 | MIT | ✅ |
| `sonner` | ^2.0.7 | MIT | ✅ |
| `@radix-ui/react-dialog` | ^1.1.15 | MIT | ✅ |
| `@radix-ui/react-dropdown-menu` | ^2.1.16 | MIT | ✅ |
| `@radix-ui/react-tooltip` | ^1.2.8 | MIT | ✅ |
| `@radix-ui/react-avatar` | ^1.1.11 | MIT | ✅ |
| `@radix-ui/react-alert-dialog` | ^1.1.15 | MIT | ✅ |
| `@radix-ui/react-select` | ^2.2.6 | MIT | ✅ |
| `@radix-ui/react-separator` | ^1.1.8 | MIT | ✅ |
| `@radix-ui/react-slot` | ^1.2.4 | MIT | ✅ |
| `@radix-ui/react-checkbox` | ^1.3.3 | MIT | ✅ |

**Conclusión:** Todas las dependencias emplean licencias permisivas (MIT, ISC o Apache-2.0). No existe incompatibilidad con la licencia principal del proyecto y no se introducen cláusulas virales.

---

## 3. Atribución y Créditos

* **Datos públicos de películas:** RetroDex consume la API de [TMDB](https://www.themoviedb.org/documentation/api). El uso requiere aceptar sus términos y mostrar atribución a TMDB en la interfaz (cumplido en la sección Discover).
* **Iconografía:** [Lucide](https://lucide.dev/) provee los iconos SVG utilizados en la UI bajo licencia ISC.
* **Componentes UI:** Las primitivas de [Radix UI](https://www.radix-ui.com/) y la colección [shadcn/ui](https://ui.shadcn.com/) otorgan componentes accesibles bajo MIT.
* **Tipografías:** Se emplean fuentes del sistema y/o fuentes libres compatibles para evitar restricciones adicionales.

---

RetroDex mantiene así un stack legalmente coherente, con documentación clara para operadores que necesiten validar cumplimiento antes de desplegar la plataforma.
