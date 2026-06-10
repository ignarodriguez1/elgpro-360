-- Una patente por cliente (Vehicle.@@unique([customerId, licensePlate])).
-- Si fallara por datos preexistentes duplicados, limpiar antes de aplicar.
CREATE UNIQUE INDEX "Vehicle_customerId_licensePlate_key" ON "Vehicle"("customerId", "licensePlate");

-- Garantiza UN solo estado actual por orden (índice único PARCIAL).
-- Prisma no expresa índices parciales en schema.prisma, por eso va en SQL manual.
-- NOTA: aplicar con `prisma migrate deploy`. Con `migrate dev` Prisma puede avisar
-- que este índice no está en el schema; es esperado, NO lo borres.
CREATE UNIQUE INDEX "WorkOrderStatusUpdate_one_current_per_order"
  ON "WorkOrderStatusUpdate"("workOrderId")
  WHERE "isCurrent" = true;
