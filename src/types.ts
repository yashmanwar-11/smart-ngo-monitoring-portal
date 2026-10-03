export type UserRole = 'ADMIN' | 'OFFICER' | 'NGO' | 'USER' | 'NGO_WORKER';

export type SecurityClearance =
  | 'LEVEL_5_DIRECTORATE' // Directorate Administrator
  | 'LEVEL_3_INSPECTOR'   // Field Inspection Officer
  | 'LEVEL_2_NGO'         // Authorized Representative of Registered NGO Entity
  | 'LEVEL_2_WORKER'      // NGO Field Staff / Grassroots Mobilizer
  | 'LEVEL_1_PUBLIC';     // Citizen / Public Observer / Whistleblower

export interface AuthSession {
  token: string;
  loginTime: string;
  clearance: SecurityClearance;
  ipAddress: string;
  deviceFingerprint: string;
  isVerified2FA: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation?: string;
  clearance?: SecurityClearance;
  phone: string;
  avatarUrl?: string;
  badgeNumber?: string; // For inspection officers
  department?: string;
  assignedDistrict?: string;
  ngoId?: string; // For NGO representative
  status: 'ACTIVE' | 'ON_DUTY' | 'OFF_DUTY' | 'SUSPENDED';
  currentLocation?: {
    lat: number;
    lng: number;
    lastPingTime: string;
    batteryLevel: number;
  };
}

export type NgoStatus = 'REGISTERED' | 'PENDING_APPROVAL' | 'REJECTED' | 'UNDER_INSPECTION' | 'FLAGGED_VIOLATION';

export interface NGO {
  id: string;
  name: string;
  regNumber: string; // e.g., NGO-DARPAN-2024-8841
  sector: 'Education' | 'Healthcare' | 'Child Welfare' | 'Rural Development' | 'Women Empowerment' | 'Environment' | 'De-addiction' | 'Disability Welfare' | string;
  scheme?: string; // e.g. NAPDDR/IRCA, DDRS, DDRS/DDRC, DEPwD Apex Institute
  dosjeScheme?: DosjeScheme | string;
  beneficiaryCapacity?: number;
  activeBeneficiaryCount?: number;
  ngoType?: string; // e.g. De-addiction NGO, Disability NGO, Govt Rehab Centre, Vocational Training
  website?: string;
  googleMapsUrl?: string; // Direct Google Maps CID URL
  verificationStatus?: string; // e.g. Confirmed - MoSJE affiliated, UNVERIFIED - check e-Anudaan
  status: NgoStatus;
  foundingYear: number;
  presidentName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  district: string;
  state: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  fcraStatus: 'APPROVED' | 'EXEMPT' | 'UNDER_REVIEW' | 'SUSPENDED';
  annualBudgetInr: number;
  lastInspectionDate?: string;
  complianceScore?: number; // 0 to 100
  reportedComplaintsCount: number;
  description: string;
  documents: {
    trustDeedUrl?: string;
    panCardNumber: string;
    darpanId: string;
    auditReportUrl?: string;
  };
  photos?: string[];
}

export type InspectionStatus = 'SCHEDULED' | 'EN_ROUTE' | 'ON_SITE_IN_PROGRESS' | 'COMPLETED' | 'FLAGGED_FOR_AUDIT' | 'CANCELLED';

export interface InspectionChecklist {
  physicalOfficeExists: boolean;
  signboardDisplayed: boolean;
  staffPresent: boolean;
  actualStaffCount: number;
  cashBookLedgerAvailable: boolean;
  beneficiaryRegisterVerified: boolean;
  bankAccountOperatedLocally: boolean;
  projectActivitiesOngoing: boolean;
  noPoliticalCommercialMisuse: boolean;
  fireSafetyValid: boolean;
}

export interface InspectionPhoto {
  id: string;
  caption: string;
  category: 'OFFICE_EXTERIOR' | 'STAFF_VERIFICATION' | 'LEDGER_AUDIT' | 'BENEFICIARY_MEET' | 'VIOLATION_EVIDENCE' | PhotoEvidenceCategory | string;
  imageUrl: string;
  timestamp: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  accuracyMeters: number;
  officerBadge?: string;
  tamperProofHash?: string;
  locationAddress?: string;
}

export interface InspectionRecord {
  id: string;
  ngoId: string;
  ngoName: string;
  officerId: string;
  officerName: string;
  officerBadge: string;
  scheduledDate: string;
  scheduledTime: string;
  status: InspectionStatus;
  priority: 'ROUTINE' | 'HIGH_SURPRISE' | 'COMPLAINT_INVESTIGATION';
  startDateTime?: string;
  completionDateTime?: string;
  gpsTrack?: Array<{ lat: number; lng: number; timestamp: string }>;
  geofenceVerified?: boolean;
  officerDistanceToNgoMeters?: number;
  checklist?: InspectionChecklist;
  findingsSummary?: string;
  complianceRating?: 'A_EXCELLENT' | 'B_SATISFACTORY' | 'C_NON_COMPLIANT' | 'D_CRITICAL_FRAUD';
  score?: number; // 0-100
  photos?: InspectionPhoto[];
  audioNoteUrl?: string;
  officerSignature?: string;
  actionRecommended?: 'CLEAR_RENEWAL' | 'ISSUE_SHOW_CAUSE' | 'FREEZE_BANK_ACCOUNT' | 'CRIMINAL_INVESTIGATION';
}

export interface Complaint {
  id: string;
  trackingToken: string;
  ngoId: string;
  ngoName: string;
  citizenName?: string;
  citizenContact?: string;
  isAnonymous: boolean;
  category: 'FUNDS_EMBEZZLEMENT' | 'GHOST_BENEFICIARIES' | 'FAKE_OFFICE' | 'DISCRIMINATION' | 'FCRA_VIOLATION' | 'OTHER';
  description: string;
  evidenceFiles?: string[];
  submittedAt: string;
  status: 'PENDING_REVIEW' | 'INSPECTION_ORDERED' | 'RESOLVED_VALIDATED' | 'DISMISSED';
  investigatingOfficerId?: string;
  adminRemarks?: string;
}

export interface NgoApplication {
  id: string;
  ngoName: string;
  applicantName: string;
  applicantRole: string;
  email: string;
  phone: string;
  registrationNumber: string;
  sector: string;
  address: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  appliedDate: string;
  darpanId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

export type InspectionPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SavedInspectionStatus = 'Pending' | 'Completed';

export interface InspectionChecklistItem {
  id: string;
  label: string;
  passed: boolean;
  notes?: string;
}

export interface SavedInspectionRecord {
  id: string; // Inspection ID (e.g. INSP-2026-0421)
  inspectorId: string; // User ID of the inspector who created/owns this record (access control)
  inspectorName: string; // Inspector Name
  inspectorBadge: string;
  locationSite: string; // Location / Site Name & Address
  ngoId?: string; // Optional linked NGO ID if selected
  dateTime: string; // Date & Time of inspection
  inspectionType: string; // e.g. Routine Statutory Audit, Surprise Check, etc.
  checklistItems: InspectionChecklistItem[];
  observations: string; // Observations
  issuesDefectsFound: string; // Issues / Defects Found
  severityPriority: InspectionPriority; // Severity / Priority
  remarks: string; // Remarks
  status: SavedInspectionStatus; // Pending | Completed
  createdAt: string;
  updatedAt: string;
  tamperProofHash?: string;
}

export type PhotoEvidenceCategory =
  | 'PREMISE_SIGNBOARD'
  | 'ACCOUNTS_LEDGERS'
  | 'WELFARE_BENEFICIARIES'
  | 'INFRASTRUCTURE'
  | 'VIOLATIONS_DEFECTS';

export interface TaskPhoto {
  id: string;
  url: string;
  caption?: string;
  timestamp?: string;
  coordinates?: { lat: number; lng: number };
  category?: PhotoEvidenceCategory | string;
  accuracyMeters?: number;
  tamperProofHash?: string;
  locationAddress?: string;
  officerBadge?: string;
}

export interface TaskVideo {
  id: string;
  url: string;
  durationSeconds?: number;
  caption?: string;
  timestamp?: string;
  coordinates?: { lat: number; lng: number };
  category?: PhotoEvidenceCategory | string;
  accuracyMeters?: number;
  tamperProofHash?: string;
  locationAddress?: string;
  officerBadge?: string;
  thumbnailUrl?: string;
  fileSizeMb?: number;
}

export type GovernmentTaskStatus = 'Pending' | 'Assigned' | 'In Progress' | 'Completed' | 'Failed/Issue Found';

export type ScrutinyVerdict = 'GOOD_COMPLIANT' | 'BAD_DEFICIENT';
export type StatutoryActionChoice = 'ACTION_REQUIRED' | 'NO_ACTION_CLEARED';

export interface DirectorateScrutinyReview {
  reviewedByOfficerName: string;
  reviewedByOfficerBadge: string;
  reviewedAt: string;
  verdict: ScrutinyVerdict;
  score: number; // 0 to 100
  complianceGrade: 'A_EXCELLENT' | 'B_SATISFACTORY' | 'C_NON_COMPLIANT' | 'D_CRITICAL_FRAUD';
  actionChoice: StatutoryActionChoice;
  selectedActions: string[];
  scrutinyRemarks: string;
  sanctionOrderNumber: string;
  isLocked?: boolean;
}

export interface GovernmentInspectionTask {
  id: string; // Inspection ID (e.g. INSP-2026-101)
  title: string; // Facility/Project/Organization Name
  location: string; // Location / Site Address
  department: string; // Government Department
  inspectionType: string; // Inspection Type
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  date: string; // Scheduled Date (YYYY-MM-DD)
  status: GovernmentTaskStatus;
  assignedInspectorId?: string;
  assignedInspectorName?: string;
  assignedInspectorBadge?: string;
  assignedDate?: string;
  coordinates?: { lat: number; lng: number };
  
  // Completed inspection record details
  submittedRecord?: {
    inspectionId: string;
    locationSite: string;
    assignedInspector: string;
    assignedInspectorBadge: string;
    dateTime: string;
    inspectionType: string;
    photos: TaskPhoto[];
    videos?: TaskVideo[];
    checklist: InspectionChecklistItem[];
    observations: string;
    issuesDefects: string;
    severityPriority: 'Low' | 'Medium' | 'High' | 'Critical';
    inspectorRemarks: string;
    inspectionStatus: 'Completed' | 'Failed/Issue Found';
    geofenceVerified?: boolean;
    tamperProofHash?: string;
  };

  // Directorate Scrutiny Review
  scrutinyReview?: DirectorateScrutinyReview;
}

export interface StatutoryNotice {
  id: string;
  notice_number: string;
  ngo_id: string;
  ngo_name?: string;
  ngo_darpan_id?: string;
  inspection_id?: string;
  subject: string;
  notice_type: string;
  reason: string;
  details: string;
  deadline: string;
  issued_by_name?: string;
  status: 'ISSUED' | 'RESPONSE_RECEIVED' | 'REVIEWED' | 'CLOSED';
  created_at: string;
  responses?: Array<{
    id: string;
    response_text: string;
    submitted_by_name: string;
    submitted_at: string;
  }>;
}

export interface AuditLogEntry {
  id: string;
  user_id?: string;
  user_name: string;
  user_role: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  ip_address?: string;
  details?: string;
  timestamp: string;
}

export interface NgoWorkerAttendance {
  id: string;
  workerId: string;
  workerName: string;
  workerDesignation?: string;
  ngoId: string;
  ngoName: string;
  dutyDate: string; // YYYY-MM-DD
  // Check-In (Morning / Arrival at work)
  checkInTime?: string; // HH:MM:SS IST
  checkInPhoto?: string; // Watermarked Canvas Data URL
  checkInCoordinates?: {
    lat: number;
    lng: number;
  };
  checkInAddress?: string;
  checkInDistanceMeters?: number;
  checkInTamperHash?: string;
  // Check-Out (Evening / Departure from work)
  checkOutTime?: string; // HH:MM:SS IST
  checkOutPhoto?: string; // Watermarked Canvas Data URL
  checkOutCoordinates?: {
    lat: number;
    lng: number;
  };
  checkOutAddress?: string;
  checkOutDistanceMeters?: number;
  checkOutTamperHash?: string;
  // Overall shift metrics
  hoursWorked?: number;
  status: 'PRESENT' | 'HALF_DAY' | 'IN_PROGRESS' | 'ABSENT' | 'OVERTIME';
  shiftNotes?: string;
  departureNotes?: string;
  supervisorApproval?: 'VERIFIED' | 'FLAGGED' | 'PENDING';
  supervisorRemarks?: string;
  createdAt?: string;
}

// -------------------------------------------------------------------------
// CCTV SURVEILLANCE & REAL IP CAMERA MONITORING TYPES
// -------------------------------------------------------------------------

export type CameraStatus = 'LIVE' | 'OFFLINE' | 'CONNECTING' | 'ERROR' | 'DISABLED';
export type CameraType = 'FIXED' | 'PTZ' | 'DOME' | 'BULLET' | 'THERMAL' | 'DEVICE_CAM' | 'ANALYTICS';
export type CameraSource = 'HARDWARE_DEVICE' | 'RTSP_STREAM' | 'HTTP_MJPEG' | 'HLS_STREAM';

export interface Camera {
  id: string;
  name: string;
  ngo_id: string;
  ngo_name?: string;
  ngo_district?: string;
  ngo_state?: string;
  location: string;
  camera_type: CameraType;
  camera_source?: CameraSource;
  ptz_capabilities?: number;
  manufacturer?: string;
  model?: string;
  ip_address: string;
  port: number;
  rtsp_path: string;
  stream_url?: string;
  masked_url?: string;
  onvif_url?: string;
  username?: string;
  status: CameraStatus;
  last_seen?: string;
  last_heartbeat?: string;
  last_error?: string;
  consecutive_failures?: number;
  resolution?: string;
  codec?: string;
  fps?: number;
  is_enabled: boolean | number;
  created_at: string;
  updated_at?: string;
}

export interface CctvConnectionTestResult {
  status: 'SUCCESS' | 'AUTHENTICATION_FAILED' | 'CAMERA_OFFLINE' | 'STREAM_UNAVAILABLE' | 'TIMEOUT' | 'INVALID_CONFIGURATION';
  message: string;
  resolution?: string;
  codec?: string;
  fps?: number;
  latencyMs?: number;
  rawDetails?: string;
}

export interface CctvAuditLog {
  id: string;
  camera_id?: string;
  camera_name?: string;
  ngo_id?: string;
  user_id?: string;
  user_name: string;
  user_role: string;
  action: string;
  details?: string;
  ip_address?: string;
  timestamp: string;
}

export interface CctvStreamSession {
  sessionToken: string;
  streamUrl: string;
  streamType?: 'HLS' | 'MJPEG' | 'WEBCAM';
  directUrl?: string;
  status: 'LIVE' | 'STARTING' | 'OFFLINE' | 'ERROR';
  expiresAt: string;
}

export interface PtzPreset {
  id: string;
  name: string;
  pan: number; // -100 to 100
  tilt: number; // -100 to 100
  zoom: number; // 1.0 to 5.0
}

export interface CctvTimelineSegment {
  id: string;
  start: string; // ISO string
  end: string; // ISO string
  type: 'CONTINUOUS' | 'MOTION' | 'INCIDENT';
  label: string;
}

export type VideoWallLayout = '1x1' | '2x2' | '3x3' | 'PATROL';

export interface DiscoveredCamera {
  ip: string;
  port: number;
  type: string;
  manufacturer: string;
  status: 'OPEN' | 'AUTH_REQUIRED';
  streamUrl?: string;
  cameraSource?: 'HARDWARE_DEVICE' | 'RTSP_STREAM' | 'HTTP_MJPEG' | 'HLS_STREAM';
  latencyMs?: number;
}

// --------------------------------------------------------------------------
// DoSJE Statutory Schemes & Stakeholders
// --------------------------------------------------------------------------
export type DosjeScheme =
  | 'NAPDDR'  // National Action Plan for Drug Demand Reduction
  | 'AVYAY'   // Atal Vayo Abhyuday Yojana (Senior Citizens)
  | 'DDRS'    // Deendayal Disabled Rehabilitation Scheme
  | 'PM_AJAY' // Pradhan Mantri Anusuchit Jaati Abhyuday Yojana
  | 'SMILE';  // Support for Marginalised Individuals for Livelihood and Enterprise

// --------------------------------------------------------------------------
// Random Video Conferencing (VC) Connectivity
// --------------------------------------------------------------------------
export type VcParticipantType = 'INCHARGE' | 'STAFF' | 'BENEFICIARY';

export interface VcVerificationChecklist {
  physicalPresenceConfirmed: boolean;
  identityVerifiedAadhaar: boolean;
  headcountMatchesRegister: boolean;
  reportedHeadcount: number;
  cleanlinessAndMealsSatisfactory: boolean;
  noCoercionReported: boolean;
  immediateGrievanceNoted?: string;
}

export interface VideoConferenceSession {
  id: string;
  sessionToken: string;
  ngoId: string;
  ngoName: string;
  ngoDarpanId?: string;
  district: string;
  state: string;
  scheme: string;
  initiatedByOfficerId: string;
  initiatedByOfficerName: string;
  participantType: VcParticipantType;
  participantName: string;
  participantPhone?: string;
  startTime: string;
  endTime?: string;
  status: 'CONNECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'REJECTED';
  verificationChecklist: VcVerificationChecklist;
  latitude?: number;
  longitude?: number;
  gpsAccuracyMeters?: number;
  evidenceSnapshotUrl?: string;
  tamperProofHash?: string;
  findingsSummary?: string;
  complianceVerdict?: 'SATISFACTORY' | 'DEFICIENT_WARNING' | 'CRITICAL_SHOW_CAUSE';
}

// --------------------------------------------------------------------------
// AI Automated Double-Blind Random Duty Assignment Engine
// --------------------------------------------------------------------------
export interface RandomAssignmentTask {
  id: string;
  instituteId: string;
  instituteName: string;
  darpanId: string;
  district: string;
  state: string;
  scheme: DosjeScheme | string;
  inspectorId: string;
  inspectorName: string;
  inspectorBadge: string;
  distanceKm: number;
  conflictOfInterestCleared: boolean;
  riskScore: number;
  assignedDate: string;
  scheduledAuditDate: string;
  unlockedAtTimestamp: string;
  status: 'DISPATCHED' | 'LOCKED_T4' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface RandomAssignmentBatch {
  batchId: string;
  timestamp: string;
  generatedBy: string;
  neutralitySeed: string;
  schemeFilter: string;
  stateFilter: string;
  totalAssigned: number;
  antiCollusionBufferHours: number;
  tasks: RandomAssignmentTask[];
}

// --------------------------------------------------------------------------
// AI-Based Anomaly & Attendance Analytics
// --------------------------------------------------------------------------
export interface SystemAnomaly {
  id: string;
  ngoId: string;
  ngoName: string;
  darpanId: string;
  district: string;
  scheme: string;
  type: 'ATTENDANCE_DROP' | 'GHOST_BENEFICIARY' | 'GEO_DRIFT' | 'SPOOF_ATTEMPT' | 'EXPENDITURE_OUTLIER';
  severity: 'CRITICAL' | 'HIGH' | 'WARNING';
  title: string;
  description: string;
  metricValue: string;
  baselineValue: string;
  detectedAt: string;
  status: 'OPEN' | 'INVESTIGATING' | 'SHOW_CAUSE_ISSUED' | 'RESOLVED';
}

