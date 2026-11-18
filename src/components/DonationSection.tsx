import { useState, FormEvent } from 'react';
import { Check, CheckCircle2, Copy, Facebook, Phone, Printer, Send } from 'lucide-react';
import {
  Campaign,
  CampaignCategory,
  DonationRecord,
  FOUNDATION_FACEBOOK_URL,
  FOUNDATION_PHONE_BN,
  FOUNDATION_PHONE_RAW,
  PAYMENT_METHODS,
  PaymentMethod,
  formatBDT,
  getMethodLabel,
  normalizeDigits,
  toBengaliDigits,
} from '../data/foundation';

interface DonationSectionProps {
  campaigns: Campaign[];
  selectedCampaign: CampaignCategory;
  onChangeCampaign: (campaign: CampaignCategory) => void;
  onSubmitDonation: (
    donation: Omit<DonationRecord, 'id' | 'receiptNo' | 'createdAt'>
  ) => Promise<DonationRecord>;
}

const PRESET_AMOUNTS = [100, 500, 1000, 2000];

export function DonationSection({
  campaigns,
  selectedCampaign,
  onChangeCampaign,
  onSubmitDonation,
}: DonationSectionProps) {
  const [amount, setAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustomAmount, setIsCustomAmount] = useState<boolean>(false);
  const [method, setMethod] = useState<PaymentMethod>('bkash');
  const [copiedId, setCopiedId] = useState<PaymentMethod | null>(null);

  const [donorName, setDonorName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [phone, setPhone] = useState('');
  const [trxId, setTrxId] = useState('');
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<DonationRecord | null>(null);

  const activeAmount = isCustomAmount ? Number(normalizeDigits(customAmount)) || 0 : amount;

  const handleCopyNumber = async (methodId: PaymentMethod, rawNumber: string) => {
    try {
      await navigator.clipboard.writeText(rawNumber);
      setCopiedId(methodId);
      setTimeout(() => setCopiedId((prev) => (prev === methodId ? null : prev)), 2000);
    } catch {
      setCopiedId(methodId);
      setTimeout(() => setCopiedId((prev) => (prev === methodId ? null : prev)), 2000);
    }
  };

  const selectedCampaignTitle =
    selectedCampaign === 'general'
      ? 'সাধারণ মানবিক তহবিল'
      : campaigns.find((c) => c.id === selectedCampaign)?.title ?? 'সাধারণ মানবিক তহবিল';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!activeAmount || activeAmount < 10 || activeAmount > 10000000) {
      setErrorMsg('অনুগ্রহ করে ৳ ১০ থেকে ১,০০,০০,০০০ এর মধ্যে সঠিক অনুদানের পরিমাণ লিখুন।');
      return;
    }

    const cleanName = isAnonymous ? 'নাম প্রকাশে অনিচ্ছুক' : donorName.trim();
    if (!isAnonymous && (cleanName.length < 2 || cleanName.length > 80)) {
      setErrorMsg('অনুগ্রহ করে আপনার নাম লিখুন (২ থেকে ৮০ অক্ষরের মধ্যে)।');
      return;
    }

    const normalizedPhone = normalizeDigits(phone).replace(/\D/g, '');
    if (!/^01[0-9]{9}$/.test(normalizedPhone)) {
      setErrorMsg('অনুগ্রহ করে ঠিক ১১ ডিজিটের সঠিক বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।');
      return;
    }

    const cleanTrx = trxId.trim().toUpperCase();
    if (cleanTrx.length < 4 || cleanTrx.length > 40) {
      setErrorMsg('অনুগ্রহ করে বিকাশ/নগদ/রকেটের সঠিক লেনদেন নম্বর (TrxID) দিন।');
      return;
    }

    setSubmitting(true);
    try {
      const created = await onSubmitDonation({
        donorName: cleanName,
        phone: normalizedPhone,
        campaignId: selectedCampaign,
        campaignTitle: selectedCampaignTitle,
        amount: activeAmount,
        method,
        trxId: cleanTrx,
        note: note.trim().slice(0, 300) || undefined,
      });

      setReceipt(created);
      setDonorName('');
      setPhone('');
      setTrxId('');
      setNote('');
    } catch {
      setErrorMsg('অনুদানের তথ্য সংরক্ষণ করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadReceipt = () => {
    if (!receipt) return;
    const text = [
      '========================================',
      '           সেবা ফাউন্ডেশন — অনুদান রসিদ',
      '========================================',
      `রসিদ নম্বর: ${receipt.receiptNo}`,
      `তারিখ ও সময়: ${receipt.createdAt}`,
      `দাতার নাম: ${receipt.donorName}`,
      `মোবাইল: ${receipt.phone}`,
      `ক্যাম্পেইন: ${receipt.campaignTitle}`,
      `পরিমাণ: ${formatBDT(receipt.amount)}`,
      `মাধ্যম: ${getMethodLabel(receipt.method)} (${FOUNDATION_PHONE_BN})`,
      `লেনদেন নম্বর (TrxID): ${receipt.trxId}`,
      receipt.note ? `বার্তা: ${receipt.note}` : '',
      '----------------------------------------',
      'আপনার মানবিক সহায়তার জন্য আন্তরিক ধন্যবাদ।',
      'যোগাযোগ: 01331496395 · ঢাকা, বাংলাদেশ',
      '========================================',
    ]
      .filter(Boolean)
      .join('\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `seba-foundation-receipt-${receipt.receiptNo}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="how" className="scroll-mt-20 border-y border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-5">
          <span className="text-sm font-semibold text-primary">কীভাবে দান করবেন</span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            মাত্র ৩টি ধাপে আপনার অনুদান পৌঁছে যাবে
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            বিকাশ, নগদ বা রকেটের মাধ্যমে সরাসরি আমাদের পার্সোনাল নম্বরে অনুদান পাঠিয়ে পাশের ফর্মে
            লেনদেন নম্বরটি (TrxID) জমা দিন — তাৎক্ষণিকভাবে আপনার রসিদ তৈরি হবে।
          </p>

          <ol className="mt-8 space-y-6">
            <li className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-primary font-display text-base font-bold text-primary-foreground shadow-glow">
                ১
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold">মোবাইল ব্যাংকিং নির্বাচন</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  পাশের তালিকা থেকে বিকাশ, নগদ বা রকেট নম্বর কপি করে আপনার পছন্দের পরিমাণ পাঠান।
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-primary font-display text-base font-bold text-primary-foreground shadow-glow">
                ২
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold">তথ্য ও TrxID জানান</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  পাশের ফর্মে আপনার নাম, মোবাইল নম্বর এবং লেনদেন নম্বর (TrxID) জমা দিন অথবা ফোনে জানান।
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-primary font-display text-base font-bold text-primary-foreground shadow-glow">
                ৩
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold">প্রাপ্তি নিশ্চিত ও রসিদ সংগ্রহ</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  আমরা অনুদানটি স্বচ্ছ হিসাব রেজিস্টারে যুক্ত করি এবং তাৎক্ষণিক ডিজিটাল রসিদ প্রদান করি।
                </p>
              </div>
            </li>
          </ol>

          <div className="mt-8 rounded-2xl border border-border bg-background/60 p-5">
            <p className="text-xs font-semibold text-primary-glow">আর্থিক সাহায্য না করতে পারলেও পাশে থাকুন</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              আপনি এই মুহূর্তে আর্থিক সাহায্য করতে না পারলে অন্তত আমাদের ফেসবুক পেজটি ফলো করে রাখুন — আপনার একটি ফলো ও শেয়ার অন্য কারো সহায়তার পথ খুলে দিতে পারে।
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a
                href={FOUNDATION_FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary/20"
              >
                <Facebook className="size-4 text-primary" />
                ফেসবুক পেজ ফলো করুন
              </a>
              <a
                href={`tel:+88${FOUNDATION_PHONE_RAW}`}
                className="inline-flex items-center gap-2 rounded-xl border border-input bg-card px-4 py-2.5 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
              >
                <Phone className="size-4 text-primary" />
                {FOUNDATION_PHONE_BN}
              </a>
            </div>
          </div>
        </div>

        <div
          id="donate"
          className="scroll-mt-24 rounded-3xl border border-border bg-background p-6 shadow-card sm:p-8 lg:col-span-7"
        >
          {receipt ? (
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <CheckCircle2 className="size-6" />
                </span>
                <div>
                  <h3 className="font-display text-2xl font-bold">
                    আপনার অনুদানের তথ্য গৃহীত হয়েছে
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    আল্লাহ আপনার দান কবুল করুন। নিচে আপনার ডিজিটাল অনুদান রসিদ ও হিসাব নম্বর সংরক্ষণ করুন।
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 space-y-3 text-sm">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">রসিদ নম্বর</span>
                  <span className="font-mono font-bold text-primary-glow tabular-nums">
                    {receipt.receiptNo}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">দাতার নাম</span>
                  <span className="font-semibold">{receipt.donorName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">ক্যাম্পেইন</span>
                  <span className="font-semibold">{receipt.campaignTitle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">অনুদানের পরিমাণ</span>
                  <span className="font-display text-lg font-bold text-primary-glow tabular-nums">
                    {formatBDT(receipt.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">পেমেন্ট মাধ্যম</span>
                  <span>{getMethodLabel(receipt.method)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">লেনদেন নম্বর (TrxID)</span>
                  <span className="font-mono font-semibold">{receipt.trxId}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-input bg-card px-5 py-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
                >
                  <Printer className="size-4" />
                  রসিদ ডাউনলোড করুন
                </button>
                <button
                  type="button"
                  onClick={() => setReceipt(null)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 font-display text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]"
                >
                  আরেকটি অনুদান পাঠান
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h3 className="font-display text-2xl font-bold">অনুদান পাঠান ও নিশ্চিত করুন</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    যেকোনো পরিমাণই আমাদের কাছে মূল্যবান।
                  </p>
                </div>
                <span className="text-xs font-semibold text-primary-glow tabular-nums">
                  নির্বাচিত: {activeAmount > 0 ? formatBDT(activeAmount) : '৳ ০'}
                </span>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="campaign-select"
                  className="block text-xs font-semibold text-muted-foreground"
                >
                  ক্যাম্পেইন নির্বাচন করুন
                </label>
                <select
                  id="campaign-select"
                  value={selectedCampaign}
                  onChange={(e) => onChangeCampaign(e.target.value as CampaignCategory)}
                  className="mt-2 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm font-medium text-foreground focus:border-primary focus:outline-none"
                >
                  {campaigns.map((camp) => (
                    <option key={camp.id} value={camp.id}>
                      {camp.title} ({camp.location})
                    </option>
                  ))}
                  <option value="general">সাধারণ মানবিক তহবিল (যেখানে জরুরি প্রয়োজন)</option>
                </select>
              </div>

              <div className="mt-5">
                <span className="block text-xs font-semibold text-muted-foreground">
                  অনুদানের পরিমাণ নির্বাচন করুন
                </span>
                <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {PRESET_AMOUNTS.map((preset) => {
                    const active = !isCustomAmount && amount === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setIsCustomAmount(false);
                          setAmount(preset);
                        }}
                        className={`rounded-xl border py-3 font-display text-base font-bold transition-all tabular-nums ${
                          active
                            ? 'border-primary bg-primary/15 text-primary-glow shadow-glow'
                            : 'border-input bg-card text-foreground hover:border-primary/50'
                        }`}
                      >
                        {formatBDT(preset)}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCustomAmount(true)}
                    className={`shrink-0 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                      isCustomAmount
                        ? 'border-primary bg-primary/15 text-primary-glow'
                        : 'border-input bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    অন্য পরিমাণ
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    aria-label="নিজস্ব অনুদানের পরিমাণ"
                    placeholder="যেমন: 300 বা ৩০০"
                    value={customAmount}
                    onFocus={() => setIsCustomAmount(true)}
                    onChange={(e) => {
                      setIsCustomAmount(true);
                      setCustomAmount(e.target.value);
                    }}
                    className="w-full rounded-xl border border-input bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none tabular-nums"
                  />
                </div>
              </div>

              <div className="mt-5">
                <span className="block text-xs font-semibold text-muted-foreground">
                  মোবাইল ব্যাংকিং নম্বর (ট্যাপ করে কপি করুন)
                </span>
                <div className="mt-2 grid gap-2.5 sm:grid-cols-3">
                  {PAYMENT_METHODS.map((pm) => {
                    const isSelected = method === pm.id;
                    const isCopied = copiedId === pm.id;
                    return (
                      <div
                        key={pm.id}
                        onClick={() => setMethod(pm.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setMethod(pm.id);
                          }
                        }}
                        className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-input bg-card hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-muted-foreground">
                            {pm.name} · {pm.accountType}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMethod(pm.id);
                              handleCopyNumber(pm.id, pm.numberRaw);
                            }}
                            aria-label={`${pm.name} নম্বর কপি করুন`}
                            className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-accent"
                          >
                            {isCopied ? (
                              <>
                                <Check className="size-3 text-primary" />
                                কপি হয়েছে
                              </>
                            ) : (
                              <>
                                <Copy className="size-3" />
                                কপি
                              </>
                            )}
                          </button>
                        </div>
                        <div className="mt-1.5 font-display text-base font-bold tracking-wider tabular-nums">
                          {pm.numberBn}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 space-y-4 border-t border-border pt-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">লেনদেন নিশ্চিতকরণ তথ্য</span>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="size-4 accent-primary"
                    />
                    নাম গোপন রাখুন
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="donor-name" className="block text-xs text-muted-foreground">
                      আপনার নাম
                    </label>
                    <input
                      id="donor-name"
                      type="text"
                      disabled={isAnonymous}
                      value={isAnonymous ? 'নাম প্রকাশে অনিচ্ছুক' : donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder="যেমন: মো. রাফিউজ্জামান"
                      className="mt-1.5 w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label htmlFor="donor-phone" className="block text-xs text-muted-foreground">
                      মোবাইল নম্বর (যে নম্বর থেকে পাঠিয়েছেন)
                    </label>
                    <input
                      id="donor-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="mt-1.5 w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none tabular-nums"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="donor-trx" className="block text-xs text-muted-foreground">
                      লেনদেন নম্বর (TrxID)
                    </label>
                    <input
                      id="donor-trx"
                      type="text"
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      placeholder="যেমন: BKS8H2K9L1"
                      className="mt-1.5 w-full rounded-xl border border-input bg-card px-3.5 py-2.5 font-mono text-sm uppercase text-foreground placeholder:font-sans placeholder:normal-case placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="donor-note" className="block text-xs text-muted-foreground">
                      মন্তব্য / দোয়া (ঐচ্ছিক)
                    </label>
                    <input
                      id="donor-note"
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="যেমন: অসহায় মানুষদের জন্য"
                      className="mt-1.5 w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <p
                    role="alert"
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-medium text-red-300"
                  >
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3.5 font-display text-base font-bold text-primary-foreground shadow-glow transition-transform hover:scale-[1.01] disabled:opacity-60"
                >
                  <Send className="size-4" />
                  {submitting
                    ? 'তথ্য সংরক্ষণ হচ্ছে...'
                    : `অনুদান নিশ্চিত করুন (${toBengaliDigits(activeAmount > 0 ? formatBDT(activeAmount) : '৳ ০')})`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
