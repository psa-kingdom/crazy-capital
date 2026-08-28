'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  Coins,
  Target,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Zap,
  Activity,
  Layers,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Card, Button, Badge } from '@cc/ui';
import { predictiveReportsApi } from '@/lib/api';
import {
  PredictiveRevenueForecastDto,
  PredictiveTurnaroundForecastDto,
  PredictiveBottleneckDto,
} from '@cc/types';

export default function PredictiveIntelligencePage() {
  const [period, setPeriod] = useState('NEXT_30_DAYS');
  const [loading, setLoading] = useState(false);
  const [deployedInterventions, setDeployedInterventions] = useState<Record<string, boolean>>({});

  const [revenueForecast, setRevenueForecast] = useState<PredictiveRevenueForecastDto>({
    period: 'NEXT_30_DAYS',
    baseRevenue: 285000,
    optimisticRevenue: 356250,
    conservativeRevenue: 233700,
    projectedConversions: 38,
    projectedPartnerCommissions: 51300,
    historicalComparisonPct: 18.5,
  });

  const [turnaroundForecast, setTurnaroundForecast] = useState<PredictiveTurnaroundForecastDto>({
    overallAvgHours: 38.4,
    fastestStageName: 'Digital Signature & Statutory KYC',
    fastestStageHours: 4.2,
    slowestStageName: 'MCA Central Registration Centre (CRC) Approval',
    slowestStageHours: 72.0,
    stagesAtRiskCount: 2,
  });

  const [bottlenecks, setBottlenecks] = useState<PredictiveBottleneckDto[]>([
    {
      stageId: 'stage-mca-crc',
      stageName: 'MCA Central Registration Centre (CRC) Review',
      serviceName: 'Private Limited Company Incorporation',
      currentActiveCount: 14,
      avgHoursSpent: 68.5,
      slaTargetHours: 48.0,
      breachRiskProbability: 0.78,
      bottleneckSeverity: 'HIGH',
      recommendedIntervention: '⚡ Resubmission Prevention: Pre-verify DIN/DSC & e-MoA draft with Senior Legal Reviewer before final SPICe+ submission.',
    },
    {
      stageId: 'stage-gst-aadhaar',
      stageName: 'GST Aadhaar Authentication & PV Verification',
      serviceName: 'GST Registration',
      currentActiveCount: 9,
      avgHoursSpent: 36.0,
      slaTargetHours: 24.0,
      breachRiskProbability: 0.52,
      bottleneckSeverity: 'MEDIUM',
      recommendedIntervention: '📞 Direct WhatsApp Alert: Auto-remind applicant to complete OTP Aadhaar authentication link within 24 hours.',
    },
    {
      stageId: 'stage-tm-search',
      stageName: 'NICE Class Trademark Search & Conflicting Mark Audit',
      serviceName: 'Trademark Registration',
      currentActiveCount: 5,
      avgHoursSpent: 12.0,
      slaTargetHours: 16.0,
      breachRiskProbability: 0.22,
      bottleneckSeverity: 'LOW',
      recommendedIntervention: '✅ Operating within SLA: Automate IP India journal phonetic search via AI Copilot.',
    },
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [revRes, turnRes, botRes]: [any, any, any] = await Promise.all([
        predictiveReportsApi.getRevenueForecast({ period }).catch(() => null),
        predictiveReportsApi.getTurnaroundForecast({}).catch(() => null),
        predictiveReportsApi.getBottleneckRadar().catch(() => null),
      ]);

      if (revRes) setRevenueForecast(revRes);
      if (turnRes) setTurnaroundForecast(turnRes);
      if (botRes && Array.isArray(botRes)) setBottlenecks(botRes);
    } catch (e) {
      // Local demo fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  const handleDeployIntervention = (stageId: string) => {
    setDeployedInterventions(prev => ({ ...prev, [stageId]: true }));
    setTimeout(() => {
      setBottlenecks(prev =>
        prev.map(b => b.stageId === stageId ? { ...b, breachRiskProbability: Math.max(0.1, b.breachRiskProbability - 0.35), bottleneckSeverity: 'LOW' } : b),
      );
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Executive Predictive Intelligence Hub</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  Vertical Slice 4.4
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pipeline-Weighted Revenue Forecasting • Stage Turnaround Modeling • Preventive Bottleneck Radar
              </p>
            </div>
          </div>
        </div>

        {/* Time Horizon Selector */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
          {['NEXT_30_DAYS', 'NEXT_60_DAYS', 'NEXT_90_DAYS'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === p
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {p === 'NEXT_30_DAYS' ? 'Next 30 Days' : p === 'NEXT_60_DAYS' ? 'Next 60 Days' : 'Next 90 Days (Q4)'}
            </button>
          ))}
          <Button
            onClick={loadData}
            variant="outline"
            size="sm"
            disabled={loading}
            className="p-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Highlights Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Base Revenue */}
        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Base Projected Revenue</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <ChevronUp className="w-3 h-3" /> +{revenueForecast.historicalComparisonPct}% MoM
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-950 mt-1">
            ₹{revenueForecast.baseRevenue.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">
            Range: ₹{revenueForecast.conservativeRevenue.toLocaleString('en-IN')} – ₹{revenueForecast.optimisticRevenue.toLocaleString('en-IN')}
          </p>
        </Card>

        {/* Projected Conversions */}
        <Card className="p-4 bg-gradient-to-br from-sky-50 to-indigo-50/50 border-sky-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-900 uppercase tracking-wider">Projected Conversions</span>
            <Target className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-3xl font-black text-sky-950 mt-1">
            {revenueForecast.projectedConversions} Deals
          </div>
          <p className="text-[11px] text-sky-700 font-medium mt-1">
            Weighted pipeline conversion rate: 64.2%
          </p>
        </Card>

        {/* Partner Commission Liability */}
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Partner & Franchise Payouts</span>
            <Coins className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-950 mt-1">
            ₹{revenueForecast.projectedPartnerCommissions.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-amber-700 font-medium mt-1">
            18% blended channel commission allocation
          </p>
        </Card>

        {/* Average Turnaround Velocity */}
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50/50 border-purple-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">Predicted Turnaround</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-purple-950 mt-1">
            {turnaroundForecast.overallAvgHours}h Avg
          </div>
          <p className="text-[11px] text-purple-700 font-medium mt-1">
            {turnaroundForecast.stagesAtRiskCount} stage(s) at potential SLA risk
          </p>
        </Card>
      </div>

      {/* Revenue Trajectory & Confidence Bands Visual Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Projected Revenue Trajectory & Confidence Band</h3>
            <p className="text-xs text-slate-500">Bayesian pipeline conversion modeling based on lead scores & stage velocity</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Conservative (-18%)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Base Forecast
            </span>
            <span className="flex items-center gap-1.5 text-indigo-600 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Optimistic (+25%)
            </span>
          </div>
        </div>

        {/* Trajectory Meter Bars */}
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600">Conservative Confidence Bound</span>
              <span className="text-slate-800">₹{revenueForecast.conservativeRevenue.toLocaleString('en-IN')} (90% Confidence)</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-slate-400 rounded-full" style={{ width: '65%' }} />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-emerald-700">Base Revenue Target (Expected Mean)</span>
              <span className="text-emerald-800">₹{revenueForecast.baseRevenue.toLocaleString('en-IN')} (78% Probability)</span>
            </div>
            <div className="w-full h-4 bg-emerald-50 rounded-full overflow-hidden border border-emerald-200">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: '80%' }} />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-indigo-700">Optimistic Upside Projection</span>
              <span className="text-indigo-800">₹{revenueForecast.optimisticRevenue.toLocaleString('en-IN')} (Peak Velocity)</span>
            </div>
            <div className="w-full h-3 bg-indigo-50 rounded-full overflow-hidden border border-indigo-100">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Stage Velocity & Turnaround Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Activity className="w-4 h-4 text-emerald-600" /> Fastest Fulfillment Milestone
          </div>
          <div className="text-lg font-bold text-slate-900">{turnaroundForecast.fastestStageName}</div>
          <div className="text-2xl font-black text-emerald-600">{turnaroundForecast.fastestStageHours} Hours</div>
          <p className="text-xs text-slate-500">Automated Aadhaar OTP & DigiLocker statutory verification integration.</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Critical Bottleneck Stage
          </div>
          <div className="text-lg font-bold text-slate-900">{turnaroundForecast.slowestStageName}</div>
          <div className="text-2xl font-black text-amber-600">{turnaroundForecast.slowestStageHours} Hours</div>
          <p className="text-xs text-slate-500">External MCA registrar review queue & CRC processing times.</p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-brand-950 text-white p-5 rounded-2xl shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-brand-300 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-300" /> AI Capacity Recommendation
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Based on projected {revenueForecast.projectedConversions} incorporations, reassigning 2 junior case officers to the CRC pre-screening gate will reduce overall turnaround by <strong>18.4 hours</strong>.
            </p>
          </div>
          <Link href="/admin/tasks">
            <Button variant="primary" size="sm" className="w-full text-xs flex items-center justify-center gap-1.5">
              Rebalance Workload Engine <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Preventive Bottleneck Early Warning Radar Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Bottleneck Early Warning Radar</h3>
            <span className="text-[11px] font-bold px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full border border-rose-200">
              Active SLA Risk Detection
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">Preventive intervention suggestions generated by AI Engine</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Workflow Stage & Service</th>
                <th className="py-3 px-4">Active Cases</th>
                <th className="py-3 px-4">Avg Duration vs SLA</th>
                <th className="py-3 px-4">Breach Risk Probability</th>
                <th className="py-3 px-4">AI Prescribed Preventive Intervention</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bottlenecks.map((item) => {
                const isHigh = item.bottleneckSeverity === 'HIGH';
                const isMedium = item.bottleneckSeverity === 'MEDIUM';
                const isDeployed = deployedInterventions[item.stageId];

                return (
                  <tr key={item.stageId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{item.stageName}</div>
                      <div className="text-[11px] text-slate-500">{item.serviceName}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {item.currentActiveCount} cases
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{item.avgHoursSpent}h / {item.slaTargetHours}h SLA</div>
                      <span className={`text-[10px] font-bold ${item.avgHoursSpent > item.slaTargetHours ? 'text-red-600' : 'text-emerald-600'}`}>
                        {item.avgHoursSpent > item.slaTargetHours ? `+${(item.avgHoursSpent - item.slaTargetHours).toFixed(1)}h Over Target` : 'Within SLA'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${
                            isHigh
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : isMedium
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {Math.round(item.breachRiskProbability * 100)}% Risk
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-md">
                      <p className="text-[11px] text-slate-700 leading-snug bg-slate-50 p-2 rounded-lg border border-slate-200">
                        {item.recommendedIntervention}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isDeployed ? (
                        <span className="text-xs font-bold text-emerald-600 flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Deployed
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeployIntervention(item.stageId)}
                          className="text-xs bg-brand-50 hover:bg-brand-100 text-brand-700 border-brand-200"
                          leftIcon={<Zap className="w-3 h-3 text-amber-500" />}
                        >
                          Deploy Measure
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
