-- Refs de storage para las imágenes del portfolio (patrón WorkOrderPhoto.publicId).
-- Aditivo y nullable: las 3 filas existentes quedan con refs NULL a propósito
-- (sus assets son huérfanos históricos; se limpian con el script de la Fase 5).
-- SQL validado contra `prisma migrate diff --from-schema <HEAD> --to-schema <nuevo> --script`.

-- AlterTable
ALTER TABLE "PortfolioWork" ADD COLUMN     "afterImageRef" TEXT,
ADD COLUMN     "beforeImageRef" TEXT;
