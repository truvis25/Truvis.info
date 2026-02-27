import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-AE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(num);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trim() + '...';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function buildSearchUrl(params: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) searchParams.set(k, v);
  });
  const qs = searchParams.toString();
  return `/directory${qs ? `?${qs}` : ''}`;
}

export function getEmployeeLabel(count: string): string {
  const labels: Record<string, string> = {
    'one_to_ten': '1–10 employees',
    'eleven_to_fifty': '11–50 employees',
    'fifty_to_two': '51–200 employees',
    'two_to_five': '201–500 employees',
    'five_plus': '500+ employees',
  };
  return labels[count] || count;
}
