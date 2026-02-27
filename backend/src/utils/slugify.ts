import slugifyLib from 'slugify';
import prisma from '../config/database';

export function createSlug(text: string): string {
  return slugifyLib(text, {
    lower: true,
    strict: true,
    trim: true,
  });
}

export async function uniqueCompanySlug(name: string, existingId?: string): Promise<string> {
  let slug = createSlug(name);
  let counter = 0;

  while (true) {
    const candidate = counter === 0 ? slug : `${slug}-${counter}`;
    const existing = await prisma.company.findUnique({ where: { slug: candidate } });

    if (!existing || existing.id === existingId) {
      return candidate;
    }
    counter++;
  }
}

export async function uniqueBlogSlug(title: string, existingId?: string): Promise<string> {
  let slug = createSlug(title);
  let counter = 0;

  while (true) {
    const candidate = counter === 0 ? slug : `${slug}-${counter}`;
    const existing = await prisma.blogPost.findUnique({ where: { slug: candidate } });

    if (!existing || existing.id === existingId) {
      return candidate;
    }
    counter++;
  }
}
