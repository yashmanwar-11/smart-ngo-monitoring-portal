import React from 'react';
import {
  X,
  Users,
  Award,
  Building,
  UserCheck,
  CreditCard,
  Mail,
  Phone,
  Printer,
  Sparkles,
  CheckCircle2,
  GraduationCap
} from 'lucide-react';

interface SihTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface TeamMember {
  role: 'LEADER' | 'TEAM_MEMBER';
  name: string;
  email: string;
  phone: string;
  gender: 'Female' | 'Male';
}

export const SIH_TEAM_DATA = {
  teamName: 'InnoCoders',
  teamLeader: 'Monika Warkad',
  teamId: '180211',
  collegeName: "Mauli Group of Institution's College of Engineering & Technology, Shegaon",
  members: [
    {
      role: 'LEADER',
      name: 'Monika Warkad',
      email: 'monikawarked@gmail.com',
      phone: '7558273598',
      gender: 'Female',
    },
    {
      role: 'TEAM_MEMBER',
      name: 'Shruti Chavan',
      email: 'shrutichawan2006@gmail.com',
      phone: '8668483628',
      gender: 'Female',
    },
    {
      role: 'TEAM_MEMBER',
      name: 'Namrata Singare',
      email: 'namratasingare7@gmail.com',
      phone: '8668793207',
      gender: 'Female',
    },
    {
      role: 'TEAM_MEMBER',
      name: 'Divya Gond',
      email: 'gonddivya17@gmail.com',
      phone: '9518922745',
      gender: 'Female',
    },
    {
      role: 'TEAM_MEMBER',
      name: 'Yash Manwar',
      email: 'yashmanwar0711@gmail.com',
      phone: '9209673221',
      gender: 'Male',
    },
    {
      role: 'TEAM_MEMBER',
      name: 'Aarti Borakhade',
      email: 'aartiborakhad@gmail.com',
      phone: '7030600999',
      gender: 'Female',
    },
  ] as TeamMember[],
};

export const SihTeamModal: React.FC<SihTeamModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden text-slate-900 relative my-auto">
        {/* National Flag Color Strip */}
        <div className="grid grid-cols-3 h-1.5 w-full">
          <div className="bg-[#FF9933]"></div>
          <div className="bg-white"></div>
          <div className="bg-[#138808]"></div>
        </div>

        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 bg-purple-100 text-purple-900 border border-purple-200 rounded-md font-mono text-[11px] font-bold tracking-wider">
              SMART INDIA HACKATHON
            </span>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Official Team Roster &amp; Institutional Credentials
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content matching user's SIH Portal View */}
        <div className="p-6 sm:p-8 space-y-6" id="sih-team-printable-area">
          {/* Main Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Team Detail</span>
              <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold border border-emerald-300">
                Verified
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Ministry of Social Justice &amp; Empowerment • Problem Statement Real-Time NGO Vigilance
            </p>
          </div>

          {/* 4 Characteristic Gradient Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Team Name (Blue Gradient) */}
            <div className="relative overflow-hidden rounded-xl p-4 text-white shadow-md bg-gradient-to-r from-[#0284c7] to-[#0ea5e9]">
              <div className="relative z-10">
                <div className="text-xs font-bold text-sky-100 uppercase tracking-wider">
                  Team Name
                </div>
                <div className="text-xl font-black mt-1 tracking-tight">
                  {SIH_TEAM_DATA.teamName}
                </div>
              </div>
              <CreditCard className="absolute -right-2 -bottom-2 w-16 h-16 text-white/20" />
            </div>

            {/* Card 2: Team Leader Name (Green Gradient) */}
            <div className="relative overflow-hidden rounded-xl p-4 text-white shadow-md bg-gradient-to-r from-[#65a30d] to-[#84cc16]">
              <div className="relative z-10">
                <div className="text-xs font-bold text-lime-100 uppercase tracking-wider">
                  Team Leader Name
                </div>
                <div className="text-xl font-black mt-1 tracking-tight">
                  {SIH_TEAM_DATA.teamLeader}
                </div>
              </div>
              <Users className="absolute -right-2 -bottom-2 w-16 h-16 text-white/20" />
            </div>

            {/* Card 3: Team ID (Purple/Violet Gradient) */}
            <div className="relative overflow-hidden rounded-xl p-4 text-white shadow-md bg-gradient-to-r from-[#7c3aed] to-[#a855f7]">
              <div className="relative z-10">
                <div className="text-xs font-bold text-purple-100 uppercase tracking-wider">
                  Team ID
                </div>
                <div className="text-xl font-black mt-1 tracking-tight font-mono">
                  {SIH_TEAM_DATA.teamId}
                </div>
              </div>
              <Building className="absolute -right-2 -bottom-2 w-16 h-16 text-white/20" />
            </div>

            {/* Card 4: College Name (Deep Cyan / Blue Gradient) */}
            <div className="relative overflow-hidden rounded-xl p-4 text-white shadow-md bg-gradient-to-r from-[#0284c7] to-[#2563eb]">
              <div className="relative z-10">
                <div className="text-xs font-bold text-cyan-100 uppercase tracking-wider">
                  College Name
                </div>
                <div className="text-xs font-bold mt-1.5 leading-snug line-clamp-3">
                  {SIH_TEAM_DATA.collegeName}
                </div>
              </div>
              <GraduationCap className="absolute -right-2 -bottom-2 w-16 h-16 text-white/20" />
            </div>
          </div>

          {/* Team Members Section */}
          <div className="space-y-3 pt-2">
            <h2 className="text-lg font-bold text-[#6d28d9] tracking-tight flex items-center gap-2">
              <span>Team Members</span>
              <span className="text-xs font-mono px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full border border-purple-200">
                6 Members
              </span>
            </h2>

            {/* Responsive Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
              <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                <thead className="bg-[#262626] text-white uppercase font-bold tracking-wider text-[11px]">
                  <tr>
                    <th scope="col" className="px-4 py-3">Member Role</th>
                    <th scope="col" className="px-4 py-3">Member Name</th>
                    <th scope="col" className="px-4 py-3">Member Email</th>
                    <th scope="col" className="px-4 py-3">Member Phone</th>
                    <th scope="col" className="px-4 py-3">Member Gender</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 text-slate-800">
                  {SIH_TEAM_DATA.members.map((member, index) => {
                    const isLeader = member.role === 'LEADER';
                    return (
                      <tr
                        key={member.email}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isLeader ? 'bg-amber-50/30 font-semibold' : ''
                        }`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isLeader ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Award className="w-3 h-3 text-amber-700" />
                              LEADER
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10.5px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              TEAM_MEMBER
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                          {member.name}
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-mono whitespace-nowrap">
                          <a
                            href={`mailto:${member.email}`}
                            className="hover:text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Mail className="w-3 h-3 text-slate-400" />
                            {member.email}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-mono whitespace-nowrap">
                          <a
                            href={`tel:${member.phone}`}
                            className="hover:text-emerald-600 flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            {member.phone}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] ${
                              member.gender === 'Female'
                                ? 'bg-pink-50 text-pink-700 border border-pink-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {member.gender}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Institutional Trust Footnote */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Project: <strong>INSPIRA National NGO Real-Time Monitoring &amp; Inspection Portal</strong>
              </span>
            </div>
            <div className="font-mono text-[11px] text-slate-500">
              SIH-2026-TEAM-180211 • VERIFIED SUBMISSION
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            Smart India Hackathon • Ministry of Social Justice &amp; Empowerment
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Details</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
