import { prisma } from "../src/database/prisma/prisma.client.js";

async function main() {
  const orgId = "d6b9ea2a-7e1e-4b9a-9e1e-5a0a38d7b384";

  await prisma.location.deleteMany({ where: { organizationId: orgId } });
  await prisma.organizationMembership.deleteMany({ where: { organizationId: orgId } });
  await prisma.organization.deleteMany({ where: { id: orgId } });

  console.log("Cleanup complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
