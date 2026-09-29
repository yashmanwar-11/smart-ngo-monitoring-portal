import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  TrendingDown,
  Users,
  Building2,
  ShieldAlert,
  FileText,
  Video,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Send,
  Zap,
  Radio,
  MapPin,
  Flame,
  Search,
  Filter
} from 'lucide-react';
import { DosjeScheme, SystemAnomaly } from '../types';
import { analyticsApi } from '../services/apiClient';

interface SchemeMetric {
  schemeCode: string;
  schemeName: string;
  targetGroup: string;
  facilityTypes: string;
  totalInstitutes: number;
  activeBeneficiaries: number;
  annualGrantCr: number;
  averageCompliance: number;
  highRiskCount: number;
  activeCctvNodes: number;
}

interface AnomalyAnalyticsSectionProps {
  onLaunchVcWithNgo?: (ngoId: string) => void;
  onOpenDutyAllocation?: (scheme?: string) => void;
  onShowToast?: (message: string, type?: 'success' | 'info') => void;
}

export const AnomalyAnalyticsSection: React.FC<AnomalyAnalyticsSectionProps> = ({
  onLaunchVcWithNgo,
  onOpenDutyAllocation,
  onShowToast,
}) => {
  const [schemes, setSchemes] = useState<SchemeMetric[]>([]);
  const [anomalies, setAnomalies] = useState<SystemAnomaly[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [issuingNoticeId, setIssuingNoticeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [selectedSeverity]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [schemesRes, anomaliesRes] = await Promise.all([
        analyticsApi.getSchemes(),
        analyticsApi.getAnomalies(selectedSeverity === 'ALL' ? undefined : selectedSeverity),
      ]);

      if (schemesRes && schemesRes.schemes) {
        setSchemes(schemesRes.schemes);
      }
      if (anomaliesRes && anomaliesRes.anomalies) {
        setAnomalies(anomaliesRes.anomalies);
      }
    } catch (err) {
      console.error('Failed to load DoSJE scheme and anomaly analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerNotice = async (anomaly: SystemAnomaly) => {
    setIssuingNoticeId(anomaly.id);
    try {
      const res = await analyticsApi.triggerShowCause({
        anomalyId: anomaly.id,
        ngoId: anomaly.ngoId,
        subject: `Statutory Show-Cause Notice: ${anomaly.title}`,
        details: `Under Section 14 of Scheme Guidelines, an automated anomaly was detected: ${anomaly.description}. Baseline: ${anomaly.baselineValue}, Recorded: ${anomaly.metricValue}. Provide explanation within 7 days.`,
        deadlineDays: 7,
      });

      if (res && res.success) {
        // Update anomaly in local list
        setAnomalies((prev) =>
          prev.map((a) =>
            a.id === anomaly.id ? { ...a, status: 'SHOW_CAUSE_ISSUED' } : a
          )
        );
        if (onShowToast) {
          onShowToast(
            `Statutory Notice ${res.noticeNumber} issued to ${anomaly.ngoName}. Deadline: ${new Date(res.deadline).toLocaleDateString()}`,
            'success'
          );
        }
      }
    } catch (err: any) {
      alert('Failed to issue notice: ' + (err.message || 'Server error'));
    } finally {
      setIssuingNoticeId(null);
    }
  };

  const getSchemeCardBadge = (code: string) => {
    switch (code) {
      case 'NAPDDR':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'AVYAY':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'DDRS':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'PM_AJAY':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'SMILE':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const filteredAnomalies = anomalies.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.ngoName.toLowerCase().includes(q) ||
      a.darpanId.toLowerCase().includes(q) ||
      a.district.toLowerCase().includes(q) ||
      a.scheme.toLowerCase().includes(q) ||
      a.title.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <h2 className="text-lg font-bold text-white tracking-wide">
              DoSJE Statutory Scheme Surveillance & AI Anomaly Engine
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Department of Social Justice & Empowerment
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Automated compliance analytics across NAPDDR, AVYAY, DDRS, PM-AJAY & SMILE programs with real-time biometric and geo-telemetry pattern recognition.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onOpenDutyAllocation?.('ALL')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:brightness-110 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch Random Duty Allocation</span>
          </button>

          <button
            onClick={fetchData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh Analytics Feed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 5 DoSJE Schemes Metrics Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Statutory Scheme Portfolios ({schemes.length})
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">
            Total Central Grant Tracked: ₹{schemes.reduce((acc, s) => acc + (s.annualGrantCr || 0), 0)} Cr
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {schemes.map((scheme) => (
            <div
              key={scheme.schemeCode}
              className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-sm relative overflow-hidden group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${getSchemeCardBadge(scheme.schemeCode)}`}>
                    {scheme.schemeCode}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                    <span>{scheme.averageCompliance}%</span>
                    <span className="text-[9px] text-slate-500">Comp.</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {scheme.schemeName}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {scheme.facilityTypes}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      scheme.averageCompliance > 90
                        ? 'bg-emerald-500'
                        : scheme.averageCompliance > 75
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${scheme.averageCompliance}%` }}
                  />
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Institutes</span>
                    <span className="font-semibold text-slate-200">{scheme.totalInstitutes}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Grant Pool</span>
                    <span className="font-semibold text-slate-200">₹{scheme.annualGrantCr} Cr</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Beneficiaries</span>
                    <span className="font-semibold text-slate-200">{scheme.activeBeneficiaries?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">CCTV Nodes</span>
                    <span className="font-semibold text-cyan-400 flex items-center gap-1">
                      <Radio className="w-2.5 h-2.5" />
                      {scheme.activeCctvNodes}
                    </span>
                  </div>
                </div>
              </div>

              {scheme.highRiskCount > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">
                    <Flame className="w-3 h-3 text-rose-400" />
                    {scheme.highRiskCount} Flagged Centers
                  </span>
                  <button
                    onClick={() => onOpenDutyAllocation?.(scheme.schemeCode)}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center"
                  >
                    <span>Audit</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Anomalies Feed Header & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Live AI Anomaly Detection Feed</h3>
              <p className="text-xs text-slate-400">
                Identified biometric cliffs, geo-fence deviations, and ghost headcount fraud requiring official intervention.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search facility, DARPAN, district..."
                className="pl-8 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-48 sm:w-60"
              />
            </div>

            {/* Severity Filter */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-0.5 flex items-center">
              {['ALL', 'CRITICAL', 'HIGH', 'WARNING'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all ${
                    selectedSeverity === sev
                      ? sev === 'CRITICAL'
                        ? 'bg-rose-600 text-white'
                        : sev === 'HIGH'
                        ? 'bg-amber-600 text-white'
                        : 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Anomalies List */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
            <p className="text-xs">Scanning DoSJE central telemetric streams...</p>
          </div>
        ) : filteredAnomalies.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400/60" />
            <p className="text-sm font-medium text-slate-300">Zero Active Anomalies</p>
            <p className="text-xs text-slate-400 mt-1">All monitored institutes are operating within normal biometric tolerances.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAnomalies.map((anomaly) => (
              <div
                key={anomaly.id}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-3 shadow-md relative"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                          anomaly.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : anomaly.severity === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                        }`}
                      >
                        {anomaly.severity}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${getSchemeCardBadge(anomaly.scheme)}`}>
                        {anomaly.scheme}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(anomaly.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      {anomaly.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {anomaly.description}
                    </p>
                  </div>

                  {/* Institute & Location */}
                  <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{anomaly.ngoName}</span>
                      <span className="font-mono text-cyan-400 text-[11px]">{anomaly.darpanId}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{anomaly.district}</span>
                    </div>
                  </div>

                  {/* Metrics Comparison Box */}
                  <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Baseline Value</span>
                      <span className="font-mono font-semibold text-slate-300">{anomaly.baselineValue}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-400 block">Detected Telemetry</span>
                      <span className="font-mono font-bold text-rose-300">{anomaly.metricValue}</span>
                    </div>
                  </div>
                </div>

                {/* Status & Intervention Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {anomaly.status === 'SHOW_CAUSE_ISSUED' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/50">
                        <CheckCircle2 className="w-3 h-3" />
                        Notice Issued
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/50">
                        <AlertTriangle className="w-3 h-3" />
                        Open Violation
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Surprise Video Conference Button */}
                    <button
                      onClick={() => onLaunchVcWithNgo?.(anomaly.ngoId)}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Initiate Immediate Random Video Conference"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Surprise VC</span>
                    </button>

                    {/* Show-Cause Notice Button */}
                    {anomaly.status !== 'SHOW_CAUSE_ISSUED' ? (
                      <button
                        onClick={() => handleTriggerNotice(anomaly)}
                        disabled={issuingNoticeId === anomaly.id}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-all active:scale-95"
                      >
                        {issuingNoticeId === anomaly.id ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Issuing...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Issue Notice</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        7-Day Reply Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
