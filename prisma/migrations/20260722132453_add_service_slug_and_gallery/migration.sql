-- Servicios: slug para /servicios/[slug] + galería multi-imagen (ServiceImage).
-- `slug` entra NULLABLE a propósito: los 10 servicios existentes se backfillean
-- con el script de la Fase 2 (el UNIQUE de Postgres tolera múltiples NULL, así
-- esta migración no puede fallar sobre datos existentes). El endurecimiento a
-- NOT NULL queda para una migración posterior del prompt de limpieza.
-- SQL generado con `prisma migrate diff --from-schema <HEAD> --to-schema <nuevo> --script`.

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "slug" TEXT;

-- CreateTable
CREATE TABLE "ServiceImage" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ref" TEXT,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceImage_serviceId_sortOrder_idx" ON "ServiceImage"("serviceId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- AddForeignKey
ALTER TABLE "ServiceImage" ADD CONSTRAINT "ServiceImage_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
