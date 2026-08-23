'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Globe,
  Sparkles,
  CheckCircle2,
  Clock,
  Tag,
  Share2,
  FileText,
  AlertCircle,
  ExternalLink,
  Layers,
  Save,
  X,
} from 'lucide-react';
import { AdminShell } from '../../components/layout/admin-shell';
import { Card, Button, Badge, Modal } from '@cc/ui';
import { cmsApi } from '../../lib/api';
import { BlogPostDto, BlogCategoryDto, BlogPostStatus } from '@cc/types';

export default function AdminCmsPage() {
  const [posts, setPosts] = useState<BlogPostDto[]>([]);
  const [categories, setCategories] = useState<BlogCategoryDto[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [activeEditorTab, setActiveEditorTab] = useState<'content' | 'seo' | 'preview'>('content');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    categoryId: '',
    excerpt: '',
    content: '',
    coverImage: '',
    readingTimeMin: 5,
    status: 'DRAFT' as BlogPostStatus,
    tags: '' as string,
    featured: false,
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    twitterCard: 'summary_large_image',
  });

  // Category Form State
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    slug: '',
    description: '',
    sortOrder: 0,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [postsRes, catsRes] = await Promise.all([
        cmsApi.getAdminPosts({ limit: 100 }).catch(() => ({ data: { data: [] } })),
        cmsApi.getCategories().catch(() => ({ data: [] })),
      ]);

      if (postsRes?.data?.data) {
        setPosts(postsRes.data.data);
      }
      if (Array.isArray(catsRes?.data)) {
        setCategories(catsRes.data);
      }
    } catch (err) {
      console.error('Failed to load CMS articles', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewPost = () => {
    setEditingPostId(null);
    setFormData({
      title: '',
      slug: '',
      categoryId: categories[0]?.id || '',
      excerpt: '',
      content: '',
      coverImage: '',
      readingTimeMin: 5,
      status: 'DRAFT',
      tags: '',
      featured: false,
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
      canonicalUrl: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      twitterCard: 'summary_large_image',
    });
    setActiveEditorTab('content');
    setIsEditorOpen(true);
  };

  const openEditPost = (post: BlogPostDto) => {
    setEditingPostId(post.id);
    setFormData({
      title: post.title,
      slug: post.slug,
      categoryId: post.categoryId || '',
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage || '',
      readingTimeMin: post.readingTimeMin || 5,
      status: post.status,
      tags: post.tags ? post.tags.join(', ') : '',
      featured: post.featured,
      metaTitle: post.metaTitle || '',
      metaDescription: post.metaDescription || '',
      metaKeywords: post.metaKeywords || '',
      canonicalUrl: post.canonicalUrl || '',
      ogTitle: post.ogTitle || '',
      ogDescription: post.ogDescription || '',
      ogImage: post.ogImage || '',
      twitterCard: post.twitterCard || 'summary_large_image',
    });
    setActiveEditorTab('content');
    setIsEditorOpen(true);
  };

  const handleSavePost = async (publishImmediate = false) => {
    if (!formData.title.trim() || !formData.excerpt.trim() || !formData.content.trim()) {
      alert('Please fill out the Title, Excerpt, and Article Content.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        title: formData.title.trim(),
        slug: formData.slug.trim() || undefined,
        categoryId: formData.categoryId || undefined,
        excerpt: formData.excerpt.trim(),
        content: formData.content,
        coverImage: formData.coverImage.trim() || undefined,
        readingTimeMin: Number(formData.readingTimeMin) || 5,
        status: publishImmediate ? 'PUBLISHED' : formData.status,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        featured: formData.featured,
        metaTitle: formData.metaTitle.trim() || undefined,
        metaDescription: formData.metaDescription.trim() || undefined,
        metaKeywords: formData.metaKeywords.trim() || undefined,
        canonicalUrl: formData.canonicalUrl.trim() || undefined,
        ogTitle: formData.ogTitle.trim() || undefined,
        ogDescription: formData.ogDescription.trim() || undefined,
        ogImage: formData.ogImage.trim() || undefined,
        twitterCard: formData.twitterCard,
      };

      if (editingPostId) {
        await cmsApi.updatePost(editingPostId, payload);
      } else {
        await cmsApi.createPost(payload);
      }

      setIsEditorOpen(false);
      await loadData();
    } catch (err: any) {
      alert(`Save failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePost = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to archive "${title}"?`)) {
      try {
        await cmsApi.deletePost(id);
        await loadData();
      } catch (err: any) {
        alert(`Delete failed: ${err.message}`);
      }
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name.trim()) return;

    try {
      await cmsApi.createCategory({
        name: categoryFormData.name.trim(),
        slug: categoryFormData.slug.trim() || undefined,
        description: categoryFormData.description.trim() || undefined,
        sortOrder: Number(categoryFormData.sortOrder) || 0,
      });
      setIsCategoryModalOpen(false);
      setCategoryFormData({ name: '', slug: '', description: '', sortOrder: 0 });
      await loadData();
    } catch (err: any) {
      alert(`Category creation failed: ${err.message}`);
    }
  };

  const filteredPosts = posts.filter((p) => {
    const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
    const matchesCategory = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-brand-600" /> CMS & Knowledge Base Engine
              <Badge variant="default" size="sm">Slice 1.13</Badge>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Author articles, manage regulatory guides, configure SEO OpenGraph tags, and publish to the public website.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCategoryModalOpen(true)}
              className="text-xs"
            >
              + New Category
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={openNewPost}
              className="text-xs bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" /> New Article
            </Button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <Card className="p-4 bg-white shadow-sm border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                    selectedStatus === status
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Category and Search */}
            <div className="flex flex-1 items-center gap-2 max-w-lg">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 outline-none text-xs"
              >
                <option value="ALL">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles by title, slug, or content..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 outline-none text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Articles Table */}
        <Card className="bg-white shadow-sm border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Article Title & Excerpt</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Views</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Published Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Loading articles...
                    </td>
                  </tr>
                ) : filteredPosts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 space-y-2">
                      <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
                      <div className="font-semibold text-slate-600">No articles found</div>
                      <p className="text-[11px] text-slate-400">Click &quot;New Article&quot; to write your first knowledge base article.</p>
                    </td>
                  </tr>
                ) : (
                  filteredPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 line-clamp-1">{post.title}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{post.excerpt}</div>
                        <div className="text-[10px] font-mono text-brand-600 mt-0.5">/blog/{post.slug}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {post.category ? (
                          <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-semibold text-[10px] border border-brand-200">
                            {post.category.name}
                          </span>
                        ) : (
                          <span className="text-slate-400">Uncategorized</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {post.status === 'PUBLISHED' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Published
                          </span>
                        )}
                        {post.status === 'DRAFT' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-1 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span> Draft
                          </span>
                        )}
                        {post.status === 'ARCHIVED' && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] w-fit">
                            Archived
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                        {post.viewCount}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {post.author ? `${post.author.firstName} ${post.author.lastName}` : 'Admin'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Not published'}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => openEditPost(post)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
                          title="Edit Article"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id, post.title)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          title="Archive Article"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Article Authoring Modal / Drawer */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingPostId ? 'Edit Blog Article' : 'Author New Blog Article'}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {['content', 'seo', 'preview'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveEditorTab(tab as any)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-md capitalize transition-colors ${
                        activeEditorTab === tab
                          ? 'bg-brand-600 text-white'
                          : 'text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {tab === 'seo' ? 'SEO & OpenGraph' : tab}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
              {activeEditorTab === 'content' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">Article Title *</label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. How to Register a Private Limited Company in India (2026 Guide)"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">URL Slug (Auto-generated if blank)</label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="e.g. how-to-register-pvt-ltd-company-india"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Category *</label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50"
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Short Excerpt / Summary *</label>
                    <textarea
                      rows={2}
                      required
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      placeholder="Brief overview displayed on search cards and social previews..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full Article Content (Markdown Supported) *</label>
                    <textarea
                      rows={12}
                      required
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="# Heading 1&#10;&#10;## Heading 2&#10;&#10;Article text with bullet points..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 font-mono leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Cover Image URL</label>
                      <input
                        type="url"
                        value={formData.coverImage}
                        onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Reading Time (Minutes)</label>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={formData.readingTimeMin}
                        onChange={(e) => setFormData({ ...formData, readingTimeMin: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tags (Comma Separated)</label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        placeholder="Incorporation, MCA, Tax"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="featuredCheck"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <label htmlFor="featuredCheck" className="font-semibold text-slate-700">
                      Feature this article on the top of the Knowledge Center
                    </label>
                  </div>
                </div>
              )}

              {activeEditorTab === 'seo' && (
                <div className="space-y-4">
                  <div className="p-3 bg-brand-50 rounded-xl border border-brand-200 text-brand-800 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-brand-600" /> Search Engine Optimization & Social Sharing
                    </div>
                    <p className="text-[11px]">
                      Configure meta tags, OpenGraph snippets for WhatsApp/LinkedIn shares, and canonical links.
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Meta Title (SEO Title)</label>
                    <input
                      type="text"
                      value={formData.metaTitle}
                      onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                      placeholder="Title tag displayed in Google Search results..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Meta Description</label>
                    <textarea
                      rows={2}
                      value={formData.metaDescription}
                      onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                      placeholder="150–160 character snippet for Google search snippet..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">OpenGraph Title</label>
                      <input
                        type="text"
                        value={formData.ogTitle}
                        onChange={(e) => setFormData({ ...formData, ogTitle: e.target.value })}
                        placeholder="Title for WhatsApp / LinkedIn / Twitter preview"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">OpenGraph Image URL</label>
                      <input
                        type="url"
                        value={formData.ogImage}
                        onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                        placeholder="https://crazycapital.in/og/image.jpg"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Canonical URL</label>
                    <input
                      type="url"
                      value={formData.canonicalUrl}
                      onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value })}
                      placeholder="https://crazycapital.in/blog/how-to-register-pvt-ltd"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50"
                    />
                  </div>
                </div>
              )}

              {activeEditorTab === 'preview' && (
                <div className="p-6 rounded-xl bg-slate-900 text-slate-100 space-y-4">
                  <div className="space-y-2">
                    <span className="px-2.5 py-0.5 rounded bg-brand-500/20 text-brand-400 font-bold text-[10px]">
                      {categories.find((c) => c.id === formData.categoryId)?.name || 'Category'}
                    </span>
                    <h2 className="text-2xl font-black text-white">{formData.title || 'Untitled Article'}</h2>
                    <p className="text-xs text-slate-300 font-medium">{formData.excerpt || 'Excerpt preview...'}</p>
                  </div>
                  <hr className="border-slate-800" />
                  <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-mono">
                    {formData.content || 'No content written yet.'}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-500">
                Status: <span className="font-bold text-slate-800">{formData.status}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditorOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={isSaving}
                  onClick={() => handleSavePost(false)}
                >
                  <Save className="w-3.5 h-3.5 mr-1" /> Save Draft
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isSaving}
                  onClick={() => handleSavePost(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  <Globe className="w-3.5 h-3.5 mr-1" /> Publish to Live Web
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h3 className="text-base font-black text-slate-900">Create Blog Category</h3>
            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  placeholder="e.g. Taxation & GST Compliance"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Slug (Optional)</label>
                <input
                  type="text"
                  value={categoryFormData.slug}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, slug: e.target.value })}
                  placeholder="e.g. taxation-gst-compliance"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  placeholder="Brief description..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCategoryModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-brand-600 hover:bg-brand-700 text-white"
                >
                  Create Category
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
