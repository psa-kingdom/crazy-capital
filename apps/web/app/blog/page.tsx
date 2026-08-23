'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  Tag,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Card, Badge, Button } from '@cc/ui';
import { BlogPostDto, BlogCategoryDto } from '@cc/types';
import { SEEDED_BLOG_ARTICLES } from '../../data/blog-articles';

export default function BlogIndexPage() {
  const [posts, setPosts] = useState<BlogPostDto[]>([]);
  const [categories, setCategories] = useState<BlogCategoryDto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [postsRes, catRes] = await Promise.all([
          fetch('http://localhost:4000/api/v1/cms/posts?limit=50').then((r) => r.json()).catch(() => null),
          fetch('http://localhost:4000/api/v1/cms/categories').then((r) => r.json()).catch(() => null),
        ]);

        if (postsRes?.data && postsRes.data.length > 0) {
          setPosts(postsRes.data);
        } else {
          setPosts(SEEDED_BLOG_ARTICLES);
        }
        if (Array.isArray(catRes) && catRes.length > 0) {
          setCategories(catRes);
        } else {
          setCategories([
            { id: 'cat-001', organizationId: 'org-cc-india', name: 'Company Incorporation', slug: 'incorporation-guide', sortOrder: 1, postCount: 1, createdAt: '2026-08-01T00:00:00Z', updatedAt: '2026-08-01T00:00:00Z' },
            { id: 'cat-002', organizationId: 'org-cc-india', name: 'Tax & GST Compliance', slug: 'gst-taxation', sortOrder: 2, postCount: 1, createdAt: '2026-08-01T00:00:00Z', updatedAt: '2026-08-01T00:00:00Z' },
            { id: 'cat-003', organizationId: 'org-cc-india', name: 'Intellectual Property', slug: 'trademark-ip', sortOrder: 3, postCount: 1, createdAt: '2026-08-01T00:00:00Z', updatedAt: '2026-08-01T00:00:00Z' },
          ]);
        }
      } catch (err) {
        setPosts(SEEDED_BLOG_ARTICLES);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredPosts = posts.filter((post) => {
    const matchesCategory =
      selectedCategory === 'all' || post.category?.slug === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const featuredPost = posts.find((p) => p.featured) || posts[0];
  const regularPosts = filteredPosts.filter((p) => p.id !== (selectedCategory === 'all' && !searchQuery ? featuredPost?.id : ''));

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
            <Link href="/" className="text-slate-300 hover:text-white transition-colors">
              All 14 Services
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

      {/* Header Banner */}
      <section className="py-12 bg-gradient-to-b from-slate-950 to-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-400 text-xs font-bold">
            <BookOpen className="w-3.5 h-3.5" /> Crazy Capital Knowledge Hub
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Insights, Regulations & Growth Playbooks
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            Authoritative regulatory guides on company registration, GST tax optimization, trademark defense, and startup financing in India.
          </p>

          {/* Search & Filter Bar */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by topic, e.g. Private Limited, GST, Trademark..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 text-xs outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills Bar */}
      <div className="border-b border-slate-800 bg-slate-950/40 py-3 sticky top-16 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-brand-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
          >
            All Categories ({posts.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-3.5 py-1.5 rounded-full font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                selectedCategory === cat.slug
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              <span>{cat.name}</span>
              {cat.postCount !== undefined && (
                <span className="text-[10px] opacity-75 font-mono">({cat.postCount})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 space-y-10">
        {/* Featured Spotlight Card */}
        {selectedCategory === 'all' && !searchQuery && featuredPost && (
          <Link
            href={`/blog/${featuredPost.slug}`}
            className="block p-6 sm:p-8 rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-800 to-brand-950/30 border border-slate-700/80 hover:border-brand-500/50 transition-all shadow-xl group"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold border border-amber-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Featured Article
                  </span>
                  {featuredPost.category && (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700">
                      {featuredPost.category.name}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white group-hover:text-brand-400 transition-colors leading-tight">
                  {featuredPost.title}
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                  {featuredPost.excerpt}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" /> {featuredPost.readingTimeMin} min read
                  </span>
                  <span>•</span>
                  <span>{new Date(featuredPost.publishedAt || featuredPost.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>

              <div className="lg:col-span-4 flex justify-end">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold group-hover:bg-brand-500 transition-colors shadow-lg">
                  Read Full Guide <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Regular Articles Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Showing {filteredPosts.length} Articles</span>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-brand-400 hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>

          {filteredPosts.length === 0 ? (
            <div className="p-12 text-center bg-slate-800/40 rounded-2xl border border-slate-800 space-y-3">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No articles found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No matching guides found for &quot;{searchQuery}&quot;. Try adjusting your search query or selecting another category.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                Reset Search
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/70 hover:border-brand-500/50 hover:bg-slate-800/90 transition-all flex flex-col justify-between space-y-4 group shadow-lg"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      {post.category ? (
                        <span className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 font-semibold border border-brand-500/20">
                          {post.category.name}
                        </span>
                      ) : (
                        <span className="text-slate-500">General</span>
                      )}
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {post.readingTimeMin}m
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-white group-hover:text-brand-400 transition-colors leading-snug line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="border-t border-slate-700/50 pt-3 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className="text-brand-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Read Article <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 text-xs text-slate-500">
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
