import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { QueryBlogPostsDto } from './dto/query-blog-posts.dto';
import { CreateBlogCategoryDto } from './dto/create-blog-category.dto';
import { BlogPostStatus, UserRole } from '@cc/types';

@Injectable()
export class CmsService {
  private readonly logger = new Logger(CmsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to slugify a string for clean SEO-friendly URLs.
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Public: Get paginated published blog posts with category and search filters.
   */
  async getPublicPosts(query: QueryBlogPostsDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {
      status: BlogPostStatus.PUBLISHED,
      deletedAt: null,
      publishedAt: { lte: new Date() },
    };

    if (query.categorySlug) {
      where.category = {
        slug: query.categorySlug.toLowerCase(),
      };
    }

    if (query.tag) {
      where.tags = {
        has: query.tag,
      };
    }

    if (query.featured !== undefined) {
      where.featured = query.featured;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { excerpt: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
        { tags: { has: query.search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
        include: {
          category: {
            select: { id: true, name: true, slug: true, icon: true },
          },
          author: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Public: Get single published blog post by slug and increment view count.
   */
  async getPublicPostBySlug(slug: string) {
    const cleanSlug = slug.toLowerCase().trim();

    const post = await this.prisma.blogPost.findFirst({
      where: {
        slug: cleanSlug,
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

    if (!post) {
      throw new NotFoundException(`Article with slug '${slug}' not found`);
    }

    // Increment view count asynchronously
    this.prisma.blogPost
      .update({
        where: { id: post.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch((err) => this.logger.warn(`Failed to increment viewCount for post ${post.id}`, err));

    return post;
  }

  /**
   * Public: Get all active blog categories with published post counts.
   */
  async getPublicCategories() {
    const categories = await this.prisma.blogCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            posts: {
              where: {
                status: BlogPostStatus.PUBLISHED,
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    return categories.map((c) => ({
      id: c.id,
      organizationId: c.organizationId,
      name: c.name,
      slug: c.slug,
      description: c.description,
      icon: c.icon,
      sortOrder: c.sortOrder,
      postCount: c._count.posts,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  /**
   * Admin: Get all articles (including Drafts and Archived).
   */
  async getAdminPosts(user: any, query: QueryBlogPostsDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (user.organizationId) {
      where.organizationId = user.organizationId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.categorySlug) {
      where.category = { slug: query.categorySlug.toLowerCase() };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { excerpt: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          category: {
            select: { id: true, name: true, slug: true, icon: true },
          },
          author: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin: Create a new blog post.
   */
  async createPost(user: any, dto: CreateBlogPostDto) {
    // Generate or clean slug
    let slug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.title);
    if (!slug) {
      slug = `post-${Date.now()}`;
    }

    // Check slug uniqueness
    const existing = await this.prisma.blogPost.findUnique({
      where: { slug },
    });
    if (existing) {
      slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const status = dto.status || BlogPostStatus.DRAFT;
    const publishedAt =
      status === BlogPostStatus.PUBLISHED ? new Date() : null;

    let orgId = user?.organizationId;
    if (!orgId) {
      const defaultOrg = await this.prisma.organization.findFirst({
        where: { status: 'ACTIVE' },
      });
      orgId = defaultOrg?.id;
    }

    return this.prisma.blogPost.create({
      data: {
        organizationId: orgId,
        categoryId: dto.categoryId || null,
        authorId: user?.id || null,
        title: dto.title.trim(),
        slug,
        excerpt: dto.excerpt.trim(),
        content: dto.content,
        coverImage: dto.coverImage || null,
        readingTimeMin: dto.readingTimeMin || 5,
        status,
        publishedAt,
        tags: dto.tags || [],
        featured: dto.featured || false,
        metaTitle: dto.metaTitle || dto.title,
        metaDescription: dto.metaDescription || dto.excerpt,
        metaKeywords: dto.metaKeywords || null,
        canonicalUrl: dto.canonicalUrl || null,
        ogTitle: dto.ogTitle || dto.metaTitle || dto.title,
        ogDescription: dto.ogDescription || dto.metaDescription || dto.excerpt,
        ogImage: dto.ogImage || dto.coverImage || null,
        twitterCard: dto.twitterCard || 'summary_large_image',
      },
      include: {
        category: true,
        author: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  /**
   * Admin: Update an existing blog post.
   */
  async updatePost(id: string, dto: UpdateBlogPostDto) {
    const post = await this.prisma.blogPost.findUnique({
      where: { id },
    });

    if (!post || post.deletedAt) {
      throw new NotFoundException(`Blog post with ID '${id}' not found`);
    }

    let slug = post.slug;
    if (dto.slug && dto.slug !== post.slug) {
      slug = this.slugify(dto.slug);
      const duplicate = await this.prisma.blogPost.findUnique({
        where: { slug },
      });
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException(`Slug '${slug}' is already in use by another article`);
      }
    }

    const data: any = { ...dto };
    if (dto.slug) data.slug = slug;

    // Handle publishing status change
    if (dto.status === BlogPostStatus.PUBLISHED && post.status !== BlogPostStatus.PUBLISHED) {
      data.publishedAt = post.publishedAt || new Date();
    } else if (dto.status === BlogPostStatus.DRAFT && post.status === BlogPostStatus.PUBLISHED) {
      // Keep or reset publishedAt based on business preference (keep timestamp for record)
    }

    return this.prisma.blogPost.update({
      where: { id },
      data,
      include: {
        category: true,
        author: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  /**
   * Admin: Delete (soft delete) a blog post.
   */
  async deletePost(id: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { id },
    });

    if (!post || post.deletedAt) {
      throw new NotFoundException(`Blog post with ID '${id}' not found`);
    }

    return this.prisma.blogPost.update({
      where: { id },
      data: { deletedAt: new Date(), status: BlogPostStatus.ARCHIVED },
    });
  }

  /**
   * Admin: Create a new blog category.
   */
  async createCategory(user: any, dto: CreateBlogCategoryDto) {
    let slug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.name);
    if (!slug) {
      slug = `category-${Date.now()}`;
    }

    const existing = await this.prisma.blogCategory.findUnique({
      where: { slug },
    });
    if (existing) {
      throw new BadRequestException(`Category with slug '${slug}' already exists`);
    }

    let orgId = user?.organizationId;
    if (!orgId) {
      const defaultOrg = await this.prisma.organization.findFirst({
        where: { status: 'ACTIVE' },
      });
      orgId = defaultOrg?.id;
    }

    return this.prisma.blogCategory.create({
      data: {
        organizationId: orgId,
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() || null,
        icon: dto.icon || 'FileText',
        sortOrder: dto.sortOrder || 0,
      },
    });
  }
}
