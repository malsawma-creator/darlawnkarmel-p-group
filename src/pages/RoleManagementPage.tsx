import React, { useState } from 'react';
import { Member, UserRole, ROLE_LABELS, isOBRole, isDeveloperUser, MemberStatus } from '../types';
import { Storage } from '../utils/storage';
import {
  ShieldAlert,
  UserCheck,
  UserX,
  Trash2,
  Search,
  Filter,
  Users,
  Award,
  Clock,
  Shield,
  PhoneCall,
  Crown,
  AlertTriangle,
} from 'lucide-react';

interface RoleManagementPageProps {
  currentUser: Member | null;
  onOpenLogin: () => void;
  onDataChanged: () => void;
  dataVersion?: number;
}

export const RoleManagementPage: React.FC<RoleManagementPageProps> = ({
  currentUser,
  onOpenLogin,
  onDataChanged,
}) => {
  const isDev = isDeveloperUser(currentUser);
  const isOB = (currentUser && isOBRole(currentUser.role)) || isDev;
  const members = Storage.getMembers();

  const [activeTab, setActiveTab] = useState<'pending' | 'members'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | 'OB' | 'MEMBER'>('ALL');

  if (!isOB) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">OB & Developer Only</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          He screen "Manage Members & Roles" hi Branch Office Bearers (OB) leh Developer-te pual chauh a ni.
          Member dangte tan luh theih a ni lo.
        </p>
        <button
          onClick={onOpenLogin}
          className="rounded-xl bg-blue-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-600 shadow-sm"
        >
          OB / Developer Login
        </button>
      </div>
    );
  }

  const pendingMembers = members.filter((m) => m.status === 'Pending');
  const approvedMembers = members.filter((m) => m.status !== 'Pending');

  const filteredApproved = approvedMembers.filter((m) => {
    const matchSearch =
      m.hming.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.veng.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm);
    if (filterRole === 'OB') return matchSearch && isOBRole(m.role);
    if (filterRole === 'MEMBER') return matchSearch && !isOBRole(m.role);
    return matchSearch;
  });

  const handleApprove = (id: string, name: string) => {
    Storage.updateMemberStatus(id, 'Approved');
    onDataChanged();
  };

  const handleReject = (id: string, name: string) => {
    if (window.confirm(`${name}-a registration hi hnawl (Reject) i duh takzet em?`)) {
      Storage.updateMemberStatus(id, 'Rejected');
      onDataChanged();
    }
  };

  const handlePermanentDelete = (id: string, name: string) => {
    if (
      window.confirm(
        `Are you sure you want to permanently remove "${name}" from the group?\n\nThis will completely erase their member record and finance budget.`
      )
    ) {
      Storage.deleteMember(id);
      onDataChanged();
    }
  };

  const handleRoleChange = (id: string, newRole: UserRole) => {
    Storage.assignMemberDesignation(id, newRole);
    onDataChanged();
  };

  const handleMakeOB = (id: string) => {
    Storage.assignMemberDesignation(id, 'COMMITTEE_OB');
    onDataChanged();
  };

  const handleRemoveOB = (id: string, name: string) => {
    if (window.confirm(`${name} hi OB nihna atanga hlipin Member pangngaiah dah i duh em?`)) {
      Storage.assignMemberDesignation(id, 'MEMBER');
      onDataChanged();
    }
  };

  return (
    <div className="space-y-6 pb-28 animate-in fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-900 via-amber-800 to-slate-900 p-5 sm:p-6 text-white shadow-md">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-sm">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-200 border border-amber-400/30">
                <Crown className="w-3 h-3 text-amber-300" />
                <span>Developer Control Center (Private)</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                Manage Members & Roles
              </h1>
              <p className="text-xs text-amber-100 font-medium">
                Approve new requests, assign OB designations, or permanently remove fake accounts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'pending'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Approvals</span>
          {pendingMembers.length > 0 && (
            <span className="rounded-full bg-rose-500 text-white px-2 py-0.5 text-[10px] font-mono font-bold">
              {pendingMembers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'members'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>All Members & Roles ({approvedMembers.length})</span>
        </button>
      </div>

      {/* TAB 1: PENDING APPROVALS */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Approval Guide:</strong>
              Normal member-te an inziahluh hian PENDING state-ah an awm a, i approve hma chu app
              data an lut thei lo. I approve hnuah an phone number hmangin awlsam takin an lut thei
              ang.
            </div>
          </div>

          {pendingMembers.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 p-6">
              <UserCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="font-bold text-slate-900 text-sm">No Pending Approvals</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Member thar inziak lut approval nghak mek an awm lo e.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {pendingMembers.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl border-2 border-amber-300 bg-white p-4.5 shadow-sm hover:shadow-md transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">{m.hming}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                          Pending
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {m.veng} • Applied: {m.joinedDate || 'Recently'}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-2.5 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Phone Number:</span>
                    <a
                      href={`tel:${m.phone}`}
                      className="inline-flex items-center gap-1 font-mono font-bold text-blue-700 hover:underline"
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>+91 {m.phone}</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => handleApprove(m.id, m.hming)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2 px-3 text-xs font-bold text-white shadow-xs transition"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Approve</span>
                    </button>

                    <button
                      onClick={() => handleReject(m.id, m.hming)}
                      className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 py-2 px-3 text-xs font-bold text-slate-700 transition"
                      title="Reject request"
                    >
                      <UserX className="w-4 h-4 text-slate-600" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => handlePermanentDelete(m.id, m.hming)}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition"
                      title="Delete application permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALL MEMBERS & ROLE ASSIGNMENT */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search member by name, phone, or veng..."
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilterRole('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  filterRole === 'ALL'
                    ? 'bg-blue-700 text-white'
                    : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterRole('OB')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  filterRole === 'OB'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                OB Only
              </button>
              <button
                onClick={() => setFilterRole('MEMBER')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  filterRole === 'MEMBER'
                    ? 'bg-slate-800 text-white'
                    : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                Normal Members
              </button>
            </div>
          </div>

          {/* Members List */}
          <div className="space-y-2.5">
            {filteredApproved.map((m) => {
              const isOB = isOBRole(m.role);
              const isThisDeveloper = m.isDeveloper || m.phone === '9862123456';
              return (
                <div
                  key={m.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{m.hming}</span>
                      {isThisDeveloper ? (
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          Developer (You)
                        </span>
                      ) : isOB ? (
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                          OB / Admin
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-slate-100 text-slate-700">
                          Member
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span>{m.veng}</span>
                      <span>•</span>
                      <span className="font-mono">+91 {m.phone}</span>
                    </div>
                  </div>

                  {/* Role Assignment & Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Designation:
                      </label>
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.id, e.target.value as UserRole)}
                        className="rounded-xl border border-slate-300 bg-white py-1.5 px-2.5 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                      >
                        <option value="LEADER">Leader</option>
                        <option value="ASST_LEADER">Asst. Leader</option>
                        <option value="SECRETARY">Secretary</option>
                        <option value="ASST_SECRETARY">Asst. Secretary</option>
                        <option value="TREASURER">Treasurer</option>
                        <option value="FINANCE_SECRETARY">Asst. Treasurer</option>
                        <option value="COMMITTEE_OB">Committee Member</option>
                        <option value="MEMBER">Member (Normal)</option>
                      </select>
                    </div>

                    {!isThisDeveloper && (
                      <>
                        {isOB ? (
                          <button
                            onClick={() => handleRemoveOB(m.id, m.hming)}
                            className="rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition"
                          >
                            Remove OB
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMakeOB(m.id)}
                            className="rounded-xl bg-amber-500 hover:bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-2xs transition"
                          >
                            Make OB
                          </button>
                        )}

                        {/* REMOVE MEMBER BUTTON WITH CONFIRM */}
                        <button
                          onClick={() => handlePermanentDelete(m.id, m.hming)}
                          className="flex items-center gap-1 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 px-3 py-1.5 text-xs font-bold transition"
                          title="Remove member permanently to delete fake accounts"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove Member</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
