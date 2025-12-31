import { PrismaClient, PlanName } from '.prisma/billing-service-client';

const prisma = new PrismaClient();

const plans = [
  {
    name: PlanName.FREE,
    displayName: 'Free',
    description: 'Perfect for individuals just getting started',
    price: 0,
    billingPeriod: 'monthly',
    features: [
      'Basic content creation',
      'Up to 10 AI generations per month',
      '100 video views',
      'Community support',
      '1 GB storage',
    ],
    limits: {
      VIEWS: 100,
      RENDERS: 5,
      AI_GENERATIONS: 10,
      WORKFLOW_RUNS: 10,
      STORAGE_GB: 1,
      BANDWIDTH_GB: 5,
      API_CALLS: 100,
    },
    isActive: true,
    trialPeriodDays: null,
  },
  {
    name: PlanName.STARTER,
    displayName: 'Starter',
    description: 'For creators building their audience',
    price: 29,
    billingPeriod: 'monthly',
    features: [
      'Everything in Free',
      'Up to 100 AI generations per month',
      '10,000 video views',
      'Email support',
      '10 GB storage',
      'Basic analytics',
      'Custom branding',
    ],
    limits: {
      VIEWS: 10000,
      RENDERS: 50,
      AI_GENERATIONS: 100,
      WORKFLOW_RUNS: 100,
      STORAGE_GB: 10,
      BANDWIDTH_GB: 50,
      API_CALLS: 1000,
    },
    isActive: true,
    trialPeriodDays: 14,
  },
  {
    name: PlanName.GROWTH,
    displayName: 'Growth',
    description: 'For growing teams and businesses',
    price: 99,
    billingPeriod: 'monthly',
    features: [
      'Everything in Starter',
      'Up to 500 AI generations per month',
      '100,000 video views',
      'Priority support',
      '50 GB storage',
      'Advanced analytics',
      'Team collaboration (up to 5 members)',
      'API access',
      'Custom workflows',
    ],
    limits: {
      VIEWS: 100000,
      RENDERS: 500,
      AI_GENERATIONS: 500,
      WORKFLOW_RUNS: 1000,
      STORAGE_GB: 50,
      BANDWIDTH_GB: 500,
      API_CALLS: 10000,
    },
    isActive: true,
    trialPeriodDays: 14,
  },
  {
    name: PlanName.PRO,
    displayName: 'Pro',
    description: 'For professionals and large teams',
    price: 299,
    billingPeriod: 'monthly',
    features: [
      'Everything in Growth',
      'Up to 2,000 AI generations per month',
      '1,000,000 video views',
      '24/7 support',
      '200 GB storage',
      'Premium analytics',
      'Unlimited team members',
      'Advanced API access',
      'Custom integrations',
      'White-label options',
      'Dedicated account manager',
    ],
    limits: {
      VIEWS: 1000000,
      RENDERS: 2000,
      AI_GENERATIONS: 2000,
      WORKFLOW_RUNS: 10000,
      STORAGE_GB: 200,
      BANDWIDTH_GB: 2000,
      API_CALLS: 100000,
    },
    isActive: true,
    trialPeriodDays: 14,
  },
  {
    name: PlanName.ENTERPRISE,
    displayName: 'Enterprise',
    description: 'Custom solutions for large organizations',
    price: 999,
    billingPeriod: 'monthly',
    features: [
      'Everything in Pro',
      'Unlimited AI generations',
      'Unlimited video views',
      'Dedicated support team',
      'Unlimited storage',
      'Custom analytics',
      'Enterprise SSO',
      'Custom SLA',
      'On-premise deployment option',
      'Advanced security features',
      'Custom development',
      'Training & onboarding',
    ],
    limits: {
      VIEWS: null, // Unlimited
      RENDERS: null,
      AI_GENERATIONS: null,
      WORKFLOW_RUNS: null,
      STORAGE_GB: null,
      BANDWIDTH_GB: null,
      API_CALLS: null,
    },
    isActive: true,
    trialPeriodDays: 30,
  },
];

async function main() {
  console.log('Start seeding...');

  for (const plan of plans) {
    const result = await prisma.plan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
    console.log(`Created/Updated plan: ${result.displayName}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
