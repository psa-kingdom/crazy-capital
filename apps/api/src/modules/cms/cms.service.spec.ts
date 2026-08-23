import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CmsService } from './cms.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BlogPostStatus, UserRole } from '@cc/types';

describe('CmsService (Vertical Slice 1.13 - CMS & Knowledge Base Engine)', () => {
  let service: CmsService;
  let prisma: PrismaService;

  const mockCategory = {
    id: 'cat-101',
    organizationId: 'org-cc-india',
    name: 'Company Incorporation',
    slug: 'incorporation-guide',
    description: 'Guides on registering corporate entities in India',
    icon: 'Building2',
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { posts: 3 },
  };

  const mockAuthor = {
    id: 'user-admin-01',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@crazycapital.in',
  };

  const mockPublishedPost = {
    id: 'post-001',
    organizationId: 'org-cc-india',
    categoryId: 'cat-101',
    authorId: 'user-admin-01',
    title: 'How to Register a Private Limited Company in India (2026 Guide)',
    slug: 'how-to-register-pvt-ltd-company-india',
    excerpt: 'Complete SPICe+ MCA guide for entrepreneurs.',
    content: '# SPICe+ Guide\n\nLearn how to incorporate in 3-5 days...',
    coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
    readingTimeMin: 6,
    status: BlogPostStatus.PUBLISHED,
    publishedAt: new Date('2026-08-01T10:00:00Z'),
    tags: ['Incorporation', 'MCA', 'Pvt Ltd'],
    featured: true,
    viewCount: 142,
    metaTitle: 'Pvt Ltd Company Registration Guide | Crazy Capital',
    metaDescription: 'Step-by-step SPICe+ process for private limited registration.',
    metaKeywords: 'pvt ltd, mca, company registration',
    canonicalUrl: 'https://crazycapital.in/blog/how-to-register-pvt-ltd-company-india',
    ogTitle: 'How to Register a Pvt Ltd Company in India',
    ogDescription: 'Step-by-step SPICe+ process for private limited registration.',
    ogImage: 'https://crazycapital.in/og/company-reg.jpg',
    twitterCard: 'summary_large_image',
    createdAt: new Date('2026-08-01T09:00:00Z'),
    updatedAt: new Date('2026-08-01T10:00:00Z'),
    deletedAt: null,
    category: mockCategory,
    author: mockAuthor,
  };

  const mockDraftPost = {
    id: 'post-002',
    organizationId: 'org-cc-india',
    categoryId: 'cat-101',
    authorId: 'user-admin-01',
    title: 'Upcoming Changes to GSTR-3B in Late 2026',
    slug: 'upcoming-changes-gstr-3b-2026',
    excerpt: 'Draft notes on upcoming GST rules.',
    content: 'Draft content in progress...',
    coverImage: null,
    readingTimeMin: 4,
    status: BlogPostStatus.DRAFT,
    publishedAt: null,
    tags: ['GST', 'Tax'],
    featured: false,
    viewCount: 0,
    metaTitle: null,
    metaDescription: null,
    metaKeywords: null,
    canonicalUrl: null,
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    twitterCard: 'summary_large_image',
    createdAt: new Date('2026-08-15T09:00:00Z'),
    updatedAt: new Date('2026-08-15T09:00:00Z'),
    deletedAt: null,
    category: mockCategory,
    author: mockAuthor,
  };

  const mockPrismaService = {
    blogPost: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    blogCategory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    organization: {
      findFirst: jest.fn().mockResolvedValue({ id: 'org-cc-india', code: 'CC_INDIA' }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CmsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CmsService>(CmsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('1. Public Article Querying & Draft Exclusion', () => {
    it('should query only PUBLISHED articles with publishedAt <= now', async () => {
      mockPrismaService.blogPost.findMany.mockResolvedValue([mockPublishedPost]);
      mockPrismaService.blogPost.count.mockResolvedValue(1);

      const result = await service.getPublicPosts({ page: 1, limit: 10 });

      expect(mockPrismaService.blogPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: BlogPostStatus.PUBLISHED,
            deletedAt: null,
          }),
        }),
      );
      expect(result.data).toHaveLength(1);
      expect(result.data[0].slug).toBe('how-to-register-pvt-ltd-company-india');
      expect(result.meta.total).toBe(1);
    });

    it('should filter public articles by category slug', async () => {
      mockPrismaService.blogPost.findMany.mockResolvedValue([mockPublishedPost]);
      mockPrismaService.blogPost.count.mockResolvedValue(1);

      await service.getPublicPosts({ categorySlug: 'incorporation-guide' });

      expect(mockPrismaService.blogPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: { slug: 'incorporation-guide' },
          }),
        }),
      );
    });

    it('should search public articles by text keyword', async () => {
      mockPrismaService.blogPost.findMany.mockResolvedValue([mockPublishedPost]);
      mockPrismaService.blogPost.count.mockResolvedValue(1);

      await service.getPublicPosts({ search: 'incorporation' });

      expect(mockPrismaService.blogPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { title: { contains: 'incorporation', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });
  });

  describe('2. Public Slug Resolution & View Counting', () => {
    it('should return published post by slug and increment view count', async () => {
      mockPrismaService.blogPost.findFirst.mockResolvedValue(mockPublishedPost);
      mockPrismaService.blogPost.update.mockResolvedValue({
        ...mockPublishedPost,
        viewCount: 143,
      });

      const result = await service.getPublicPostBySlug('how-to-register-pvt-ltd-company-india');

      expect(result.slug).toBe('how-to-register-pvt-ltd-company-india');
      expect(mockPrismaService.blogPost.findFirst).toHaveBeenCalledWith({
        where: {
          slug: 'how-to-register-pvt-ltd-company-india',
          status: BlogPostStatus.PUBLISHED,
          deletedAt: null,
        },
        include: {
          category: true,
          author: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });
      expect(mockPrismaService.blogPost.update).toHaveBeenCalledWith({
        where: { id: mockPublishedPost.id },
        data: { viewCount: { increment: 1 } },
      });
    });

    it('should throw NotFoundException if slug does not exist or is DRAFT', async () => {
      mockPrismaService.blogPost.findFirst.mockResolvedValue(null);

      await expect(service.getPublicPostBySlug('non-existent-or-draft-slug')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('3. Public Category Listing & Counts', () => {
    it('should return active categories with post counts', async () => {
      mockPrismaService.blogCategory.findMany.mockResolvedValue([mockCategory]);

      const result = await service.getPublicCategories();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Company Incorporation');
      expect(result[0].postCount).toBe(3);
    });
  });

  describe('4. Admin Management & Lifecycle CRUD', () => {
    it('should allow Admin to view all posts including DRAFT and ARCHIVED', async () => {
      mockPrismaService.blogPost.findMany.mockResolvedValue([mockPublishedPost, mockDraftPost]);
      mockPrismaService.blogPost.count.mockResolvedValue(2);

      const user = { id: 'user-admin-01', organizationId: 'org-cc-india' };
      const result = await service.getAdminPosts(user, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(mockPrismaService.blogPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-cc-india',
            deletedAt: null,
          }),
        }),
      );
    });

    it('should create a new blog post with automatic slug generation and SEO metadata', async () => {
      mockPrismaService.blogPost.findUnique.mockResolvedValue(null);
      mockPrismaService.blogPost.create.mockResolvedValue({
        id: 'post-new-001',
        title: 'Complete Guide to Trademark TM-A Filing in 2026',
        slug: 'complete-guide-to-trademark-tm-a-filing-in-2026',
        status: BlogPostStatus.PUBLISHED,
        publishedAt: expect.any(Date),
      });

      const user = { id: 'user-admin-01', organizationId: 'org-cc-india' };
      const dto = {
        title: 'Complete Guide to Trademark TM-A Filing in 2026',
        excerpt: 'Everything you need to know about TM-A filing...',
        content: '# Trademark Filing Guide\n\nProtect your brand identity...',
        status: BlogPostStatus.PUBLISHED,
        metaTitle: 'TM-A Trademark Registration Guide | Crazy Capital',
        metaDescription: 'Step-by-step trademark registration instructions for Indian startups.',
      };

      const result = await service.createPost(user, dto as any);

      expect(mockPrismaService.blogPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: dto.title,
            slug: 'complete-guide-to-trademark-tm-a-filing-in-2026',
            status: BlogPostStatus.PUBLISHED,
            metaTitle: dto.metaTitle,
            metaDescription: dto.metaDescription,
          }),
        }),
      );
      expect(result.id).toBe('post-new-001');
    });

    it('should handle slug collisions by appending a unique random suffix', async () => {
      // First check returns collision
      mockPrismaService.blogPost.findUnique.mockResolvedValueOnce({ id: 'existing-post' });
      mockPrismaService.blogPost.create.mockImplementation(({ data }) => Promise.resolve({ id: 'post-collision-resolved', ...data }));

      const user = { id: 'user-admin-01', organizationId: 'org-cc-india' };
      const dto = {
        title: 'Pvt Ltd Registration Guide',
        excerpt: 'Excerpt...',
        content: 'Content...',
      };

      const result = await service.createPost(user, dto as any);

      expect(result.slug).toMatch(/^pvt-ltd-registration-guide-\d{4}$/);
    });

    it('should update an existing post and handle status transitions', async () => {
      mockPrismaService.blogPost.findUnique.mockResolvedValue(mockDraftPost);
      mockPrismaService.blogPost.update.mockResolvedValue({
        ...mockDraftPost,
        status: BlogPostStatus.PUBLISHED,
        publishedAt: new Date(),
      });

      const result = await service.updatePost('post-002', {
        status: BlogPostStatus.PUBLISHED,
      });

      expect(result.status).toBe(BlogPostStatus.PUBLISHED);
      expect(mockPrismaService.blogPost.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'post-002' },
          data: expect.objectContaining({
            status: BlogPostStatus.PUBLISHED,
            publishedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should soft delete a blog post by updating deletedAt and ARCHIVED status', async () => {
      mockPrismaService.blogPost.findUnique.mockResolvedValue(mockPublishedPost);
      mockPrismaService.blogPost.update.mockResolvedValue({
        ...mockPublishedPost,
        status: BlogPostStatus.ARCHIVED,
        deletedAt: new Date(),
      });

      const result = await service.deletePost('post-001');

      expect(mockPrismaService.blogPost.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'post-001' },
          data: expect.objectContaining({
            status: BlogPostStatus.ARCHIVED,
            deletedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should create a new blog category with unique slug', async () => {
      mockPrismaService.blogCategory.findUnique.mockResolvedValue(null);
      mockPrismaService.blogCategory.create.mockResolvedValue({
        id: 'cat-new-002',
        name: 'Taxation & GST Compliance',
        slug: 'taxation-gst-compliance',
      });

      const user = { id: 'user-admin-01', organizationId: 'org-cc-india' };
      const dto = {
        name: 'Taxation & GST Compliance',
        description: 'GST and Income Tax guides',
      };

      const result = await service.createCategory(user, dto as any);

      expect(result.name).toBe('Taxation & GST Compliance');
      expect(mockPrismaService.blogCategory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Taxation & GST Compliance',
            slug: 'taxation-gst-compliance',
          }),
        }),
      );
    });

    it('should throw BadRequestException when creating a duplicate category slug', async () => {
      mockPrismaService.blogCategory.findUnique.mockResolvedValue(mockCategory);

      const user = { id: 'user-admin-01', organizationId: 'org-cc-india' };
      const dto = {
        name: 'Company Incorporation',
        slug: 'incorporation-guide',
      };

      await expect(service.createCategory(user, dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
