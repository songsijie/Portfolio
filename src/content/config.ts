import { defineCollection, z } from 'astro:content';

// 定义博客集合的模式
const blogCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    coverImage: z.string().optional(), // 保留coverImage字段但设为可选
    tags: z.array(z.string()).default([]),
  }),
});

// 导出集合配置
export const collections = {
  'blog': blogCollection,
};
