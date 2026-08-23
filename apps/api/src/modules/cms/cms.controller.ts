import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CmsService } from './cms.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { QueryBlogPostsDto } from './dto/query-blog-posts.dto';
import { CreateBlogCategoryDto } from './dto/create-blog-category.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/guards/rbac.guard';

@ApiTags('CMS & Knowledge Base')
@Controller('cms')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  // ─── PUBLIC ENDPOINTS ───────────────────────────────────────────────────────

  @Get('posts')
  @Public()
  @ApiOperation({ summary: 'Get paginated published blog posts (Public)' })
  @ApiResponse({ status: 200, description: 'List of published blog posts with pagination' })
  getPublicPosts(@Query() query: QueryBlogPostsDto) {
    return this.cmsService.getPublicPosts(query);
  }

  @Get('posts/:slug')
  @Public()
  @ApiOperation({ summary: 'Get a single published blog post by slug (Public)' })
  @ApiParam({ name: 'slug', example: 'how-to-register-pvt-ltd-company-india' })
  @ApiResponse({ status: 200, description: 'Blog post details with SEO metadata' })
  @ApiResponse({ status: 404, description: 'Post not found or unpublished' })
  getPublicPostBySlug(@Param('slug') slug: string) {
    return this.cmsService.getPublicPostBySlug(slug);
  }

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'Get all active blog categories with post counts (Public)' })
  @ApiResponse({ status: 200, description: 'List of blog categories' })
  getPublicCategories() {
    return this.cmsService.getPublicCategories();
  }

  // ─── ADMIN PROTECTED ENDPOINTS ─────────────────────────────────────────────

  @Get('admin/posts')
  @ApiBearerAuth()
  @RequirePermissions('cms.view')
  @ApiOperation({ summary: 'Get all articles including drafts (Admin only)' })
  @ApiResponse({ status: 200, description: 'Admin article list' })
  getAdminPosts(@CurrentUser() user: any, @Query() query: QueryBlogPostsDto) {
    return this.cmsService.getAdminPosts(user, query);
  }

  @Post('posts')
  @ApiBearerAuth()
  @RequirePermissions('cms.manage')
  @ApiOperation({ summary: 'Create a new blog article (Admin only)' })
  @ApiResponse({ status: 201, description: 'Article created successfully' })
  createPost(@CurrentUser() user: any, @Body() dto: CreateBlogPostDto) {
    return this.cmsService.createPost(user, dto);
  }

  @Patch('posts/:id')
  @ApiBearerAuth()
  @RequirePermissions('cms.manage')
  @ApiOperation({ summary: 'Update an existing blog article (Admin only)' })
  @ApiParam({ name: 'id', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiResponse({ status: 200, description: 'Article updated successfully' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  updatePost(@Param('id') id: string, @Body() dto: UpdateBlogPostDto) {
    return this.cmsService.updatePost(id, dto);
  }

  @Delete('posts/:id')
  @ApiBearerAuth()
  @RequirePermissions('cms.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete (archive) a blog article (Admin only)' })
  @ApiParam({ name: 'id', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiResponse({ status: 200, description: 'Article deleted/archived successfully' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  deletePost(@Param('id') id: string) {
    return this.cmsService.deletePost(id);
  }

  @Post('categories')
  @ApiBearerAuth()
  @RequirePermissions('cms.manage')
  @ApiOperation({ summary: 'Create a new blog category (Admin only)' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  createCategory(@CurrentUser() user: any, @Body() dto: CreateBlogCategoryDto) {
    return this.cmsService.createCategory(user, dto);
  }
}
