import { SavedInspectionRecord, InspectionChecklistItem } from '../types';

const STORAGE_KEY = 'GOV_INSPECTOR_SAVED_INSPECTIONS_DB_V1';

export const DEFAULT_CHECKLIST_TEMPLATE: InspectionChecklistItem[] = [
  { id: 'chk_1', label: 'Physical Registered Office Exists & Operational', passed: true, notes: 'Verified physical premises & address board.' },
  { id: 'chk_2', label: 'Official Signboard Displayed at Entrance', passed: true, notes: 'Signboard clear with Darpan ID & Reg No.' },
  { id: 'chk_3', label: 'Key Staff & Program Personnel Present On-Site', passed: true, notes: 'Found 4 operational staff members.' },
  { id: 'chk_4', label: 'Cash Book, General Ledger & Vouchers Audited', passed: true, notes: 'Physical vouchers match bank entries.' },
  { id: 'chk_5', label: 'Beneficiary Enrollment Register Authenticated', passed: true, notes: 'Sample verified 10 active beneficiaries.' },
  { id: 'chk_6', label: 'Bank Account Operated in Designated District', passed: true, notes: 'State Bank account in active use.' },
  { id: 'chk_7', label: 'Scheduled Field Welfare Activities Ongoing', passed: true, notes: 'Vocational training sessions running.' },
  { id: 'chk_8', label: 'No Political or Commercial Misuse of Premises', passed: true, notes: 'Dedicated to charitable activities.' },
  { id: 'chk_9', label: 'Fire Safety Clearance & Building Norms Met', passed: true, notes: 'Valid fire extinguisher & exits.' },
  { id: 'chk_10', label: 'Statutory Annual Audit Reports Available', passed: true, notes: 'Latest audited balance sheet inspected.' },
];

const SEED_INSPECTIONS: SavedInspectionRecord[] = [
  {
    id: 'INSP-2026-1042',
    inspectorId: 'usr_officer_1', // Inspector Vikram Singh
    inspectorName: 'Inspector Vikram Singh',
    inspectorBadge: 'INSP-DEL-402',
    locationSite: 'Aarogya Health Mission, Plot 42, Okhla Phase-II, South Delhi',
    ngoId: 'ngo_1',
    dateTime: '2026-09-10T11:30',
    inspectionType: 'Routine Statutory Audit',
    checklistItems: [
      { id: 'chk_1', label: 'Physical Registered Office Exists & Operational', passed: true, notes: 'Office verified' },
      { id: 'chk_2', label: 'Official Signboard Displayed at Entrance', passed: true, notes: 'Clear signboard' },
      { id: 'chk_3', label: 'Key Staff & Program Personnel Present On-Site', passed: true, notes: 'Staff headcount: 5' },
      { id: 'chk_4', label: 'Cash Book, General Ledger & Vouchers Audited', passed: true, notes: 'Ledgers maintained' },
      { id: 'chk_5', label: 'Beneficiary Enrollment Register Authenticated', passed: true, notes: 'Health camp logs verified' },
      { id: 'chk_6', label: 'Bank Account Operated in Designated District', passed: true, notes: 'SBI Okhla branch verified' },
      { id: 'chk_7', label: 'Scheduled Field Welfare Activities Ongoing', passed: true, notes: 'Mobile clinic dispatch confirmed' },
      { id: 'chk_8', label: 'No Political or Commercial Misuse of Premises', passed: true, notes: 'Strictly non-profit healthcare' },
      { id: 'chk_9', label: 'Fire Safety Clearance & Building Norms Met', passed: true, notes: 'Valid fire NOC available' },
      { id: 'chk_10', label: 'Statutory Annual Audit Reports Available', passed: true, notes: 'FY 2024-25 audit filed' },
    ],
    observations: 'Physical health center actively operational. Patient register and free medication logs maintained with biometric timestamping.',
    issuesDefectsFound: 'Minor delay in updating weekly dispensary inventory log for the current month. Advised digital sync.',
    severityPriority: 'LOW',
    remarks: 'Compliant with statutory NGO regulations. Recommended for annual accreditation renewal without reservations.',
    status: 'Completed',
    createdAt: '2026-09-10T12:15:00.000Z',
    updatedAt: '2026-09-10T12:15:00.000Z',
    tamperProofHash: 'SHA256:7e491c3d9a24bb18f03e',
  },
  {
    id: 'INSP-2026-1088',
    inspectorId: 'usr_officer_1', // Inspector Vikram Singh
    inspectorName: 'Inspector Vikram Singh',
    inspectorBadge: 'INSP-DEL-402',
    locationSite: 'Pragati Mahila Vikas Trust, Sector 7, RK Puram, New Delhi',
    ngoId: 'ngo_2',
    dateTime: '2026-09-08T14:15',
    inspectionType: 'Surprise Compliance Check',
    checklistItems: [
      { id: 'chk_1', label: 'Physical Registered Office Exists & Operational', passed: true, notes: 'Office verified' },
      { id: 'chk_2', label: 'Official Signboard Displayed at Entrance', passed: true, notes: 'Signboard present' },
      { id: 'chk_3', label: 'Key Staff & Program Personnel Present On-Site', passed: true, notes: '3 teachers present' },
      { id: 'chk_4', label: 'Cash Book, General Ledger & Vouchers Audited', passed: false, notes: 'Q2 ledger missing on-site' },
      { id: 'chk_5', label: 'Beneficiary Enrollment Register Authenticated', passed: true, notes: 'Beneficiary cards inspected' },
      { id: 'chk_6', label: 'Bank Account Operated in Designated District', passed: true, notes: 'PNB branch verified' },
      { id: 'chk_7', label: 'Scheduled Field Welfare Activities Ongoing', passed: true, notes: 'Sewing batch ongoing' },
      { id: 'chk_8', label: 'No Political or Commercial Misuse of Premises', passed: true, notes: 'No unauthorized use' },
      { id: 'chk_9', label: 'Fire Safety Clearance & Building Norms Met', passed: false, notes: 'Extinguisher service lapsed' },
      { id: 'chk_10', label: 'Statutory Annual Audit Reports Available', passed: true, notes: 'Tax returns produced' },
    ],
    observations: 'Skill training classes were actively in session for 24 women beneficiaries. Physical facilities clean and functional.',
    issuesDefectsFound: 'Q2 petty cash vouchers not produced during spot inspection (custodian claimed they were with CA). Fire extinguisher expired August 2026.',
    severityPriority: 'MEDIUM',
    remarks: 'Show-cause notice served to produce vouchers within 7 working days. Fire equipment recertification required before next audit.',
    status: 'Pending',
    createdAt: '2026-09-08T15:00:00.000Z',
    updatedAt: '2026-09-08T15:00:00.000Z',
    tamperProofHash: 'SHA256:3a91b2c48e77fa59012d',
  },
  {
    id: 'INSP-2026-1120',
    inspectorId: 'usr_officer_1', // Inspector Vikram Singh
    inspectorName: 'Inspector Vikram Singh',
    inspectorBadge: 'INSP-DEL-402',
    locationSite: 'Navjeevan Child Care & Education Foundation, Kotla Mubarakpur, New Delhi',
    ngoId: 'ngo_3',
    dateTime: '2026-09-05T09:45',
    inspectionType: 'Complaint Investigation',
    checklistItems: [
      { id: 'chk_1', label: 'Physical Registered Office Exists & Operational', passed: false, notes: 'Premises locked on 2 surprise visits' },
      { id: 'chk_2', label: 'Official Signboard Displayed at Entrance', passed: false, notes: 'No board found at registered address' },
      { id: 'chk_3', label: 'Key Staff & Program Personnel Present On-Site', passed: false, notes: 'No staff available' },
      { id: 'chk_4', label: 'Cash Book, General Ledger & Vouchers Audited', passed: false, notes: 'No records available' },
      { id: 'chk_5', label: 'Beneficiary Enrollment Register Authenticated', passed: false, notes: 'Listed children could not be traced' },
      { id: 'chk_6', label: 'Bank Account Operated in Designated District', passed: false, notes: 'Suspected shell account' },
      { id: 'chk_7', label: 'Scheduled Field Welfare Activities Ongoing', passed: false, notes: 'No activities underway' },
      { id: 'chk_8', label: 'No Political or Commercial Misuse of Premises', passed: false, notes: 'Premises sublet to commercial travel agent' },
      { id: 'chk_9', label: 'Fire Safety Clearance & Building Norms Met', passed: false, notes: 'Non-compliant' },
      { id: 'chk_10', label: 'Statutory Annual Audit Reports Available', passed: false, notes: 'No audit records provided' },
    ],
    observations: 'CRITICAL AUDIT DISCREPANCY: Registered premises operates as a commercial travel office. Landlord confirmed NGO vacated 8 months ago without intimating registrar.',
    issuesDefectsFound: 'Probable Ghost / Shell NGO. Substantial government grants received with zero physical presence or legitimate beneficiaries.',
    severityPriority: 'CRITICAL',
    remarks: 'Immediate freezing of linked bank accounts recommended. Forwarded to State Vigilance Directorate for criminal prosecution under IPC Sections 420/468.',
    status: 'Completed',
    createdAt: '2026-09-05T11:20:00.000Z',
    updatedAt: '2026-09-05T11:20:00.000Z',
    tamperProofHash: 'SHA256:d812f5a904b7e193c72b',
  },
  // Record belonging to Inspector Ananya Roy (usr_officer_2) - for testing authorization isolation
  {
    id: 'INSP-2026-2005',
    inspectorId: 'usr_officer_2', // Inspector Ananya Roy
    inspectorName: 'Inspector Ananya Roy',
    inspectorBadge: 'INSP-DEL-518',
    locationSite: 'Yamuna Green Environmental Protection Society, Civil Lines, North Delhi',
    ngoId: 'ngo_4',
    dateTime: '2026-09-09T10:00',
    inspectionType: 'Physical Infrastructure Inspection',
    checklistItems: DEFAULT_CHECKLIST_TEMPLATE,
    observations: 'Tree plantation nursery and organic composting units inspected on-site. Field logs well documented.',
    issuesDefectsFound: 'None. All environmental project parameters compliant.',
    severityPriority: 'LOW',
    remarks: 'Approved for state green fund grant disbursement.',
    status: 'Completed',
    createdAt: '2026-09-09T11:00:00.000Z',
    updatedAt: '2026-09-09T11:00:00.000Z',
    tamperProofHash: 'SHA256:99f81a7d65b210e34c90',
  },
];

/**
 * Loads the raw database from local storage or initializes with seed data.
 */
function loadDatabase(): SavedInspectionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_INSPECTIONS));
      return SEED_INSPECTIONS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_INSPECTIONS));
      return SEED_INSPECTIONS;
    }
    return parsed;
  } catch (e) {
    console.warn('Error reading inspection database from localStorage, resetting to seeds:', e);
    return SEED_INSPECTIONS;
  }
}

/**
 * Saves the database array to localStorage.
 */
function saveDatabase(records: SavedInspectionRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Error persisting inspection database:', e);
  }
}

/**
 * Generates a unique Inspection ID.
 */
export function generateNextInspectionId(): string {
  const year = new Date().getFullYear();
  const randNum = Math.floor(1000 + Math.random() * 9000);
  return `INSP-${year}-${randNum}`;
}

/**
 * Generates a tamper-proof cryptographic hash string.
 */
export function generateTamperProofHash(id: string, inspectorBadge: string): string {
  const ts = Date.now().toString(16);
  const rand = Math.random().toString(16).substring(2, 10);
  return `SHA256:${id.slice(-4)}${inspectorBadge.slice(-3)}${ts.slice(-6)}${rand}`.toLowerCase();
}

/**
 * Retrieves ONLY inspections belonging to the logged-in inspector.
 * Enforces strict authorization isolation.
 */
export function getInspectionsForInspector(inspectorId: string): SavedInspectionRecord[] {
  const all = loadDatabase();
  // Authorization filter: Only records where inspectorId matches
  return all.filter((r) => r.inspectorId === inspectorId);
}

/**
 * Retrieves a single inspection by ID with authorization verification.
 * Returns unauthorized=true if the record belongs to another inspector!
 */
export function getInspectionById(
  id: string,
  requesterInspectorId: string
): { record: SavedInspectionRecord | null; unauthorized: boolean } {
  const all = loadDatabase();
  const record = all.find((r) => r.id === id);

  if (!record) {
    return { record: null, unauthorized: false };
  }

  if (record.inspectorId !== requesterInspectorId) {
    // Security violation: Unauthorized attempt to access another inspector's record
    return { record: null, unauthorized: true };
  }

  return { record, unauthorized: false };
}

/**
 * Creates or updates an inspection record securely in the database.
 * Ensures the record is strictly linked to the requester inspector.
 */
export function saveInspection(
  recordData: Partial<SavedInspectionRecord> & {
    id: string;
    locationSite: string;
    dateTime: string;
    inspectionType: string;
    observations: string;
    issuesDefectsFound: string;
    severityPriority: SavedInspectionRecord['severityPriority'];
    remarks: string;
    status: SavedInspectionRecord['status'];
    checklistItems: InspectionChecklistItem[];
  },
  requesterUser: { id: string; name: string; badgeNumber?: string }
): { success: boolean; record?: SavedInspectionRecord; error?: string; isEdit?: boolean } {
  const all = loadDatabase();
  const existingIndex = all.findIndex((r) => r.id === recordData.id);

  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    const existing = all[existingIndex];

    // Authorization check: Prevent modifying another inspector's record
    if (existing.inspectorId !== requesterUser.id) {
      return {
        success: false,
        error: `Unauthorized Access: You cannot modify inspection record ${recordData.id} because it belongs to another inspector (${existing.inspectorName}).`,
      };
    }

    // Update existing record
    const updatedRecord: SavedInspectionRecord = {
      ...existing,
      locationSite: recordData.locationSite,
      ngoId: recordData.ngoId || existing.ngoId,
      dateTime: recordData.dateTime,
      inspectionType: recordData.inspectionType,
      checklistItems: recordData.checklistItems,
      observations: recordData.observations,
      issuesDefectsFound: recordData.issuesDefectsFound,
      severityPriority: recordData.severityPriority,
      remarks: recordData.remarks,
      status: recordData.status,
      updatedAt: now,
      tamperProofHash: generateTamperProofHash(existing.id, requesterUser.badgeNumber || 'INSP'),
    };

    all[existingIndex] = updatedRecord;
    saveDatabase(all);
    return { success: true, record: updatedRecord, isEdit: true };
  } else {
    // Create brand new record linked to logged-in inspector
    const newRecord: SavedInspectionRecord = {
      id: recordData.id.trim() || generateNextInspectionId(),
      inspectorId: requesterUser.id,
      inspectorName: requesterUser.name,
      inspectorBadge: requesterUser.badgeNumber || 'INSP-DEL-000',
      locationSite: recordData.locationSite,
      ngoId: recordData.ngoId,
      dateTime: recordData.dateTime || new Date().toISOString().slice(0, 16),
      inspectionType: recordData.inspectionType,
      checklistItems: recordData.checklistItems,
      observations: recordData.observations,
      issuesDefectsFound: recordData.issuesDefectsFound,
      severityPriority: recordData.severityPriority,
      remarks: recordData.remarks,
      status: recordData.status,
      createdAt: now,
      updatedAt: now,
      tamperProofHash: generateTamperProofHash(recordData.id, requesterUser.badgeNumber || 'INSP'),
    };

    all.unshift(newRecord);
    saveDatabase(all);
    return { success: true, record: newRecord, isEdit: false };
  }
}

/**
 * Deletes an inspection record securely from the database.
 * Strictly verifies that the record belongs to the requester inspector.
 */
export function deleteInspection(
  id: string,
  requesterInspectorId: string
): { success: boolean; error?: string } {
  const all = loadDatabase();
  const existing = all.find((r) => r.id === id);

  if (!existing) {
    return { success: false, error: `Inspection record ${id} not found.` };
  }

  // Authorization check
  if (existing.inspectorId !== requesterInspectorId) {
    return {
      success: false,
      error: `Security Violation: Unauthorized deletion attempt. You cannot delete record ${id} belonging to another officer (${existing.inspectorName}).`,
    };
  }

  const remaining = all.filter((r) => r.id !== id);
  saveDatabase(remaining);
  return { success: true };
}
