/**
 * TruVis.info — Database Seed
 * Populates essential reference data: industries, categories, service tags, subscription plans
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─────────────────────────────────────────
  // SUPER ADMIN USER
  // ─────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@TruVis2024!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@truvis.info' },
    update: {},
    create: {
      email: 'admin@truvis.info',
      passwordHash: adminPassword,
      role: 'super_admin',
      emailVerified: true,
      isActive: true,
    },
  });
  console.log('✓ Admin user created:', admin.email);

  // ─────────────────────────────────────────
  // TRUVIS SERVICE TAGS
  // ─────────────────────────────────────────
  const serviceTags = [
    { name: 'Company Formation', slug: 'company-formation', icon: '🏢' },
    { name: 'Business Licensing', slug: 'business-licensing', icon: '📋' },
    { name: 'PRO Services', slug: 'pro-services', icon: '🔖' },
    { name: 'Visa Processing', slug: 'visa-processing', icon: '✈️' },
    { name: 'Corporate Banking', slug: 'corporate-banking', icon: '🏦' },
    { name: 'Tax Advisory', slug: 'tax-advisory', icon: '📊' },
    { name: 'Legal Services', slug: 'legal-services', icon: '⚖️' },
    { name: 'Accounting & Audit', slug: 'accounting-audit', icon: '🧾' },
    { name: 'Business Advisory', slug: 'business-advisory', icon: '💼' },
    { name: 'Due Diligence', slug: 'due-diligence', icon: '🔍' },
    { name: 'Market Entry', slug: 'market-entry', icon: '🌐' },
    { name: 'Compliance', slug: 'compliance', icon: '✅' },
  ];

  for (const tag of serviceTags) {
    await prisma.truvisServiceTag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
  }
  console.log(`✓ ${serviceTags.length} TruVis service tags created`);

  // ─────────────────────────────────────────
  // INDUSTRIES & CATEGORIES
  // ─────────────────────────────────────────
  const industries = [
    {
      name: 'Financial Services',
      slug: 'financial-services',
      icon: '💰',
      categories: [
        { name: 'Banking & Finance', slug: 'banking-finance' },
        { name: 'Investment Management', slug: 'investment-management' },
        { name: 'Insurance', slug: 'insurance' },
        { name: 'Fintech', slug: 'fintech' },
        { name: 'Accounting & Tax', slug: 'accounting-tax' },
      ],
    },
    {
      name: 'Legal & Compliance',
      slug: 'legal-compliance',
      icon: '⚖️',
      categories: [
        { name: 'Law Firms', slug: 'law-firms' },
        { name: 'Regulatory Compliance', slug: 'regulatory-compliance' },
        { name: 'Intellectual Property', slug: 'intellectual-property' },
        { name: 'Corporate Law', slug: 'corporate-law' },
      ],
    },
    {
      name: 'Real Estate',
      slug: 'real-estate',
      icon: '🏗️',
      categories: [
        { name: 'Commercial Real Estate', slug: 'commercial-real-estate' },
        { name: 'Residential Development', slug: 'residential-development' },
        { name: 'Property Management', slug: 'property-management' },
        { name: 'Real Estate Investment', slug: 'real-estate-investment' },
      ],
    },
    {
      name: 'Technology',
      slug: 'technology',
      icon: '💻',
      categories: [
        { name: 'Software Development', slug: 'software-development' },
        { name: 'IT Consulting', slug: 'it-consulting' },
        { name: 'Cybersecurity', slug: 'cybersecurity' },
        { name: 'Cloud Services', slug: 'cloud-services' },
        { name: 'AI & Data', slug: 'ai-data' },
      ],
    },
    {
      name: 'Trade & Logistics',
      slug: 'trade-logistics',
      icon: '🚢',
      categories: [
        { name: 'Import & Export', slug: 'import-export' },
        { name: 'Freight & Shipping', slug: 'freight-shipping' },
        { name: 'Supply Chain', slug: 'supply-chain' },
        { name: 'Warehousing', slug: 'warehousing' },
      ],
    },
    {
      name: 'Healthcare',
      slug: 'healthcare',
      icon: '🏥',
      categories: [
        { name: 'Medical Services', slug: 'medical-services' },
        { name: 'Pharmaceuticals', slug: 'pharmaceuticals' },
        { name: 'Health Tech', slug: 'health-tech' },
      ],
    },
    {
      name: 'Education & Training',
      slug: 'education-training',
      icon: '🎓',
      categories: [
        { name: 'Corporate Training', slug: 'corporate-training' },
        { name: 'Professional Development', slug: 'professional-development' },
        { name: 'E-learning', slug: 'elearning' },
      ],
    },
    {
      name: 'Consulting & Advisory',
      slug: 'consulting-advisory',
      icon: '🤝',
      categories: [
        { name: 'Management Consulting', slug: 'management-consulting' },
        { name: 'Strategy', slug: 'strategy' },
        { name: 'HR Consulting', slug: 'hr-consulting' },
      ],
    },
    {
      name: 'Media & Marketing',
      slug: 'media-marketing',
      icon: '📢',
      categories: [
        { name: 'Digital Marketing', slug: 'digital-marketing' },
        { name: 'PR & Communications', slug: 'pr-communications' },
        { name: 'Branding & Design', slug: 'branding-design' },
      ],
    },
    {
      name: 'Energy & Utilities',
      slug: 'energy-utilities',
      icon: '⚡',
      categories: [
        { name: 'Oil & Gas', slug: 'oil-gas' },
        { name: 'Renewable Energy', slug: 'renewable-energy' },
        { name: 'Utilities Management', slug: 'utilities-management' },
      ],
    },
  ];

  let industryOrder = 0;
  for (const ind of industries) {
    const { categories, ...industryData } = ind;

    const industry = await prisma.industry.upsert({
      where: { slug: ind.slug },
      update: {},
      create: { ...industryData, sortOrder: industryOrder++ },
    });

    let catOrder = 0;
    for (const cat of categories) {
      await prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: { ...cat, industryId: industry.id, sortOrder: catOrder++ },
      });
    }
  }
  console.log(`✓ ${industries.length} industries with categories created`);

  // ─────────────────────────────────────────
  // SUBSCRIPTION PLANS
  // ─────────────────────────────────────────
  const plans = [
    {
      name: 'Free',
      slug: 'free',
      description: 'Basic listing for verified TruVis clients.',
      priceMonthly: null,
      priceAnnually: null,
      currency: 'USD',
      features: {
        profileListing: true,
        contactForm: true,
        gallery: true,
        blogPosts: 2,
        analytics: false,
        featured: false,
      },
    },
    {
      name: 'Essential',
      slug: 'essential',
      description: 'Enhanced visibility for active businesses.',
      priceMonthly: 99,
      priceAnnually: 990,
      currency: 'USD',
      features: {
        profileListing: true,
        contactForm: true,
        gallery: true,
        blogPosts: 10,
        analytics: true,
        featured: false,
        priorityPlacement: true,
      },
    },
    {
      name: 'Professional',
      slug: 'professional',
      description: 'Premium placement and advanced features.',
      priceMonthly: 299,
      priceAnnually: 2990,
      currency: 'USD',
      features: {
        profileListing: true,
        contactForm: true,
        gallery: true,
        blogPosts: 50,
        analytics: true,
        featured: true,
        priorityPlacement: true,
        leadGeneration: true,
        marketplaceAccess: true,
      },
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: {},
      create: {
        ...plan,
        priceMonthly: plan.priceMonthly?.toString(),
        priceAnnually: plan.priceAnnually?.toString(),
        features: plan.features as any,
      },
    });
  }
  console.log(`✓ ${plans.length} subscription plans created`);

  console.log('\n🎉 Database seeded successfully!');
  console.log('─────────────────────────────');
  console.log(`Admin Email:    admin@truvis.info`);
  console.log(`Admin Password: Admin@TruVis2024!`);
  console.log('Change the admin password immediately after first login!');
  console.log('─────────────────────────────');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
