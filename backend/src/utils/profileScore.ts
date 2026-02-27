import type { Company } from '@prisma/client';

/**
 * Computes profile completeness score (0–100)
 * Used in ranking algorithm and UI progress indicator.
 */
export function computeProfileScore(company: Partial<Company>): number {
  let score = 0;

  // Logo uploaded: 15 pts
  if (company.logoUrl) score += 15;

  // Cover uploaded: 10 pts
  if (company.coverUrl) score += 10;

  // Description (>100 chars): 15 pts
  if (company.description && company.description.replace(/<[^>]*>/g, '').length > 100) score += 15;

  // Country + City + Address: 10 pts
  if (company.country && company.city && company.address) score += 10;

  // Phone + Email + Website: 10 pts
  if (company.phone && company.email && company.website) score += 10;

  // License number: 5 pts
  if (company.licenseNumber) score += 5;

  // Gallery (checked separately — needs gallery array): 10 pts
  const gallery = Array.isArray(company.gallery) ? company.gallery : [];
  if (gallery.length >= 3) score += 10;

  // Tagline: 5 pts
  if (company.tagline) score += 5;

  // Video link: 5 pts
  if (company.videoUrl) score += 5;

  // Social links (≥2): 5 pts
  const social = (company.socialLinks as Record<string, string>) || {};
  const socialCount = Object.values(social).filter(Boolean).length;
  if (socialCount >= 2) score += 5;

  // Whatsapp: 5 pts (UAE-specific — very common)
  if (company.whatsapp) score += 5;

  return Math.min(score, 100);
}

/**
 * Computes the search/display rank score.
 * Higher = shown first in listings.
 */
export function computeRankScore(
  company: Partial<Company> & { serviceTagCount?: number }
): number {
  let score = 0;

  // Verified badge: 40 pts
  if (company.truvisVerified) score += 40;

  // Client badge: 20 pts
  if (company.truvisClient) score += 20;

  // Featured: 30 pts
  if (company.featured) {
    const now = new Date();
    const featuredUntil = company.featuredUntil ? new Date(company.featuredUntil) : null;
    if (!featuredUntil || featuredUntil > now) {
      score += 30;
    }
  }

  // Profile completeness: max 10 pts
  score += ((company.profileScore || 0) / 100) * 10;

  // Service tags: max ~20 pts (2 pts each, capped)
  const tagBonus = Math.min((company.serviceTagCount || 0) * 2, 20);
  score += tagBonus;

  // View popularity: max 10 pts
  const viewBonus = Math.min((company.viewsCount || 0) / 100, 10);
  score += viewBonus;

  // Recency bonus: 10 pts if active in last 30 days
  if (company.lastActivityAt) {
    const daysSinceActivity =
      (Date.now() - new Date(company.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceActivity < 30) score += 10;
  }

  return parseFloat(score.toFixed(4));
}
