-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('company', 'admin', 'super_admin');

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('draft', 'pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('service', 'product', 'capability');

-- CreateEnum
CREATE TYPE "BlogStatus" AS ENUM ('draft', 'pending', 'published', 'rejected');

-- CreateEnum
CREATE TYPE "EmployeeCount" AS ENUM ('1-10', '11-50', '51-200', '201-500', '500+');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'cancelled', 'expired', 'past_due');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('monthly', 'annually');

-- CreateEnum
CREATE TYPE "MarketplaceListingType" AS ENUM ('business_for_sale', 'investment', 'partnership');

-- CreateEnum
CREATE TYPE "MarketplaceListingStatus" AS ENUM ('draft', 'active', 'under_offer', 'sold', 'withdrawn');

-- CreateEnum
CREATE TYPE "NdaStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('unread', 'read', 'replied');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'company',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_token" TEXT,
    "email_token_exp" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "license_number" TEXT,
    "description" TEXT,
    "tagline" TEXT,
    "founded_year" INTEGER,
    "employee_count" "EmployeeCount",
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "logo_url" TEXT,
    "cover_url" TEXT,
    "video_url" TEXT,
    "gallery" JSONB NOT NULL DEFAULT '[]',
    "social_links" JSONB NOT NULL DEFAULT '{}',
    "status" "CompanyStatus" NOT NULL DEFAULT 'draft',
    "rejection_reason" TEXT,
    "profile_score" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "featured_until" TIMESTAMP(3),
    "featured_order" INTEGER NOT NULL DEFAULT 0,
    "truvis_client" BOOLEAN NOT NULL DEFAULT false,
    "truvis_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "verified_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "contact_count" INTEGER NOT NULL DEFAULT 0,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rank_score" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "industries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "industry_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_industries" (
    "company_id" TEXT NOT NULL,
    "industry_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "company_industries_pkey" PRIMARY KEY ("company_id","industry_id")
);

-- CreateTable
CREATE TABLE "company_categories" (
    "company_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "company_categories_pkey" PRIMARY KEY ("company_id","category_id")
);

-- CreateTable
CREATE TABLE "truvis_service_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "truvis_service_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_service_tags" (
    "company_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "assigned_by" TEXT,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_service_tags_pkey" PRIMARY KEY ("company_id","tag_id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "type" "ServiceType" NOT NULL DEFAULT 'service',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "cover_url" TEXT,
    "status" "BlogStatus" NOT NULL DEFAULT 'draft',
    "rejection_reason" TEXT,
    "published_at" TIMESTAMP(3),
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_inquiries" (
    "id" TEXT NOT NULL,
    "company_id" TEXT,
    "sender_name" TEXT NOT NULL,
    "sender_email" TEXT NOT NULL,
    "sender_phone" TEXT,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "ip_address" TEXT,
    "status" "InquiryStatus" NOT NULL DEFAULT 'unread',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "price_monthly" DECIMAL(10,2),
    "price_annually" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "features" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_subscriptions" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "billing_cycle" "BillingCycle" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "payment_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_listings" (
    "id" TEXT NOT NULL,
    "company_id" TEXT,
    "listed_by" TEXT NOT NULL,
    "type" "MarketplaceListingType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "asking_price" DECIMAL(15,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "revenue_annual" DECIMAL(15,2),
    "ebitda" DECIMAL(15,2),
    "industry_id" TEXT,
    "country" TEXT,
    "city" TEXT,
    "is_confidential" BOOLEAN NOT NULL DEFAULT true,
    "nda_required" BOOLEAN NOT NULL DEFAULT true,
    "status" "MarketplaceListingStatus" NOT NULL DEFAULT 'draft',
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "marketplace_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nda_requests" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "company_name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "purpose" TEXT,
    "status" "NdaStatus" NOT NULL DEFAULT 'pending',
    "signed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nda_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "companies_user_id_key" ON "companies"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE INDEX "companies_status_rank_score_idx" ON "companies"("status", "rank_score" DESC);

-- CreateIndex
CREATE INDEX "companies_country_city_idx" ON "companies"("country", "city");

-- CreateIndex
CREATE INDEX "companies_truvis_verified_featured_idx" ON "companies"("truvis_verified", "featured");

-- CreateIndex
CREATE UNIQUE INDEX "industries_slug_key" ON "industries"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "truvis_service_tags_slug_key" ON "truvis_service_tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_status_published_at_idx" ON "blog_posts"("status", "published_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_slug_key" ON "subscription_plans"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "company_subscriptions_company_id_key" ON "company_subscriptions"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_listings_company_id_key" ON "marketplace_listings"("company_id");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "industries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_industries" ADD CONSTRAINT "company_industries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_industries" ADD CONSTRAINT "company_industries_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "industries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_categories" ADD CONSTRAINT "company_categories_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_categories" ADD CONSTRAINT "company_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_service_tags" ADD CONSTRAINT "company_service_tags_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_service_tags" ADD CONSTRAINT "company_service_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "truvis_service_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_service_tags" ADD CONSTRAINT "company_service_tags_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_inquiries" ADD CONSTRAINT "contact_inquiries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_subscriptions" ADD CONSTRAINT "company_subscriptions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_subscriptions" ADD CONSTRAINT "company_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_listed_by_fkey" FOREIGN KEY ("listed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "industries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nda_requests" ADD CONSTRAINT "nda_requests_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "marketplace_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nda_requests" ADD CONSTRAINT "nda_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
