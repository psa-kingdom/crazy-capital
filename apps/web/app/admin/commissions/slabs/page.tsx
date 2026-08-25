'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Award,
  Plus,
  Coins,
  CheckCircle2,
  Percent,
  Layers,
  ArrowRight,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { partnersApi } from '../../../../lib/api';

export default function AdminCommissionSlabsPage() {
  const [slabs, setSlabs] = useState<any[]>([]);
  const [incentives, setIncentives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    tier: 'SILVER',
    ratePercentage: 10.0,
    flatBonusAmount: 0,
    notes: 'Standard Partner Slab',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [slabsRes, incRes] = await Promise.allSettled([
        partnersApi.getCommissionSlabs(),
        partnersApi.getIncentiveRules(),
      ]);

      if (slabsRes.status === 'fulfilled') {
        const list = slabsRes.value.data?.data || slabsRes.value.data || [];
        setSlabs(Array.isArray(list) ? list : []);
      }
      if (incRes.status === 'fulfilled') {
        const incList = incRes.value.data?.data || incRes.value.data || [];
        setIncentives(Array.isArray(incList) ? incList : []);
      }
    } catch (err) {
      console.error('Failed to load slabs data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSlab = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await partnersApi.createCommissionSlab(formData);
      setShowModal(false);
      await fetchData();
    } catch (err) {
      console.error('Failed to create slab', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="font-bold text-lg text-slate-100 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black">
                CC
              </div>
              <span>Crazy Capital Admin</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              Tiered Commission Slabs & Multi-Tier Rule Engine
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              Create Commission Slab
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Tier Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Entry Tier</span>
                <h3 className="text-xl font-extrabold text-slate-200">SILVER PARTNER</h3>
              </div>
              <span className="text-2xl font-black text-slate-300">10%</span>
            </div>
            <p className="text-xs text-slate-400">Baseline referral slab applied immediately upon partner registration and initial KYC.</p>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
              Threshold: 0-14 Conversions
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-950/40 to-slate-950 border border-amber-500/30 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Growth Tier</span>
                <h3 className="text-xl font-extrabold text-amber-300">GOLD PARTNER</h3>
              </div>
              <span className="text-2xl font-black text-amber-400">15%</span>
            </div>
            <p className="text-xs text-slate-400">Accelerated commission rate unlocked after hitting 15 client conversions or ₹25k earnings.</p>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-amber-500/70">
              Threshold: 15-49 Conversions
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-b from-purple-950/40 to-slate-950 border border-purple-500/30 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Enterprise Tier</span>
                <h3 className="text-xl font-extrabold text-purple-300">PLATINUM PARTNER</h3>
              </div>
              <span className="text-2xl font-black text-purple-400">20%</span>
            </div>
            <p className="text-xs text-slate-400">Premium nationwide distribution slab + priority VIP operations desk assistance.</p>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-purple-500/70">
              Threshold: 50+ Conversions / ₹1L Earnings
            </div>
          </div>
        </section>

        {/* Multi-Tier Network Override Engine Summary */}
        <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            3-Tier Multi-Level Network Override Hierarchy
          </h3>
          <p className="text-xs text-slate-400">
            Crazy Capital&apos;s referral engine automates tree traversal up to depth 3 with anti-abuse loop prevention.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs font-bold text-amber-400 uppercase">Tier 1: Direct Partner</div>
              <div className="text-lg font-bold text-slate-100 mt-1">Tier Slab Rate (10% - 20%)</div>
              <p className="text-[11px] text-slate-400 mt-1">Calculated off service order base amount.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs font-bold text-blue-400 uppercase">Tier 2: Parent Affiliate</div>
              <div className="text-lg font-bold text-blue-400 mt-1">+2.5% Flat Override</div>
              <p className="text-[11px] text-slate-400 mt-1">Credited to recruiter on every downstream conversion.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs font-bold text-purple-400 uppercase">Tier 3: Master Hub</div>
              <div className="text-lg font-bold text-purple-400 mt-1">+1.0% Master Override</div>
              <p className="text-[11px] text-slate-400 mt-1">Credited to nationwide apex partner nodes.</p>
            </div>
          </div>
        </section>

        {/* Modal: Create Slab */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Configure Commission Slab Rule
              </h3>
              <form onSubmit={handleCreateSlab} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Partner Tier</label>
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
                  >
                    <option value="SILVER">SILVER</option>
                    <option value="GOLD">GOLD</option>
                    <option value="PLATINUM">PLATINUM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.ratePercentage}
                    onChange={(e) => setFormData({ ...formData, ratePercentage: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Flat Bonus Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.flatBonusAmount}
                    onChange={(e) => setFormData({ ...formData, flatBonusAmount: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                  >
                    Save Slab Rule
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
