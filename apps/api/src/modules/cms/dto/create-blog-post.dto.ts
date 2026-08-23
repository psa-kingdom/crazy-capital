import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { BlogPostStatus } from '@cc/types';

export class CreateBlogPostDto {
  @ApiProperty({ example: 'How to Register a Private Limited Company in India (2026 Guide)' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'how-to-register-pvt-ltd-company-india-2026' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ example: 'A complete step-by-step walkthrough of SPICe+ MCA incorporation process...' })
  @IsString()
  @IsNotEmpty()
  excerpt: string;

  @ApiProperty({ example: '# Complete Guide to Company Incorporation\n\nStarting a business in India...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab' })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ example: 6, default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  readingTimeMin?: number;

  @ApiPropertyOptional({ enum: BlogPostStatus, default: BlogPostStatus.DRAFT })
  @IsOptional()
  @IsEnum(BlogPostStatus)
  status?: BlogPostStatus;

  @ApiPropertyOptional({ example: ['Incorporation', 'MCA', 'Startup India'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  // SEO Metadata
  @ApiPropertyOptional({ example: 'Private Limited Company Registration in India | Crazy Capital' })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiPropertyOptional({ example: 'Step-by-step guide to incorporating a Pvt Ltd company with MCA SPICe+...' })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiPropertyOptional({ example: 'company registration, pvt ltd, spice plus, mca compliance' })
  @IsOptional()
  @IsString()
  metaKeywords?: string;

  @ApiPropertyOptional({ example: 'https://crazycapital.in/blog/how-to-register-pvt-ltd-company-india' })
  @IsOptional()
  @IsString()
  canonicalUrl?: string;

  @ApiPropertyOptional({ example: 'How to Register a Pvt Ltd Company in India' })
  @IsOptional()
  @IsString()
  ogTitle?: string;

  @ApiPropertyOptional({ example: 'Step-by-step guide to incorporating a Pvt Ltd company in 3-5 days...' })
  @IsOptional()
  @IsString()
  ogDescription?: string;

  @ApiPropertyOptional({ example: 'https://crazycapital.in/og/company-registration.jpg' })
  @IsOptional()
  @IsString()
  ogImage?: string;

  @ApiPropertyOptional({ example: 'summary_large_image', default: 'summary_large_image' })
  @IsOptional()
  @IsString()
  twitterCard?: string;
}
