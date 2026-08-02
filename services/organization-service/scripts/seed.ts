import { prisma } from "../src/database/prisma/prisma.client.js";

async function main() {
  console.log('🚀 Seeding Organization Service Database...');

  const orgId = 'd6b9ea2a-7e1e-4b9a-9e1e-5a0a38d7b384';
  
  // 1. Create Organization
  const org = await prisma.organization.upsert({
    where: { id: orgId },
    update: { name: 'Industrial Demo Corp' },
    create: {
      id: orgId,
      name: 'Industrial Demo Corp',
      slug: 'industrial-demo',
    },
  });
  console.log(`✅ Organization created: ${org.name} (${org.id})`);

  // 2. Create Memberships
  const memberships = [
    { userId: 'owner-id-001', role: 'org_owner' },
    { userId: 'admin-id-002', role: 'org_admin' },
    { userId: 'staff-id-003', role: 'org_staff' },
    { userId: 'viewer-id-004', role: 'org_viewer' },
  ];

  for (const m of memberships) {
    await prisma.organizationMembership.upsert({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: m.userId,
        },
      },
      update: { role: m.role },
      create: {
        organizationId: orgId,
        userId: m.userId,
        role: m.role,
      },
    });
    console.log(`✅ Membership created for user ${m.userId} as ${m.role}`);
  }

  // 3. Create Locations
  await prisma.location.create({
    data: {
      organizationId: orgId,
      name: 'Main HQ',
      city: 'Tech City',
      country: 'USA',
    }
  });
  console.log('✅ Default location created.');

  console.log('🎉 Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
