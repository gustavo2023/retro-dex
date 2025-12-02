# Manual de Administrador / Técnico
**RetroDex**

Este manual resume los pasos necesarios para desplegar, configurar y operar RetroDex sin requerir conocimientos avanzados de programación. Está orientado a personal técnico que administra entornos locales o servidores destinados a la aplicación.

## 1. Requisitos del Sistema

Asegúrese de contar con lo siguiente antes de iniciar:

* **Sistema Operativo:** Windows, macOS o Linux (x64/ARM64).
* **Node.js:** Versión 18 o superior (recomendado 20 LTS).
	* *Verificación:* ejecute `node -v` en la terminal; si es menor a 18, descargue la versión actual desde [nodejs.org](https://nodejs.org/).
* **npm:** Se instala junto con Node.js. Verifique con `npm -v`.
* **Acceso a Internet:** Necesario para descargar dependencias, conectarse a Supabase y al Edge Function que consulta TMDB.
* **Cuenta en Supabase:** Ya sea una existente o una nueva donde residirán la base de datos, el almacenamiento y las funciones Edge.
* **Token de TMDB:** RetroDex requiere un `TMDB Access Token` (v4) para la función `search-tmdb`.

## 2. Cómo Desplegar la App desde Cero

Siga estos pasos para montar RetroDex en un equipo limpio.

### Paso 1: Obtener el código

Clone el repositorio oficial o descargue el ZIP:

```bash
git clone https://github.com/gustavo2023/retro-dex.git
cd retro-dex
```

### Paso 2: Instalar dependencias

```bash
npm install
```

Espere a que finalice la instalación de Next.js, Tailwind, Supabase y librerías auxiliares (jsPDF, PapaParse, etc.).

### Paso 3: Configurar variables de entorno

1. Cree el archivo `.env.local` en la raíz del proyecto.
2. Pegue el siguiente contenido y complete los valores según su proyecto Supabase/TMDB:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Paso 4: Preparar recursos en Supabase

1. **Base de datos:** Ejecute las migraciones o cree las tablas `profiles`, `movies` y el enum `movie_status`. Revise `INFORME_ARQUITECTURA.md` para la estructura completa.
2. **Storage buckets:** Cree `profile-pictures` y `movie-posters`. Asegure políticas que permitan escritura únicamente a carpetas con el `auth.uid()` del usuario.
3. **Edge Function `search-tmdb`:** Desde el CLI de Supabase o el dashboard, despliegue la función que reside en `supabase/functions/search-tmdb`. Configure las variables `TMDB_ACCESS_TOKEN`, `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` en la función.

### Paso 5: Ejecutar la aplicación

* **Modo desarrollo:**

```bash
npm run dev
```

Acceda a `http://localhost:3000`.

Puede definir un puerto alternativo exportando `PORT=4000` (Linux/macOS) o `set PORT=4000` en Windows antes de `npm start`.

## 3. Variables de Entorno Necesarias

| Variable | Descripción | Dónde obtenerla |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL base de su proyecto Supabase. | Supabase › *Project Settings* › *Data API* › *Project URL*. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave pública usada por el cliente web. | Supabase › *Data API Keys* › `anon` key. |
| `TMDB_ACCESS_TOKEN` | Token v4 para la API de TMDB. | [TMDB Account Settings](https://www.themoviedb.org/settings/api). |
| `NEXT_PUBLIC_APP_URL` | URL base desde la que se sirve RetroDex (útil para enlaces en correos). | Defínala según su entorno (`http://localhost:3000`, dominio del hosting, etc.). |

## 4. Cómo hacer un Backup de la Base de Datos

RetroDex delega el almacenamiento totalmente a Supabase; por lo tanto, use las herramientas del panel para seguridad y respaldo.

### 4.1 Backups automáticos

* En planes **Pro** o superiores Supabase genera snapshots diarios. Revise *Project Settings › Database Backups* para confirmar retención.
* En el plan **Free**, considere programar exportaciones manuales si necesita historial (ver siguiente punto).

### 4.2 Backups manuales

1. Ingrese a su proyecto Supabase.
2. Abra *Table Editor › movies* o use la pestaña *SQL* para exportar en formato CSV/SQL.
3. Opcionalmente, ejecute `supabase db dump --project-ref <ref>` desde el CLI para obtener un volcado completo.
4. Guarde los archivos en un almacenamiento seguro (repositorio privado, S3, etc.).

### 4.3 Buckets de almacenamiento

* Descargue periódicamente las carpetas `profile-pictures` y `movie-posters` mediante el panel de Storage o scripts con la API.
* Si emplea CDN, valide que la caché se invalide tras restaurar archivos.

## 5. Mantenimiento y Operación

* **Actualizaciones:** Ejecute `npm outdated` y actualice dependencias críticas (Next.js, Supabase) tras validar en ambiente de pruebas.
* **Monitoreo:** Revise los logs de la Edge Function `search-tmdb` y el panel de errores de Supabase para detectar fallos de autenticación.
* **Usuarios bloqueados:** Desde Supabase Auth puede resetear contraseñas o deshabilitar cuentas. RetroDex reflejará los cambios inmediatamente.
* **Limpieza de datos:** Use las herramientas de Supabase o scripts SQL para eliminar películas duplicadas o usuarios de prueba antes de pasar a producción.

Con estos pasos podrá instalar y administrar RetroDex de manera segura, manteniendo la separación entre datos públicos (TMDB) y privados (Supabase) que caracteriza al proyecto.
