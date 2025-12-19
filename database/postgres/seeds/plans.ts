/**
 * NEXUS Platform - Subscription Plans Seed
 * Seeds the database with default subscription plans
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const plans = [
  // FREE TIER
  {
    id: 'plan_free',
    name: 'Free',
    tier: 'FREE',
    description: 'Perfect for getting started with UGC content creation',
    price: 0,
    currency: 'USD',
    interval: 'MONTH',
    features: {
      campaigns: 1,
      creators: 5,
      content_storage: '1GB',
      content_uploads: 10,
      analytics: 'Basic',
      support: 'Community',
      api_access: false,
      white_label: false,
      custom_domain: false,
      advanced_analytics: false,
      priority_support: false,
      dedicated_manager: false,
    },
    limits: {
      campaigns: 1,
      active_campaigns: 1,
      creators: 5,
      content_storage_gb: 1,
      content_uploads_per_month: 10,
      team_members: 1,
      api_calls_per_month: 0,
      webhooks: 0,
      custom_integrations: 0,
    },
    isActive: true,
    trialDays: 0,
  },

  // STARTER TIER - Monthly
  {
    id: 'plan_starter_monthly',
    name: 'Starter',
    tier: 'STARTER',
    description: 'Ideal for small businesses and growing brands',
    price: 49,
    currency: 'USD',
    interval: 'MONTH',
    features: {
      campaigns: 5,
      creators: 25,
      content_storage: '10GB',
      content_uploads: 100,
      analytics: 'Advanced',
      support: 'Email',
      api_access: true,
      white_label: false,
      custom_domain: false,
      advanced_analytics: true,
      priority_support: false,
      dedicated_manager: false,
      content_rights_management: true,
      collaboration_tools: true,
      brand_guidelines: true,
    },
    limits: {
      campaigns: 5,
      active_campaigns: 3,
      creators: 25,
      content_storage_gb: 10,
      content_uploads_per_month: 100,
      team_members: 3,
      api_calls_per_month: 10000,
      webhooks: 3,
      custom_integrations: 1,
    },
    isActive: true,
    trialDays: 14,
  },

  // STARTER TIER - Yearly (15% discount)
  {
    id: 'plan_starter_yearly',
    name: 'Starter (Annual)',
    tier: 'STARTER',
    description: 'Ideal for small businesses and growing brands - Save 15% with annual billing',
    price: 499,
    currency: 'USD',
    interval: 'YEAR',
    features: {
      campaigns: 5,
      creators: 25,
      content_storage: '10GB',
      content_uploads: 100,
      analytics: 'Advanced',
      support: 'Email',
      api_access: true,
      white_label: false,
      custom_domain: false,
      advanced_analytics: true,
      priority_support: false,
      dedicated_manager: false,
      content_rights_management: true,
      collaboration_tools: true,
      brand_guidelines: true,
    },
    limits: {
      campaigns: 5,
      active_campaigns: 3,
      creators: 25,
      content_storage_gb: 10,
      content_uploads_per_month: 100,
      team_members: 3,
      api_calls_per_month: 10000,
      webhooks: 3,
      custom_integrations: 1,
    },
    isActive: true,
    trialDays: 14,
  },

  // PROFESSIONAL TIER - Monthly
  {
    id: 'plan_professional_monthly',
    name: 'Professional',
    tier: 'PROFESSIONAL',
    description: 'For established brands running multiple campaigns',
    price: 149,
    currency: 'USD',
    interval: 'MONTH',
    features: {
      campaigns: 20,
      creators: 100,
      content_storage: '50GB',
      content_uploads: 500,
      analytics: 'Advanced + Custom Reports',
      support: 'Priority Email & Chat',
      api_access: true,
      white_label: true,
      custom_domain: true,
      advanced_analytics: true,
      priority_support: true,
      dedicated_manager: false,
      content_rights_management: true,
      collaboration_tools: true,
      brand_guidelines: true,
      automated_workflows: true,
      a_b_testing: true,
      audience_insights: true,
    },
    limits: {
      campaigns: 20,
      active_campaigns: 10,
      creators: 100,
      content_storage_gb: 50,
      content_uploads_per_month: 500,
      team_members: 10,
      api_calls_per_month: 50000,
      webhooks: 10,
      custom_integrations: 5,
    },
    isActive: true,
    trialDays: 14,
  },

  // PROFESSIONAL TIER - Yearly (20% discount)
  {
    id: 'plan_professional_yearly',
    name: 'Professional (Annual)',
    tier: 'PROFESSIONAL',
    description: 'For established brands running multiple campaigns - Save 20% with annual billing',
    price: 1429,
    currency: 'USD',
    interval: 'YEAR',
    features: {
      campaigns: 20,
      creators: 100,
      content_storage: '50GB',
      content_uploads: 500,
      analytics: 'Advanced + Custom Reports',
      support: 'Priority Email & Chat',
      api_access: true,
      white_label: true,
      custom_domain: true,
      advanced_analytics: true,
      priority_support: true,
      dedicated_manager: false,
      content_rights_management: true,
      collaboration_tools: true,
      brand_guidelines: true,
      automated_workflows: true,
      a_b_testing: true,
      audience_insights: true,
    },
    limits: {
      campaigns: 20,
      active_campaigns: 10,
      creators: 100,
      content_storage_gb: 50,
      content_uploads_per_month: 500,
      team_members: 10,
      api_calls_per_month: 50000,
      webhooks: 10,
      custom_integrations: 5,
    },
    isActive: true,
    trialDays: 14,
  },

  // ENTERPRISE TIER - Monthly
  {
    id: 'plan_enterprise_monthly',
    name: 'Enterprise',
    tier: 'ENTERPRISE',
    description: 'For large organizations with advanced needs',
    price: 499,
    currency: 'USD',
    interval: 'MONTH',
    features: {
      campaigns: 'Unlimited',
      creators: 'Unlimited',
      content_storage: 'Unlimited',
      content_uploads: 'Unlimited',
      analytics: 'Enterprise + Custom BI Integration',
      support: '24/7 Priority Support',
      api_access: true,
      white_label: true,
      custom_domain: true,
      advanced_analytics: true,
      priority_support: true,
      dedicated_manager: true,
      content_rights_management: true,
      collaboration_tools: true,
      brand_guidelines: true,
      automated_workflows: true,
      a_b_testing: true,
      audience_insights: true,
      custom_integrations: true,
      sso: true,
      advanced_security: true,
      sla_guarantee: '99.9%',
      onboarding: 'Dedicated',
      training: 'Unlimited',
    },
    limits: {
      campaigns: 999999,
      active_campaigns: 999999,
      creators: 999999,
      content_storage_gb: 999999,
      content_uploads_per_month: 999999,
      team_members: 999999,
      api_calls_per_month: 999999,
      webhooks: 999999,
      custom_integrations: 999999,
    },
    isActive: true,
    trialDays: 30,
  },

  // ENTERPRISE TIER - Yearly (25% discount)
  {
    id: 'plan_enterprise_yearly',
    name: 'Enterprise (Annual)',
    tier: 'ENTERPRISE',
    description: 'For large organizations with advanced needs - Save 25% with annual billing',
    price: 4491,
    currency: 'USD',
    interval: 'YEAR',
    features: {
      campaigns: 'Unlimited',
      creators: 'Unlimited',
      content_storage: 'Unlimited',
      content_uploads: 'Unlimited',
      analytics: 'Enterprise + Custom BI Integration',
      support: '24/7 Priority Support',
      api_access: true,
      white_label: true,
      custom_domain: true,
      advanced_analytics: true,
      priority_support: true,
      dedicated_manager: true,
      content_rights_management: true,
      collaboration_tools: true,
      brand_guidelines: true,
      automated_workflows: true,
      a_b_testing: true,
      audience_insights: true,
      custom_integrations: true,
      sso: true,
      advanced_security: true,
      sla_guarantee: '99.9%',
      onboarding: 'Dedicated',
      training: 'Unlimited',
    },
    limits: {
      campaigns: 999999,
      active_campaigns: 999999,
      creators: 999999,
      content_storage_gb: 999999,
      content_uploads_per_month: 999999,
      team_members: 999999,
      api_calls_per_month: 999999,
      webhooks: 999999,
      custom_integrations: 999999,
    },
    isActive: true,
    trialDays: 30,
  },
];

async function seedPlans() {
  console.log('🌱 Seeding subscription plans...');

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan,
    });
    console.log(`✅ Created/Updated plan: ${plan.name} (${plan.tier})`);
  }

  console.log('✨ Successfully seeded subscription plans!');
}

async function main() {
  try {
    await seedPlans();
  } catch (error) {
    console.error('❌ Error seeding plans:', error);
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

export { seedPlans };
