-- CreateEnum
CREATE TYPE "Answer" AS ENUM ('yes', 'no', 'na');

-- CreateTable
CREATE TABLE "Inspection" (
    "id" UUID NOT NULL,
    "workOrder" TEXT NOT NULL,
    "image" BYTEA,
    "imageType" TEXT,
    "inspectedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionAnswer" (
    "inspectionId" UUID NOT NULL,
    "itemId" TEXT NOT NULL,
    "answer" "Answer" NOT NULL,
    "remark" TEXT,

    CONSTRAINT "InspectionAnswer_pkey" PRIMARY KEY ("inspectionId","itemId")
);

-- CreateIndex
CREATE INDEX "Inspection_workOrder_idx" ON "Inspection"("workOrder");

-- AddForeignKey
ALTER TABLE "InspectionAnswer" ADD CONSTRAINT "InspectionAnswer_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
