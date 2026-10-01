import React, { useState, useEffect } from 'react';
import {
  INITIAL_USERS,
  INITIAL_NGOS,
  INITIAL_INSPECTIONS,
  INITIAL_COMPLAINTS,
  INITIAL_APPLICATIONS,
} from './data/mockData';
import { User, NGO, InspectionRecord, Complaint, NgoApplication, GovernmentInspectionTask, UserRole } from './types';
import { getStoredGovernmentTasks, assignInspectorToTask } from './services/governmentTasksStorage';
import { authApi, ngoApi, inspectionApi, grievanceApi, applicationApi, getStoredToken, setStoredToken } from './services/apiClient';
import { Navbar } from './components/Navbar';
import { HeroLandingPage } from './components/HeroLandingPage';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { OfficerDashboard } from './components/OfficerDashboard';
import { NormalUserDashboard } from './components/NormalUserDashboard';
import { NgoDashboard } from './components/NgoDashboard';
import { NgoWorkerAttendancePage } from './components/NgoWorkerAttendancePage';
import { AssignInspectorModal } from './components/AssignInspectorModal';
import { InspectionDetailModal } from './components/InspectionDetailModal';
import { InspectorLoginModal } from './components/InspectorLoginModal';
import { NgoPublicDetailModal } from './components/NgoPublicDetailModal';
import { AndroidSimulatorStudio } from './components/AndroidSimulatorStudio';
import { GlobalCommandPalette } from './components/GlobalCommandPalette';
import { VigilanceAiCopilot } from './components/VigilanceAiCopilot';
import { AndroidAppExperience } from './components/AndroidAppExperience';
import { RandomVideoConferenceModal } from './components/RandomVideoConferenceModal';
import { RandomAssignmentModal } from './components/RandomAssignmentModal';
import { SihTeamModal } from './components/SihTeamModal';
import { VersionReleaseModal } from './components/VersionReleaseModal';
import { ApiKeysConfigModal } from './components/ApiKeysConfigModal';
import {
  CheckCircle,
  AlertCircle,
  Info,
  Lock,
  ShieldCheck,
  ShieldAlert,
  LogIn,
  Shield,
  Smartphone,
  X
} from 'lucide-react';
import { AuthSession } from './types';

// Synchronizes NGO Directory Status & Scores with Directorate Scrutiny Reviews
const syncNgosWithTasks = (currentTasks: GovernmentInspectionTask[], currentNgos: NGO[]): NGO[] => {
  return currentNgos.map((ngo) => {
    const matchingTask = currentTasks.find(
      (t) =>
        t.title.toLowerCase().includes(ngo.name.toLowerCase()) ||
        ngo.name.toLowerCase().includes(t.title.toLowerCase())
    );
    if (matchingTask?.scrutinyReview) {
      const isBad = matchingTask.scrutinyReview.verdict === 'BAD_DEFICIENT';
      return {
        ...ngo,
        status: isBad ? 'FLAGGED_VIOLATION' : 'REGISTERED',
        complianceScore: matchingTask.scrutinyReview.score,
        lastInspectionDate: matchingTask.date,
      };
    }
    return ngo;
  });
};

export default function App() {
  // Navigation View State
  const [currentView, setCurrentView] = useState<'HERO' | 'DASHBOARD' | 'WORKER_ATTENDANCE'>('HERO');

  // Android View Simulator State
  const isInsideAndroidFrame = typeof window !== 'undefined' && window.location.search.includes('android_mode=1');
  const [isAndroidSimulatorOpen, setIsAndroidSimulatorOpen] = useState(false);

  // Authentication & Security Clearance State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  // Core Interconnected State (Unauthenticated by default to enforce strict security gating)
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentSession, setCurrentSession] = useState<AuthSession | null>(null);
  const [govTasks, setGovTasks] = useState<GovernmentInspectionTask[]>(() => getStoredGovernmentTasks());
  const [ngos, setNgos] = useState<NGO[]>(() => syncNgosWithTasks(getStoredGovernmentTasks(), INITIAL_NGOS));
  const [inspections, setInspections] = useState<InspectionRecord[]>(INITIAL_INSPECTIONS);
  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS);
  const [applications, setApplications] = useState<NgoApplication[]>(INITIAL_APPLICATIONS);

  // Modals & Navigation Target State
  const [dashboardTargetTab, setDashboardTargetTab] = useState<string | undefined>();
  const [publicNgoDetail, setPublicNgoDetail] = useState<NGO | null>(null);
  const [complaintPreselectedNgoId, setComplaintPreselectedNgoId] = useState<string | undefined>();
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [preSelectedNgoId, setPreSelectedNgoId] = useState<string | undefined>(undefined);
  const [selectedInspectionForDetail, setSelectedInspectionForDetail] = useState<InspectionRecord | null>(null);
  const [isInspectorLoginOpen, setIsInspectorLoginOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // DoSJE Surprise VC & AI Duty Allocation Modals State
  const [isRandomVcOpen, setIsRandomVcOpen] = useState(false);
  const [randomVcPreselectedNgoId, setRandomVcPreselectedNgoId] = useState<string | undefined>(undefined);
  const [isRandomDutyModalOpen, setIsRandomDutyModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isApiConfigModalOpen, setIsApiConfigModalOpen] = useState(false);

  // Actionable Notification Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info'; title?: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success', title?: string) => {
    setToastMessage({ text, type, title });
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Accessibility & Command Palette Global States
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [fontSizeRatio, setFontSizeRatio] = useState<'standard' | 'large' | 'small'>('standard');
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  // Dynamic Root Font Size Scaling
  useEffect(() => {
    if (fontSizeRatio === 'large') {
      document.documentElement.style.fontSize = '112.5%';
    } else if (fontSizeRatio === 'small') {
      document.documentElement.style.fontSize = '92.5%';
    } else {
      document.documentElement.style.fontSize = '100%';
    }
  }, [fontSizeRatio]);

  // High-Contrast Attribute Synchronization
  useEffect(() => {
    if (isHighContrast) {
      document.documentElement.setAttribute('data-contrast', 'high');
      document.body.classList.add('high-contrast-mode');
    } else {
      document.documentElement.removeAttribute('data-contrast');
      document.body.classList.remove('high-contrast-mode');
    }
  }, [isHighContrast]);

  // Global Keyboard Shortcut Listener for Command Palette (Ctrl+K / ⌘K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Real-time backend synchronization on mount
  useEffect(() => {
    // 1. Restore authenticated session if valid token exists
    const initAuth = async () => {
      const token = getStoredToken();
      if (token) {
        try {
          const res = await authApi.getMe();
          if (res?.user) {
            setCurrentUser(res.user);
            setCurrentSession({
              token,
              loginTime: new Date().toLocaleString('en-IN') + ' IST',
              clearance: res.user.clearance || (res.user.role === 'ADMIN' ? 'LEVEL_5_DIRECTORATE' : res.user.role === 'OFFICER' ? 'LEVEL_3_INSPECTOR' : res.user.role === 'NGO' ? 'LEVEL_2_NGO' : 'LEVEL_1_PUBLIC'),
              ipAddress: '10.194.73.98 (NIC Gov Secure Net)',
              deviceFingerprint: 'CERT-IN-TAMPER-PROOF-HW-9921',
              isVerified2FA: true,
            });
            setCurrentView('DASHBOARD');
          }
        } catch (e) {
          console.warn('Session expired or invalid token:', e);
          setStoredToken(null);
        }
      }

      // Handle direct view switching if loaded inside Android Simulator
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const roleParam = searchParams.get('role');
        const viewParam = searchParams.get('view');
        
        if (viewParam === 'WORKER_ATTENDANCE' || roleParam === 'NGO_WORKER') {
          setCurrentView('WORKER_ATTENDANCE');
          const worker = INITIAL_USERS.find((u) => u.role === 'NGO_WORKER');
          if (worker) setCurrentUser(worker);
        } else if (roleParam === 'OFFICER') {
          const officer = INITIAL_USERS.find((u) => u.role === 'OFFICER');
          if (officer) setCurrentUser(officer);
          setCurrentView('DASHBOARD');
        } else if (roleParam === 'USER' || roleParam === 'CITIZEN') {
          const citizen = INITIAL_USERS.find((u) => u.role === 'USER');
          if (citizen) setCurrentUser(citizen);
          setCurrentView('DASHBOARD');
        } else if (roleParam === 'ADMIN') {
          const admin = INITIAL_USERS.find((u) => u.role === 'ADMIN');
          if (admin) setCurrentUser(admin);
          setCurrentView('DASHBOARD');
        } else if (roleParam === 'NGO') {
          const ngoRep = INITIAL_USERS.find((u) => u.role === 'NGO');
          if (ngoRep) setCurrentUser(ngoRep);
          setCurrentView('DASHBOARD');
        }
      }
    };

    // 2. Fetch live data from backend SQLite database
    const loadPortalData = async () => {
      try {
        const [ngosRes, inspsRes, complaintsRes, usersRes, appsRes] = await Promise.allSettled([
          ngoApi.getAll(),
          inspectionApi.getAll(),
          grievanceApi.getAll(),
          authApi.getUsers(),
          applicationApi.getAll(),
        ]);

        if (ngosRes.status === 'fulfilled' && Array.isArray(ngosRes.value) && ngosRes.value.length > 0) {
          setNgos(ngosRes.value);
        }
        if (inspsRes.status === 'fulfilled' && Array.isArray(inspsRes.value) && inspsRes.value.length > 0) {
          setGovTasks(inspsRes.value);
        }
        if (complaintsRes.status === 'fulfilled' && Array.isArray(complaintsRes.value) && complaintsRes.value.length > 0) {
          setComplaints(complaintsRes.value);
        }
        if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value) && usersRes.value.length > 0) {
          setUsers(usersRes.value);
        }
        if (appsRes.status === 'fulfilled' && Array.isArray(appsRes.value) && appsRes.value.length > 0) {
          setApplications(appsRes.value);
        }
      } catch (err) {
        console.error('Failed to load initial portal data:', err);
      }
    };

    initAuth();
    loadPortalData();
  }, []);

  const fieldOfficers = users.filter((u) => u.role === 'OFFICER');

  // Auth Handlers with Cryptographic Clearance Verification
  const handleOpenLogin = () => {
    setAuthMode('LOGIN');
    setIsAuthModalOpen(true);
  };

  const handleOpenSignUp = () => {
    setAuthMode('SIGNUP');
    setIsAuthModalOpen(true);
  };

  const handleLoginSuccess = (user: User, session: AuthSession) => {
    setCurrentUser(user);
    setCurrentSession(session);
    setIsAuthModalOpen(false);
    setCurrentView('DASHBOARD');
    showToast(`✓ Access Granted: ${user.name} (${user.clearance?.replace(/_/g, ' ') || user.role}).`, 'success');
  };

  const handleSignUpSuccess = (newUser: User, session: AuthSession) => {
    setUsers((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);
    setCurrentSession(session);
    setIsAuthModalOpen(false);
    setCurrentView('DASHBOARD');
    showToast(`✓ Account created & authenticated with ${newUser.clearance?.replace(/_/g, ' ') || newUser.role} Clearance.`, 'success');
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    setCurrentUser(null);
    setCurrentSession(null);
    setCurrentView('HERO');
    showToast('🔒 Session revoked. Internal dashboard locked.', 'info');
  };

  const handleEnterDashboard = async (role?: UserRole) => {
    if (role) {
      try {
        const res = await authApi.switchUser({ role });
        setCurrentUser(res.user);
        setCurrentSession(res.session);
        setCurrentView('DASHBOARD');
        showToast(`✓ Verified ${res.user.clearance?.replace(/_/g, ' ') || res.user.role} Clearance for ${res.user.name}.`, 'success');
        return;
      } catch (err) {
        console.warn('Backend switchUser fallback:', err);
        const match = users.find((u) => u.role === role) || users[0];
        const session: AuthSession = {
          token: `SES-${role}-${Date.now().toString(36).toUpperCase()}`,
          loginTime: new Date().toLocaleTimeString('en-IN') + ' IST',
          clearance: match.clearance || (role === 'ADMIN' ? 'LEVEL_5_DIRECTORATE' : role === 'OFFICER' ? 'LEVEL_3_INSPECTOR' : role === 'NGO' ? 'LEVEL_2_NGO' : 'LEVEL_1_PUBLIC'),
          ipAddress: '10.244.18.91 (NIC Secure GovNet)',
          deviceFingerprint: 'SHA256:' + Math.random().toString(16).substring(2, 10),
          isVerified2FA: true,
        };
        setCurrentUser(match);
        setCurrentSession(session);
        setCurrentView('DASHBOARD');
        showToast(`✓ Verified ${match.clearance?.replace(/_/g, ' ') || match.role} Clearance for ${match.name}.`, 'success');
        return;
      }
    }

    if (!currentUser) {
      setIsAuthModalOpen(true);
      showToast('🔒 Access Restricted: Please authenticate to view internal dashboards.', 'info');
      return;
    }

    setCurrentView('DASHBOARD');
  };

  // Handler: Assign Inspector to Government Task
  const handleAssignGovTask = async (taskId: string, inspector: User) => {
    try {
      await inspectionApi.assign(taskId, inspector.id);
      const updated = await inspectionApi.getAll();
      setGovTasks(updated);
      showToast(`✓ Inspection ${taskId} successfully assigned to ${inspector.name} via Central Registry.`, 'success');
    } catch {
      const result = assignInspectorToTask(taskId, inspector);
      setGovTasks([...result.allTasks]);
      showToast(`✓ Inspection ${taskId} successfully assigned to ${inspector.name} (${inspector.badgeNumber || 'INSP'}).`, 'success');
    }
  };

  const handleRefreshGovTasks = () => {
    const updated = getStoredGovernmentTasks();
    setGovTasks(updated);
    setNgos((prev) => syncNgosWithTasks(updated, prev));
  };

  const handleUpdateGovTask = (_updatedTask: GovernmentInspectionTask) => {
    const updated = getStoredGovernmentTasks();
    setGovTasks(updated);
    setNgos((prev) => syncNgosWithTasks(updated, prev));
  };

  // Handler: Assign Inspector
  const handleAssignInspector = async (newInspection: InspectionRecord) => {
    setInspections((prev) => [newInspection, ...prev]);

    // Update target NGO status
    setNgos((prev) =>
      prev.map((n) => (n.id === newInspection.ngoId ? { ...n, status: 'UNDER_INSPECTION' } : n))
    );

    try {
      await inspectionApi.create({
        ngoId: newInspection.ngoId,
        inspectionType: newInspection.priority === 'COMPLAINT_INVESTIGATION' ? 'Complaint Investigation' : 'Routine Statutory Audit',
        priority: newInspection.priority === 'COMPLAINT_INVESTIGATION' ? 'CRITICAL' : 'MEDIUM',
        scheduledDate: newInspection.scheduledDate,
        scheduledTime: newInspection.scheduledTime || '11:00 AM',
        instructions: `Dispatched inspection assigned to ${newInspection.officerName} (${newInspection.officerBadge || 'INSP'})`,
      });
      const updatedTasks = await inspectionApi.getAll();
      setGovTasks(updatedTasks);
    } catch (e) {
      console.warn('Backend inspection dispatch sync:', e);
    }

    showToast(`✓ Field Inspection dispatched to ${newInspection.officerName} for ${newInspection.ngoName}`, 'success');
  };

  // Handler: Start Inspection by Officer
  const handleStartInspection = (inspectionId: string, officerCoords: { lat: number; lng: number }) => {
    setInspections((prev) =>
      prev.map((i) =>
        i.id === inspectionId
          ? {
              ...i,
              status: 'ON_SITE_IN_PROGRESS',
              startDateTime: new Date().toLocaleString('en-IN') + ' IST',
              geofenceVerified: true,
              officerDistanceToNgoMeters: 45,
            }
          : i
      )
    );

    showToast('Inspection commenced. GPS stream and 150m geofence active on site.', 'info');
  };

  // Handler: Submit Completed Inspection (Interconnected with NGOs, Complaints, and Tasks)
  const handleSubmitInspection = (inspectionId: string, data: Partial<InspectionRecord>) => {
    setInspections((prev) =>
      prev.map((i) => (i.id === inspectionId ? { ...i, ...data } : i))
    );

    const target = inspections.find((i) => i.id === inspectionId);
    if (target) {
      const isCritical = data.complianceRating === 'D_CRITICAL_FRAUD';

      // 1. Update NGO Status, Score, and last inspection date
      setNgos((prev) =>
        prev.map((n) => {
          if (n.id === target.ngoId) {
            return {
              ...n,
              status: isCritical ? 'FLAGGED_VIOLATION' : 'REGISTERED',
              complianceScore: data.score || 95,
              lastInspectionDate: new Date().toISOString().split('T')[0],
            };
          }
          return n;
        })
      );

      // 2. Interconnected: Resolve any pending complaints associated with this inspected NGO
      setComplaints((prev) =>
        prev.map((c) => {
          if (c.ngoId === target.ngoId && c.status === 'INSPECTION_ORDERED') {
            return {
              ...c,
              status: 'RESOLVED_VALIDATED',
              adminRemarks: `Physical audit concluded by ${data.officerName || target.officerName}. Rating: ${data.complianceRating || 'SATISFACTORY'}. Score: ${data.score || 90}/100.`,
            };
          }
          return c;
        })
      );

      // 3. Update task in govTasks if matching ID
      setGovTasks((prev) =>
        prev.map((t) =>
          t.id === inspectionId
            ? {
                ...t,
                status: isCritical ? 'Failed/Issue Found' : 'Completed',
                submittedRecord: {
                  inspectionId,
                  locationSite: target.ngoName,
                  assignedInspector: data.officerName || target.officerName,
                  assignedInspectorBadge: target.officerBadge,
                  dateTime: new Date().toLocaleString('en-IN') + ' IST',
                  inspectionType: target.priority,
                  photos: data.photos || [],
                  checklist: [],
                  observations: data.findingsSummary || 'On-site verification completed successfully.',
                  issuesDefects: isCritical ? 'Critical discrepancies found during verification' : 'None. Compliant with parameters.',
                  severityPriority: isCritical ? 'Critical' : 'Low',
                  inspectorRemarks: data.actionRecommended || 'Audited',
                  inspectionStatus: isCritical ? 'Failed/Issue Found' : 'Completed',
                  geofenceVerified: true,
                  tamperProofHash: 'SHA256:' + Math.random().toString(16).substring(2, 10),
                },
              }
            : t
        )
      );
    }

    showToast('✓ Statutory Audit Dossier submitted with GPS watermarks and digital signature.', 'success');
  };

  // Handler: Approve NGO Registration Application (Interconnected: provisions directly to SQLite Master Registry)
  const handleApproveApplication = async (appId: string) => {
    const app = applications.find((a) => a.id === appId);
    if (!app) return;

    try {
      await applicationApi.approve(appId);
      const [updatedApps, updatedNgos] = await Promise.all([
        applicationApi.getAll(),
        ngoApi.getAll()
      ]);
      setApplications(updatedApps);
      setNgos(updatedNgos);
      showToast(`✓ Approved registration for ${app.ngoName}. Added to Master Registry & Interactive Map.`, 'success');
    } catch (e) {
      console.warn('Backend application approve fallback:', e);
      const newNgo: NGO = {
        id: 'ngo_' + Date.now(),
        name: app.ngoName,
        regNumber: app.registrationNumber,
        sector: app.sector as any,
        status: 'REGISTERED',
        foundingYear: new Date().getFullYear(),
        presidentName: app.applicantName,
        contactEmail: app.email,
        contactPhone: app.phone,
        address: app.address,
        district: app.district,
        state: app.state,
        coordinates: { lat: app.lat, lng: app.lng },
        fcraStatus: 'UNDER_REVIEW',
        annualBudgetInr: 2500000,
        complianceScore: 100,
        reportedComplaintsCount: 0,
        description: `Newly onboarded non-profit organization serving ${app.sector} in ${app.district}. Approved under NITI Aayog guidelines.`,
        documents: {
          panCardNumber: 'AAATB' + Math.floor(1000 + Math.random() * 9000) + 'K',
          darpanId: app.darpanId,
        },
      };

      setNgos((prev) => [newNgo, ...prev]);
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: 'APPROVED' } : a))
      );
      showToast(`✓ Approved registration for ${app.ngoName}. Added to Master Registry & Interactive Map.`, 'success');
    }
  };

  // Handler: Reject Application
  const handleRejectApplication = async (appId: string, reason: string) => {
    try {
      await applicationApi.reject(appId, reason);
      const updatedApps = await applicationApi.getAll();
      setApplications(updatedApps);
      showToast(`Registration application rejected.`);
    } catch {
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: 'REJECTED', rejectionReason: reason } : a))
      );
      showToast(`Registration application rejected.`);
    }
  };

  // Handler: Complaint status update (Interconnected: Ordering surprise inspection dispatches real task to SQLite!)
  const handleUpdateComplaintStatus = async (
    complaintId: string,
    status: Complaint['status'],
    remarks?: string
  ) => {
    if (status === 'INSPECTION_ORDERED') {
      const targetComp = complaints.find((c) => c.id === complaintId);
      if (targetComp) {
        const assignedOfficer = fieldOfficers[0] || users[1];
        const targetNgo = ngos.find((n) => n.id === targetComp.ngoId);
        const inspectionId = 'INSP-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900);

        // 1. Create real inspection record in local state
        const newInsp: InspectionRecord = {
          id: inspectionId,
          ngoId: targetComp.ngoId,
          ngoName: targetComp.ngoName,
          officerId: assignedOfficer.id,
          officerName: assignedOfficer.name,
          officerBadge: assignedOfficer.badgeNumber || 'INSP-DEL-402',
          scheduledDate: new Date().toISOString().split('T')[0],
          scheduledTime: '11:00 AM',
          status: 'SCHEDULED',
          priority: 'COMPLAINT_INVESTIGATION',
          officerDistanceToNgoMeters: 380,
        };
        setInspections((prev) => [newInsp, ...prev]);

        // 2. Create Government Task in local state
        const newTask: GovernmentInspectionTask = {
          id: inspectionId,
          title: targetComp.ngoName + ' (Grievance Audit)',
          location: targetNgo?.address || 'Premises under inspection',
          department: 'Central Vigilance & Social Oversight',
          inspectionType: 'Surprise Grievance Audit',
          priority: 'Critical',
          date: new Date().toISOString().split('T')[0],
          status: 'Assigned',
          assignedInspectorId: assignedOfficer.id,
          assignedInspectorName: assignedOfficer.name,
          assignedInspectorBadge: assignedOfficer.badgeNumber,
          assignedDate: new Date().toISOString().split('T')[0],
          coordinates: targetNgo?.coordinates,
        };
        setGovTasks((prev) => [newTask, ...prev]);

        // 3. Update target NGO status
        setNgos((prev) =>
          prev.map((n) => (n.id === targetComp.ngoId ? { ...n, status: 'UNDER_INSPECTION' } : n))
        );

        // 4. Update complaint record
        setComplaints((prev) =>
          prev.map((c) =>
            c.id === complaintId
              ? {
                  ...c,
                  status: 'INSPECTION_ORDERED',
                  investigatingOfficerId: assignedOfficer.id,
                  adminRemarks: remarks || `Surprise field inspection ordered. Dispatched to ${assignedOfficer.name}.`,
                }
              : c
          )
        );

        // 5. Persist to central SQLite backend
        try {
          await grievanceApi.updateStatus(
            complaintId,
            'INSPECTION_ORDERED',
            remarks || `Surprise inspection ordered pursuant to complaint ${targetComp.trackingToken}`,
            assignedOfficer.id
          );
          if (targetComp.ngoId) {
            await inspectionApi.create({
              ngoId: targetComp.ngoId,
              inspectionType: 'Surprise Grievance Audit',
              priority: 'CRITICAL',
              scheduledDate: new Date().toISOString().split('T')[0],
              instructions: `Surprise field audit dispatched to ${assignedOfficer.name} based on whistleblower grievance ${targetComp.trackingToken}: ${targetComp.description}`,
            });
            const updatedTasks = await inspectionApi.getAll();
            setGovTasks(updatedTasks);
          }
        } catch (e) {
          console.warn('Backend grievance status & inspection creation sync:', e);
        }

        showToast(`✓ Surprise inspection ${inspectionId} dispatched to ${assignedOfficer.name} for ${targetComp.ngoName}.`, 'success');
        return;
      }
    }

    setComplaints((prev) =>
      prev.map((c) => (c.id === complaintId ? { ...c, status, adminRemarks: remarks } : c))
    );
    try {
      await grievanceApi.updateStatus(complaintId, status, remarks);
    } catch (e) {
      console.warn('Backend grievance status sync:', e);
    }
    showToast(`Grievance status updated: ${status.replace(/_/g, ' ')}`);
  };

  // Handler: Citizen Submits Complaint (Interconnected with SQLite backend)
  const handleCitizenComplaint = async (newComp: Partial<Complaint>) => {
    const token = newComp.trackingToken || 'GRV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    try {
      const res = await grievanceApi.submit({
        ngoId: newComp.ngoId,
        ngoName: newComp.ngoName,
        citizenName: newComp.citizenName,
        citizenContact: newComp.citizenContact,
        isAnonymous: newComp.isAnonymous,
        category: newComp.category || 'OTHER',
        description: newComp.description || '',
      });
      const grievances = await grievanceApi.getAll();
      setComplaints(grievances);
      const updatedNgos = await ngoApi.getAll();
      setNgos(updatedNgos);
      showToast(`✓ Grievance registered under Token ${res.trackingToken || token}. Added to Central Review Queue.`, 'success');
    } catch {
      // Local fallback
      const created: Complaint = {
        id: 'cmp_' + Date.now(),
        trackingToken: token,
        ngoId: newComp.ngoId || '',
        ngoName: newComp.ngoName || '',
        citizenName: newComp.citizenName,
        citizenContact: newComp.citizenContact,
        isAnonymous: Boolean(newComp.isAnonymous),
        category: newComp.category || 'OTHER',
        description: newComp.description || '',
        submittedAt: newComp.submittedAt || new Date().toLocaleString('en-IN') + ' IST',
        status: 'PENDING_REVIEW',
      };
      setComplaints((prev) => [created, ...prev]);
      if (newComp.ngoId) {
        setNgos((prev) =>
          prev.map((n) =>
            n.id === newComp.ngoId
              ? { ...n, reportedComplaintsCount: (n.reportedComplaintsCount || 0) + 1 }
              : n
          )
        );
      }
      showToast(`✓ Grievance registered under Token ${token}. Added to Central Review Queue.`, 'success');
    }
  };

  // Handler: New NGO registration submitted by citizen (Interconnected with SQLite backend)
  const handleCitizenApplication = async (newApp: Partial<NgoApplication>) => {
    try {
      const res = await applicationApi.submit(newApp);
      const updatedApps = await applicationApi.getAll();
      setApplications(updatedApps);
      showToast(`✓ Registration application for ${newApp.ngoName} placed in Review Queue (DARPAN: ${res.darpanId}).`, 'success');
    } catch (err) {
      console.warn('Backend application submit fallback:', err);
      const created: NgoApplication = {
        id: 'app_' + Date.now(),
        ngoName: newApp.ngoName || 'Untitled NGO',
        applicantName: newApp.applicantName || 'Applicant',
        applicantRole: newApp.applicantRole || 'Trustee',
        email: newApp.email || '',
        phone: newApp.phone || '',
        registrationNumber: newApp.registrationNumber || 'REG-DARPAN-' + Date.now(),
        sector: newApp.sector || 'Education',
        address: newApp.address || '',
        district: newApp.district || 'South Delhi',
        state: newApp.state || 'Delhi NCR',
        lat: newApp.lat || 28.6139,
        lng: newApp.lng || 77.2090,
        appliedDate: newApp.appliedDate || new Date().toISOString().split('T')[0],
        darpanId: newApp.darpanId || `DL/${new Date().getFullYear()}/${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'PENDING',
      };
      setApplications((prev) => [created, ...prev]);
      showToast(`✓ Registration application for ${created.ngoName} placed in Review Queue.`, 'success');
    }
  };

  // Native Android App Experience: rendered when inside the Android device frame or mobile mode
  if (isInsideAndroidFrame) {
    return (
      <div id="android-native-app" className="w-full h-full min-h-screen bg-[#f4f7fa] flex flex-col font-sans overflow-hidden">
        <AndroidAppExperience
          currentUser={currentUser}
          currentSession={currentSession}
          allUsers={users}
          ngos={ngos}
          govTasks={govTasks}
          inspections={inspections}
          complaints={complaints}
          applications={applications}
          onSwitchUser={async (user) => {
            try {
              const res = await authApi.switchUser({ userId: user.id });
              setCurrentUser(res.user);
              setCurrentSession(res.session);
              showToast(`Switched active clearance: ${res.user.name} (${res.user.role})`, 'info');
            } catch {
              setCurrentUser(user);
              showToast(`Switched active identity to ${user.name}`, 'info');
            }
          }}
          onOpenLogin={handleOpenLogin}
          onStartInspection={handleStartInspection}
          onSubmitInspection={handleSubmitInspection}
          onSubmitComplaint={handleCitizenComplaint}
          onShowToast={showToast}
        />

        {/* Actionable Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-14 inset-x-4 z-50 flex items-center space-x-2.5 bg-slate-900/95 backdrop-blur-md text-white text-xs font-semibold px-3 py-2.5 rounded-xl shadow-2xl border border-slate-700/80 animate-fade-in">
            <div className="flex-1 truncate">{toastMessage.text}</div>
            <button type="button" onClick={() => setToastMessage(null)} className="p-1 text-slate-400">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* e-Pramaan Auth Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode={authMode}
          allUsers={users}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          onSignUpSuccess={handleSignUpSuccess}
          onShowToast={showToast}
        />
      </div>
    );
  }

  return (
    <div id="main-content" className="min-h-screen bg-[#f8fafd] text-slate-800 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900 w-full max-w-full overflow-x-hidden">
      {/* Skip to Main Content Accessibility Link (GIGW 3.0 Standard) */}
      <a
        href="#portal-workspace"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-slate-900 focus:text-white focus:rounded-xl focus:shadow-2xl focus:ring-2 focus:ring-amber-400 font-bold text-xs transition-all"
      >
        Skip to main portal content (GIGW 3.0)
      </a>

      {/* Navigation Header */}
      <Navbar
        currentUser={currentUser}
        currentSession={currentSession}
        allUsers={users}
        currentView={currentView === 'WORKER_ATTENDANCE' ? 'DASHBOARD' : currentView}
        onNavigateHome={() => setCurrentView('HERO')}
        onNavigateDashboard={(targetTab?: string) => {
          if (targetTab) {
            setDashboardTargetTab(targetTab);
          }
          if (!currentUser) {
            showToast('🔒 Security Clearance Required: Please authenticate with e-Pramaan to access dashboards.', 'info');
            setIsAuthModalOpen(true);
          } else {
            setCurrentView('DASHBOARD');
          }
        }}
        onNavigateWorkerAttendance={() => setCurrentView('WORKER_ATTENDANCE')}
        onOpenLogin={handleOpenLogin}
        onOpenSignUp={handleOpenSignUp}
        onLogout={handleLogout}
        onSwitchUser={async (user) => {
          try {
            const res = await authApi.switchUser({ userId: user.id });
            setCurrentUser(res.user);
            setCurrentSession(res.session);
            if (user.role === 'NGO_WORKER') {
              setCurrentView('WORKER_ATTENDANCE');
            } else {
              setCurrentView('DASHBOARD');
            }
            showToast(`Switched active clearance: ${res.user.name} (${res.user.clearance?.replace(/_/g, ' ') || res.user.role})`, 'info');
          } catch (err) {
            console.warn('Backend switch user error:', err);
            const session: AuthSession = {
              token: `SES-${user.role}-${Date.now().toString(36).toUpperCase()}`,
              loginTime: new Date().toLocaleTimeString('en-IN') + ' IST',
              clearance: user.clearance || (user.role === 'ADMIN' ? 'LEVEL_5_DIRECTORATE' : user.role === 'OFFICER' ? 'LEVEL_3_INSPECTOR' : user.role === 'NGO' ? 'LEVEL_2_NGO' : user.role === 'NGO_WORKER' ? 'LEVEL_2_WORKER' : 'LEVEL_1_PUBLIC'),
              ipAddress: '10.244.18.91 (NIC Secure GovNet)',
              deviceFingerprint: 'SHA256:' + Math.random().toString(16).substring(2, 10),
              isVerified2FA: true,
            };
            setCurrentUser(user);
            setCurrentSession(session);
            if (user.role === 'NGO_WORKER') {
              setCurrentView('WORKER_ATTENDANCE');
            } else {
              setCurrentView('DASHBOARD');
            }
            showToast(`Switched active clearance: ${user.name} (${user.clearance?.replace(/_/g, ' ') || user.role})`, 'info');
          }
        }}
        onOpenInspectorLogin={() => setIsInspectorLoginOpen(true)}
        isMobileFrame={isInsideAndroidFrame}
        onToggleMobileFrame={() => setIsAndroidSimulatorOpen(true)}
        unreadComplaintsCount={complaints.filter((c) => c.status === 'PENDING_REVIEW').length}
        fontSizeRatio={fontSizeRatio}
        onSetFontSize={setFontSizeRatio}
        isHighContrast={isHighContrast}
        onToggleHighContrast={() => setIsHighContrast((prev) => !prev)}
        language={language}
        onToggleLanguage={() => setLanguage((prev) => (prev === 'en' ? 'hi' : 'en'))}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenTeamDetails={() => setIsTeamModalOpen(true)}
        onOpenVersionModal={() => setIsVersionModalOpen(true)}
        onOpenApiConfigModal={() => setIsApiConfigModalOpen(true)}
      />

      {/* Main View Render */}
      {currentView === 'HERO' ? (
        <HeroLandingPage
          ngos={ngos}
          officers={fieldOfficers}
          onOpenLogin={handleOpenLogin}
          onOpenSignUp={handleOpenSignUp}
          onEnterDashboard={handleEnterDashboard}
          onOpenInspectorTerminal={() => setIsInspectorLoginOpen(true)}
          onOpenWorkerAttendance={() => setCurrentView('WORKER_ATTENDANCE')}
          onOpenAndroidView={() => setIsAndroidSimulatorOpen(true)}
          onSelectNgoDetails={(ngo) => setPublicNgoDetail(ngo)}
          onNavigateCitizenTab={(tab) => {
            setDashboardTargetTab(tab);
            handleEnterDashboard('USER');
          }}
          onOpenTeamDetails={() => setIsTeamModalOpen(true)}
        />
      ) : currentView === 'WORKER_ATTENDANCE' ? (
        /* Dedicated NGO Worker Regular Attendance Workspace */
        <div className="min-h-screen bg-[#f8fafd] text-slate-800 flex flex-col flex-1">
          <main className="flex-1 py-6 px-3 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
            <NgoWorkerAttendancePage
              currentUser={
                currentUser?.role === 'NGO_WORKER'
                  ? currentUser
                  : users.find((u) => u.role === 'NGO_WORKER') || {
                      id: 'usr_worker_1',
                      name: 'Sunita Patil',
                      email: 'worker.patil@swasthya.org',
                      role: 'NGO_WORKER',
                      designation: 'Community Health Mobilizer & Field Staff',
                      clearance: 'LEVEL_2_WORKER',
                      phone: '+91 98334 11290',
                      badgeNumber: 'WRK-MH-8821',
                      ngoId: 'ngo_swasthya',
                      status: 'ACTIVE',
                    }
              }
              currentSession={currentSession}
              onShowToast={showToast}
              onNavigateBack={() => setCurrentView('HERO')}
            />
          </main>
        </div>
      ) : (
        /* Authenticated Dashboard View - Google Workspace Clean Design */
        <div className="min-h-screen bg-[#f8fafd] text-slate-800 flex flex-col flex-1">
          <main className="flex-1 py-6 px-3 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
            {!currentUser ? (
              /* Security Barrier Screen when unauthenticated */
              <div className="max-w-2xl mx-auto my-10 bg-white rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden text-center">
                {/* Modern Gradient Accent Line */}
                <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-400"></div>

                <div className="p-6 sm:p-10 space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
                    <Lock className="w-8 h-8 text-white" />
                  </div>

                  <div className="space-y-2">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                      Security Clearance Required • Level 1/3/5 Access Only
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      Official e-Pramaan SSO Required
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed pt-1">
                      Access to statutory inspection logs, live GPS tracking of field officers, and administrative action queues is restricted to authorized Government Officials and registered Whistleblowers.
                    </p>
                  </div>

                  <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 text-left space-y-3 text-xs text-slate-700 shadow-2xs">
                    <div className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>Role-Based Interface Access Protocol:</span>
                    </div>
                    <ul className="space-y-2 text-slate-600 text-xs">
                      <li className="flex items-start gap-2.5">
                        <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 shrink-0 text-[10px]">Level 5</span>
                        <span><strong>Directorate General / IAS Admin:</strong> Pan-India GIS oversight, inspection dispatch, and disciplinary sanction controls.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 shrink-0 text-[10px]">Level 3</span>
                        <span><strong>Vigilance Field Inspector:</strong> 150m geofence audit terminal, SHA-256 EXIF camera verification, and dossier signing.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0 text-[10px]">Level 1</span>
                        <span><strong>Citizen &amp; NGO Representative:</strong> Whistleblower grievance submission with encrypted tracking token and DARPAN onboarding.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={handleOpenLogin}
                      className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>e-Pramaan SSO Gateway</span>
                    </button>

                    <button
                      onClick={() => setIsInspectorLoginOpen(true)}
                      className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ShieldAlert className="w-4 h-4 text-blue-300" />
                      <span>Inspector Service Login</span>
                    </button>

                    <button
                      onClick={() => setCurrentView('HERO')}
                      className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-full text-xs font-semibold border border-slate-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                    >
                      Return to Portal
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Authenticated Official Dashboard View */
              <>
                {currentUser.role === 'ADMIN' && (
                  <AdminDashboard
                    currentAdmin={currentUser}
                    currentSession={currentSession}
                    initialTab={dashboardTargetTab}
                    ngos={ngos}
                    officers={fieldOfficers}
                    inspections={inspections}
                    complaints={complaints}
                    applications={applications}
                    govTasks={govTasks}
                    onAssignGovTask={handleAssignGovTask}
                    onRefreshGovTasks={handleRefreshGovTasks}
                    onOpenAssignModal={(ngoId) => {
                      setPreSelectedNgoId(ngoId);
                      setIsAssignModalOpen(true);
                    }}
                    onOpenRandomVc={(ngoId) => {
                      setRandomVcPreselectedNgoId(ngoId);
                      setIsRandomVcOpen(true);
                    }}
                    onOpenRandomDutyModal={() => {
                      setIsRandomDutyModalOpen(true);
                    }}
                    onViewInspectionDetails={(insp) => setSelectedInspectionForDetail(insp)}
                    onApproveApplication={handleApproveApplication}
                    onRejectApplication={handleRejectApplication}
                    onUpdateComplaintStatus={handleUpdateComplaintStatus}
                    onShowToast={showToast}
                  />
                )}

                {currentUser.role === 'OFFICER' && (
                  <OfficerDashboard
                    currentOfficer={currentUser}
                    currentSession={currentSession}
                    initialTab={dashboardTargetTab}
                    ngos={ngos}
                    inspections={inspections}
                    govTasks={govTasks}
                    onStartInspection={handleStartInspection}
                    onSubmitInspection={handleSubmitInspection}
                    onOpenAuditDossier={(insp) => setSelectedInspectionForDetail(insp)}
                    onUpdateGovTask={handleUpdateGovTask}
                    onShowToast={showToast}
                  />
                )}

                {currentUser.role === 'NGO' && (
                  <NgoDashboard
                    currentUser={currentUser}
                    currentSession={currentSession}
                    initialTab={dashboardTargetTab}
                    onShowToast={showToast}
                    ngos={ngos}
                    onOpenWorkerTerminal={() => setCurrentView('WORKER_ATTENDANCE')}
                  />
                )}

                {currentUser.role === 'NGO_WORKER' && (
                  <NgoWorkerAttendancePage
                    currentUser={currentUser}
                    currentSession={currentSession}
                    onShowToast={showToast}
                    onNavigateBack={() => setCurrentView('HERO')}
                  />
                )}

                {currentUser.role === 'USER' && (
                  <NormalUserDashboard
                    currentUser={currentUser}
                    currentSession={currentSession}
                    initialTab={dashboardTargetTab}
                    preSelectedNgoId={complaintPreselectedNgoId}
                    ngos={ngos}
                    complaints={complaints}
                    onSubmitComplaint={handleCitizenComplaint}
                    onSubmitApplication={handleCitizenApplication}
                  />
                )}
              </>
            )}
          </main>
        </div>
      )}

      {/* Actionable Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 bg-slate-900/95 backdrop-blur-md text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/80 animate-fade-in max-w-md">
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
            toastMessage.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-300'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Info className="w-4 h-4" />
            )}
          </div>
          <div className="flex-1 min-w-0 pr-2">
            {toastMessage.title && <p className="font-bold text-white text-[11px] mb-0.5">{toastMessage.title}</p>}
            <p className="text-slate-200 text-xs leading-snug">{toastMessage.text}</p>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Public NGO Dossier & Compliance Modal */}
      {publicNgoDetail && (
        <NgoPublicDetailModal
          ngo={publicNgoDetail}
          onClose={() => setPublicNgoDetail(null)}
          onLodgeGrievance={(ngo) => {
            setPublicNgoDetail(null);
            setComplaintPreselectedNgoId(ngo.id);
            setDashboardTargetTab('FILE_COMPLAINT');
            handleEnterDashboard('USER');
          }}
        />
      )}

      {/* Authentication Modal (Login & Sign Up) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        allUsers={users}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onSignUpSuccess={handleSignUpSuccess}
        onShowToast={showToast}
      />

      {/* Assign Inspector Modal */}
      {isAssignModalOpen && (
        <AssignInspectorModal
          ngos={ngos}
          officers={fieldOfficers}
          preSelectedNgoId={preSelectedNgoId}
          onAssign={handleAssignInspector}
          onClose={() => {
            setIsAssignModalOpen(false);
            setPreSelectedNgoId(undefined);
          }}
        />
      )}

      {/* DoSJE Random Video Conferencing (VC) Modal */}
      <RandomVideoConferenceModal
        isOpen={isRandomVcOpen}
        ngos={ngos}
        preSelectedNgoId={randomVcPreselectedNgoId}
        onClose={() => {
          setIsRandomVcOpen(false);
          setRandomVcPreselectedNgoId(undefined);
        }}
        onShowToast={showToast}
      />

      {/* DoSJE AI Double-Blind Random Duty Allocation Modal */}
      <RandomAssignmentModal
        isOpen={isRandomDutyModalOpen}
        onClose={() => setIsRandomDutyModalOpen(false)}
        onShowToast={showToast}
      />

      {/* Inspection Detail Modal */}
      {selectedInspectionForDetail && (
        <InspectionDetailModal
          inspection={selectedInspectionForDetail}
          onClose={() => setSelectedInspectionForDetail(null)}
        />
      )}


      {/* Inspector Login & Authentication Modal */}
      {isInspectorLoginOpen && (
        <InspectorLoginModal
          allOfficers={fieldOfficers}
          currentOfficer={currentUser?.role === 'OFFICER' ? currentUser : fieldOfficers[0] || users.find((u) => u.role === 'OFFICER') || users[0]}
          onLoginSuccess={async (officer) => {
            try {
              const res = await authApi.switchUser({ userId: officer.id });
              setCurrentUser(res.user);
              setCurrentSession(res.session);
              setCurrentView('DASHBOARD');
              showToast(`✓ Authenticated as Inspector ${res.user.name} (${res.user.badgeNumber || 'OFFICER'}). Inspection section unlocked.`, 'success');
            } catch {
              const session: AuthSession = {
                token: `SES-INSP-${Date.now().toString(36).toUpperCase()}`,
                loginTime: new Date().toLocaleTimeString('en-IN') + ' IST',
                clearance: 'LEVEL_3_INSPECTOR',
                ipAddress: '10.244.18.91 (Field Cell)',
                deviceFingerprint: 'SHA256:' + Math.random().toString(16).substring(2, 10),
                isVerified2FA: true,
              };
              setCurrentUser(officer);
              setCurrentSession(session);
              setCurrentView('DASHBOARD');
              showToast(`✓ Authenticated as Inspector ${officer.name} (${officer.badgeNumber || 'OFFICER'}). Inspection section unlocked.`, 'success');
            }
          }}
          onClose={() => setIsInspectorLoginOpen(false)}
        />
      )}

      {/* Floating Quick Switcher to Android View Mode (Hidden when already in Android Frame) */}
      {!isInsideAndroidFrame && !isAndroidSimulatorOpen && (
        <button
          type="button"
          onClick={() => setIsAndroidSimulatorOpen(true)}
          className="fixed bottom-6 left-6 z-40 flex items-center space-x-2 px-4 py-2.5 bg-slate-900/95 hover:bg-slate-900 text-emerald-400 hover:text-emerald-300 rounded-full text-xs font-semibold shadow-2xl border border-emerald-500/40 backdrop-blur-md transition-all hover:scale-105 cursor-pointer group"
          title="Open Android App Simulator (Pixel 8 / Galaxy S24 / Rugged Tablet)"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="hidden sm:inline font-bold">Android App Mode</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>
      )}

      {/* Full-Screen Interactive Android Device Simulator Studio */}
      {isAndroidSimulatorOpen && !isInsideAndroidFrame && (
        <AndroidSimulatorStudio
          onClose={() => setIsAndroidSimulatorOpen(false)}
          initialRole={currentUser?.role || 'OFFICER'}
          initialView={currentView}
        />
      )}

      {/* Universal Command Palette (Ctrl+K / ⌘K) */}
      <GlobalCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        ngos={ngos}
        onSelectNgo={(ngo) => setPublicNgoDetail(ngo)}
        onNavigateView={(view, role, targetTab) => {
          if (view === 'WORKER_ATTENDANCE') {
            const worker = users.find((u) => u.role === 'NGO_WORKER');
            if (worker) setCurrentUser(worker);
            setCurrentView('WORKER_ATTENDANCE');
          } else if (view === 'HERO') {
            setCurrentView('HERO');
          } else if (view === 'DASHBOARD') {
            if (role) {
              const targetUser = users.find((u) => u.role === role);
              if (targetUser) {
                setCurrentUser(targetUser);
              }
            }
            if (targetTab) {
              setDashboardTargetTab(targetTab);
            }
            setCurrentView('DASHBOARD');
          }
        }}
        onToggleHighContrast={() => setIsHighContrast((prev) => !prev)}
        onToggleAndroidSimulator={() => setIsAndroidSimulatorOpen(true)}
        onOpenRandomVc={() => {
          setRandomVcPreselectedNgoId(undefined);
          setIsRandomVcOpen(true);
        }}
        onOpenRandomDutyModal={() => {
          setIsRandomDutyModalOpen(true);
        }}
        onShowToast={showToast}
        onOpenTeamDetails={() => setIsTeamModalOpen(true)}
        onOpenVersionModal={() => setIsVersionModalOpen(true)}
        onOpenApiConfigModal={() => setIsApiConfigModalOpen(true)}
      />

      {/* Institutional VigilanceAI Copilot & Autonomous Agent Drawer */}
      {!isInsideAndroidFrame && (
        <VigilanceAiCopilot
          currentUser={currentUser}
          isOpen={isCopilotOpen}
          onToggle={() => setIsCopilotOpen((prev) => !prev)}
          onNavigate={(view, tab) => {
            setCurrentView(view);
            if (tab) {
              setDashboardTargetTab(tab);
            }
          }}
          onShowToast={showToast}
          onFilterHighRisk={() => {
            setCurrentView('DASHBOARD');
            setDashboardTargetTab('ngos');
          }}
        />
      )}

      {/* Official Smart India Hackathon Team Detail Modal */}
      <SihTeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
      />

      {/* Statutory Architecture & Version 2.0 Release Modal */}
      <VersionReleaseModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        onNavigateTab={(tab) => {
          setIsVersionModalOpen(false);
          setDashboardTargetTab(tab);
          setCurrentView('DASHBOARD');
        }}
      />

      {/* Live APIs & System Integration Gateway Hub Modal */}
      <ApiKeysConfigModal
        isOpen={isApiConfigModalOpen}
        onClose={() => setIsApiConfigModalOpen(false)}
        onShowToast={showToast}
      />
    </div>
  );
}
