/*
  Warnings:

  - You are about to drop the `Operator` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Operator" DROP CONSTRAINT "Operator_digesterId_fkey";

-- DropTable
DROP TABLE "Operator";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'operator',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "digesterId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_digesterId_key" ON "User"("digesterId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_digesterId_fkey" FOREIGN KEY ("digesterId") REFERENCES "Digester"("id") ON DELETE SET NULL ON UPDATE CASCADE;
