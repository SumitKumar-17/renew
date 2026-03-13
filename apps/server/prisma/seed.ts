import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    // ── Digesters ────────────────────────────────────────────────────────────
    const digesters = await Promise.all([
        prisma.digester.upsert({
            where: { id: "DG-001" },
            update: {},
            create: {
                id: "DG-001",
                location: "Sector 4, Rampur Village",
                installedDate: new Date("2024-10-15"),
                status: "active",
            },
        }),
        prisma.digester.upsert({
            where: { id: "DG-002" },
            update: {},
            create: {
                id: "DG-002",
                location: "Block B, Kisan Colony",
                installedDate: new Date("2024-10-15"),
                status: "active",
            },
        }),
        prisma.digester.upsert({
            where: { id: "DG-003" },
            update: {},
            create: {
                id: "DG-003",
                location: "Ward 7, Mahila Nagar",
                installedDate: new Date("2024-10-20"),
                status: "active",
            },
        }),
    ]);
    console.log(`✅ ${digesters.length} digesters`);

    // ── Admin User ───────────────────────────────────────────────────────────
    const adminHash = await bcrypt.hash("admin123", 12);
    await prisma.user.upsert({
        where: { id: "ADMIN" },
        update: {},
        create: {
            id: "ADMIN",
            name: "Program Admin",
            phone: "0000000000",
            passwordHash: adminHash,
            role: "admin",
            status: "active",
            digesterId: null,
        },
    });
    console.log("✅ Admin user");

    // ── Operator Users ────────────────────────────────────────────────────────
    const operators = [
        { id: "OP001", name: "Rajan Kumar",  phone: "9876543210", password: "pass123", digesterId: "DG-001" },
        { id: "OP002", name: "Priya Sharma", phone: "9876500211", password: "pass456", digesterId: "DG-002" },
        { id: "OP003", name: "Dilip Yadav",  phone: "9876577712", password: "pass789", digesterId: "DG-003" },
    ];
    for (const op of operators) {
        const hash = await bcrypt.hash(op.password, 12);
        await prisma.user.upsert({
            where: { id: op.id },
            update: {},
            create: { id: op.id, name: op.name, phone: op.phone, passwordHash: hash, role: "operator", status: "active", digesterId: op.digesterId },
        });
    }
    console.log(`✅ ${operators.length} operators`);

    // ── Households ────────────────────────────────────────────────────────────
    const households = [
        { id: "HH-001", digesterId: "DG-001", headName: "Suresh Patel",  phone: "9900112233", address: "House 12, Lane 3", members: 4, fuelReplaced: ["LPG (Cooking Gas)"] },
        { id: "HH-002", digesterId: "DG-001", headName: "Meena Devi",    phone: "9900112234", address: "House 5, Lane 1",  members: 3, fuelReplaced: ["Firewood"] },
        { id: "HH-003", digesterId: "DG-001", headName: "Amol Wagh",     phone: "9900112235", address: "House 18, Lane 5", members: 5, fuelReplaced: ["LPG (Cooking Gas)", "Firewood"] },
        { id: "HH-004", digesterId: "DG-002", headName: "Lakshmi Bai",   phone: "9900112236", address: "Plot 3, Sector B", members: 4, fuelReplaced: ["Firewood"] },
        { id: "HH-005", digesterId: "DG-002", headName: "Ramesh Singh",  phone: "9900112237", address: "Plot 9, Sector A", members: 6, fuelReplaced: ["Kerosene"] },
        { id: "HH-006", digesterId: "DG-003", headName: "Anita Kumari",  phone: "9900112238", address: "Lane 2, Block C",  members: 3, fuelReplaced: ["Firewood"] },
        { id: "HH-007", digesterId: "DG-001", headName: "Vijay Tiwari",  phone: "9900112239", address: "House 3, Lane 2",  members: 5, fuelReplaced: ["LPG (Cooking Gas)"] },
        { id: "HH-008", digesterId: "DG-002", headName: "Sunita Verma",  phone: "9900112240", address: "Plot 6, Sector C", members: 2, fuelReplaced: ["Firewood", "Kerosene"] },
        { id: "HH-009", digesterId: "DG-003", headName: "Deepak Gupta",  phone: "9900112241", address: "Lane 7, Block A",  members: 4, fuelReplaced: ["LPG (Cooking Gas)"] },
    ];
    for (const hh of households) {
        await prisma.household.upsert({ where: { id: hh.id }, update: {}, create: hh });
    }
    console.log(`✅ ${households.length} households`);

    // ── Feedstock Logs ────────────────────────────────────────────────────────
    // Delete and re-create so we get fresh deterministic data
    await prisma.feedstockLog.deleteMany({ where: { operatorId: { in: ["OP001", "OP002", "OP003"] } } });

    const feedstockData = [
        // DG-001 / OP001
        { date: "2025-03-01", weight: 120, waterLitres: 60,  type: "Cow Dung",        notes: "Morning batch",        digesterId: "DG-001", operatorId: "OP001" },
        { date: "2025-03-02", weight: 135, waterLitres: 70,  type: "Cow Dung",        notes: null,                   digesterId: "DG-001", operatorId: "OP001" },
        { date: "2025-03-04", weight: 110, waterLitres: 55,  type: "Mixed Organic",   notes: "Veg waste added",      digesterId: "DG-001", operatorId: "OP001" },
        { date: "2025-03-06", weight: 150, waterLitres: 75,  type: "Cow Dung",        notes: null,                   digesterId: "DG-001", operatorId: "OP001" },
        { date: "2025-03-08", weight: 125, waterLitres: 65,  type: "Kitchen Waste",   notes: "Hotel waste included", digesterId: "DG-001", operatorId: "OP001" },
        { date: "2025-03-10", weight: 140, waterLitres: 70,  type: "Cow Dung",        notes: null,                   digesterId: "DG-001", operatorId: "OP001" },
        { date: "2025-03-12", weight: 130, waterLitres: 65,  type: "Mixed Organic",   notes: "Crop residue",         digesterId: "DG-001", operatorId: "OP001" },
        { date: "2025-03-14", weight: 115, waterLitres: 58,  type: "Cow Dung",        notes: null,                   digesterId: "DG-001", operatorId: "OP001" },
        // DG-002 / OP002
        { date: "2025-03-01", weight: 200, waterLitres: 100, type: "Cow Dung",        notes: null,                   digesterId: "DG-002", operatorId: "OP002" },
        { date: "2025-03-03", weight: 180, waterLitres: 90,  type: "Mixed Organic",   notes: "Market waste",         digesterId: "DG-002", operatorId: "OP002" },
        { date: "2025-03-05", weight: 220, waterLitres: 110, type: "Cow Dung",        notes: null,                   digesterId: "DG-002", operatorId: "OP002" },
        { date: "2025-03-07", weight: 195, waterLitres: 98,  type: "Kitchen Waste",   notes: "School canteen",       digesterId: "DG-002", operatorId: "OP002" },
        { date: "2025-03-09", weight: 210, waterLitres: 105, type: "Cow Dung",        notes: null,                   digesterId: "DG-002", operatorId: "OP002" },
        { date: "2025-03-11", weight: 175, waterLitres: 88,  type: "Mixed Organic",   notes: null,                   digesterId: "DG-002", operatorId: "OP002" },
        // DG-003 / OP003
        { date: "2025-03-02", weight: 90,  waterLitres: 45,  type: "Cow Dung",        notes: "Small batch",          digesterId: "DG-003", operatorId: "OP003" },
        { date: "2025-03-05", weight: 100, waterLitres: 50,  type: "Kitchen Waste",   notes: null,                   digesterId: "DG-003", operatorId: "OP003" },
        { date: "2025-03-08", weight: 85,  waterLitres: 42,  type: "Cow Dung",        notes: null,                   digesterId: "DG-003", operatorId: "OP003" },
        { date: "2025-03-11", weight: 95,  waterLitres: 48,  type: "Mixed Organic",   notes: "Green waste added",    digesterId: "DG-003", operatorId: "OP003" },
        { date: "2025-03-13", weight: 105, waterLitres: 53,  type: "Cow Dung",        notes: null,                   digesterId: "DG-003", operatorId: "OP003" },
    ];

    await prisma.feedstockLog.createMany({
        data: feedstockData.map(r => ({
            date: new Date(r.date + "T06:00:00Z"),
            weight: r.weight,
            waterLitres: r.waterLitres,
            type: r.type,
            photoUrl: "",
            notes: r.notes,
            digesterId: r.digesterId,
            operatorId: r.operatorId,
        })),
    });
    console.log(`✅ ${feedstockData.length} feedstock logs`);

    // ── Flow Meter Readings ───────────────────────────────────────────────────
    await prisma.flowMeterReading.deleteMany({ where: { operatorId: { in: ["OP001", "OP002", "OP003"] } } });

    const meterData = [
        // DG-001 cumulative readings
        { date: "2025-02-01", reading:  45.0, digesterId: "DG-001", operatorId: "OP001", notes: "Baseline" },
        { date: "2025-02-08", reading:  78.5, digesterId: "DG-001", operatorId: "OP001", notes: null },
        { date: "2025-02-15", reading: 115.2, digesterId: "DG-001", operatorId: "OP001", notes: null },
        { date: "2025-02-22", reading: 154.0, digesterId: "DG-001", operatorId: "OP001", notes: null },
        { date: "2025-03-01", reading: 192.5, digesterId: "DG-001", operatorId: "OP001", notes: null },
        { date: "2025-03-08", reading: 231.0, digesterId: "DG-001", operatorId: "OP001", notes: null },
        { date: "2025-03-14", reading: 268.4, digesterId: "DG-001", operatorId: "OP001", notes: "Latest" },
        // DG-002 cumulative readings
        { date: "2025-02-01", reading:  80.0, digesterId: "DG-002", operatorId: "OP002", notes: "Baseline" },
        { date: "2025-02-08", reading: 132.0, digesterId: "DG-002", operatorId: "OP002", notes: null },
        { date: "2025-02-15", reading: 186.5, digesterId: "DG-002", operatorId: "OP002", notes: null },
        { date: "2025-02-22", reading: 244.0, digesterId: "DG-002", operatorId: "OP002", notes: null },
        { date: "2025-03-01", reading: 302.0, digesterId: "DG-002", operatorId: "OP002", notes: null },
        { date: "2025-03-08", reading: 362.5, digesterId: "DG-002", operatorId: "OP002", notes: null },
        { date: "2025-03-14", reading: 420.0, digesterId: "DG-002", operatorId: "OP002", notes: "Latest" },
        // DG-003 cumulative readings
        { date: "2025-02-10", reading:  22.0, digesterId: "DG-003", operatorId: "OP003", notes: "Baseline" },
        { date: "2025-02-20", reading:  45.5, digesterId: "DG-003", operatorId: "OP003", notes: null },
        { date: "2025-03-01", reading:  70.0, digesterId: "DG-003", operatorId: "OP003", notes: null },
        { date: "2025-03-10", reading:  96.5, digesterId: "DG-003", operatorId: "OP003", notes: null },
        { date: "2025-03-14", reading: 118.0, digesterId: "DG-003", operatorId: "OP003", notes: "Latest" },
    ];

    await prisma.flowMeterReading.createMany({
        data: meterData.map(r => ({
            date: new Date(r.date + "T07:00:00Z"),
            reading: r.reading,
            photoUrl: "",
            notes: r.notes,
            digesterId: r.digesterId,
            operatorId: r.operatorId,
        })),
    });
    console.log(`✅ ${meterData.length} meter readings`);

    // ── Gas Distributions ─────────────────────────────────────────────────────
    await prisma.gasDistribution.deleteMany({ where: { operatorId: { in: ["OP001", "OP002", "OP003"] } } });

    const distributionData = [
        // DG-001 distributions
        { date: "2025-03-01", householdId: "HH-001", volume: 1.5, digesterId: "DG-001", operatorId: "OP001" },
        { date: "2025-03-01", householdId: "HH-002", volume: 1.5, digesterId: "DG-001", operatorId: "OP001" },
        { date: "2025-03-01", householdId: "HH-003", volume: 1.5, digesterId: "DG-001", operatorId: "OP001" },
        { date: "2025-03-01", householdId: "HH-007", volume: 1.5, digesterId: "DG-001", operatorId: "OP001" },
        { date: "2025-03-08", householdId: "HH-001", volume: 1.5, digesterId: "DG-001", operatorId: "OP001" },
        { date: "2025-03-08", householdId: "HH-002", volume: 1.2, digesterId: "DG-001", operatorId: "OP001" },
        { date: "2025-03-08", householdId: "HH-003", volume: 1.5, digesterId: "DG-001", operatorId: "OP001" },
        { date: "2025-03-08", householdId: "HH-007", volume: 1.5, digesterId: "DG-001", operatorId: "OP001" },
        { date: "2025-03-14", householdId: "HH-001", volume: 1.5, digesterId: "DG-001", operatorId: "OP001" },
        { date: "2025-03-14", householdId: "HH-002", volume: 1.5, digesterId: "DG-001", operatorId: "OP001" },
        { date: "2025-03-14", householdId: "HH-003", volume: 2.0, digesterId: "DG-001", operatorId: "OP001" },
        // DG-002 distributions
        { date: "2025-03-01", householdId: "HH-004", volume: 1.5, digesterId: "DG-002", operatorId: "OP002" },
        { date: "2025-03-01", householdId: "HH-005", volume: 1.5, digesterId: "DG-002", operatorId: "OP002" },
        { date: "2025-03-01", householdId: "HH-008", volume: 1.5, digesterId: "DG-002", operatorId: "OP002" },
        { date: "2025-03-08", householdId: "HH-004", volume: 1.5, digesterId: "DG-002", operatorId: "OP002" },
        { date: "2025-03-08", householdId: "HH-005", volume: 1.5, digesterId: "DG-002", operatorId: "OP002" },
        { date: "2025-03-08", householdId: "HH-008", volume: 1.0, digesterId: "DG-002", operatorId: "OP002" },
        { date: "2025-03-14", householdId: "HH-004", volume: 1.5, digesterId: "DG-002", operatorId: "OP002" },
        { date: "2025-03-14", householdId: "HH-005", volume: 2.0, digesterId: "DG-002", operatorId: "OP002" },
        // DG-003 distributions
        { date: "2025-03-05", householdId: "HH-006", volume: 1.5, digesterId: "DG-003", operatorId: "OP003" },
        { date: "2025-03-05", householdId: "HH-009", volume: 1.5, digesterId: "DG-003", operatorId: "OP003" },
        { date: "2025-03-12", householdId: "HH-006", volume: 1.5, digesterId: "DG-003", operatorId: "OP003" },
        { date: "2025-03-12", householdId: "HH-009", volume: 1.5, digesterId: "DG-003", operatorId: "OP003" },
    ];

    await prisma.gasDistribution.createMany({
        data: distributionData.map(r => ({
            date: new Date(r.date + "T08:00:00Z"),
            volume: r.volume,
            householdId: r.householdId,
            digesterId: r.digesterId,
            operatorId: r.operatorId,
        })),
    });
    console.log(`✅ ${distributionData.length} gas distributions`);

    // ── Compost Logs ─────────────────────────────────────────────────────────
    await prisma.compostLog.deleteMany({ where: { operatorId: { in: ["OP001", "OP002", "OP003"] } } });

    const compostData = [
        // DG-001
        { date: "2025-02-15", bags: 8,  digesterId: "DG-001", operatorId: "OP001", notes: "Good quality slurry" },
        { date: "2025-03-01", bags: 10, digesterId: "DG-001", operatorId: "OP001", notes: null },
        { date: "2025-03-08", bags: 9,  digesterId: "DG-001", operatorId: "OP001", notes: "Distributed to 3 farmers" },
        { date: "2025-03-14", bags: 11, digesterId: "DG-001", operatorId: "OP001", notes: null },
        // DG-002
        { date: "2025-02-20", bags: 14, digesterId: "DG-002", operatorId: "OP002", notes: null },
        { date: "2025-03-04", bags: 16, digesterId: "DG-002", operatorId: "OP002", notes: "Large batch" },
        { date: "2025-03-11", bags: 13, digesterId: "DG-002", operatorId: "OP002", notes: null },
        { date: "2025-03-14", bags: 15, digesterId: "DG-002", operatorId: "OP002", notes: "Sold to market" },
        // DG-003
        { date: "2025-02-28", bags: 5,  digesterId: "DG-003", operatorId: "OP003", notes: null },
        { date: "2025-03-07", bags: 6,  digesterId: "DG-003", operatorId: "OP003", notes: "Composting improving" },
        { date: "2025-03-14", bags: 7,  digesterId: "DG-003", operatorId: "OP003", notes: null },
    ];

    await prisma.compostLog.createMany({
        data: compostData.map(r => ({
            date: new Date(r.date + "T09:00:00Z"),
            bags: r.bags,
            photoUrl: "",
            notes: r.notes,
            digesterId: r.digesterId,
            operatorId: r.operatorId,
        })),
    });
    console.log(`✅ ${compostData.length} compost logs`);

    console.log("\n🎉 Seeding complete!");
    console.log("\nLogin credentials:");
    console.log("  Admin : phone=0000000000  password=admin123");
    console.log("  OP001 : phone=9876543210  password=pass123  (DG-001)");
    console.log("  OP002 : phone=9876500211  password=pass456  (DG-002)");
    console.log("  OP003 : phone=9876577712  password=pass789  (DG-003)");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
