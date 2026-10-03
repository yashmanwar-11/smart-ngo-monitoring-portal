import React, { useState } from 'react';
import { Shield, Award, User as UserIcon, Building2, HeartHandshake } from 'lucide-react';

interface UserAvatarProps {
  name?: string;
  role?: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBadge?: boolean;
}

const sizeConfig = {
  xs: {
    container: 'w-6 h-6 text-[10px]',
    icon: 'w-3 h-3',
    badge: 'w-2 h-2 -bottom-0.5 -right-0.5',
  },
  sm: {
    container: 'w-8 h-8 text-xs font-bold',
    icon: 'w-4 h-4',
    badge: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
  },
  md: {
    container: 'w-10 h-10 text-sm font-bold',
    icon: 'w-5 h-5',
    badge: 'w-3 h-3 -bottom-1 -right-1',
  },
  lg: {
    container: 'w-12 h-12 text-base font-bold',
    icon: 'w-6 h-6',
    badge: 'w-3.5 h-3.5 -bottom-1 -right-1',
  },
  xl: {
    container: 'w-16 h-16 text-lg font-black',
    icon: 'w-8 h-8',
    badge: 'w-4 h-4 -bottom-1 -right-1',
  },
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name = 'Government User',
  role = 'USER',
  avatarUrl,
  size = 'md',
  className = '',
  showBadge = true,
}) => {
  const [imageError, setImageError] = useState(false);

  // Filter out stock unsplash photos
  const isStockPhoto = Boolean(avatarUrl && avatarUrl.includes('images.unsplash.com'));
  const hasValidCustomImage = Boolean(avatarUrl && !isStockPhoto && !imageError);

  // Extract initials (max 2 characters)
  const getInitials = (n: string): string => {
    const clean = n.replace(/^(Dr\.|Inspector|Mr\.|Mrs\.|Ms\.|Shri|Smt\.)\s*/i, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'IN';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(name);
  const cfg = sizeConfig[size] || sizeConfig.md;

  // Role visual identity based on Indian Government hierarchy
  const getRoleDesign = (r: string) => {
    switch (r) {
      case 'ADMIN':
        return {
          bg: 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900',
          text: 'text-amber-300',
          border: 'border-amber-400/50 shadow-xs',
          ring: 'ring-1 ring-amber-400/30',
          badgeBg: 'bg-amber-500',
          badgeIcon: Award,
          label: 'Directorate / IAS',
        };
      case 'OFFICER':
        return {
          bg: 'bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950',
          text: 'text-blue-200',
          border: 'border-blue-400/50 shadow-xs',
          ring: 'ring-1 ring-blue-400/30',
          badgeBg: 'bg-blue-600',
          badgeIcon: Shield,
          label: 'Field Vigilance',
        };
      case 'NGO':
        return {
          bg: 'bg-gradient-to-br from-purple-950 via-slate-900 to-slate-900',
          text: 'text-purple-200',
          border: 'border-purple-400/50 shadow-xs',
          ring: 'ring-1 ring-purple-400/30',
          badgeBg: 'bg-purple-600',
          badgeIcon: Building2,
          label: 'Registered NGO',
        };
      case 'NGO_WORKER':
        return {
          bg: 'bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950',
          text: 'text-emerald-200',
          border: 'border-emerald-400/50 shadow-xs',
          ring: 'ring-1 ring-emerald-400/30',
          badgeBg: 'bg-emerald-600',
          badgeIcon: HeartHandshake,
          label: 'Field Worker',
        };
      case 'USER':
      default:
        return {
          bg: 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800',
          text: 'text-slate-200',
          border: 'border-slate-500/40 shadow-xs',
          ring: 'ring-1 ring-slate-400/20',
          badgeBg: 'bg-slate-600',
          badgeIcon: UserIcon,
          label: 'Citizen / Auditor',
        };
    }
  };

  const style = getRoleDesign(role);
  const BadgeIcon = style.badgeIcon;

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}>
      {hasValidCustomImage ? (
        <img
          src={avatarUrl!}
          alt={name}
          onError={() => setImageError(true)}
          className={`${cfg.container} rounded-full object-cover border ${style.border} ${style.ring}`}
        />
      ) : (
        <div
          className={`${cfg.container} rounded-full ${style.bg} ${style.text} border ${style.border} ${style.ring} flex items-center justify-center tracking-wider font-mono shadow-xs overflow-hidden`}
          title={`${name} (${style.label})`}
        >
          <span>{initials}</span>
        </div>
      )}

      {showBadge && (
        <div
          className={`absolute ${cfg.badge} rounded-full ${style.badgeBg} text-white flex items-center justify-center border border-white/80 shadow-xs`}
          title={style.label}
        >
          <BadgeIcon className="w-[60%] h-[60%]" />
        </div>
      )}
    </div>
  );
};
