import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Globe, Phone, Mail, Linkedin, Twitter, Instagram, Facebook } from 'lucide-react';
import { Navbar } from '@/components/shared/Navbar';
import { TruvisVerifiedBadge, TruvisClientBadge, Badge } from '@/components/ui/Badge';
import { ContactForm } from '@/components/public/ContactForm';
import { getInitials, formatDate, getEmployeeLabel } from '@/lib/utils';
import type { Company } from '@/types';

const API_URL = process.env.API_URL || 'http://localhost:4000/api';

async function getCompany(slug: string): Promise<Company | null> {
  try {
    const res = await fetch(`${API_URL}/companies/${slug}`, {
      next: { revalidate: 86400 }, // ISR: 24 hours
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const company = await getCompany(params.slug);
  if (!company) return { title: 'Company Not Found' };

  return {
    title: company.metaTitle || company.name,
    description: company.metaDescription || company.tagline || `${company.name} — verified on TruVis.info`,
    openGraph: {
      title: company.name,
      description: company.tagline || '',
      images: company.coverUrl ? [company.coverUrl] : [],
      type: 'profile',
    },
  };
}

export default async function CompanyProfilePage({ params }: { params: { slug: string } }) {
  const company = await getCompany(params.slug);
  if (!company) notFound();

  const socialLinks = company.socialLinks as Record<string, string>;

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.name,
    url: company.website,
    logo: company.logoUrl,
    address: {
      '@type': 'PostalAddress',
      addressLocality: company.city,
      addressCountry: company.country,
      streetAddress: company.address,
    },
    telephone: company.phone,
    email: company.email,
    foundingDate: company.foundedYear?.toString(),
    description: company.tagline,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />

      <div className="pt-16">
        {/* Hero / Cover */}
        <div className="relative h-48 md:h-64 bg-navy-900 overflow-hidden">
          {company.coverUrl ? (
            <Image src={company.coverUrl} alt={`${company.name} cover`} fill className="object-cover" priority />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-navy-900 to-navy-800 opacity-90" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 -mt-8 pb-16">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header Card */}
              <div className="bg-white rounded-xl shadow-card p-6">
                <div className="flex items-start gap-4">
                  {/* Logo */}
                  <div className="w-20 h-20 rounded-xl border-4 border-white shadow-md bg-white flex-shrink-0 overflow-hidden -mt-12">
                    {company.logoUrl ? (
                      <Image src={company.logoUrl} alt={`${company.name} logo`} width={80} height={80} className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full bg-navy-900 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">{getInitials(company.name)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {company.truvisVerified && <TruvisVerifiedBadge />}
                      {company.truvisClient && <TruvisClientBadge />}
                    </div>
                    <h1 className="text-2xl font-bold text-navy-900">{company.name}</h1>
                    {company.tagline && (
                      <p className="text-gray-500 mt-1">{company.tagline}</p>
                    )}

                    {/* Quick meta */}
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                      {(company.city || company.country) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {[company.city, company.country].filter(Boolean).join(', ')}
                        </span>
                      )}
                      {company.website && (
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-navy-700">
                          <Globe className="w-4 h-4" />
                          {company.website.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      )}
                    </div>

                    {/* Industries */}
                    {company.industries && company.industries.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {company.industries.map(({ industry }) => (
                          <Link
                            key={industry.id}
                            href={`/directory?industryId=${industry.id}`}
                            className="px-2.5 py-1 bg-navy-50 text-navy-700 rounded-lg text-xs font-medium hover:bg-navy-100 transition-colors"
                          >
                            {industry.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* About */}
              {company.description && (
                <div className="bg-white rounded-xl shadow-card p-6">
                  <h2 className="text-lg font-semibold text-navy-900 mb-4">About</h2>
                  <div
                    className="prose-truvis"
                    dangerouslySetInnerHTML={{ __html: company.description }}
                  />
                </div>
              )}

              {/* Services / Products */}
              {company.services && company.services.length > 0 && (
                <div className="bg-white rounded-xl shadow-card p-6">
                  <h2 className="text-lg font-semibold text-navy-900 mb-4">Services & Products</h2>
                  <div className="space-y-4">
                    {['service', 'product', 'capability'].map(type => {
                      const items = company.services!.filter(s => s.type === type);
                      if (!items.length) return null;
                      return (
                        <div key={type}>
                          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            {type === 'service' ? 'Services' : type === 'product' ? 'Products' : 'Capabilities'}
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {items.map(service => (
                              <div key={service.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="font-medium text-navy-900 text-sm">{service.title}</div>
                                {service.description && (
                                  <p className="text-gray-500 text-xs mt-1 leading-relaxed">{service.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Gallery */}
              {company.gallery && company.gallery.length > 0 && (
                <div className="bg-white rounded-xl shadow-card p-6">
                  <h2 className="text-lg font-semibold text-navy-900 mb-4">Gallery</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {company.gallery.map((url, i) => (
                      <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                        <Image src={url} alt={`Gallery ${i + 1}`} fill className="object-cover hover:scale-105 transition-transform duration-300" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TruVis Service Tags */}
              {company.serviceTags && company.serviceTags.length > 0 && (
                <div className="bg-white rounded-xl shadow-card p-6">
                  <h2 className="text-lg font-semibold text-navy-900 mb-4">TruVis Services Received</h2>
                  <div className="flex flex-wrap gap-2">
                    {company.serviceTags.map(({ tag }) => (
                      <span key={tag.id} className="px-3 py-1.5 bg-gold-50 text-gold-800 border border-gold-200 rounded-full text-sm font-medium">
                        {tag.icon && <span className="mr-1">{tag.icon}</span>}
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Blog Posts */}
              {company.blogPosts && company.blogPosts.length > 0 && (
                <div className="bg-white rounded-xl shadow-card p-6">
                  <h2 className="text-lg font-semibold text-navy-900 mb-4">Latest Insights</h2>
                  <div className="space-y-4">
                    {company.blogPosts.map(post => (
                      <Link key={post.id} href={`/blog/${post.slug}`} className="flex gap-3 group">
                        {post.coverUrl && (
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <Image src={post.coverUrl} alt={post.title} width={64} height={64} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium text-navy-900 text-sm group-hover:text-navy-700 line-clamp-2">{post.title}</h4>
                          <p className="text-xs text-gray-400 mt-1">{post.publishedAt ? formatDate(post.publishedAt) : ''}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Contact Card */}
              <ContactForm slug={company.slug} companyName={company.name} />

              {/* Company Details */}
              <div className="bg-white rounded-xl shadow-card p-5">
                <h3 className="font-semibold text-navy-900 mb-4">Company Details</h3>
                <dl className="space-y-3 text-sm">
                  {company.foundedYear && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Founded</dt>
                      <dd className="font-medium text-navy-900">{company.foundedYear}</dd>
                    </div>
                  )}
                  {company.employeeCount && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Team Size</dt>
                      <dd className="font-medium text-navy-900">{getEmployeeLabel(company.employeeCount)}</dd>
                    </div>
                  )}
                  {company.licenseNumber && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">License</dt>
                      <dd className="font-medium text-navy-900">{company.licenseNumber}</dd>
                    </div>
                  )}
                  {company.approvedAt && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Listed since</dt>
                      <dd className="font-medium text-navy-900">{formatDate(company.approvedAt)}</dd>
                    </div>
                  )}
                </dl>

                {/* Contact Info */}
                {(company.phone || company.email || company.website) && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                    {company.phone && (
                      <a href={`tel:${company.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-navy-900">
                        <Phone className="w-4 h-4" />{company.phone}
                      </a>
                    )}
                    {company.email && (
                      <a href={`mailto:${company.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-navy-900">
                        <Mail className="w-4 h-4" />{company.email}
                      </a>
                    )}
                  </div>
                )}

                {/* Social Links */}
                {Object.values(socialLinks).some(Boolean) && (
                  <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                    {socialLinks.linkedin && (
                      <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 rounded-lg hover:bg-navy-50 transition-colors">
                        <Linkedin className="w-4 h-4 text-gray-600" />
                      </a>
                    )}
                    {socialLinks.twitter && (
                      <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 rounded-lg hover:bg-navy-50 transition-colors">
                        <Twitter className="w-4 h-4 text-gray-600" />
                      </a>
                    )}
                    {socialLinks.instagram && (
                      <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 rounded-lg hover:bg-navy-50 transition-colors">
                        <Instagram className="w-4 h-4 text-gray-600" />
                      </a>
                    )}
                    {socialLinks.facebook && (
                      <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 rounded-lg hover:bg-navy-50 transition-colors">
                        <Facebook className="w-4 h-4 text-gray-600" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
