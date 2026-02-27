export interface Company {
  id: string;
  slug: string;
  name: string;
  licenseNumber?: string;
  description?: string;
  tagline?: string;
  foundedYear?: number;
  employeeCount?: string;
  website?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  logoUrl?: string;
  coverUrl?: string;
  videoUrl?: string;
  gallery: string[];
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
  };
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  profileScore: number;
  featured: boolean;
  featuredUntil?: string;
  truvisClient: boolean;
  truvisVerified: boolean;
  verifiedAt?: string;
  approvedAt?: string;
  viewsCount: number;
  contactCount: number;
  rankScore: number;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  industries?: CompanyIndustry[];
  categories?: CompanyCategory[];
  serviceTags?: CompanyServiceTag[];
  services?: Service[];
  blogPosts?: BlogPost[];
}

export interface Industry {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  categories?: Category[];
}

export interface Category {
  id: string;
  industryId: string;
  name: string;
  slug: string;
}

export interface CompanyIndustry {
  companyId: string;
  industryId: string;
  isPrimary: boolean;
  industry: Industry;
}

export interface CompanyCategory {
  companyId: string;
  categoryId: string;
  category: Category;
}

export interface TruvisServiceTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface CompanyServiceTag {
  companyId: string;
  tagId: string;
  tag: TruvisServiceTag;
}

export interface Service {
  id: string;
  companyId: string;
  type: 'service' | 'product' | 'capability';
  title: string;
  description?: string;
  sortOrder: number;
}

export interface BlogPost {
  id: string;
  companyId: string;
  authorId: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverUrl?: string;
  status: 'draft' | 'pending' | 'published' | 'rejected';
  rejectionReason?: string;
  publishedAt?: string;
  viewsCount: number;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
  company?: Pick<Company, 'name' | 'slug' | 'logoUrl' | 'truvisVerified' | 'truvisClient'>;
}

export interface SearchResult {
  data: Company[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DashboardStats {
  totalCompanies: number;
  approvedCompanies: number;
  pendingCompanies: number;
  verifiedCompanies: number;
  pendingBlogs: number;
  recentInquiries: number;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValues?: object;
  newValues?: object;
  ipAddress?: string;
  createdAt: string;
  user?: { email: string; role: string };
}
