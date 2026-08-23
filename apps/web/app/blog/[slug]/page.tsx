import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
  Clock,
  Calendar,
  User,
  ChevronRight,
  Eye,
  Tag,
  ArrowLeft,
  Share2,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { BlogPostDto } from '@cc/types';
import { PublicLeadCapture } from '../../../components/public-lead-capture';
import { getBlogArticleBySlug } from '../../../data/blog-articles';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string): Promise<BlogPostDto | null> {
  try {
    const res = await fetch(`http://localhost:4000/api/v1/cms/posts/${slug}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // API not reachable, fallback to seeded data
  }
  return getBlogArticleBySlug(slug) || null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: 'Article Not Found | Crazy Capital',
    };
  }

  const title = post.metaTitle || `${post.title} | Crazy Capital`;
  const description = post.metaDescription || post.excerpt;
  const canonicalUrl = post.canonicalUrl || `https://crazycapital.in/blog/${post.slug}`;
  const ogImage = post.ogImage || post.coverImage || 'https://crazycapital.in/og/default.jpg';

  return {
    title,
    description,
    keywords: post.metaKeywords || post.tags.join(', '),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.ogTitle || title,
      description: post.ogDescription || description,
      url: canonicalUrl,
      siteName: 'Crazy Capital — India’s Business Operating System',
      type: 'article',
      publishedTime: post.publishedAt || post.createdAt,
      authors: post.author ? [`${post.author.firstName} ${post.author.lastName}`] : undefined,
      tags: post.tags,
      images: [
        {
          url: ogImage,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.ogTitle || title,
      description: post.ogDescription || description,
      images: [ogImage],
    },
  };
}

export default async function BlogPostDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-amber-400 flex items-center justify-center font-black text-white shadow-lg">
                CC
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                  Crazy Capital <span className="text-xs">🇮🇳</span>
                </span>
                <span className="text-[10px] text-slate-400 tracking-wider font-semibold uppercase">
                  India&apos;s Business Operating System
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/blog" className="text-slate-300 hover:text-white transition-colors">
              Knowledge Hub
            </Link>
            <Link
              href="/customer"
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
            >
              Customer Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Breadcrumb Bar */}
      <div className="border-b border-slate-800 bg-slate-950/40 py-3">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs text-slate-400">
          <Link href="/blog" className="hover:text-slate-200 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Knowledge Center
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          {post.category && (
            <>
              <span className="text-brand-400 font-medium">{post.category.name}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            </>
          )}
          <span className="text-white font-medium truncate">{post.title}</span>
        </div>
      </div>

      {/* Main Article Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 space-y-8">
        {/* Article Header */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {post.category && (
              <span className="px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-400 font-bold">
                {post.category.name}
              </span>
            )}
            <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-400" /> {post.readingTimeMin} min read
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-medium flex items-center gap-1">
              <Eye className="w-3 h-3 text-blue-400" /> {post.viewCount} views
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {post.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-medium">
            {post.excerpt}
          </p>

          {/* Author & Publish Info Bar */}
          <div className="flex items-center justify-between border-y border-slate-800 py-3.5 text-xs text-slate-400">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brand-600/30 border border-brand-500/40 text-brand-400 flex items-center justify-center font-bold">
                {post.author ? post.author.firstName[0] : 'A'}
              </div>
              <div>
                <div className="font-bold text-white">
                  {post.author ? `${post.author.firstName} ${post.author.lastName}` : 'Crazy Capital Editorial Board'}
                </div>
                <div className="text-[11px] text-slate-500">Corporate & Legal Compliance Specialist</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-IN', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>

        {/* Article Body Content */}
        <article className="prose prose-invert max-w-none space-y-6 text-slate-200 text-sm sm:text-base leading-relaxed">
          {post.content.split('\n\n').map((paragraph, index) => {
            if (paragraph.startsWith('# ')) {
              return null; // Skip main title
            }
            if (paragraph.startsWith('## ')) {
              return (
                <h2 key={index} className="text-xl sm:text-2xl font-extrabold text-white tracking-tight pt-4 border-b border-slate-800 pb-2">
                  {paragraph.replace('## ', '')}
                </h2>
              );
            }
            if (paragraph.startsWith('### ')) {
              return (
                <h3 key={index} className="text-lg font-bold text-brand-400 pt-2">
                  {paragraph.replace('### ', '')}
                </h3>
              );
            }
            if (paragraph.startsWith('---')) {
              return <hr key={index} className="border-slate-800 my-6" />;
            }
            if (paragraph.startsWith('- ')) {
              const items = paragraph.split('\n- ');
              return (
                <ul key={index} className="space-y-1.5 list-disc list-inside text-slate-300 pl-2">
                  {items.map((item, i) => (
                    <li key={i}>{item.replace(/^- /, '')}</li>
                  ))}
                </ul>
              );
            }
            if (/^\d+\./.test(paragraph)) {
              const items = paragraph.split(/\n\d+\.\s/);
              return (
                <ol key={index} className="space-y-1.5 list-decimal list-inside text-slate-300 pl-2">
                  {items.map((item, i) => (
                    <li key={i}>{item.replace(/^\d+\.\s/, '')}</li>
                  ))}
                </ol>
              );
            }
            return (
              <p key={index} className="text-slate-300 leading-relaxed">
                {paragraph}
              </p>
            );
          })}
        </article>

        {/* Tags Bar */}
        {post.tags && post.tags.length > 0 && (
          <div className="border-t border-slate-800 pt-6 space-y-2">
            <div className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-brand-400" /> Related Topics
            </div>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Lead Capture CTA Banner */}
        <div className="pt-8">
          <PublicLeadCapture
            title="Need Professional Help with Compliance?"
            subtitle="Connect directly with Crazy Capital chartered accountants, legal counsel, and company secretaries."
            buttonText="Speak with an Advisor"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © 2026 Crazy Capital Technologies Pvt Ltd. All rights reserved. 🇮🇳
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-slate-300">All 14 Services</Link>
            <Link href="/blog" className="hover:text-slate-300">Knowledge Center</Link>
            <Link href="/customer" className="hover:text-slate-300">Customer Portal</Link>
            <Link href="/partner" className="hover:text-slate-300">Partner Growth Hub</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
