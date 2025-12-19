/**
 * NEXUS Platform - Main Seed File
 * Orchestrates all database seeding operations
 */

import { PrismaClient } from '@prisma/client';
import { seedPlans } from './plans';
import { seedAdmin, seedTestUsers } from './admin';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting database seeding...\n');

  try {
    // 1. Seed subscription plans
    console.log('📋 Step 1: Seeding subscription plans...');
    await seedPlans();
    console.log('✅ Subscription plans seeded successfully\n');

    // 2. Seed admin user
    console.log('👤 Step 2: Seeding admin user...');
    await seedAdmin();
    console.log('✅ Admin user seeded successfully\n');

    // 3. Seed test users (only in development)
    if (process.env.NODE_ENV !== 'production') {
      console.log('🧪 Step 3: Seeding test users...');
      await seedTestUsers();
      console.log('✅ Test users seeded successfully\n');
    } else {
      console.log('⏭️  Step 3: Skipping test users (production mode)\n');
    }

    console.log('✨ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('  - Subscription plans: ✅');
    console.log('  - Admin user: ✅');
    if (process.env.NODE_ENV !== 'production') {
      console.log('  - Test users: ✅');
    }
    console.log('\n🎉 Your NEXUS platform is ready to use!');

  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
