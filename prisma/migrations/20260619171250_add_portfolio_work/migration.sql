-- CreateTable
CREATE TABLE "PortfolioWork" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "afterImageUrl" TEXT,
    "beforeImageUrl" TEXT,
    "tint" TEXT,
    "tall" BOOLEAN NOT NULL DEFAULT false,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioWork_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PortfolioWork_visible_sortOrder_idx" ON "PortfolioWork"("visible", "sortOrder");
