// Restore negotiations from SQLite backup
// Run in container: node prisma/migrate-negotiations.js

const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();

  // Map old client names to get new IDs
  const claudia = await prisma.client.findFirst({ where: { stoneCode: "592922570" } });
  const tatiele = await prisma.client.findFirst({ where: { stoneCode: "276254313" } });
  const stylus = await prisma.client.findFirst({ where: { stoneCode: "196491101" } });

  if (!claudia || !tatiele || !stylus) {
    console.log("ERROR: Run migrate-data.js first to create clients!");
    console.log("  Claudia:", claudia?.id || "NOT FOUND");
    console.log("  Tatiele:", tatiele?.id || "NOT FOUND");
    console.log("  Stylus:", stylus?.id || "NOT FOUND");
    await prisma.$disconnect();
    return;
  }

  console.log("==> Restoring negotiations...");

  const negotiations = [
    {
      clientId: claudia.id,
      dateNeg: "2026-01-30",
      dateAccept: "2026-01-30",
      status: "aceita",
      rates: {"debit":2.04,"credit1x":3.85,"credit2to6":2.18,"credit7to12":2.41,"pix":5,"rav":1.3,"brandRates":{"VISA/MASTER":{"debit":2.04,"credit1x":3.85,"credit2to6":2.18,"credit7to12":2.41},"ELO":{"debit":2.38,"credit1x":4.4,"credit2to6":3.28,"credit7to12":3.76},"AMEX":{"debit":2.5,"credit1x":3.5,"credit2to6":4,"credit7to12":4.5},"HIPERCARD":{"debit":1.9,"credit1x":2.9,"credit2to6":3.4,"credit7to12":3.9},"CABAL":{"debit":1.8,"credit1x":2.8,"credit2to6":3.3,"credit7to12":3.8}},"ravTipo":"automatico","ravRate":1.3,"ravPontual":3.79,"ravTiming":"du"},
      notes: "",
      createdAt: new Date(1772548380422),
      updatedAt: new Date(1772717254842),
    },
    {
      clientId: tatiele.id,
      dateNeg: "2026-02-06",
      dateAccept: "2026-02-06",
      status: "aceita",
      rates: {"debit":1.34,"credit1x":3.85,"credit2to6":8.37,"credit7to12":13.9,"pix":50,"rav":1.3,"brandRates":{"VISA/MASTER":{"debit":1.34,"credit1x":3.85,"credit2to6":8.37,"credit7to12":13.9},"ELO":{"debit":1.83,"credit1x":2.82,"credit2to6":3.28,"credit7to12":3.76},"AMEX":{"debit":2.5,"credit1x":3.5,"credit2to6":4,"credit7to12":4.5},"HIPERCARD":{"debit":1.9,"credit1x":2.9,"credit2to6":3.4,"credit7to12":3.9},"CABAL":{"debit":1.8,"credit1x":2.8,"credit2to6":3.3,"credit7to12":3.8}},"ravTipo":"automatico","ravRate":1.3,"ravPontual":3.79,"ravTiming":"du"},
      notes: "",
      createdAt: new Date(1772717150506),
      updatedAt: new Date(1772717150506),
    },
    {
      clientId: stylus.id,
      dateNeg: "2026-02-13",
      dateAccept: "2026-02-13",
      status: "aceita",
      rates: {"debit":1.49,"credit1x":3.51,"credit2to6":2.18,"credit7to12":2.41,"pix":50,"rav":1.3,"brandRates":{"VISA/MASTER":{"debit":1.49,"credit1x":3.51,"credit2to6":2.18,"credit7to12":2.41},"ELO":{"debit":1.83,"credit1x":2.82,"credit2to6":3.28,"credit7to12":3.76},"AMEX":{"debit":2.5,"credit1x":3.5,"credit2to6":4,"credit7to12":4.5},"HIPERCARD":{"debit":1.9,"credit1x":2.9,"credit2to6":3.4,"credit7to12":3.9},"CABAL":{"debit":1.8,"credit1x":2.8,"credit2to6":3.3,"credit7to12":3.8}},"ravTipo":"automatico","ravRate":1.3,"ravPontual":3.79,"ravTiming":"du"},
      notes: "",
      createdAt: new Date(1772718083021),
      updatedAt: new Date(1772718083021),
    },
  ];

  for (const neg of negotiations) {
    const result = await prisma.negotiation.create({ data: neg });
    console.log(`  ✓ ${neg.status} (${neg.dateNeg.toISOString().split("T")[0]}) → ${result.id}`);
  }

  console.log("\n==> Done! 3 negotiations restored.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
