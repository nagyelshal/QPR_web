import { defineCollection, z } from 'astro:content';

const newsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    summary: z.string()
  })
});

const archiveCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]).optional(),
    summary: z.string().optional(),
    archived: z.boolean().default(true),
    archived_at: z.coerce.date(),
    original_collection: z.string().optional(),
    original_path: z.string().optional(),
    archive_reason: z.string().optional()
  })
});

export const collections = {
  news: newsCollection,
  archive: archiveCollection
};
