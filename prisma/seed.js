const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

async function main() {
    const prisma = new PrismaClient();
    const pw = await bcrypt.hash("Stone-001", 12);

    const users = [
        { name: "Eliel", email: "eliel@casa94.com" },
        { name: "Mateus", email: "mateus@casa94.com" },
        { name: "Luciana", email: "luciana@casa94.com" },
        { name: "Nayane", email: "nayane@casa94.com" },
        { name: "José", email: "jose@casa94.com" },
        { name: "Wilson", email: "wilson@casa94.com" },
    ];

    for (const u of users) {
        await prisma.user.upsert({
            where: { email: u.email },
            update: {},
            create: { name: u.name, email: u.email, password: pw },
        });
        console.log(`  ✓ ${u.name} (${u.email})`);
    }

    console.log(`\nSeeded ${users.length} users! Password: Stone-001`);
    await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
