// Migration script: restore data from SQLite backup into PostgreSQL
// Run ONCE after first deploy: node prisma/migrate-data.js

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

async function main() {
  const prisma = new PrismaClient();
  const pw = await bcrypt.hash("Stone-001", 12);

  console.log("==> Seeding users...");
  const users = [
    { name: "Eliel", email: "eliel@casa94.com" },
    { name: "Mateus", email: "mateus@casa94.com" },
    { name: "Luciana", email: "luciana@casa94.com" },
    { name: "Nayane", email: "nayane@casa94.com" },
    { name: "José", email: "jose@casa94.com" },
    { name: "Wilson", email: "wilson@casa94.com" },
  ];

  const userMap = {};
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { name: u.name, email: u.email, password: pw },
    });
    userMap[u.email] = user.id;
    console.log(`  ✓ ${u.name} (${u.email}) → ${user.id}`);
  }

  console.log("\n==> Seeding clients...");
  // Data recovered from SQLite backup (Mar 5, 2026)
  const clients = [
    { name: "Claudia Fernandes Studio Hair", stoneCode: "592922570", userId: "luciana@casa94.com" },
    { name: "TATIELE R DE SOUSA", stoneCode: "276254313", userId: "luciana@casa94.com" },
    { name: "STYLUS COMESTICO", stoneCode: "196491101", userId: "luciana@casa94.com" },
  ];

  const clientMap = {};
  for (const c of clients) {
    const userId = userMap[c.userId];
    if (!userId) {
      console.log(`  ✗ Skipping ${c.name} — user not found`);
      continue;
    }
    const client = await prisma.client.create({
      data: {
        name: c.name,
        stoneCode: c.stoneCode,
        userId,
      },
    });
    clientMap[c.name] = client.id;
    console.log(`  ✓ ${c.name} → ${client.id}`);
  }

  console.log(`\n==> Done! Seeded ${users.length} users, ${clients.length} clients.`);
  console.log("    Negotiations need to be re-created by users (complex JSON data).");
  console.log("    Password for all users: Stone-001");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
