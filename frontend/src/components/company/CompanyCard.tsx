import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Globe, Users } from 'lucide-react';
import { TruvisVerifiedBadge, TruvisClientBadge } from '@/components/ui/Badge';
import { getInitials, getEmployeeLabel } from '@/lib/utils';
import type { Company } from '@/types';

interface CompanyCardProps {
  company: Company;
}

export function CompanyCard({ company }: CompanyCardProps) {
  return (
    <Link href={`/directory/${company.slug}`}>
      <article className="company-card group">
        {/* Cover / Header */}
        <div className="relative h-28 bg-gradient-to-br from-navy-900 to-navy-800 overflow-hidden">
          {company.coverUrl ? (
            <Image
              src={company.coverUrl}
              alt={`${company.name} cover`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-full" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)',
              }} />
            </div>
          )}

          {/* Featured badge */}
          {company.featured && (
            <div className="absolute top-2 right-2">
              <span className="px-2 py-0.5 bg-gold-500 text-white text-xs font-semibold rounded-full">
                Featured
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Logo + Name */}
          <div className="flex items-start gap-3 -mt-8 mb-3">
            <div className="w-14 h-14 rounded-xl border-2 border-white shadow-md bg-white flex-shrink-0 overflow-hidden">
              {company.logoUrl ? (
                <Image
                  src={company.logoUrl}
                  alt={`${company.name} logo`}
                  width={56}
                  height={56}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full bg-navy-900 flex items-center justify-center rounded-xl">
                  <span className="text-white font-bold text-lg">{getInitials(company.name)}</span>
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1 mt-8 pt-1">
              {company.truvisVerified && <TruvisVerifiedBadge />}
              {company.truvisClient && !company.truvisVerified && <TruvisClientBadge />}
            </div>
          </div>

          {/* Company Name */}
          <h3 className="font-semibold text-navy-900 text-base leading-snug mb-1 group-hover:text-navy-700 transition-colors">
            {company.name}
          </h3>

          {/* Tagline */}
          {company.tagline && (
            <p className="text-gray-500 text-xs mb-3 line-clamp-2 leading-relaxed">
              {company.tagline}
            </p>
          )}

          {/* Meta info */}
          <div className="flex flex-col gap-1 text-xs text-gray-500">
            {(company.city || company.country) && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span>{[company.city, company.country].filter(Boolean).join(', ')}</span>
              </div>
            )}
            {company.website && (
              <div className="flex items-center gap-1">
                <Globe className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">
                  {company.website.replace(/^https?:\/\/(www\.)?/, '')}
                </span>
              </div>
            )}
          </div>

          {/* Industries */}
          {company.industries && company.industries.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-gray-50">
              {company.industries.slice(0, 2).map(({ industry }) => (
                <span
                  key={industry.id}
                  className="px-2 py-0.5 bg-navy-50 text-navy-700 rounded text-xs"
                >
                  {industry.name}
                </span>
              ))}
              {company.industries.length > 2 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                  +{company.industries.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
