'use client';

import { useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { companyApi, publicApi } from '@/lib/api';
import { CompanyCard } from '@/components/company/CompanyCard';
import type { SearchResult, Industry } from '@/types';

const SORT_OPTIONS = [
  { value: 'rank', label: 'Best Match' },
  { value: 'verified', label: 'Verified First' },
  { value: 'newest', label: 'Recently Added' },
  { value: 'az', label: 'A to Z' },
];

export function DirectoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [showFilters, setShowFilters] = useState(false);

  const q = searchParams.get('q') || '';
  const country = searchParams.get('country') || '';
  const city = searchParams.get('city') || '';
  const industryId = searchParams.get('industryId') || '';
  const truvisVerified = searchParams.get('truvisVerified') || '';
  const sortBy = searchParams.get('sortBy') || 'rank';
  const page = parseInt(searchParams.get('page') || '1');

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`/directory?${params.toString()}`);
  }, [searchParams, router]);

  const clearFilters = () => {
    router.push('/directory');
  };

  const { data: results, isLoading } = useQuery<SearchResult>({
    queryKey: ['companies', q, country, city, industryId, truvisVerified, sortBy, page],
    queryFn: () => companyApi.search({ q, country, city, industryId, truvisVerified: truvisVerified || undefined, sortBy, page, limit: 20 }) as Promise<SearchResult>,
  });

  const { data: industries } = useQuery<Industry[]>({
    queryKey: ['industries'],
    queryFn: () => publicApi.getIndustries() as Promise<Industry[]>,
    staleTime: Infinity,
  });

  const { data: locations } = useQuery<{ countries: { name: string; count: number }[] }>({
    queryKey: ['locations'],
    queryFn: () => publicApi.getLocations() as Promise<{ countries: { name: string; count: number }[] }>,
    staleTime: 5 * 60 * 1000,
  });

  const hasActiveFilters = !!(country || city || industryId || truvisVerified);

  return (
    <div>
      {/* Search Header */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="section-container py-4">
          <div className="flex gap-3 items-center">
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search companies, industries, services..."
                defaultValue={q}
                onChange={(e) => updateParam('q', e.target.value)}
                className="input-field pl-9"
              />
            </div>

            {/* Sort */}
            <div className="relative hidden md:block">
              <select
                value={sortBy}
                onChange={(e) => updateParam('sortBy', e.target.value)}
                className="input-field pr-8 appearance-none cursor-pointer"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-ghost gap-2 ${hasActiveFilters ? 'text-navy-900 bg-navy-50' : ''}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-5 h-5 bg-navy-900 text-white rounded-full text-xs flex items-center justify-center">
                  {[country, city, industryId, truvisVerified].filter(Boolean).length}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn-ghost text-red-500 hover:text-red-600 hover:bg-red-50">
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in">
              {/* Country filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Country</label>
                <select
                  value={country}
                  onChange={(e) => updateParam('country', e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="">All Countries</option>
                  {locations?.countries.map(c => (
                    <option key={c.name} value={c.name || ''}>{c.name} ({c.count})</option>
                  ))}
                </select>
              </div>

              {/* Industry filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Industry</label>
                <select
                  value={industryId}
                  onChange={(e) => updateParam('industryId', e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="">All Industries</option>
                  {industries?.map(ind => (
                    <option key={ind.id} value={ind.id}>{ind.name}</option>
                  ))}
                </select>
              </div>

              {/* Verification filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Verification</label>
                <select
                  value={truvisVerified}
                  onChange={(e) => updateParam('truvisVerified', e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="">All Companies</option>
                  <option value="true">TruVis Verified Only</option>
                </select>
              </div>

              {/* City filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
                <input
                  type="text"
                  placeholder="Enter city..."
                  defaultValue={city}
                  onChange={(e) => updateParam('city', e.target.value)}
                  className="input-field text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="section-container py-8">
        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            {isLoading ? (
              'Searching...'
            ) : (
              <>
                <span className="font-semibold text-navy-900">{results?.pagination.total || 0}</span> companies found
                {q && ` for "${q}"`}
              </>
            )}
          </p>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-56 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : results?.data.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-navy-900 mb-2">No companies found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search or filters</p>
            <button onClick={clearFilters} className="btn-primary">
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {results?.data.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>

            {/* Pagination */}
            {results && results.pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: Math.min(results.pagination.pages, 7) }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => updateParam('page', String(p))}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      p === page
                        ? 'bg-navy-900 text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-navy-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
