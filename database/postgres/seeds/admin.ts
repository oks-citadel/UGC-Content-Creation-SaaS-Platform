/**
 * NEXUS Platform - Admin User Seed
 * Creates default admin user for initial system setup
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

function generateCuid(): string {
  return randomBytes(15).toString('base64url');
}

async function seedAdmin() {
  console.log('🌱 Seeding admin user...');

  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: {
      role: 'SUPER_ADMIN',
    },
  });

  if (existingAdmin) {
    console.log('⚠️  Admin user already exists. Skipping...');
    return existingAdmin;
  }

  // Create admin user - REQUIRE password from environment
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error(
      'ADMIN_PASSWORD environment variable is required. ' +
      'Set a strong password (min 12 chars, mixed case, numbers, symbols) before running seed.'
    );
  }
  if (adminPassword.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters long');
  }
  const hashedPassword = await hashPassword(adminPassword);

  const adminUser = await prisma.user.create({
    data: {
      id: generateCuid(),
      email: process.env.ADMIN_EMAIL || 'admin@nexus.local',
      emailVerified: new Date(),
      passwordHash: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      displayName: 'Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      mfaEnabled: false,
      timezone: 'UTC',
      locale: 'en',
    },
  });

  console.log('✅ Created admin user:', {
    id: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
  });

  // Create default organization for admin
  const defaultOrg = await prisma.organization.create({
    data: {
      id: generateCuid(),
      name: 'NEXUS Admin',
      slug: 'nexus-admin',
      type: 'ENTERPRISE',
      status: 'ACTIVE',
      ownerId: adminUser.id,
      description: 'System administration organization',
    },
  });

  console.log('✅ Created admin organization:', {
    id: defaultOrg.id,
    name: defaultOrg.name,
  });

  // Add admin as organization member
  await prisma.organizationMember.create({
    data: {
      id: generateCuid(),
      organizationId: defaultOrg.id,
      userId: adminUser.id,
      role: 'OWNER',
    },
  });

  console.log('✅ Added admin as organization owner');

  // Create notification preferences
  const notificationTypes = [
    'CAMPAIGN_UPDATE',
    'APPLICATION_STATUS',
    'CONTENT_APPROVED',
    'CONTENT_REJECTED',
    'PAYMENT_RECEIVED',
    'MESSAGE',
    'SYSTEM',
  ];

  for (const type of notificationTypes) {
    await prisma.notificationPreference.create({
      data: {
        id: generateCuid(),
        userId: adminUser.id,
        type: type as any,
        email: true,
        sms: false,
        push: true,
        inApp: true,
      },
    });
  }

  console.log('✅ Created notification preferences');

  // Create consent records
  await prisma.consentRecord.create({
    data: {
      id: generateCuid(),
      userId: adminUser.id,
      type: 'DATA_PROCESSING',
      granted: true,
      version: '1.0',
    },
  });

  console.log('✅ Created consent records');

  console.log('\n✨ Admin user setup complete!');
  console.log('\n📧 Admin login email:', adminUser.email);
  console.log('🔐 Password was set from ADMIN_PASSWORD environment variable');
  console.log('⚠️  Store credentials securely and rotate after first login!\n');

  return adminUser;
}

async function seedTestUsers() {
  console.log('🌱 Seeding test users...');

  // Require test user password from environment - never use hardcoded credentials
  const testPassword = process.env.TEST_USER_PASSWORD;
  if (!testPassword) {
    throw new Error(
      'TEST_USER_PASSWORD environment variable is required for seeding test users. ' +
      'Set a password (min 8 chars) before running seed in development.'
    );
  }
  if (testPassword.length < 8) {
    throw new Error('TEST_USER_PASSWORD must be at least 8 characters long');
  }

  const testUsers = [
    {
      email: process.env.TEST_BRAND_EMAIL || 'brand@example.com',
      firstName: 'Brand',
      lastName: 'Manager',
      role: 'BRAND_MANAGER',
      orgType: 'BRAND',
    },
    {
      email: process.env.TEST_CREATOR_EMAIL || 'creator@example.com',
      firstName: 'Content',
      lastName: 'Creator',
      role: 'CREATOR',
      createCreatorProfile: true,
    },
    {
      email: process.env.TEST_AGENCY_EMAIL || 'agency@example.com',
      firstName: 'Agency',
      lastName: 'Owner',
      role: 'ADMIN',
      orgType: 'AGENCY',
    },
  ];

  const defaultPassword = await hashPassword(testPassword);

  for (const userData of testUsers) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      console.log(`⚠️  User ${userData.email} already exists. Skipping...`);
      continue;
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        id: generateCuid(),
        email: userData.email,
        emailVerified: new Date(),
        passwordHash: defaultPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        displayName: `${userData.firstName} ${userData.lastName}`,
        role: userData.role as any,
        status: 'ACTIVE',
        mfaEnabled: false,
        timezone: 'UTC',
        locale: 'en',
      },
    });

    console.log(`✅ Created test user: ${user.email}`);

    // Create organization if needed
    if (userData.orgType) {
      const org = await prisma.organization.create({
        data: {
          id: generateCuid(),
          name: `${userData.firstName}'s ${userData.orgType}`,
          slug: `${userData.firstName.toLowerCase()}-${userData.orgType.toLowerCase()}`,
          type: userData.orgType as any,
          status: 'ACTIVE',
          ownerId: user.id,
        },
      });

      await prisma.organizationMember.create({
        data: {
          id: generateCuid(),
          organizationId: org.id,
          userId: user.id,
          role: 'OWNER',
        },
      });

      console.log(`✅ Created organization: ${org.name}`);
    }

    // Create creator profile if needed
    if (userData.createCreatorProfile) {
      const creator = await prisma.creator.create({
        data: {
          id: generateCuid(),
          userId: user.id,
          bio: 'Passionate content creator specializing in lifestyle and fashion content',
          niche: ['lifestyle', 'fashion', 'beauty'],
          verified: false,
          status: 'ACTIVE',
          reputationScore: 0,
          completionRate: 0,
          totalEarnings: 0,
          socialHandles: {
            instagram: '@contentcreator',
            tiktok: '@contentcreator',
            youtube: '@contentcreator',
          },
        },
      });

      console.log(`✅ Created creator profile for: ${user.email}`);
    }
  }

  console.log('\n✨ Test users setup complete!');
  console.log('\n📧 Test users created (development only):');
  console.log(`   - ${process.env.TEST_BRAND_EMAIL || 'brand@example.com'}`);
  console.log(`   - ${process.env.TEST_CREATOR_EMAIL || 'creator@example.com'}`);
  console.log(`   - ${process.env.TEST_AGENCY_EMAIL || 'agency@example.com'}`);
  console.log('🔐 Password was set from TEST_USER_PASSWORD environment variable');
  console.log('⚠️  These are development-only accounts. Never seed test users in production!\n');
}

async function main() {
  try {
    // Seed admin user
    await seedAdmin();

    // Seed test users (only in development)
    if (process.env.NODE_ENV !== 'production') {
      await seedTestUsers();
    }

    console.log('✨ All users seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedAdmin, seedTestUsers };
