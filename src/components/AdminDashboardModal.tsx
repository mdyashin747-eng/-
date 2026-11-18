import { useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  Lock,
  LogOut,
  Phone,
  Search,
  ShieldCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { ADMIN_EMAIL, auth, googleProvider } from '../firebase';
import {
  AdminDonationItem,
  AdminVolunteerItem,
  subscribeAdminDonations,
  subscribeAdminVolunteers,
  updateDonationStatus,
  updateVolunteerStatus,
} from '../services/firestoreService';
import { formatBDT, getMethodLabel, toBengaliDigits } from '../data/foundation';

interface AdminDashboardModalProps {
  open: boolean;
  onClose: () => void;
}

export function AdminDashboardModal({ open, onClose }: AdminDashboardModalProps) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [tab, setTab] = useState<'donations' | 'volunteers'>('donations');

  const [donations, setDonations] = useState<AdminDonationItem[]>([]);
  const [volunteers, setVolunteers] = useState<AdminVolunteerItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>(
    'all'
  );
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (current) => {
      setUser(current);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const isAuthorizedAdmin =
    Boolean(user) &&
    user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
    user?.emailVerified === true;

  useEffect(() => {
    if (!open || !authReady || !isAuthorizedAdmin) {
      return;
    }

    setLoadingData(true);
    setDataError(null);

    const unsubDon = subscribeAdminDonations(
      (items) => {
        setDonations(items);
        setLoadingData(false);
      },
      (err) => {
        setDataError(err.message);
        setLoadingData(false);
      }
    );

    const unsubVol = subscribeAdminVolunteers(
      (items) => {
        setVolunteers(items);
      },
      (err) => {
        setDataError(err.message);
      }
    );

    return () => {
      unsubDon();
      unsubVol();
    };
  }, [open, authReady, isAuthorizedAdmin]);

  if (!open) return null;

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? 'লগইন সম্পন্ন হয়নি। অনুগ্রহ করে পপআপ অ্যালাউ করে আবার চেষ্টা করুন।'
          : 'লগইন করতে সমস্যা হয়েছে।'
      );
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setDonations([]);
    setVolunteers([]);
  };

  const handleCopy = async (val: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopiedText(val);
      setTimeout(() => setCopiedText((prev) => (prev === val ? null : prev)), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleStatusChange = async (
    id: string,
    status: 'pending' | 'verified' | 'rejected'
  ) => {
    setBusyId(id);
    try {
      await updateDonationStatus(id, status);
    } catch {
      setDataError('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।');
    } finally {
      setBusyId(null);
    }
  };

  const handleVolunteerStatus = async (
    id: string,
    status: 'pending' | 'contacted' | 'approved'
  ) => {
    setBusyId(id);
    try {
      await updateVolunteerStatus(id, status);
    } catch {
      setDataError('স্বেচ্ছাসেবীর স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।');
    } finally {
      setBusyId(null);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'রসিদ নম্বর',
      'দাতার নাম',
      'মোবাইল নম্বর',
      'ক্যাম্পেইন',
      'পরিমাণ (টাকা)',
      'মাধ্যম',
      'TrxID',
      'স্ট্যাটাস',
      'মন্তব্য',
      'সময়',
    ];
    const rows = donations.map((d) => [
      d.receiptNo,
      d.donorName,
      d.phone,
      d.campaignTitle,
      String(d.amount),
      getMethodLabel(d.method),
      d.trxId,
      d.status,
      d.note ?? '',
      d.createdAtLabel,
    ]);
    const csvContent =
      '\uFEFF' +
      [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seba-foundation-donors-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredDonations = donations.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      item.donorName.toLowerCase().includes(q) ||
      item.phone.toLowerCase().includes(q) ||
      item.trxId.toLowerCase().includes(q) ||
      item.receiptNo.toLowerCase().includes(q)
    );
  });

  const filteredVolunteers = volunteers.filter((v) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.phone.toLowerCase().includes(q) ||
      v.district.toLowerCase().includes(q)
    );
  });

  const totalVerifiedAmount = donations
    .filter((d) => d.status !== 'rejected')
    .reduce((sum, d) => sum + d.amount, 0);
  const pendingCount = donations.filter((d) => d.status === 'pending').length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-modal-title"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-border bg-background px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <h2 id="admin-modal-title" className="font-display text-lg font-bold">
                অ্যাডমিন ড্যাশবোর্ড — দাতা ও স্বেচ্ছাসেবী তালিকা
              </h2>
              <p className="text-xs text-muted-foreground">
                শুধুমাত্র অনুমোদিত অ্যাডমিন ({ADMIN_EMAIL}) পূর্ণ মোবাইল নম্বর ও TrxID দেখতে পারবেন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user && (
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <LogOut className="size-3.5" />
                লগআউট
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="বন্ধ করুন"
              className="flex size-9 items-center justify-center rounded-lg border border-input bg-card text-foreground transition-colors hover:bg-accent"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {!user ? (
            <div className="mx-auto max-w-md py-12 text-center">
              <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Lock className="size-7" />
              </span>
              <h3 className="mt-4 font-display text-xl font-bold">
                দাতাদের নাম ও মোবাইল নম্বর দেখতে লগইন করুন
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                দাতাদের ব্যক্তিগত মোবাইল নম্বর সুরক্ষিত রাখতে শুধুমাত্র আপনার Google অ্যাকাউন্ট (
                <span className="font-semibold text-foreground">{ADMIN_EMAIL}</span>) দিয়ে লগইন করলে
                পূর্ণ তালিকা দেখা যাবে।
              </p>
              {authError && (
                <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
                  {authError}
                </p>
              )}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-6 py-3 font-display text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]"
              >
                Google দিয়ে অ্যাডমিন লগইন করুন
              </button>
            </div>
          ) : !isAuthorizedAdmin ? (
            <div className="mx-auto max-w-md py-12 text-center">
              <h3 className="font-display text-xl font-bold text-red-300">
                অনুমোদিত অ্যাডমিন অ্যাকাউন্ট নয়
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                আপনি বর্তমানে <span className="font-semibold text-foreground">{user.email}</span> দিয়ে
                লগইন আছেন। দাতাদের মোবাইল নম্বর দেখতে <span className="font-semibold">{ADMIN_EMAIL}</span>{' '}
                অ্যাকাউন্ট দিয়ে লগইন করুন।
              </p>
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-5 rounded-xl border border-input bg-background px-5 py-2.5 text-sm font-semibold hover:bg-accent"
              >
                অন্য অ্যাকাউন্টে পরিবর্তন করুন
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Row */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-border bg-background p-4">
                  <span className="text-xs text-muted-foreground">মোট অনুদান এন্ট্রি</span>
                  <div className="mt-1 font-display text-2xl font-bold tabular-nums">
                    {toBengaliDigits(donations.length)}টি
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-background p-4">
                  <span className="text-xs text-muted-foreground">মোট সংগৃহীত (অনলাইন ফর্ম)</span>
                  <div className="mt-1 font-display text-2xl font-bold text-primary-glow tabular-nums">
                    {formatBDT(totalVerifiedAmount)}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-background p-4">
                  <span className="text-xs text-muted-foreground">যাচাই বাকি</span>
                  <div className="mt-1 font-display text-2xl font-bold tabular-nums">
                    {toBengaliDigits(pendingCount)}টি
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-background p-4">
                  <span className="text-xs text-muted-foreground">স্বেচ্ছাসেবী আবেদন</span>
                  <div className="mt-1 font-display text-2xl font-bold tabular-nums">
                    {toBengaliDigits(volunteers.length)} জন
                  </div>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1 rounded-xl border border-border bg-background p-1">
                  <button
                    type="button"
                    onClick={() => setTab('donations')}
                    className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                      tab === 'donations'
                        ? 'bg-gradient-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    দাতার তালিকা ও নাম্বার ({toBengaliDigits(donations.length)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('volunteers')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                      tab === 'volunteers'
                        ? 'bg-gradient-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Users className="size-3.5" />
                    স্বেচ্ছাসেবী ({toBengaliDigits(volunteers.length)})
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="নাম, মোবাইল বা TrxID খুঁজুন..."
                      className="rounded-xl border border-input bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                    />
                  </div>
                  {tab === 'donations' && donations.length > 0 && (
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-input bg-background px-3.5 py-2 text-xs font-semibold transition-colors hover:border-primary hover:text-primary"
                    >
                      <Download className="size-3.5" />
                      CSV ডাউনলোড
                    </button>
                  )}
                </div>
              </div>

              {tab === 'donations' && (
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      ['all', 'সব'],
                      ['pending', 'অপেক্ষমাণ'],
                      ['verified', 'যাচাইকৃত'],
                      ['rejected', 'বাতিল'],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setStatusFilter(key)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        statusFilter === key
                          ? 'border-primary bg-primary/15 text-primary-glow'
                          : 'border-border bg-background text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {dataError && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                  {dataError}
                </p>
              )}

              {loadingData ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  তথ্য লোড হচ্ছে...
                </p>
              ) : tab === 'donations' ? (
                filteredDonations.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-background p-10 text-center text-sm text-muted-foreground">
                    এখনো কোনো অনুদানের তথ্য পাওয়া যায়নি। ওয়েবসাইটের অনুদান ফর্মে কেউ তথ্য জমা
                    দিলেই সাথে সাথে এখানে তার নাম, মোবাইল নম্বর এবং TrxID দেখাবে।
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredDonations.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-border bg-background p-4 sm:p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-display text-base font-bold text-foreground">
                                {item.donorName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                · {item.receiptNo}
                              </span>
                              <span
                                className={`text-xs font-semibold ${
                                  item.status === 'verified'
                                    ? 'text-emerald-400'
                                    : item.status === 'rejected'
                                    ? 'text-red-400'
                                    : 'text-primary-glow'
                                }`}
                              >
                                ·{' '}
                                {item.status === 'verified'
                                  ? 'যাচাইকৃত'
                                  : item.status === 'rejected'
                                  ? 'বাতিল'
                                  : 'অপেক্ষমাণ'}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <a
                                href={`tel:+88${item.phone}`}
                                className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-primary tabular-nums"
                              >
                                <Phone className="size-3.5 text-primary" />
                                {item.phone}
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCopy(item.phone)}
                                className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-[11px] text-foreground hover:bg-accent"
                              >
                                {copiedText === item.phone ? (
                                  <>
                                    <Check className="size-3 text-primary" />
                                    কপি হয়েছে
                                  </>
                                ) : (
                                  <>
                                    <Copy className="size-3" />
                                    নাম্বার কপি
                                  </>
                                )}
                              </button>
                              <span>· {item.campaignTitle}</span>
                              <span>· {item.createdAtLabel}</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="text-muted-foreground">
                                মাধ্যম: <strong className="text-foreground">{getMethodLabel(item.method)}</strong>
                              </span>
                              <span className="text-muted-foreground">· TrxID:</span>
                              <span className="font-mono font-semibold text-primary-glow">
                                {item.trxId}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(item.trxId)}
                                className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-[11px] text-foreground hover:bg-accent"
                              >
                                {copiedText === item.trxId ? 'কপি হয়েছে' : 'TrxID কপি'}
                              </button>
                            </div>

                            {item.note && (
                              <p className="text-xs text-muted-foreground">
                                মন্তব্য: {item.note}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <span className="font-display text-xl font-bold text-primary-glow tabular-nums">
                              {formatBDT(item.amount)}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {item.status !== 'verified' && (
                                <button
                                  type="button"
                                  disabled={busyId === item.id}
                                  onClick={() => handleStatusChange(item.id, 'verified')}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/25 disabled:opacity-50"
                                >
                                  <CheckCircle2 className="size-3.5" />
                                  যাচাই সম্পন্ন
                                </button>
                              )}
                              {item.status !== 'rejected' && (
                                <button
                                  type="button"
                                  disabled={busyId === item.id}
                                  onClick={() => handleStatusChange(item.id, 'rejected')}
                                  className="inline-flex items-center gap-1 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/25 disabled:opacity-50"
                                >
                                  <XCircle className="size-3.5" />
                                  বাতিল
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : filteredVolunteers.length === 0 ? (
                <div className="rounded-2xl border border-border bg-background p-10 text-center text-sm text-muted-foreground">
                  এখনো কোনো স্বেচ্ছাসেবীর আবেদন জমা পড়েনি।
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredVolunteers.map((vol) => (
                    <div
                      key={vol.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-background p-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-base font-bold">{vol.name}</span>
                          <span className="text-xs text-muted-foreground">· {vol.district}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <a
                            href={`tel:+88${vol.phone}`}
                            className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-primary tabular-nums"
                          >
                            <Phone className="size-3.5 text-primary" />
                            {vol.phone}
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(vol.phone)}
                            className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-foreground hover:bg-accent"
                          >
                            {copiedText === vol.phone ? 'কপি হয়েছে' : 'নাম্বার কপি'}
                          </button>
                          <span>· {vol.focusArea}</span>
                          <span>· {vol.createdAtLabel}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {vol.status !== 'contacted' && (
                          <button
                            type="button"
                            disabled={busyId === vol.id}
                            onClick={() => handleVolunteerStatus(vol.id, 'contacted')}
                            className="rounded-lg border border-input bg-card px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary"
                          >
                            যোগাযোগ সম্পন্ন
                          </button>
                        )}
                        {vol.status !== 'approved' && (
                          <button
                            type="button"
                            disabled={busyId === vol.id}
                            onClick={() => handleVolunteerStatus(vol.id, 'approved')}
                            className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25"
                          >
                            অনুমোদন করুন
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
