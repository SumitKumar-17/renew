-- CreateTable
CREATE TABLE "Digester" (
    "id" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "installedDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Digester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'operator',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "digesterId" TEXT,

    CONSTRAINT "Operator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Household" (
    "id" TEXT NOT NULL,
    "headName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "members" INTEGER NOT NULL,
    "fuelReplaced" TEXT[],
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "digesterId" TEXT NOT NULL,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedstockLog" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "waterLitres" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operatorId" TEXT NOT NULL,
    "digesterId" TEXT NOT NULL,

    CONSTRAINT "FeedstockLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowMeterReading" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reading" DOUBLE PRECISION NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operatorId" TEXT NOT NULL,
    "digesterId" TEXT NOT NULL,

    CONSTRAINT "FlowMeterReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GasDistribution" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operatorId" TEXT NOT NULL,
    "digesterId" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,

    CONSTRAINT "GasDistribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompostLog" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "bags" INTEGER NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operatorId" TEXT NOT NULL,
    "digesterId" TEXT NOT NULL,

    CONSTRAINT "CompostLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Operator_digesterId_key" ON "Operator"("digesterId");

-- AddForeignKey
ALTER TABLE "Operator" ADD CONSTRAINT "Operator_digesterId_fkey" FOREIGN KEY ("digesterId") REFERENCES "Digester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Household" ADD CONSTRAINT "Household_digesterId_fkey" FOREIGN KEY ("digesterId") REFERENCES "Digester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedstockLog" ADD CONSTRAINT "FeedstockLog_digesterId_fkey" FOREIGN KEY ("digesterId") REFERENCES "Digester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowMeterReading" ADD CONSTRAINT "FlowMeterReading_digesterId_fkey" FOREIGN KEY ("digesterId") REFERENCES "Digester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GasDistribution" ADD CONSTRAINT "GasDistribution_digesterId_fkey" FOREIGN KEY ("digesterId") REFERENCES "Digester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GasDistribution" ADD CONSTRAINT "GasDistribution_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompostLog" ADD CONSTRAINT "CompostLog_digesterId_fkey" FOREIGN KEY ("digesterId") REFERENCES "Digester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
