/**
 * TruVis.info — Demo Data Seed
 * Creates realistic demo companies with verification badges and services
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🎭 Seeding demo companies...');

  // Get reference data
  const industries = await prisma.industry.findMany({ include: { categories: true } });
  const serviceTags = await prisma.truvisServiceTag.findMany();
  const admin = await prisma.user.findFirst({ where: { role: 'super_admin' } });

  if (!admin) throw new Error('Run the main seed first');

  const industryMap = Object.fromEntries(industries.map(i => [i.slug, i]));
  const tagMap = Object.fromEntries(serviceTags.map(t => [t.slug, t]));

  const demoCompanies = [
    {
      email: 'info@alphaventures.ae',
      companyName: 'Alpha Ventures Group',
      slug: 'alpha-ventures-group',
      tagline: 'Strategic investment & business advisory for the UAE market',
      description: '<p>Alpha Ventures Group is a leading <strong>investment and advisory firm</strong> based in Dubai, providing comprehensive corporate services to businesses looking to establish and grow in the UAE and broader MENA region.</p><p>With over 15 years of experience, our team of experts has facilitated more than 500 company formations, managed complex regulatory approvals, and advised on cross-border transactions exceeding AED 2 billion.</p><h2>Our Approach</h2><p>We combine deep local knowledge with international best practices to deliver results that exceed expectations. Every client engagement is handled with the highest levels of confidentiality and professionalism.</p>',
      city: 'Dubai',
      country: 'United Arab Emirates',
      phone: '+971 4 123 4567',
      website: 'https://alphaventures.ae',
      whatsapp: '+971 50 123 4567',
      address: 'Level 25, Burj Al Salam Tower, Trade Centre, Dubai',
      licenseNumber: 'DED-2024-0123456',
      foundedYear: 2008,
      truvisVerified: true,
      truvisClient: true,
      featured: true,
      featuredOrder: 1,
      industrySlug: 'financial-services',
      tagSlugs: ['company-formation', 'business-advisory', 'business-licensing', 'due-diligence'],
      services: [
        { type: 'service' as const, title: 'Company Formation & Registration', description: 'End-to-end company setup in UAE Free Zones and Mainland' },
        { type: 'service' as const, title: 'Investment Advisory', description: 'Strategic investment guidance and portfolio management' },
        { type: 'service' as const, title: 'Business Restructuring', description: 'Corporate restructuring and M&A advisory services' },
        { type: 'capability' as const, title: 'Bilingual Arabic-English team', description: null },
      ],
    },
    {
      email: 'hello@nexuslaw.ae',
      companyName: 'Nexus Legal Partners',
      slug: 'nexus-legal-partners',
      tagline: 'Full-service corporate law firm with regional expertise',
      description: '<p>Nexus Legal Partners is a <strong>premier corporate law firm</strong> with offices in Dubai and Abu Dhabi, specialising in commercial law, regulatory compliance, and cross-border transactions.</p><p>Our team of over 30 qualified lawyers brings expertise in UAE corporate law, DIFC regulations, and international commercial arbitration.</p><h2>Practice Areas</h2><p>We cover the complete spectrum of corporate legal needs — from incorporation and governance to dispute resolution and intellectual property protection.</p>',
      city: 'Dubai',
      country: 'United Arab Emirates',
      phone: '+971 4 234 5678',
      website: 'https://nexuslaw.ae',
      whatsapp: '+971 55 234 5678',
      address: 'Suite 801, DIFC Gate Village, Dubai',
      licenseNumber: 'DIFC-2019-LAW-0892',
      foundedYear: 2014,
      truvisVerified: true,
      truvisClient: true,
      featured: true,
      featuredOrder: 2,
      industrySlug: 'legal-compliance',
      tagSlugs: ['legal-services', 'compliance', 'company-formation'],
      services: [
        { type: 'service' as const, title: 'Corporate Legal Advisory', description: 'Comprehensive corporate governance and compliance guidance' },
        { type: 'service' as const, title: 'Contract Drafting & Review', description: 'Commercial contracts, MOUs, and joint venture agreements' },
        { type: 'service' as const, title: 'Dispute Resolution', description: 'DIAC and DIFC arbitration and litigation support' },
        { type: 'service' as const, title: 'Intellectual Property', description: 'Trademark registration and IP portfolio management' },
      ],
    },
    {
      email: 'accounts@pinnacleaccounting.ae',
      companyName: 'Pinnacle Accounting & Tax',
      slug: 'pinnacle-accounting-tax',
      tagline: 'VAT, corporate tax, and audit services for UAE businesses',
      description: '<p>Pinnacle Accounting & Tax provides <strong>professional accounting, VAT compliance, and corporate tax advisory services</strong> to businesses operating in the UAE.</p><p>As a registered Tax Agent with the Federal Tax Authority, we ensure your business remains fully compliant with UAE tax regulations while optimising your tax position.</p><h2>Why Choose Pinnacle</h2><p>Our team of chartered accountants brings global expertise combined with deep understanding of UAE-specific regulations including VAT, Corporate Tax, and Economic Substance requirements.</p>',
      city: 'Abu Dhabi',
      country: 'United Arab Emirates',
      phone: '+971 2 345 6789',
      website: 'https://pinnacleaccounting.ae',
      whatsapp: '+971 56 345 6789',
      address: 'Tower A, Corniche Road, Abu Dhabi',
      licenseNumber: 'ADNOC-2021-ACC-4521',
      foundedYear: 2016,
      truvisVerified: true,
      truvisClient: false,
      featured: false,
      industrySlug: 'financial-services',
      tagSlugs: ['accounting-audit', 'tax-advisory', 'compliance'],
      services: [
        { type: 'service' as const, title: 'VAT Registration & Filing', description: 'FTA registration, quarterly returns, and reclaim processing' },
        { type: 'service' as const, title: 'Corporate Tax Advisory', description: 'CT registration, planning, and annual filing under UAE CT law' },
        { type: 'service' as const, title: 'Financial Audit', description: 'Statutory audit and assurance services' },
        { type: 'service' as const, title: 'Bookkeeping', description: 'Monthly management accounts and financial reporting' },
      ],
    },
    {
      email: 'contact@harbortechnologies.com',
      companyName: 'Harbor Technologies',
      slug: 'harbor-technologies',
      tagline: 'Cloud solutions and digital transformation for enterprise',
      description: '<p>Harbor Technologies is a <strong>leading technology consultancy</strong> specialising in cloud infrastructure, cybersecurity, and enterprise digital transformation across the UAE and GCC.</p><p>As a certified partner of Microsoft, AWS, and Google Cloud, we design and implement scalable technology solutions for financial services, government, and healthcare clients.</p>',
      city: 'Dubai',
      country: 'United Arab Emirates',
      phone: '+971 4 456 7890',
      website: 'https://harbortechnologies.com',
      whatsapp: '+971 52 456 7890',
      address: 'Dubai Internet City, Building 1',
      licenseNumber: 'DIC-2020-TECH-7834',
      foundedYear: 2019,
      truvisVerified: false,
      truvisClient: true,
      featured: false,
      industrySlug: 'technology',
      tagSlugs: ['business-advisory'],
      services: [
        { type: 'service' as const, title: 'Cloud Migration', description: 'End-to-end migration to AWS, Azure, and Google Cloud' },
        { type: 'service' as const, title: 'Cybersecurity Assessment', description: 'Penetration testing and security architecture review' },
        { type: 'service' as const, title: 'DevOps & Automation', description: 'CI/CD pipeline design and infrastructure automation' },
      ],
    },
    {
      email: 'info@meridianrealty.ae',
      companyName: 'Meridian Realty Group',
      slug: 'meridian-realty-group',
      tagline: 'Premium commercial and residential real estate in UAE',
      description: '<p>Meridian Realty Group is a <strong>RERA-registered real estate brokerage</strong> specialising in commercial property acquisition, development advisory, and property management services across Dubai and Abu Dhabi.</p>',
      city: 'Dubai',
      country: 'United Arab Emirates',
      phone: '+971 4 567 8901',
      website: 'https://meridianrealty.ae',
      whatsapp: '+971 50 567 8901',
      address: 'Business Bay, The Exchange, Dubai',
      licenseNumber: 'RERA-BRN-34521',
      foundedYear: 2012,
      truvisVerified: false,
      truvisClient: false,
      featured: false,
      industrySlug: 'real-estate',
      tagSlugs: [],
      services: [
        { type: 'service' as const, title: 'Commercial Leasing', description: 'Office and retail space acquisition and negotiation' },
        { type: 'service' as const, title: 'Investment Property', description: 'Buy-to-let advisory and ROI analysis' },
      ],
    },
    {
      email: 'trade@globallogix.ae',
      companyName: 'Global Logix FZE',
      slug: 'global-logix-fze',
      tagline: 'International freight forwarding and supply chain solutions',
      description: '<p>Global Logix FZE is an <strong>IATA-certified freight forwarder</strong> and customs broker operating from Jebel Ali Free Zone, providing seamless import/export and logistics services across 180+ countries.</p>',
      city: 'Dubai',
      country: 'United Arab Emirates',
      phone: '+971 4 678 9012',
      website: 'https://globallogix.ae',
      whatsapp: '+971 55 678 9012',
      address: 'JAFZA, Block P, Warehouse 12, Dubai',
      licenseNumber: 'JAFZA-2017-LOG-9234',
      foundedYear: 2017,
      truvisVerified: true,
      truvisClient: false,
      featured: false,
      industrySlug: 'trade-logistics',
      tagSlugs: ['market-entry'],
      services: [
        { type: 'service' as const, title: 'Air Freight', description: 'Express and consolidated airfreight worldwide' },
        { type: 'service' as const, title: 'Sea Freight', description: 'FCL and LCL container shipping services' },
        { type: 'service' as const, title: 'Customs Clearance', description: 'UAE customs documentation and clearance' },
      ],
    },
  ];

  for (const data of demoCompanies) {
    const hashedPw = await bcrypt.hash('Demo@TruVis2024!', 10);

    // Create user
    let user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash: hashedPw,
          role: 'company',
          emailVerified: true,
          isActive: true,
        },
      });
    }

    // Get industry
    const industry = industryMap[data.industrySlug];
    const tagIds = data.tagSlugs.map(s => tagMap[s]?.id).filter(Boolean) as string[];

    // Profile score estimate
    const profileScore = 85;
    const rankScore =
      (data.truvisVerified ? 40 : 0) +
      (data.truvisClient ? 20 : 0) +
      (data.featured ? 30 : 0) +
      8 + // profile score contribution
      (tagIds.length * 2) +
      10; // recency

    // Create or update company
    let company = await prisma.company.findUnique({ where: { userId: user.id } });
    if (!company) {
      company = await prisma.company.create({
        data: {
          userId: user.id,
          slug: data.slug,
          name: data.companyName,
          tagline: data.tagline,
          description: data.description,
          city: data.city,
          country: data.country,
          phone: data.phone,
          email: data.email,
          website: data.website,
          whatsapp: data.whatsapp,
          address: data.address,
          licenseNumber: data.licenseNumber,
          foundedYear: data.foundedYear,
          status: 'approved',
          approvedAt: new Date(),
          approvedById: admin.id,
          truvisVerified: data.truvisVerified,
          truvisClient: data.truvisClient,
          verifiedAt: data.truvisVerified ? new Date() : null,
          verifiedById: data.truvisVerified ? admin.id : null,
          featured: data.featured,
          featuredOrder: data.featuredOrder || 0,
          profileScore,
          rankScore: rankScore.toString(),
          viewsCount: Math.floor(Math.random() * 500) + 50,
          lastActivityAt: new Date(),
          socialLinks: {
            linkedin: `https://linkedin.com/company/${data.slug}`,
            twitter: `https://twitter.com/${data.slug.replace(/-/g, '')}`,
          },
        },
      });
    }

    // Link industry
    if (industry) {
      await prisma.companyIndustry.upsert({
        where: { companyId_industryId: { companyId: company.id, industryId: industry.id } },
        update: {},
        create: { companyId: company.id, industryId: industry.id, isPrimary: true },
      });
    }

    // Assign service tags
    for (const tagId of tagIds) {
      await prisma.companyServiceTag.upsert({
        where: { companyId_tagId: { companyId: company.id, tagId } },
        update: {},
        create: { companyId: company.id, tagId, assignedById: admin.id },
      });
    }

    // Create services
    const existingServices = await prisma.service.count({ where: { companyId: company.id } });
    if (existingServices === 0) {
      await prisma.service.createMany({
        data: data.services.map((s, i) => ({
          companyId: company!.id,
          type: s.type,
          title: s.title,
          description: s.description || undefined,
          sortOrder: i,
        })),
      });
    }

    console.log(`✓ ${data.companyName} [${data.truvisVerified ? '★ Verified' : data.truvisClient ? '✔ Client' : 'Listed'}]`);
  }

  console.log('\n🎉 Demo data seeded!');
  console.log('─────────────────────────────────────────');
  console.log('All demo companies: password = Demo@TruVis2024!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
