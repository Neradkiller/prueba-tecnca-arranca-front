# Notas Arranca Capital - Frontend

Aplicación web para la gestión de tareas (Notas) desarrollada con React, TypeScript y Vite, diseñada con un alto enfoque en la experiencia de usuario, diseño moderno y arquitectura escalable.

## Instrucciones de Instalación y Ejecución

### Requisitos Previos
- Node.js (v18 o superior recomendado)
- npm o yarn

### Pasos
1. **Clonar y acceder al repositorio**
   ```bash
   cd notas-arranca-capital-front
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   Puede existir un archivo `.env` configurado por defecto para desarrollo con la URL del backend temporal provista. Si es necesario, añadir en la raíz del proyecto un archivo `.env` (ejemplo, `VITE_API_URL=http://localhost:3000/api/v1`).

4. **Ejecutar el entorno de desarrollo**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible usualmente en `http://localhost:5173`.

5. **Construir para producción**
   ```bash
   npm run build
   ```

## Descripción de la Arquitectura

El proyecto está estructurado bajo los principios de **Feature-Sliced Design**. Esto quiere decir que organizamos el código por funcionalidades o "módulos de negocio" en vez de agruparlo estrictamente por tipo de archivo, para maximizar la modularidad y facilitar la escalabilidad.

- `src/features/` - Agrupa el código por dominio de negocio (ej. `auth` para autenticación, `tasks` para notas). Cada feature contiene sus propios `components`, `schemas` de validación y hooks de `api`.
- `src/components/` - Componentes UI reutilizables y genéricos (botones escalables, inputs, cards decorativas). Utilizamos **shadcn/ui** como base inicial, fuertemente customizado a un robusto sistema de tokens de diseño.
- `src/lib/` - Utilidades y configuraciones globales (ej. cliente `axios` configurado globalmente con interceptores de seguridad).

**Stack Tecnológico Core:**
- **React 18 + TypeScript + Vite**: Para una experiencia de desarrollo veloz y código fuertemente tipado que evite errores en runtime.
- **Tailwind CSS**: Estilizado predecible utilizando tokens de diseño (`primary`, `secondary`, `surface`).
- **TanStack Query v5 (React Query)**: Para el fetching de datos, manejo de loading/error, cacheo agresivo y scroll infinito (`useInfiniteQuery`).
- **React Hook Form + Zod**: Validación compleja de formularios sincronizada con los esquemas DTO del backend.
- **React Router DOM**: Control de rutas protegidas y enrutamiento del frontend.

## Documentación de API (Integración)

La aplicación se integra de manera agnóstica a un backend REST versionado en un prefijo global (ej. `/api/v1`). El cliente base (en `src/lib/axios.ts`) inyecta automáticamente la cabecera `X-Requested-With: XMLHttpRequest` e incluye la credencial de cookies en todas las peticiones con soporte CORS (`withCredentials: true`).

### Endpoints Principales Utilizados
- **Flujo de Autenticación (`AuthService`):**
  - `POST /auth/register` - Recibe `fullName`, `email`, y `password`. Retorna confirmación de creación.
  - `POST /auth/login` - Inicia sesión mediante el intercambio por una cookie HTTP-only blindada `Authentication`.
  - El interceptor global redirige instantánea y suavemente a `/login` ante cualquier error global de autorización `401 Unauthorized` provocado por el backend (lo cual limpia la sesión caducada del front automáticamente).

- **Gestión de Notas (`TasksService`):**
  - `GET /tasks` - Obtiene la lista iterativa de tareas (`?page=1&limit=20`) usando cursor metadata. Sirve el feature de **scroll infinito**.
  - `GET /tasks/:id` - Extrae de forma detallada una tarea para rellenar campos en el modo edición.
  - `POST /tasks` - Crea un documento rico (recibe parámetros como `title`, `description`, `priority`, y rangos de fecha `startDate` / `endDate` combinados de manera unificada a través del body. También admite `colorClass` y matriz de etiquetas `tagIds`).
  - `PATCH /tasks/:id` - Permite sobreescriturar variables exactas de un documento ya existente, incluso cambiar dinámicamente el switch de progreso (`completed: boolean`).
  - `DELETE /tasks/:id` - Emite un bloque purgado irreversible del repositorio.

- **Flujo de Etiquetas Complementarias (`TagsService`):**
  - `GET /tags` - Precarga al visitar formularios el ecosistema de categorías disponibles para asociar.
  - `POST /tags` - En caso de insertar un hashtag que no esté precargado de antemano el front instruirá un request atómico para indexar este nuevo Tag al perfil y adjuntarlo al input al instante.

## Decisiones Técnicas Tomadas

1. **Gestión de Sesión vía `HttpOnly` Cookies:**
   En lugar de almacenar tokens JWT desprotegidos expuestos en `localStorage` (altamente vulnerables al filtrado XSS inducido), toda la sesión se empaca delegando el manejo a las APIs nativas del navegador. La sesión se sella con el modelo HTTP-only a prueba de manipulación por JS.
   
2. **Scroll Infinito sin Dependencias Lonas de Terceros:**
   Las notas en el Dashboard no colapsan el DOM enviando 300 peticiones en el render inicial. Se cargan progresivamente de 20 en 20 usando `useInfiniteQuery`. Utilizamos un observador de navegador nativo sumamente rápido, `IntersectionObserver`, inyectando un `<div/>` centinela fantasma que orbita en silencio la pre-cola del bottom de la pantalla. Esto provee una experiencia de scrolling sin roturas sin forzar plugins reactivos lentos.
   
3. **Invalidación Inmediata del Caché Global:**
   Para conseguir una percepción de interfaz UI ultra-rápida (Optimistic Updates aproximado), al crear, editar o marcar un completado, se utiliza una técnica de `queryClient.invalidateQueries` para refrescar el caché de estado del servidor en segundo plano e inyectar subrepticiamente los cambios en la DOM, garantizando sincronía milimétrica backend/frontend sin forzar un "Full Page Reload".
   
4. **Barrera de Validación Zod + React Hook Form:**
   Los formularios jamás permiten malgastar solicitudes a la API de red si detectan que falta un requisito mandatorio en el local. Gracias a esquemas estrictos (ej. validación cruzada confirmando que contraseñas coincidan o fechas de término imposibles por preceder al inicio temporal) toda la lógica de validación reside de puente unificado entre React Hook Form y Zod.
   
5. **Decisiones Claves de Perfeccionamiento en Interfaces/UX:**
   - **Contraste Seguro en DOM Arbitrario JIT:** Ante incidencias en la inyección subyacente del *Tailwind Config System*, se implementó un *overwriting* mediante valores arbitrarios puros `text-[#ffffff]` garantizando un 100% legibilidad AA ante interfaces nocturnas de componente principal.
   - **Aislamiento Semántico (Cards UI):** Convertimos espacios previamente vacíos y planos tanto en Login como en Register en verdaderas cápsulas tridimensionales. Modificamos el nodo raíz en tarjetas con gran sombra volumétrica (`shadow-2xl`) y radio de borde de 32px para concentrar la óptica atencional del consumidor. Transformamos visualmente tablas informacionales al Dashboard en componentes atractivos que resaltan jerarquías al instante.
