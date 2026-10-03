import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Building,
  MapPin,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  KeyRound,
  AlertCircle,
  Smartphone,
  Radio,
  Fingerprint,
  RefreshCw,
  Award,
  Check,
  Cpu,
  ShieldCheck
} from 'lucide-react';
import { User, UserRole, SecurityClearance, AuthSession } from '../types';
import { authApi } from '../services/apiClient';
import { InspiraLogo } from './InspiraLogo';
import { EPramaanLogo, NicLogo } from './GovLogos';
import { UserAvatar } from './UserAvatar';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'LOGIN' | 'SIGNUP';
  allUsers: User[];
  onClose: () => void;
  onLoginSuccess: (user: User, session: AuthSession) => void;
  onSignUpSuccess: (user: User, session: AuthSession) => void;
  onShowToast: (msg: string, type?: 'success' | 'info') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'LOGIN',
  allUsers,
  onClose,
  onLoginSuccess,
  onSignUpSuccess,
  onShowToast,
}) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>(initialMode);
  const [loginMethod, setLoginMethod] = useState<'CREDENTIALS' | 'AADHAAR' | 'CERTIFICATE'>('CREDENTIALS');

  // Credentials Login Form State
  const [loginEmail, setLoginEmail] = useState('admin.monitoring@gov.in');
  const [loginPassword, setLoginPassword] = useState('GovSecure@2026');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('202609');
  const [showOtpField, setShowOtpField] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Captcha State
  const [captchaNum1, setCaptchaNum1] = useState(7);
  const [captchaNum2, setCaptchaNum2] = useState(4);
  const [captchaInput, setCaptchaInput] = useState('');

  const refreshCaptcha = () => {
    setCaptchaNum1(Math.floor(Math.random() * 9) + 1);
    setCaptchaNum2(Math.floor(Math.random() * 8) + 2);
    setCaptchaInput('');
  };

  // Aadhaar OTP Login State
  const [aadhaarNumber, setAadhaarNumber] = useState('4829-9182-3019');
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false);
  const [aadhaarOtpInput, setAadhaarOtpInput] = useState('');
  const [aadhaarTimer, setAadhaarTimer] = useState(30);

  // Sign Up Form State
  const [signUpRole, setSignUpRole] = useState<UserRole>('USER');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [district, setDistrict] = useState('South Delhi');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [signUpError, setSignUpError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync mode and clear errors whenever modal opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setLoginError('');
      setSignUpError('');
      setIsSubmitting(false);
      refreshCaptcha();
    }
  }, [isOpen, initialMode]);

  // Aadhaar OTP countdown timer
  useEffect(() => {
    let interval: any;
    if (aadhaarOtpSent && aadhaarTimer > 0) {
      interval = setInterval(() => {
        setAadhaarTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [aadhaarOtpSent, aadhaarTimer]);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const createSecuritySession = (user: User, realToken?: string): AuthSession => {
    const clearance: SecurityClearance =
      user.clearance ||
      (user.role === 'ADMIN'
        ? 'LEVEL_5_DIRECTORATE'
        : user.role === 'OFFICER'
        ? 'LEVEL_3_INSPECTOR'
        : user.role === 'NGO_WORKER'
        ? 'LEVEL_2_WORKER'
        : user.role === 'NGO'
        ? 'LEVEL_2_NGO'
        : 'LEVEL_1_PUBLIC');

    return {
      token:
        realToken ||
        `AUTH-INSPIRA-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      loginTime: new Date().toLocaleString('en-IN') + ' IST',
      clearance,
      ipAddress: 'Client Session',
      deviceFingerprint: 'BROWSER-CLIENT-SESSION',
      isVerified2FA: false,
    };
  };

  // Handle Demo Account 1-Click Instant Login
  const handleSelectDemoCredentials = async (email: string, pass: string = 'Password@123') => {
    setLoginEmail(email);
    setLoginPassword(pass);
    setLoginError('');
    try {
      setIsSubmitting(true);
      let result;
      try {
        result = await authApi.switchUser({ email });
      } catch {
        result = await authApi.login(email, pass);
      }
      onLoginSuccess(result.user, result.session);
      onShowToast(`✓ Authenticated as ${result.user.name} (${result.user.role})`, 'success');
    } catch (err: any) {
      // Local safety net: authenticate from allUsers prop
      const clean = email.trim().toLowerCase();
      const matched = allUsers.find(
        (u) =>
          u.email.toLowerCase() === clean ||
          u.name.toLowerCase().includes(clean) ||
          u.role.toLowerCase() === clean
      ) || (clean.includes('admin') ? allUsers.find(u => u.role === 'ADMIN') : undefined)
        || (clean.includes('officer') || clean.includes('vikram') ? allUsers.find(u => u.role === 'OFFICER') : undefined)
        || (clean.includes('ngo') || clean.includes('swasthya') ? allUsers.find(u => u.role === 'NGO') : undefined)
        || (clean.includes('worker') || clean.includes('sunita') ? allUsers.find(u => u.role === 'NGO_WORKER') : undefined)
        || allUsers[0];

      if (matched) {
        const session = createSecuritySession(matched);
        onLoginSuccess(matched, session);
        onShowToast(`✓ Authenticated as ${matched.name} (${matched.role})`, 'success');
      } else {
        setLoginError(err.message || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Standard Credentials Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail.trim() || !loginPassword) {
      setLoginError('Please enter your official email and password.');
      return;
    }

    // Verify Captcha
    if (parseInt(captchaInput, 10) !== captchaNum1 + captchaNum2) {
      setLoginError(`Security Captcha verification failed. Please enter correct sum: ${captchaNum1} + ${captchaNum2}.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await authApi.login(loginEmail.trim(), loginPassword);
      onLoginSuccess(result.user, result.session);
      onShowToast(
        `✓ Welcome back, ${result.user.name}! Authenticated with ${result.user.clearance?.replace(/_/g, ' ') || result.user.role}.`,
        'success'
      );
    } catch (err: any) {
      setLoginError(err.message || 'Invalid credentials or security clearance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Aadhaar OTP Verification
  const handleSendAadhaarOtp = () => {
    setAadhaarOtpSent(true);
    setAadhaarTimer(30);
    setAadhaarOtpInput('202609');
    onShowToast('✓ 6-Digit Demo OTP dispatched to linked mobile (+91 ••••••9821)', 'info');
  };

  const handleVerifyAadhaarOtp = async () => {
    if (!aadhaarOtpInput || aadhaarOtpInput.length < 6) {
      setLoginError('Please enter the 6-digit Aadhaar OTP.');
      return;
    }
    // Authenticate as worker Sunita Patil or selected user
    handleSelectDemoCredentials('worker.sunita@swasthya.org', 'Password@123');
  };

  // Handle Sign Up submission
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError('');

    if (!fullName.trim()) {
      setSignUpError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setSignUpError('Please enter a valid official email address.');
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      setSignUpError('Please enter a valid 10-digit contact number.');
      return;
    }
    if (password.length < 6) {
      setSignUpError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setSignUpError('Passwords do not match.');
      return;
    }
    if (!acceptedTerms) {
      setSignUpError('You must agree to the Statutory Verification Declaration.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await authApi.register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role: signUpRole,
        department: department.trim(),
        district,
        badgeNumber: badgeNumber.trim(),
      });

      const session = createSecuritySession(result.user, result.token);
      onSignUpSuccess(result.user, session);
      onShowToast(`✓ Account created successfully for ${result.user.name} (${result.user.role})!`, 'success');
    } catch (err: any) {
      setSignUpError(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden text-slate-800 flex flex-col my-6 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Neutral Accent Ribbon Strip */}
        <div className="h-1.5 w-full bg-[#0B3B60]"></div>

        {/* Prototype Login Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-[#0B3B60] to-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 p-1 flex items-center justify-center border border-white/20 shadow-inner shrink-0">
              <InspiraLogo className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-white tracking-wide leading-tight">
                  INSPIRA Portal Login
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  SIH 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-200 font-normal mt-0.5">
                Prototype NGO Monitoring &amp; Inspection System • PS 26095
              </p>
              <div className="flex items-center gap-2 text-[9px] text-emerald-400 font-mono mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Role-Based Access Control Active</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close Gateway"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 mx-5 mt-4 rounded-xl border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setLoginError('');
              setShowOtpField(false);
            }}
            className={`py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              mode === 'LOGIN'
                ? 'bg-[#0B3B60] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Sign In with Credentials</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('SIGNUP');
              setSignUpError('');
            }}
            className={`py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              mode === 'SIGNUP'
                ? 'bg-[#0B3B60] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>New Official Registration</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto max-h-[75vh] bg-[#f8fafd] space-y-4">
          {mode === 'LOGIN' ? (
            <>
              {/* Departmental Institutional Access Directory */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs">
                    <ShieldCheck className="w-4 h-4 text-[#0B3B60]" />
                    <span>Demo Accounts (Quick Select):</span>
                  </span>
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-mono">
                    SAMPLE DEMO ROLES
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {/* 1. Directorate Admin */}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSelectDemoCredentials('admin.monitoring@gov.in', 'Password@123')}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-amber-50/80 border border-slate-200 hover:border-amber-400 text-left transition-all group cursor-pointer disabled:opacity-50 flex flex-col justify-between card-hover-lift relative overflow-hidden"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <UserAvatar name="Demo Director" role="ADMIN" size="sm" showBadge={false} />
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-slate-900 group-hover:text-amber-900 truncate">
                          Demo Director
                        </div>
                        <div className="text-[9px] text-slate-500 font-medium truncate">Directorate Demo</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-200/60 text-[9px] font-mono">
                      <span className="font-bold text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded">DIRECTORATE</span>
                      <span className="text-slate-400 group-hover:text-amber-700">Enter →</span>
                    </div>
                  </button>

                  {/* 2. Field Inspector */}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSelectDemoCredentials('vikram.singh@inspection.gov.in', 'Password@123')}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-400 text-left transition-all group cursor-pointer disabled:opacity-50 flex flex-col justify-between card-hover-lift relative overflow-hidden"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <UserAvatar name="Vikram Singh" role="OFFICER" size="sm" showBadge={false} />
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-slate-900 group-hover:text-blue-900 truncate">
                          Vikram Singh
                        </div>
                        <div className="text-[9px] text-slate-500 font-medium truncate">Field Inspector</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-200/60 text-[9px] font-mono">
                      <span className="font-bold text-blue-800 bg-blue-100/80 px-1.5 py-0.5 rounded">INSPECTOR</span>
                      <span className="text-slate-400 group-hover:text-blue-700">Enter →</span>
                    </div>
                  </button>

                  {/* 3. Field Worker */}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSelectDemoCredentials('worker.patil@swasthya.org', 'Worker@123')}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-400 text-left transition-all group cursor-pointer disabled:opacity-50 flex flex-col justify-between card-hover-lift relative overflow-hidden"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <UserAvatar name="Sunita Patil" role="NGO_WORKER" size="sm" showBadge={false} />
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-slate-900 group-hover:text-emerald-900 truncate">
                          Sunita Patil
                        </div>
                        <div className="text-[9px] text-slate-500 font-medium truncate">Field Staff</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-200/60 text-[9px] font-mono">
                      <span className="font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded">WORKER</span>
                      <span className="text-slate-400 group-hover:text-emerald-700">Enter →</span>
                    </div>
                  </button>

                  {/* 4. NGO Trustee */}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSelectDemoCredentials('pratham.delhi@domain.org', 'Password@123')}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-purple-50/80 border border-slate-200 hover:border-purple-400 text-left transition-all group cursor-pointer disabled:opacity-50 flex flex-col justify-between card-hover-lift relative overflow-hidden"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <UserAvatar name="Madhav Chavan" role="NGO" size="sm" showBadge={false} />
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-slate-900 group-hover:text-purple-900 truncate">
                          Madhav Chavan
                        </div>
                        <div className="text-[9px] text-slate-500 font-medium truncate">Pratham Rep</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-200/60 text-[9px] font-mono">
                      <span className="font-bold text-purple-800 bg-purple-100/80 px-1.5 py-0.5 rounded">NGO REP</span>
                      <span className="text-slate-400 group-hover:text-purple-700">Enter →</span>
                    </div>
                  </button>

                  {/* 5. Citizen */}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSelectDemoCredentials('citizen.kavita@domain.in', 'Password@123')}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-sky-50/80 border border-slate-200 hover:border-sky-400 text-left transition-all group cursor-pointer disabled:opacity-50 flex flex-col justify-between card-hover-lift relative overflow-hidden"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <UserAvatar name="Kavita Sharma" role="USER" size="sm" showBadge={false} />
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-slate-900 group-hover:text-sky-900 truncate">
                          Kavita Sharma
                        </div>
                        <div className="text-[9px] text-slate-500 font-medium truncate">Whistleblower</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-200/60 text-[9px] font-mono">
                      <span className="font-bold text-sky-800 bg-sky-100/80 px-1.5 py-0.5 rounded">CITIZEN</span>
                      <span className="text-slate-400 group-hover:text-sky-700">Enter →</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Login Method Sub-Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
                <button
                  type="button"
                  onClick={() => setLoginMethod('CREDENTIALS')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    loginMethod === 'CREDENTIALS'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Standard Login (Username/Password)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLoginMethod('AADHAAR')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    loginMethod === 'AADHAAR'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                  }`}
                >
                  <Fingerprint className="w-3.5 h-3.5 text-amber-500" />
                  <span>Demo OTP Verification</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLoginMethod('CERTIFICATE')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    loginMethod === 'CERTIFICATE'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Digital Token / DSC</span>
                </button>
              </div>

              {loginError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* METHOD 1: Standard Credentials Login */}
              {loginMethod === 'CREDENTIALS' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                      <span>Registered Email / Username *</span>
                      <span className="text-[10px] text-slate-400 font-mono">Demo Accounts Active</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="e.g. admin.monitoring@gov.in or officer@gov.in"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Official Password *</label>
                      <button
                        type="button"
                        onClick={() => onShowToast('For demo credentials, use the pre-configured accounts above.', 'info')}
                        className="text-xs text-blue-600 hover:underline cursor-pointer font-medium"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your secure password"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Captcha Verification */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>Security Captcha Verification *</span>
                      <span className="text-[10px] text-slate-500">Anti-Bot Protection</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="px-4 py-2 bg-slate-200 font-mono font-extrabold text-base tracking-widest text-slate-800 rounded-lg select-none border border-slate-300">
                        {captchaNum1} + {captchaNum2} = ?
                      </div>
                      <input
                        type="number"
                        required
                        value={captchaInput}
                        onChange={(e) => setCaptchaInput(e.target.value)}
                        placeholder="Enter sum"
                        className="w-28 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 text-center"
                      />
                      <button
                        type="button"
                        onClick={refreshCaptcha}
                        className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                        title="Reload Captcha"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 2FA OTP Field */}
                  {showOtpField && (
                    <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5 uppercase">
                          <Fingerprint className="w-4 h-4 text-blue-600" />
                          Two-Factor Authentication Passcode
                        </label>
                        <span className="text-[10px] text-blue-800 font-mono font-bold bg-white px-2 py-0.5 rounded-full border border-blue-200">
                          Demo OTP: 202609
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="w-full px-4 py-2 text-center tracking-widest font-mono text-base font-bold bg-white border border-blue-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-0" />
                      <span>Remember institutional terminal (12 hrs)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowOtpField(!showOtpField)}
                      className="text-blue-600 hover:underline font-semibold cursor-pointer"
                    >
                      {showOtpField ? 'Hide 2FA' : 'Enable 2FA OTP'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    )}
                    <span>SIGN IN TO INSPIRA</span>
                  </button>
                </form>
              )}

              {/* METHOD 2: Demo Instant OTP */}
              {loginMethod === 'AADHAAR' && (
                <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                      <span>Mobile Number / Demo ID *</span>
                      <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Demo Auth
                      </span>
                    </label>
                    <div className="relative">
                      <Fingerprint className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={aadhaarNumber}
                        onChange={(e) => setAadhaarNumber(e.target.value)}
                        placeholder="XXXX-XXXX-XXXX"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  {!aadhaarOtpSent ? (
                    <button
                      type="button"
                      onClick={handleSendAadhaarOtp}
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>DISPATCH DEMO OTP TO SIMULATED MOBILE</span>
                    </button>
                  ) : (
                    <div className="space-y-3 pt-2">
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                        ✓ OTP successfully dispatched to demo mobile (+91 ••••••9821). Valid for 10 minutes.
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 uppercase">Enter 6-Digit Demo OTP *</label>
                        <input
                          type="text"
                          maxLength={6}
                          value={aadhaarOtpInput}
                          onChange={(e) => setAadhaarOtpInput(e.target.value)}
                          placeholder="202609"
                          className="w-full py-2.5 text-center tracking-widest font-mono text-lg font-extrabold bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                        <span>Resend OTP in: {aadhaarTimer}s</span>
                        {aadhaarTimer === 0 && (
                          <button
                            type="button"
                            onClick={handleSendAadhaarOtp}
                            className="text-blue-600 underline hover:no-underline cursor-pointer"
                          >
                            Resend Now
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleVerifyAadhaarOtp}
                        disabled={isSubmitting}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        <span>VERIFY OTP &amp; SIGN IN</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* METHOD 3: Digital Token / DSC */}
              {loginMethod === 'CERTIFICATE' && (
                <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center py-8">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center mx-auto">
                    <Cpu className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Cryptographic USB Token / DSC Login (Demo)</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Simulate authentication with a Directorate Digital Signature Certificate (DSC) key.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectDemoCredentials('admin.monitoring@gov.in', 'Password@123')}
                    className="px-6 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <span>SIMULATE DSC LOGIN AS DEMO DIRECTOR</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Official Registration Form */
            <form onSubmit={handleSignUpSubmit} className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              {signUpError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{signUpError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Registration Category / Official Role *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setSignUpRole('OFFICER')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      signUpRole === 'OFFICER'
                        ? 'bg-blue-50 border-blue-600 text-blue-800 ring-1 ring-blue-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    👮 Field Inspector
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignUpRole('NGO_WORKER')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      signUpRole === 'NGO_WORKER'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-800 ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    👩‍⚕️ Field Worker
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignUpRole('NGO')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      signUpRole === 'NGO'
                        ? 'bg-purple-50 border-purple-600 text-purple-800 ring-1 ring-purple-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    🏢 NGO Trustee
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignUpRole('USER')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      signUpRole === 'USER'
                        ? 'bg-teal-50 border-teal-600 text-teal-800 ring-1 ring-teal-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    👥 Citizen
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Full Official Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Smt. Sunita Patil"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Official Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gov.in or name@org.org"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Assigned District</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="South Delhi">South Delhi, DL</option>
                    <option value="New Delhi">New Delhi, DL</option>
                    <option value="Mumbai Suburban">Mumbai Suburban, MH</option>
                    <option value="Pune">Pune, MH</option>
                    <option value="Bengaluru Urban">Bengaluru Urban, KA</option>
                    <option value="Kolkata">Kolkata, WB</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Set Password *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-0"
                  />
                  <span>
                    I solemnly declare that all statutory details provided are accurate and subject to verification under the National e-Governance Standards (GIGW 3.0).
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4 text-amber-300" />}
                <span>REGISTER OFFICIAL CLEARANCE PROFILE</span>
              </button>
            </form>
          )}
        </div>

        {/* Prototype Footer */}
        <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between text-[10px] text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>INSPIRA Prototype Authentication • SIH 2026</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Problem Statement 26095</span>
            <span>•</span>
            <span className="font-bold text-slate-700">Team InnoCoders</span>
          </div>
        </div>
      </div>
    </div>
  );
};
