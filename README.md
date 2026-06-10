# ELG Pro 360 — Paint & Detail

La historia clinica de tu auto + seguimiento en tiempo real del trabajo en taller.

Aplicacion web full-stack para ELG Pro, taller premium de estetica automotor en Rosario, Argentina.

## Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Base de datos**: PostgreSQL + Prisma 7
- **Autenticacion**: Auth.js (NextAuth v5) con Credentials provider y JWT
- **UI**: Tailwind CSS v4 + shadcn/ui
- **Imagenes**: Cloudinary (next-cloudinary)
- **Emails**: Resend + react-email
- **Validaciones**: Zod

## Requisitos previos

- Node.js 18+
- PostgreSQL (local o servicio como Neon/Supabase)
- Cuenta de Cloudinary (cloud_name, api_key, api_secret)
- Cuenta de Resend (api_key)

## Instalacion

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales reales

# 3. Generar Prisma Client
npx prisma generate

# 4. Crear las tablas en la base de datos
npx prisma migrate dev --name init

# 5. Poblar la base de datos con datos de prueba
npx prisma db seed

# 6. Levantar el servidor de desarrollo
npm run dev
```

## Credenciales de prueba (seed)

| Rol      | Email                | Password      |
|----------|----------------------|---------------|
| Admin    | admin@elgpro.com     | admin1234     |
| Cliente  | martin@example.com   | cliente1234   |
| Cliente  | lucia@example.com    | cliente1234   |

## Estructura del proyecto

```
src/
├── app/
│   ├── (public)/          # Rutas publicas (landing, servicios, tutoriales, contacto)
│   ├── clientes/          # Portal de clientes (protegido por rol CUSTOMER)
│   ├── admin/             # Panel de administracion (protegido por rol ADMIN/STAFF)
│   ├── api/               # Route handlers (auth, upload)
│   ├── layout.tsx         # Root layout (fuentes, providers, dark mode)
│   └── globals.css        # Design tokens y tema
├── components/
│   ├── ui/                # Componentes shadcn/ui
│   ├── shared/            # Componentes compartidos (Timeline, VehicleCard, PhotoGallery, etc.)
│   ├── public/            # Componentes de paginas publicas
│   ├── customer/          # Componentes del portal cliente
│   └── admin/             # Componentes del panel admin
├── lib/
│   ├── prisma.ts          # Singleton Prisma Client con PrismaPg adapter
│   ├── auth.ts            # Configuracion Auth.js v5
│   ├── session.ts         # Helpers de sesion (requireAdmin, requireCustomer)
│   ├── cloudinary.ts      # Config y helpers de Cloudinary
│   ├── email.ts           # Config Resend y funciones de envio
│   ├── validations.ts     # Schemas Zod para todas las entidades
│   └── utils.ts           # Utilidades (cn, etc.)
├── services/              # Logica de negocio (customer, vehicle, work-order, etc.)
├── types/                 # Tipos TypeScript y augmentaciones de modulos
├── generated/prisma/      # Prisma Client generado (no committear)
└── middleware.ts           # Proteccion de rutas por rol
emails/                    # Templates de react-email
prisma/
├── schema.prisma          # Modelo de datos
└── seed.ts                # Datos de prueba
```

## Scripts disponibles

| Script         | Descripcion                           |
|----------------|---------------------------------------|
| `npm run dev`  | Servidor de desarrollo                |
| `npm run build`| Build de produccion                   |
| `npm run lint` | Linter                                |
| `npm run db:migrate` | Correr migraciones             |
| `npm run db:seed`    | Poblar la base de datos        |
| `npm run db:studio`  | Abrir Prisma Studio            |
| `npm run db:generate`| Regenerar Prisma Client        |
| `npm run email:dev`  | Preview de emails              |

## Estado actual

Las pantallas estan como **placeholders funcionales** (titulo + comentario `TODO`).
La arquitectura, autenticacion, middleware, servicios de negocio y componentes compartidos
estan completos y listos para usar.

El diseno visual final se va a portar manualmente desde un prototipo propio.
