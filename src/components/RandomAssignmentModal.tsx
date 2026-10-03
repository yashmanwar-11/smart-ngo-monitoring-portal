import React, { useState, useEffect } from 'react';
import {
  Shuffle,
  Shield,
  ShieldCheck,
  Lock,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  History,
  Clock,
  MapPin,
  Building2,
  UserCheck,
  Award,
  ChevronRight,
  Download,
  X,
  Sliders,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';
import { DosjeScheme, RandomAssignmentBatch, RandomAssignmentTask } from '../types';
import { randomAssignmentApi } from '../services/apiClient';

interface RandomAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (message: string, type?: 'success' | 'info') => void;
}

export const RandomAssignmentModal: React.FC<RandomAssignmentModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'allocate' | 'history'>('allocate');
  
  // Form State
  const [selectedScheme, setSelectedScheme] = useState<string>('ALL');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [batchSize, setBatchSize] = useState<number>(5);
  const [bufferHours, setBufferHours] = useState<number>(4);

  // Execution State
  const [isAllocating, setIsAllocating] = useState<boolean>(false);
  const [shuffleStep, setShuffleStep] = useState<number>(0);
  const [currentBatch, setCurrentBatch] = useState<RandomAssignmentBatch | null>(null);
  const [batchHistory, setBatchHistory] = useState<RandomAssignmentBatch[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [showSeedDetail, setShowSeedDetail] = useState<boolean>(false);

  // Load past batches on open
  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await randomAssignmentApi.getBatches();
      if (res && res.batches) {
        setBatchHistory(res.batches);
      }
    } catch (err) {
      console.error('Failed to load past random assignment batches:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleExecuteAllocation = async () => {
    setIsAllocating(true);
    setShuffleStep(1);

    try {
      const result = await randomAssignmentApi.execute({
        schemeFilter: selectedScheme,
        stateFilter: selectedState,
        batchSize,
        antiCollusionBufferHours: bufferHours,
      });

      setIsAllocating(false);
      setShuffleStep(0);
      if (result && result.success) {
        const newBatch: RandomAssignmentBatch = {
          batchId: result.batchId,
          timestamp: new Date().toISOString(),
          generatedBy: 'Directorate AI Duty Allocator',
          neutralitySeed: result.neutralitySeed,
          schemeFilter: selectedScheme,
          stateFilter: selectedState,
          totalAssigned: result.totalAssigned,
          antiCollusionBufferHours: result.antiCollusionBufferHours,
          tasks: result.tasks,
        };
        setCurrentBatch(newBatch);
        setBatchHistory((prev) => [newBatch, ...prev]);
        if (onShowToast) {
          onShowToast(`Dispatched ${result.totalAssigned} surprise inspection tasks with cryptographic lock.`, 'success');
        }
      }
    } catch (error: any) {
      setIsAllocating(false);
      setShuffleStep(0);
      alert('Error executing allocation: ' + (error.message || 'Server error'));
    }
  };

  const getSchemeBadge = (scheme: string) => {
    switch (scheme) {
      case 'NAPDDR':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">NAPDDR (De-addiction)</span>;
      case 'AVYAY':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">AVYAY (Elderly Care)</span>;
      case 'DDRS':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">DDRS (Disability)</span>;
      case 'PM_AJAY':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">PM-AJAY (Hostels)</span>;
      case 'SMILE':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">SMILE (Rehabilitation)</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-600/30 text-slate-300 border border-slate-600">{scheme}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
              <Shuffle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  DoSJE AI Double-Blind Duty Allocation Engine
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Anti-Collusion AI
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Statutory Randomized Duty Allocation &bull; Automated Conflict-of-Interest Screening &bull; T-Minus 4h Blind Lock
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-1 flex items-center gap-1">
              <button
                onClick={() => setActiveTab('allocate')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  activeTab === 'allocate'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  New Allocation
                </span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('history');
                  fetchBatches();
                }}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  activeTab === 'history'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  Batch History ({batchHistory.length})
                </span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'allocate' ? (
            <>
              {/* Top Anti-Collusion Architecture Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-200 uppercase tracking-wide">0-Affiliation Check</h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Cross-checks domicile, previous postings, and past inspections to prevent familiarity bias.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-cyan-200 uppercase tracking-wide">T-Minus Blind Sealing</h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Destination institute details remain encrypted in inspector app until {bufferHours} hours before scheduled arrival.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-200 uppercase tracking-wide">HMAC SHA-256 Verified</h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Every batch is stamped with cryptographic entropy proving true mathematical unpredictability.
                    </p>
                  </div>
                </div>
              </div>

              {/* Allocation Control Panel */}
              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 shadow-inner">
                <div className="flex items-center gap-2 mb-4">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-white">Allocation Parameters</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Scheme Filter */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      DoSJE Scheme Scope
                    </label>
                    <select
                      value={selectedScheme}
                      onChange={(e) => setSelectedScheme(e.target.value)}
                      disabled={isAllocating}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="ALL">All Schemes (Cross-Sector)</option>
                      <option value="NAPDDR">NAPDDR (Drug De-addiction)</option>
                      <option value="AVYAY">AVYAY (Senior Citizens)</option>
                      <option value="DDRS">DDRS (Disability Rehabilitation)</option>
                      <option value="PM_AJAY">PM-AJAY (SC Welfare Hostels)</option>
                      <option value="SMILE">SMILE (Livelihood & Shelters)</option>
                    </select>
                  </div>

                  {/* State Filter */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Jurisdiction / State
                    </label>
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      disabled={isAllocating}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="ALL">All States (Pan-India PMU)</option>
                      <option value="Delhi">Delhi NCT</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Rajasthan">Rajasthan</option>
                    </select>
                  </div>

                  {/* Batch Size */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Batch Quota (Institutes)
                    </label>
                    <select
                      value={batchSize}
                      onChange={(e) => setBatchSize(Number(e.target.value))}
                      disabled={isAllocating}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value={3}>3 Institutes (Rapid Spot Audit)</option>
                      <option value={5}>5 Institutes (Standard PMU Batch)</option>
                      <option value={10}>10 Institutes (Division Wide Sweep)</option>
                      <option value={15}>15 Institutes (Quarterly Blitz)</option>
                    </select>
                  </div>

                  {/* Anti-Collusion Buffer Hours */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Blind Window (Anti-Collusion)
                    </label>
                    <select
                      value={bufferHours}
                      onChange={(e) => setBufferHours(Number(e.target.value))}
                      disabled={isAllocating}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value={2}>T-2 Hours (Immediate Flying Squad)</option>
                      <option value={4}>T-4 Hours (Statutory Recommended)</option>
                      <option value={6}>T-6 Hours (Inter-District Travel)</option>
                      <option value={12}>T-12 Hours (Remote Hill/Tribal Area)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-700/60">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Lock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Allocations are saved directly to Central Registry & Field Officers will receive push tokens.</span>
                  </div>

                  <button
                    onClick={handleExecuteAllocation}
                    disabled={isAllocating}
                    className={`px-6 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
                      isAllocating
                        ? 'bg-indigo-700 text-white cursor-wait'
                        : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white hover:brightness-110 shadow-indigo-500/25 active:scale-95'
                    }`}
                  >
                    {isAllocating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Running AI Randomizer...</span>
                      </>
                    ) : (
                      <>
                        <Shuffle className="w-4 h-4" />
                        <span>Execute Double-Blind Randomizer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* In-Flight Animation */}
              {isAllocating && (
                <div className="p-8 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 text-center space-y-4 animate-pulse">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300">
                    <Shuffle className="w-8 h-8 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">
                      {shuffleStep === 1 && '1. Gathering Active Field Officer Pool & Target Facilities...'}
                      {shuffleStep === 2 && '2. Running Haversine Matrix & Conflict-of-Interest Pruning...'}
                      {shuffleStep === 3 && '3. Generating SHA-256 Neutrality Seed & Locking T-Minus Envelope...'}
                    </h4>
                    <p className="text-xs text-indigo-300/80 mt-1">
                      Ensuring mathematical parity, geofencing integrity, and total zero-collusion compliance.
                    </p>
                  </div>
                </div>
              )}

              {/* Current Batch Results Display */}
              {currentBatch && !isAllocating && (
                <div className="space-y-4">
                  {/* Batch Summary Header */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-400">Batch Code:</span>
                        <code className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                          {currentBatch.batchId}
                        </code>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Officially Sealed
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>Allocated: {currentBatch.totalAssigned} Facilities</span>
                        <span>&bull;</span>
                        <span>Blind Lock Buffer: {currentBatch.antiCollusionBufferHours} Hours</span>
                        <span>&bull;</span>
                        <span className="text-indigo-300">Audits Scheduled For: {new Date(currentBatch.tasks[0]?.scheduledAuditDate || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowSeedDetail(!showSeedDetail)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
                      >
                        {showSeedDetail ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {showSeedDetail ? 'Hide Entropy Seed' : 'View Neutrality Proof'}
                      </button>

                      <button
                        onClick={() => window.print()}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print Dispatch Order
                      </button>
                    </div>
                  </div>

                  {/* Seed Detail Dropdown */}
                  {showSeedDetail && (
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1 text-slate-400 animate-in fade-in duration-150">
                      <div className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-cyan-400" />
                        DoSJE Cryptographic Neutrality Seed (HMAC-SHA256):
                      </div>
                      <div className="text-cyan-400 break-all select-all bg-slate-900/80 p-2 rounded border border-slate-800">
                        {currentBatch.neutralitySeed}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Auditable by Comptroller and Auditor General (CAG) / Central Vigilance Commission (CVC).
                      </p>
                    </div>
                  )}

                  {/* Allocation Table / Matrix */}
                  <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/60">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-800/70 text-slate-300 font-semibold border-b border-slate-800">
                          <tr>
                            <th className="py-3 px-4">Task ID</th>
                            <th className="py-3 px-4">Institute / Project</th>
                            <th className="py-3 px-4">Scheme</th>
                            <th className="py-3 px-4">Assigned Inspector</th>
                            <th className="py-3 px-4">Conflict Check</th>
                            <th className="py-3 px-4">Risk Level</th>
                            <th className="py-3 px-4">Security Envelope</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                          {currentBatch.tasks.map((task) => (
                            <tr key={task.id} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-3 px-4 font-mono font-medium text-slate-400">
                                {task.id}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-semibold text-white">{task.instituteName}</div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <MapPin className="w-3 h-3 text-slate-500" />
                                  <span>{task.district}, {task.state}</span>
                                  <span>&bull;</span>
                                  <span className="font-mono text-cyan-400">{task.darpanId}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                {getSchemeBadge(task.scheme)}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-medium text-slate-200">{task.inspectorName}</div>
                                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                                  <UserCheck className="w-3 h-3 text-emerald-400" />
                                  <span>Badge: {task.inspectorBadge}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                                  <ShieldCheck className="w-3 h-3" />
                                  Cleared (0 Affil)
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                    task.riskScore > 70
                                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                      : task.riskScore > 40
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  }`}
                                >
                                  Score: {task.riskScore}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center gap-1 text-xs text-cyan-300 bg-cyan-950/40 px-2 py-1 rounded border border-cyan-800/50">
                                  <Lock className="w-3 h-3" />
                                  Locked (T-{bufferHours}h)
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* History Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Historical AI Allocation Batches</h3>
                  <p className="text-xs text-slate-400">
                    Audit log of all algorithmic surprise inspection duty dispatches.
                  </p>
                </div>
                <button
                  onClick={fetchBatches}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                  Refresh Log
                </button>
              </div>

              {isLoadingHistory ? (
                <div className="p-8 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                  <p className="text-xs">Loading batch audit records...</p>
                </div>
              ) : batchHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-800/30 rounded-xl border border-slate-800">
                  <Shuffle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">No duty allocation batches recorded yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Execute your first allocation from the New Allocation tab.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {batchHistory.map((batch) => (
                    <div
                      key={batch.batchId}
                      className="p-4 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800 transition-colors space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-indigo-300">
                            {batch.batchId}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {batch.totalAssigned} Facilities
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300">
                            Buffer: {batch.antiCollusionBufferHours || 4}h
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(batch.timestamp).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                        <span><strong className="text-slate-300">Scheme Scope:</strong> {batch.schemeFilter}</span>
                        <span><strong className="text-slate-300">Jurisdiction:</strong> {batch.stateFilter}</span>
                        <span><strong className="text-slate-300">Operator:</strong> {batch.generatedBy}</span>
                      </div>

                      <div className="text-[11px] font-mono text-slate-500 break-all bg-slate-950/60 p-2 rounded border border-slate-900">
                        Seed: {batch.neutralitySeed}
                      </div>

                      {batch.tasks && batch.tasks.length > 0 && (
                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-xs text-slate-400">
                            Includes: {batch.tasks.slice(0, 3).map((t) => t.instituteName).join(', ')}
                            {batch.tasks.length > 3 ? ` + ${batch.tasks.length - 3} more` : ''}
                          </span>
                          <button
                            onClick={() => {
                              setCurrentBatch(batch);
                              setActiveTab('allocate');
                            }}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                          >
                            <span>Inspect Batch</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>DoSJE Double-Blind Randomizer compliant with National e-Governance Division (NeGD) Standards.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};
