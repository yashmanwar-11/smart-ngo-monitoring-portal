import crypto from 'node:crypto';

// 32-byte secret key for AES-256-GCM camera credential encryption
const RAW_KEY = process.env.CCTV_ENCRYPTION_KEY || 'gov_cctv_master_secret_key_nic_vigilance_2026';
const ALGORITHM = 'aes-256-gcm';
const KEY = crypto.createHash('sha256').update(RAW_KEY).digest();

export interface EncryptedCredential {
  encrypted: string;
  iv: string;
  tag: string;
}

/**
 * Encrypt camera credentials using AES-256-GCM with randomized 12-byte IV
 */
export function encryptCameraCredential(plainText: string): EncryptedCredential {
  if (!plainText) {
    return { encrypted: '', iv: '', tag: '' };
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag,
  };
}

/**
 * Decrypt camera credentials using AES-256-GCM
 */
export function decryptCameraCredential(encrypted: string, ivHex: string, tagHex: string): string {
  if (!encrypted || !ivHex || !tagHex) {
    return '';
  }
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Failed to decrypt camera credential:', err);
    throw new Error('CORRUPTED_OR_INVALID_CREDENTIAL');
  }
}

/**
 * Generates a cryptographically strong stream session token
 */
export function generateStreamSessionToken(): string {
  return 'cctv_sess_' + crypto.randomBytes(24).toString('hex');
}

/**
 * Strip credentials from any raw RTSP URL for public/client display
 * e.g. rtsp://admin:pass123@192.168.1.50:554/ch0 -> rtsp://192.168.1.50:554/ch0
 */
export function maskCameraUrl(url: string): string {
  if (!url) return '';
  return url.replace(/:\/\/[^@]+@/, '://***:***@');
}

/**
 * Construct authenticated RTSP URL for media gateway consumption only (NEVER expose to client)
 */
export function buildAuthenticatedRtspUrl(params: {
  ipAddress: string;
  port?: number;
  rtspPath?: string;
  username?: string;
  password?: string;
}): string {
  const port = params.port || 554;
  let path = params.rtspPath || '/live';
  if (!path.startsWith('/')) path = '/' + path;

  if (params.username && params.password) {
    const user = encodeURIComponent(params.username);
    const pass = encodeURIComponent(params.password);
    return `rtsp://${user}:${pass}@${params.ipAddress}:${port}${path}`;
  } else if (params.username) {
    const user = encodeURIComponent(params.username);
    return `rtsp://${user}@${params.ipAddress}:${port}${path}`;
  }
  return `rtsp://${params.ipAddress}:${port}${path}`;
}
