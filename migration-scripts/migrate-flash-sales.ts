import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Flash Sale migration...");

  try {
    // Create DiscountType enum if it doesn't exist
    console.log("Creating DiscountType enum...");

    // Create FlashSale table
    console.log("Creating FlashSale table...");
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS \`FlashSale\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`name\` VARCHAR(191) NOT NULL,
        \`description\` TEXT NULL,
        \`startDate\` DATETIME(3) NOT NULL,
        \`endDate\` DATETIME(3) NOT NULL,
        \`isActive\` BOOLEAN NOT NULL DEFAULT false,
        \`featured\` BOOLEAN NOT NULL DEFAULT false,
        \`discountType\` ENUM('PERCENTAGE', 'FIXED_AMOUNT') NOT NULL DEFAULT 'PERCENTAGE',
        \`discountValue\` DOUBLE NOT NULL,
        \`maxDiscount\` DOUBLE NULL,
        \`storeId\` VARCHAR(191) NOT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL,
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `;

    // Create FlashSaleProduct table
    console.log("Creating FlashSaleProduct table...");
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS \`FlashSaleProduct\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`flashSaleId\` VARCHAR(191) NOT NULL,
        \`productId\` VARCHAR(191) NOT NULL,
        \`customDiscountValue\` DOUBLE NULL,
        \`customMaxDiscount\` DOUBLE NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`FlashSaleProduct_flashSaleId_productId_key\`(\`flashSaleId\`, \`productId\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `;

    // Add indexes
    console.log("Adding indexes...");
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS \`FlashSale_storeId_idx\` ON \`FlashSale\`(\`storeId\`)
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS \`FlashSale_startDate_idx\` ON \`FlashSale\`(\`startDate\`)
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS \`FlashSale_endDate_idx\` ON \`FlashSale\`(\`endDate\`)
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS \`FlashSale_isActive_idx\` ON \`FlashSale\`(\`isActive\`)
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS \`FlashSaleProduct_flashSaleId_idx\` ON \`FlashSaleProduct\`(\`flashSaleId\`)
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS \`FlashSaleProduct_productId_idx\` ON \`FlashSaleProduct\`(\`productId\`)
    `;

    // Add foreign key constraints
    console.log("Adding foreign key constraints...");
    await prisma.$executeRaw`
      ALTER TABLE \`FlashSale\` ADD CONSTRAINT \`FlashSale_storeId_fkey\` 
      FOREIGN KEY (\`storeId\`) REFERENCES \`Store\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    `;

    await prisma.$executeRaw`
      ALTER TABLE \`FlashSaleProduct\` ADD CONSTRAINT \`FlashSaleProduct_flashSaleId_fkey\` 
      FOREIGN KEY (\`flashSaleId\`) REFERENCES \`FlashSale\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    `;

    await prisma.$executeRaw`
      ALTER TABLE \`FlashSaleProduct\` ADD CONSTRAINT \`FlashSaleProduct_productId_fkey\` 
      FOREIGN KEY (\`productId\`) REFERENCES \`Product\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    `;

    console.log("Flash Sale migration completed successfully!");

    // Create sample flash sale data
    console.log("Creating sample flash sale data...");

    // Get first store
    const firstStore = await prisma.store.findFirst();
    if (firstStore) {
      const sampleFlashSale = await prisma.flashSale.create({
        data: {
          name: "Black Friday Blitz",
          description:
            "Get ready for the biggest sale of the year! Up to 70% off on selected items.",
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          isActive: true,
          featured: true,
          discountType: "PERCENTAGE",
          discountValue: 70,
          storeId: firstStore.id,
        },
      });

      console.log("Sample flash sale created:", sampleFlashSale.name);
    }
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
