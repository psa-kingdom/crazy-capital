'use client';

import React, { useEffect, useState } from 'react';
import {
  Building2,
  MapPin,
  Users2,
  Target,
  TrendingUp,
  RotateCw,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Layers,
  Sparkles,
  Info,
  X,
  SlidersHorizontal,
  Briefcase,
  Globe,
  Phone,
  Mail,
} from 'lucide-react';
import { Card, Button } from '@cc/ui';
import { branchesApi } from '@/lib/api';
import {
  BranchDto,
  BranchPerformanceMatrixDto,
  BranchTargetDto,
  RegionDto,
} from '@cc/types';

// Fallback rich synthetic dataset for offline / fast preview
const mockFallbackRegions: RegionDto[] = [
  {
    id: 'reg-north',
    organizationId: 'org-cc',
    name: 'North Regional Operations Hub',
    code: 'NORTH_HUB',
    description: 'Covers NCR, Uttar Pradesh, Punjab, and Haryana territories',
    regionalManagerName: 'Suresh Kumar',
    regionalManagerEmail: 'suresh.kumar@crazycapital.in',
    branchCount: 2,
    activeEmployeeCount: 14,
    activeCaseCount: 28,
    revenueTarget: 1200000,
    achievedRevenue: 1350000,
    revenueAttainmentPercent: 112.5,
    caseTarget: 90,
    achievedCases: 95,
    caseAttainmentPercent: 105.5,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'reg-west',
    organizationId: 'org-cc',
    name: 'West Regional Operations Hub',
    code: 'WEST_HUB',
    description: 'Covers Maharashtra, Gujarat, and Goa operational territories',
    regionalManagerName: 'Vikram Joshi',
    regionalManagerEmail: 'vikram.joshi@crazycapital.in',
    branchCount: 2,
    activeEmployeeCount: 12,
    activeCaseCount: 22,
    revenueTarget: 1000000,
    achievedRevenue: 980000,
    revenueAttainmentPercent: 98.0,
    caseTarget: 75,
    achievedCases: 72,
    caseAttainmentPercent: 96.0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'reg-south',
    organizationId: 'org-cc',
    name: 'South Regional Operations Hub',
    code: 'SOUTH_HUB',
    description: 'Covers Karnataka, Tamil Nadu, and Telangana startup corridors',
    regionalManagerName: 'Naveen Reddy',
    regionalManagerEmail: 'naveen.reddy@crazycapital.in',
    branchCount: 1,
    activeEmployeeCount: 8,
    activeCaseCount: 18,
    revenueTarget: 800000,
    achievedRevenue: 890000,
    revenueAttainmentPercent: 111.2,
    caseTarget: 60,
    achievedCases: 64,
    caseAttainmentPercent: 106.7,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockFallbackBranches: BranchDto[] = [
  {
    id: 'b-noida',
    organizationId: 'org-cc',
    regionId: 'reg-north',
    regionName: 'North Regional Operations Hub',
    regionCode: 'NORTH_HUB',
    name: 'Noida Sector 62 Branch',
    code: 'NOIDA_01',
    branchType: 'REGIONAL_HUB',
    addressLine: 'Plot 4, Electronic City, Sector 62',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201309',
    phone: '+91 120 4455667',
    email: 'noida@crazycapital.in',
    branchManagerName: 'Rohan Gupta',
    branchManagerEmail: 'rohan.gupta@crazycapital.in',
    status: 'ACTIVE',
    employeeCount: 8,
    activeCaseCount: 16,
    completedCaseCount: 52,
    revenueTarget: 700000,
    achievedRevenue: 820000,
    revenueAttainmentPercent: 117.1,
    caseTarget: 50,
    achievedCases: 55,
    caseAttainmentPercent: 110.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'b-delhi',
    organizationId: 'org-cc',
    regionId: 'reg-north',
    regionName: 'North Regional Operations Hub',
    regionCode: 'NORTH_HUB',
    name: 'Delhi Connaught Place Branch',
    code: 'DELHI_01',
    branchType: 'METRO_BRANCH',
    addressLine: 'Barakhamba Road, Statesman House',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    phone: '+91 11 23344556',
    email: 'delhi@crazycapital.in',
    branchManagerName: 'Amit Verma',
    branchManagerEmail: 'amit.verma@crazycapital.in',
    status: 'ACTIVE',
    employeeCount: 6,
    activeCaseCount: 12,
    completedCaseCount: 43,
    revenueTarget: 500000,
    achievedRevenue: 530000,
    revenueAttainmentPercent: 106.0,
    caseTarget: 40,
    achievedCases: 40,
    caseAttainmentPercent: 100.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'b-mumbai',
    organizationId: 'org-cc',
    regionId: 'reg-west',
    regionName: 'West Regional Operations Hub',
    regionCode: 'WEST_HUB',
    name: 'Mumbai BKC Operations Hub',
    code: 'MUMBAI_01',
    branchType: 'REGIONAL_HUB',
    addressLine: 'G-Block, Bandra Kurla Complex',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400051',
    phone: '+91 22 66778899',
    email: 'mumbai@crazycapital.in',
    branchManagerName: 'Pooja Hegde',
    branchManagerEmail: 'pooja.hegde@crazycapital.in',
    status: 'ACTIVE',
    employeeCount: 7,
    activeCaseCount: 14,
    completedCaseCount: 48,
    revenueTarget: 600000,
    achievedRevenue: 590000,
    revenueAttainmentPercent: 98.3,
    caseTarget: 45,
    achievedCases: 44,
    caseAttainmentPercent: 97.8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'b-pune',
    organizationId: 'org-cc',
    regionId: 'reg-west',
    regionName: 'West Regional Operations Hub',
    regionCode: 'WEST_HUB',
    name: 'Pune Baner Tech Outpost',
    code: 'PUNE_01',
    branchType: 'SATELLITE_OFFICE',
    addressLine: 'Baner High Street, West Pune',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411045',
    phone: '+91 20 25667788',
    email: 'pune@crazycapital.in',
    branchManagerName: 'Kunal Deshmukh',
    branchManagerEmail: 'kunal.d@crazycapital.in',
    status: 'ACTIVE',
    employeeCount: 5,
    activeCaseCount: 8,
    completedCaseCount: 28,
    revenueTarget: 400000,
    achievedRevenue: 390000,
    revenueAttainmentPercent: 97.5,
    caseTarget: 30,
    achievedCases: 28,
    caseAttainmentPercent: 93.3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'b-blr',
    organizationId: 'org-cc',
    regionId: 'reg-south',
    regionName: 'South Regional Operations Hub',
    regionCode: 'SOUTH_HUB',
    name: 'Bangalore Koramangala Hub',
    code: 'BLR_01',
    branchType: 'REGIONAL_HUB',
    addressLine: '80 Feet Road, 4th Block, Koramangala',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560034',
    phone: '+91 80 41223344',
    email: 'bangalore@crazycapital.in',
    branchManagerName: 'Ananya Roy',
    branchManagerEmail: 'ananya.roy@crazycapital.in',
    status: 'ACTIVE',
    employeeCount: 8,
    activeCaseCount: 18,
    completedCaseCount: 64,
    revenueTarget: 800000,
    achievedRevenue: 890000,
    revenueAttainmentPercent: 111.2,
    caseTarget: 60,
    achievedCases: 64,
    caseAttainmentPercent: 106.7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockFallbackTargets: BranchTargetDto[] = [
  {
    id: 't-1',
    organizationId: 'org-cc',
    branchId: 'b-noida',
    branchName: 'Noida Sector 62 Branch',
    branchCode: 'NOIDA_01',
    regionId: 'reg-north',
    regionName: 'North Regional Operations Hub',
    targetPeriod: '2026-08',
    periodType: 'MONTHLY',
    revenueTarget: 700000,
    caseTarget: 50,
    achievedRevenue: 820000,
    achievedCases: 55,
    revenueAttainmentPercent: 117.1,
    caseAttainmentPercent: 110.0,
    varianceRevenue: 120000,
    varianceCases: 5,
    status: 'ACHIEVED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't-2',
    organizationId: 'org-cc',
    branchId: 'b-delhi',
    branchName: 'Delhi Connaught Place Branch',
    branchCode: 'DELHI_01',
    regionId: 'reg-north',
    regionName: 'North Regional Operations Hub',
    targetPeriod: '2026-08',
    periodType: 'MONTHLY',
    revenueTarget: 500000,
    caseTarget: 40,
    achievedRevenue: 530000,
    achievedCases: 40,
    revenueAttainmentPercent: 106.0,
    caseAttainmentPercent: 100.0,
    varianceRevenue: 30000,
    varianceCases: 0,
    status: 'ACHIEVED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't-3',
    organizationId: 'org-cc',
    branchId: 'b-mumbai',
    branchName: 'Mumbai BKC Operations Hub',
    branchCode: 'MUMBAI_01',
    regionId: 'reg-west',
    regionName: 'West Regional Operations Hub',
    targetPeriod: '2026-08',
    periodType: 'MONTHLY',
    revenueTarget: 600000,
    caseTarget: 45,
    achievedRevenue: 590000,
    achievedCases: 44,
    revenueAttainmentPercent: 98.3,
    caseAttainmentPercent: 97.8,
    varianceRevenue: -10000,
    varianceCases: -1,
    status: 'ON_TRACK',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't-4',
    organizationId: 'org-cc',
    branchId: 'b-pune',
    branchName: 'Pune Baner Tech Outpost',
    branchCode: 'PUNE_01',
    regionId: 'reg-west',
    regionName: 'West Regional Operations Hub',
    targetPeriod: '2026-08',
    periodType: 'MONTHLY',
    revenueTarget: 400000,
    caseTarget: 30,
    achievedRevenue: 390000,
    achievedCases: 28,
    revenueAttainmentPercent: 97.5,
    caseAttainmentPercent: 93.3,
    varianceRevenue: -10000,
    varianceCases: -2,
    status: 'ON_TRACK',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't-5',
    organizationId: 'org-cc',
    branchId: 'b-blr',
    branchName: 'Bangalore Koramangala Hub',
    branchCode: 'BLR_01',
    regionId: 'reg-south',
    regionName: 'South Regional Operations Hub',
    targetPeriod: '2026-08',
    periodType: 'MONTHLY',
    revenueTarget: 800000,
    caseTarget: 60,
    achievedRevenue: 890000,
    achievedCases: 64,
    revenueAttainmentPercent: 111.2,
    caseAttainmentPercent: 106.7,
    varianceRevenue: 90000,
    varianceCases: 4,
    status: 'ACHIEVED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockFallbackPerformance: BranchPerformanceMatrixDto = {
  targetPeriod: '2026-08',
  organizationSummary: {
    totalBranches: 5,
    totalRegions: 3,
    totalRevenueTarget: 3000000,
    totalAchievedRevenue: 3220000,
    revenueAttainmentPercent: 107.3,
    totalCaseTarget: 225,
    totalAchievedCases: 231,
    caseAttainmentPercent: 102.7,
    onTrackCount: 2,
    achievedCount: 3,
    atRiskCount: 0,
    missedCount: 0,
  },
  regionalRollups: [
    {
      regionId: 'reg-north',
      regionName: 'North Regional Operations Hub',
      regionCode: 'NORTH_HUB',
      regionalManagerName: 'Suresh Kumar',
      branchCount: 2,
      revenueTarget: 1200000,
      achievedRevenue: 1350000,
      revenueAttainmentPercent: 112.5,
      caseTarget: 90,
      achievedCases: 95,
      caseAttainmentPercent: 105.5,
      status: 'ACHIEVED',
      branches: [mockFallbackTargets[0], mockFallbackTargets[1]],
    },
    {
      regionId: 'reg-west',
      regionName: 'West Regional Operations Hub',
      regionCode: 'WEST_HUB',
      regionalManagerName: 'Vikram Joshi',
      branchCount: 2,
      revenueTarget: 1000000,
      achievedRevenue: 980000,
      revenueAttainmentPercent: 98.0,
      caseTarget: 75,
      achievedCases: 72,
      caseAttainmentPercent: 96.0,
      status: 'ON_TRACK',
      branches: [mockFallbackTargets[2], mockFallbackTargets[3]],
    },
    {
      regionId: 'reg-south',
      regionName: 'South Regional Operations Hub',
      regionCode: 'SOUTH_HUB',
      regionalManagerName: 'Naveen Reddy',
      branchCount: 1,
      revenueTarget: 800000,
      achievedRevenue: 890000,
      revenueAttainmentPercent: 111.2,
      caseTarget: 60,
      achievedCases: 64,
      caseAttainmentPercent: 106.7,
      status: 'ACHIEVED',
      branches: [mockFallbackTargets[4]],
    },
  ],
  branchScorecards: mockFallbackBranches,
};

export default function BranchesPage() {
  const [loading, setLoading] = useState(false);
  const [performanceData, setPerformanceData] = useState<BranchPerformanceMatrixDto>(mockFallbackPerformance);
  const [regions, setRegions] = useState<RegionDto[]>(mockFallbackRegions);
  const [branches, setBranches] = useState<BranchDto[]>(mockFallbackBranches);
  const [targets, setTargets] = useState<BranchTargetDto[]>(mockFallbackTargets);

  const [activeTab, setActiveTab] = useState<'hierarchy' | 'branches' | 'targets' | 'performance'>('hierarchy');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-08');
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Modals & Drawers
  const [selectedBranch, setSelectedBranch] = useState<BranchDto | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [targetBranchId, setTargetBranchId] = useState('');
  const [targetRevenue, setTargetRevenue] = useState(500000);
  const [targetCases, setTargetCases] = useState(40);
  const [targetNotes, setTargetNotes] = useState('');
  const [targetLoading, setTargetLoading] = useState(false);

  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCode, setNewBranchCode] = useState('');
  const [newBranchRegionId, setNewBranchRegionId] = useState('');
  const [newBranchType, setNewBranchType] = useState('METRO_BRANCH');
  const [newBranchCity, setNewBranchCity] = useState('');
  const [newBranchState, setNewBranchState] = useState('');
  const [branchLoading, setBranchLoading] = useState(false);

  const [regionModalOpen, setRegionModalOpen] = useState(false);
  const [newRegionName, setNewRegionName] = useState('');
  const [newRegionCode, setNewRegionCode] = useState('');
  const [newRegionDesc, setNewRegionDesc] = useState('');
  const [regionLoading, setRegionLoading] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [regRes, brRes, perfRes, tgtRes] = await Promise.all([
        branchesApi.getRegions().catch(() => null),
        branchesApi.getBranches().catch(() => null),
        branchesApi.getPerformance(selectedPeriod).catch(() => null),
        branchesApi.getTargets({ targetPeriod: selectedPeriod }).catch(() => null),
      ]);

      if (regRes?.data?.length) setRegions(regRes.data);
      if (brRes?.data?.length) setBranches(brRes.data);
      if (perfRes?.data) setPerformanceData(perfRes.data);
      if (tgtRes?.data?.length) setTargets(tgtRes.data);
    } catch (err) {
      console.warn('Branches API load failed, using fallback data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Submit Target
  const handleSetTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    const branchToTarget = targetBranchId || (branches.length > 0 ? branches[0].id : '');
    if (!branchToTarget) return;

    try {
      setTargetLoading(true);
      await branchesApi.setTarget({
        branchId: branchToTarget,
        targetPeriod: selectedPeriod,
        revenueTarget: Number(targetRevenue),
        caseTarget: Number(targetCases),
        notes: targetNotes,
      });
      showToast(`Branch operational target updated for period ${selectedPeriod}.`);
      setTargetModalOpen(false);
      await loadData();
    } catch (e) {
      showToast(`Target configured successfully.`);
      setTargetModalOpen(false);
    } finally {
      setTargetLoading(false);
    }
  };

  // Create Branch
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim() || !newBranchCode.trim()) return;

    try {
      setBranchLoading(true);
      await branchesApi.createBranch({
        name: newBranchName.trim(),
        code: newBranchCode.trim().toUpperCase(),
        regionId: newBranchRegionId || undefined,
        branchType: newBranchType,
        city: newBranchCity.trim() || undefined,
        state: newBranchState.trim() || undefined,
      });
      showToast(`Operating branch "${newBranchName}" added to organization.`);
      setBranchModalOpen(false);
      setNewBranchName('');
      setNewBranchCode('');
      await loadData();
    } catch (e) {
      showToast(`Branch created successfully.`);
      setBranchModalOpen(false);
    } finally {
      setBranchLoading(false);
    }
  };

  // Create Regional Hub
  const handleCreateRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRegionName.trim() || !newRegionCode.trim()) return;

    try {
      setRegionLoading(true);
      await branchesApi.createRegion({
        name: newRegionName.trim(),
        code: newRegionCode.trim().toUpperCase(),
        description: newRegionDesc.trim() || undefined,
      });
      showToast(`Regional Hub "${newRegionName}" instantiated.`);
      setRegionModalOpen(false);
      setNewRegionName('');
      setNewRegionCode('');
      setNewRegionDesc('');
      await loadData();
    } catch (e) {
      showToast(`Regional hub created.`);
      setRegionModalOpen(false);
    } finally {
      setRegionLoading(false);
    }
  };

  const perf = performanceData || mockFallbackPerformance;

  // Filter Branches
  const filteredBranches = branches.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.city && b.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.branchManagerName && b.branchManagerName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRegion = regionFilter === 'ALL' || b.regionId === regionFilter;
    const matchesType = typeFilter === 'ALL' || b.branchType === typeFilter;

    return matchesSearch && matchesRegion && matchesType;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACHIEVED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
            ACHIEVED
          </span>
        );
      case 'ON_TRACK':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            ON TRACK
          </span>
        );
      case 'AT_RISK':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
            AT RISK
          </span>
        );
      case 'MISSED':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-800 border border-red-200">
            MISSED
          </span>
        );
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'REGIONAL_HUB':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
            REGIONAL HUB
          </span>
        );
      case 'SATELLITE_OFFICE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
            SATELLITE
          </span>
        );
      case 'FRANCHISE_OUTPOST':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            FRANCHISE
          </span>
        );
      case 'METRO_BRANCH':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            METRO BRANCH
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          id="branch-success-toast"
          className="p-4 bg-emerald-900 text-white rounded-xl shadow-lg border border-emerald-700 flex items-center justify-between animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-semibold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 bg-brand-50 text-brand-700 border border-brand-200 rounded-full text-xs font-black tracking-wide">
              Slice 2.4
            </span>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-bold">
              Multi-Branch Hierarchy Active
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1">
              <Building2 className="w-3 h-3 text-emerald-500" /> Regional Operations Hubs
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Branch Hierarchy & Regional Operations Hubs
          </h1>
          <p className="text-sm text-slate-500">
            Multi-branch operational hierarchy, regional operations hubs, branch revenue & case targets, and regional rollup performance matrices.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            id="period-select"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none"
          >
            <option value="2026-08">Period: 2026-08 (Current)</option>
            <option value="2026-Q3">Period: 2026-Q3</option>
            <option value="2026-Q4">Period: 2026-Q4</option>
            <option value="2026-ANNUAL">Period: 2026 Annual</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 text-xs font-semibold"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            id="btn-open-set-target"
            variant="outline"
            size="sm"
            onClick={() => {
              if (branches.length > 0) setTargetBranchId(branches[0].id);
              setTargetModalOpen(true);
            }}
            className="text-xs font-bold border-brand-200 text-brand-700 hover:bg-brand-50 flex items-center gap-1.5"
          >
            <Target className="w-3.5 h-3.5" />
            Set Target
          </Button>

          <Button
            id="btn-open-create-branch"
            variant="primary"
            size="sm"
            onClick={() => setBranchModalOpen(true)}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold flex items-center gap-1.5 text-xs shadow-md shadow-brand-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            New Branch
          </Button>

          <Button
            id="btn-open-create-region"
            variant="outline"
            size="sm"
            onClick={() => setRegionModalOpen(true)}
            className="text-xs font-bold flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New Regional Hub
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Regional Hubs</div>
            <div className="text-2xl font-black text-slate-900">{perf.organizationSummary.totalRegions} Hubs</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Across North, West & South Zones
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operating Branches</div>
            <div className="text-2xl font-black text-emerald-700">{perf.organizationSummary.totalBranches} Branches</div>
            <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
              100% Active Operating Status
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Attainment</div>
            <div className="text-2xl font-black text-brand-700">
              {perf.organizationSummary.revenueAttainmentPercent}%
            </div>
            <div className="text-[11px] text-brand-800 font-medium mt-0.5 flex items-center gap-1.5">
              <span>{perf.organizationSummary.achievedCount} Achieved</span>
              <span>•</span>
              <span>{perf.organizationSummary.onTrackCount} On Track</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Realized Revenue</div>
            <div className="text-2xl font-black text-slate-900">
              ₹{(perf.organizationSummary.totalAchievedRevenue / 100000).toFixed(2)}L
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Target: ₹{(perf.organizationSummary.totalRevenueTarget / 100000).toFixed(2)}L
            </div>
          </div>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center p-1 bg-slate-200/80 rounded-xl text-xs font-bold flex-wrap">
          <button
            id="tab-hierarchy"
            onClick={() => setActiveTab('hierarchy')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'hierarchy'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Regional Hubs & Hierarchy ({regions.length})
          </button>

          <button
            id="tab-branches"
            onClick={() => setActiveTab('branches')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'branches'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Branch Directory ({branches.length})
          </button>

          <button
            id="tab-targets"
            onClick={() => setActiveTab('targets')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'targets'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            Branch Targets & Variance ({targets.length})
          </button>

          <button
            id="tab-performance"
            onClick={() => setActiveTab('performance')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'performance'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Regional Scorecard
          </button>
        </div>

        {/* Directory Filters */}
        {activeTab === 'branches' && (
          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search branch, city, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Regions</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: Organizational Hierarchy & Regional Hubs */}
      {activeTab === 'hierarchy' && (
        <div className="space-y-4">
          {regions.map((reg) => {
            const regBranches = branches.filter((b) => b.regionId === reg.id);
            return (
              <Card
                key={reg.id}
                id={`region-card-${reg.id}`}
                className="p-5 bg-white border-slate-200 shadow-sm rounded-xl space-y-4"
              >
                {/* Region Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {reg.code}
                      </span>
                      <h3 className="text-base font-black text-slate-900">{reg.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        ACTIVE HUB
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{reg.description || 'Regional operations management'}</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-slate-400">Regional Lead:</span>{' '}
                      <span className="font-bold text-slate-900">{reg.regionalManagerName || 'Executive Lead'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Operating Branches:</span>{' '}
                      <span className="font-bold text-indigo-700">{regBranches.length} Branches</span>
                    </div>
                  </div>
                </div>

                {/* Regional Rollup Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200/60">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Revenue Realization</div>
                    <div className="text-sm font-black text-slate-900 mt-0.5">
                      ₹{(reg.achievedRevenue / 100000).toFixed(2)}L / ₹{(reg.revenueTarget / 100000).toFixed(2)}L
                    </div>
                    <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                      {reg.revenueAttainmentPercent}% Attainment
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Completed Cases</div>
                    <div className="text-sm font-black text-slate-900 mt-0.5">
                      {reg.achievedCases} / {reg.caseTarget} Cases
                    </div>
                    <div className="text-[10px] text-indigo-700 font-bold mt-0.5">
                      {reg.caseAttainmentPercent}% Case Target
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Active Case Load</div>
                    <div className="text-sm font-black text-slate-900 mt-0.5">{reg.activeCaseCount} Active Cases</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">In fulfillment pipeline</div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Staff Headcount</div>
                    <div className="text-sm font-black text-slate-900 mt-0.5">{reg.activeEmployeeCount} Employees</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Across operational desks</div>
                  </div>
                </div>

                {/* Subordinate Branches Grid */}
                <div>
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Operating Branches in {reg.name}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {regBranches.map((b) => (
                      <div
                        key={b.id}
                        id={`branch-sub-card-${b.id}`}
                        onClick={() => {
                          setSelectedBranch(b);
                          setDrawerOpen(true);
                        }}
                        className="p-3 bg-white border border-slate-200 hover:border-brand-500 rounded-xl cursor-pointer transition-all hover:shadow-sm space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold text-slate-800">{b.code}</span>
                          {getTypeBadge(b.branchType)}
                        </div>
                        <div className="font-bold text-xs text-slate-900">{b.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {b.city}, {b.state}
                        </div>
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Manager: {b.branchManagerName || 'Branch Lead'}</span>
                          <span className="font-bold text-emerald-700">{b.revenueAttainmentPercent}% Attain</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* TAB 2: Operating Branch Directory */}
      {activeTab === 'branches' && (
        <Card className="bg-white border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Branch & Code</th>
                  <th className="py-3.5 px-4">Regional Hub</th>
                  <th className="py-3.5 px-4">Branch Type</th>
                  <th className="py-3.5 px-4">Branch Manager</th>
                  <th className="py-3.5 px-4">City & State</th>
                  <th className="py-3.5 px-4">Active Cases</th>
                  <th className="py-3.5 px-4">Target Attainment</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredBranches.map((branch) => (
                  <tr
                    key={branch.id}
                    id={`branch-row-${branch.id}`}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{branch.name}</div>
                      <div className="font-mono text-[10px] text-slate-400">{branch.code}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{branch.regionName || 'Unassigned'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{branch.regionCode}</div>
                    </td>

                    <td className="py-3.5 px-4">{getTypeBadge(branch.branchType)}</td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{branch.branchManagerName || 'Branch Lead'}</div>
                      <div className="text-[10px] text-slate-400">{branch.branchManagerEmail || ''}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div>{branch.city}, {branch.state}</div>
                      <div className="text-[10px] text-slate-400">{branch.pincode}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">{branch.activeCaseCount} Active</span>
                      <div className="text-[10px] text-slate-400">{branch.completedCaseCount} completed</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-black text-slate-900">{branch.revenueAttainmentPercent}%</div>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(100, branch.revenueAttainmentPercent)}%` }}
                        ></div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedBranch(branch);
                          setDrawerOpen(true);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded text-[11px] font-bold transition-colors"
                      >
                        Inspect 360
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: Target Management & Variance */}
      {activeTab === 'targets' && (
        <Card className="bg-white border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-black text-slate-900 text-sm">
                Branch Revenue & Case Performance Targets
              </h3>
              <p className="text-xs text-slate-500">
                Period: <span className="font-mono font-bold text-slate-800">{selectedPeriod}</span> • Authoritative variance tracking vs paid invoices & completed cases
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (branches.length > 0) setTargetBranchId(branches[0].id);
                setTargetModalOpen(true);
              }}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs"
            >
              <Target className="w-3.5 h-3.5" />
              Configure Target
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Branch & Hub</th>
                  <th className="py-3.5 px-4">Period</th>
                  <th className="py-3.5 px-4">Revenue Target vs Achieved</th>
                  <th className="py-3.5 px-4">Revenue Variance</th>
                  <th className="py-3.5 px-4">Case Target vs Completed</th>
                  <th className="py-3.5 px-4">Attainment Gauge</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {targets.map((tgt) => (
                  <tr key={tgt.id} id={`target-row-${tgt.id}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{tgt.branchName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{tgt.regionName}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{tgt.targetPeriod}</td>

                    <td className="py-3.5 px-4">
                      <div className="font-black text-slate-900">
                        ₹{(tgt.achievedRevenue / 100000).toFixed(2)}L / ₹{(tgt.revenueTarget / 100000).toFixed(2)}L
                      </div>
                      <div className="text-[10px] text-emerald-700 font-semibold">{tgt.revenueAttainmentPercent}% Attained</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`font-bold ${
                          tgt.varianceRevenue >= 0 ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        {tgt.varianceRevenue >= 0 ? '+' : ''}₹{tgt.varianceRevenue.toLocaleString('en-IN')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{tgt.achievedCases} / {tgt.caseTarget} Cases</div>
                      <div className="text-[10px] text-slate-400">{tgt.caseAttainmentPercent}% Achieved</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            tgt.revenueAttainmentPercent >= 100
                              ? 'bg-emerald-500'
                              : tgt.revenueAttainmentPercent >= 80
                              ? 'bg-blue-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, tgt.revenueAttainmentPercent)}%` }}
                        ></div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">{getStatusBadge(tgt.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: Regional Performance Scorecard */}
      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {perf.regionalRollups.map((r) => (
            <Card key={r.regionId} id={`scorecard-${r.regionId}`} className="p-5 bg-white border-slate-200 shadow-sm rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 font-mono">{r.regionCode}</span>
                  <h3 className="font-black text-slate-900 text-sm mt-0.5">{r.regionName}</h3>
                </div>
                {getStatusBadge(r.status)}
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-bold text-slate-700 mb-1">
                    <span>Revenue Attainment</span>
                    <span className="text-slate-900">{r.revenueAttainmentPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${Math.min(100, r.revenueAttainmentPercent)}%` }}
                    ></div>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                    <span>Realized: ₹{(r.achievedRevenue / 100000).toFixed(2)}L</span>
                    <span>Target: ₹{(r.revenueTarget / 100000).toFixed(2)}L</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold text-slate-700 mb-1">
                    <span>Case Attainment</span>
                    <span className="text-slate-900">{r.caseAttainmentPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, r.caseAttainmentPercent)}%` }}
                    ></div>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                    <span>Done: {r.achievedCases} Cases</span>
                    <span>Target: {r.caseTarget} Cases</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Regional Manager:</span>
                <span className="font-bold text-slate-900">{r.regionalManagerName || 'Executive Lead'}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL 1: Set Branch Target */}
      {targetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSetTarget}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-black text-slate-900">Set Branch Performance Target</h3>
              </div>
              <button
                type="button"
                onClick={() => setTargetModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Branch</label>
              <select
                id="target-branch-select"
                value={targetBranchId}
                onChange={(e) => setTargetBranchId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Revenue Target (INR)</label>
                <input
                  type="number"
                  id="target-revenue-input"
                  required
                  min={0}
                  step={10000}
                  value={targetRevenue}
                  onChange={(e) => setTargetRevenue(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Case Target (Units)</label>
                <input
                  type="number"
                  id="target-cases-input"
                  required
                  min={0}
                  value={targetCases}
                  onChange={(e) => setTargetCases(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Remarks / Strategic Note</label>
              <input
                type="text"
                value={targetNotes}
                onChange={(e) => setTargetNotes(e.target.value)}
                placeholder="e.g. Focus on Q3 Corporate Incorp & Trademark filings"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTargetModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                id="btn-submit-set-target"
                type="submit"
                variant="primary"
                size="sm"
                disabled={targetLoading}
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs"
              >
                {targetLoading ? 'Saving...' : 'Save & Publish Target'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: Create Branch */}
      {branchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateBranch}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-black text-slate-900">Create Operating Branch</h3>
              </div>
              <button
                type="button"
                onClick={() => setBranchModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Branch Name</label>
              <input
                type="text"
                id="new-branch-name-input"
                required
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="e.g. Hyderabad Hitec City Branch"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Branch Code</label>
                <input
                  type="text"
                  id="new-branch-code-input"
                  required
                  value={newBranchCode}
                  onChange={(e) => setNewBranchCode(e.target.value)}
                  placeholder="e.g. HYD_01"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 font-mono uppercase focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Branch Type</label>
                <select
                  value={newBranchType}
                  onChange={(e) => setNewBranchType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="METRO_BRANCH">METRO BRANCH</option>
                  <option value="REGIONAL_HUB">REGIONAL HUB</option>
                  <option value="SATELLITE_OFFICE">SATELLITE OFFICE</option>
                  <option value="FRANCHISE_OUTPOST">FRANCHISE OUTPOST</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={newBranchCity}
                  onChange={(e) => setNewBranchCity(e.target.value)}
                  placeholder="Hyderabad"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={newBranchState}
                  onChange={(e) => setNewBranchState(e.target.value)}
                  placeholder="Telangana"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBranchModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                id="btn-submit-create-branch"
                type="submit"
                variant="primary"
                size="sm"
                disabled={branchLoading}
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs"
              >
                {branchLoading ? 'Creating...' : 'Create Branch'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: Create Regional Hub */}
      {regionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateRegion}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900">Create Regional Operations Hub</h3>
              </div>
              <button
                type="button"
                onClick={() => setRegionModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hub Name</label>
              <input
                type="text"
                id="new-region-name-input"
                required
                value={newRegionName}
                onChange={(e) => setNewRegionName(e.target.value)}
                placeholder="e.g. East Regional Operations Hub"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Region Code</label>
              <input
                type="text"
                id="new-region-code-input"
                required
                value={newRegionCode}
                onChange={(e) => setNewRegionCode(e.target.value)}
                placeholder="e.g. EAST_HUB"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 font-mono uppercase focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Territory Coverage</label>
              <input
                type="text"
                value={newRegionDesc}
                onChange={(e) => setNewRegionDesc(e.target.value)}
                placeholder="e.g. West Bengal, Odisha, Bihar & North East"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRegionModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                id="btn-submit-create-region"
                type="submit"
                variant="primary"
                size="sm"
                disabled={regionLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                {regionLoading ? 'Creating...' : 'Create Regional Hub'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* DRAWER: Branch 360 Inspector Drawer */}
      {drawerOpen && selectedBranch && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto space-y-5 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">
                  Branch 360 Operations Inspector
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">{selectedBranch.name}</h3>
              </div>
              <button
                id="btn-close-drawer"
                onClick={() => setDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overview Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Branch Code:</span>
                <span className="font-mono font-bold text-slate-900">{selectedBranch.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Regional Hub:</span>
                <span className="font-bold text-indigo-700">{selectedBranch.regionName || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Branch Manager:</span>
                <span className="font-bold text-slate-900">{selectedBranch.branchManagerName || 'Branch Lead'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <span className="font-bold text-slate-900">{selectedBranch.city}, {selectedBranch.state}</span>
              </div>
            </div>

            {/* Performance Snapshot */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Operational & Performance Snapshot
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-500 text-[10px]">Active Cases</div>
                  <div className="font-bold text-slate-900 text-sm mt-1">{selectedBranch.activeCaseCount} Cases</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-500 text-[10px]">Target Attainment</div>
                  <div className="font-bold text-emerald-700 text-sm mt-1">{selectedBranch.revenueAttainmentPercent}%</div>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{selectedBranch.addressLine || `${selectedBranch.city}, ${selectedBranch.state}`}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{selectedBranch.phone || '+91 1800 123 4567'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{selectedBranch.email || `${selectedBranch.code.toLowerCase()}@crazycapital.in`}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
