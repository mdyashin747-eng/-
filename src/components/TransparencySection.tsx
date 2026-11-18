import { useState } from 'react';
import { HeartHandshake, Lock, ShieldCheck, Users } from 'lucide-react';
import {
  CampaignCategory,
  DonationRecord,
  MONTHLY_AUDIT_LEDGER,
  formatBDT,
  getMethodLabel,
  maskPhone,
  toBengaliDigits,
} from '../data/foundation';

interface TransparencySectionProps {
  donations: DonationRecord[];
  onOpenAdmin: () => void;
}

export function TransparencySection({ donations, onOpenAdmin }: TransparencySectionProps) {
  const [filter, setFilter] = useState<'all' | CampaignCategory>('all');

  const filteredDonations =
    filter === 'all' ? donations : donations.filter((d) => d.campaignId === filter);

  const totalDisbursed = MONTHLY_AUDIT_LEDGER.reduce((sum, item) => sum + item.allocated, 0);

  return (
    <section id="trust" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-semibold text-primary">স্বচ্ছতা ও আস্থা</span>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          আপনার প্রতিটি টাকার হিসাব আমরা রাখি
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          দাতাদের আস্থা আমাদের সবচেয়ে বড় শক্তি। প্রতি মাসের আয়-ব্যয়ের হিসাব এবং সাম্প্রতিক
          অনুদানের তালিকা সবার জন্য উন্মুক্ত।
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/15">
            <ShieldCheck className="size-6 text-primary" />
          </span>
          <h3 className="mt-4 font-display text-lg font-semibold">প্রকাশ্য হিসাব</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            প্রতি মাসে আয়-ব্যয়ের পূর্ণাঙ্গ হিসাব আমাদের ওয়েবসাইট ও ফেসবুক পেজে প্রকাশ করা হয়।
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/15">
            <Users className="size-6 text-primary" />
          </span>
          <h3 className="mt-4 font-display text-lg font-semibold">স্বেচ্ছাসেবী টিম</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            আমাদের সবাই অবৈতনিক স্বেচ্ছাসেবী — অনুদানের ১০০% সরাসরি খরচ হয় মানুষের কল্যাণে।
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/15">
            <HeartHandshake className="size-6 text-primary" />
          </span>
          <h3 className="mt-4 font-display text-lg font-semibold">সরেজমিনে বিতরণ</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            প্রতিটি বিতরণ কার্যক্রমের ছবি, ভিডিও ও উপকারভোগীদের তথ্য আমরা দাতাদের সঙ্গে শেয়ার করি।
          </p>
        </div>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-12">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card lg:col-span-5">
          <div className="flex items-baseline justify-between gap-2 border-b border-border pb-4">
            <div>
              <h3 className="font-display text-lg font-bold">মাসিক ব্যয় ও বণ্টন খতিয়ান</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">সর্বশেষ নিরীক্ষিত মাসিক হিসাব</p>
            </div>
            <span className="font-display text-base font-bold text-primary-glow tabular-nums">
              {formatBDT(totalDisbursed)}
            </span>
          </div>

          <div className="mt-5 space-y-5">
            {MONTHLY_AUDIT_LEDGER.map((row) => (
              <div key={row.sector}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium text-foreground">{row.sector}</span>
                  <span className="shrink-0 font-semibold text-primary-glow tabular-nums">
                    {formatBDT(row.allocated)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                  <span>{row.beneficiaries}</span>
                  <span>{toBengaliDigits(row.sharePercent)}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-gradient-primary"
                    style={{ width: `${row.sharePercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <h3 className="font-display text-lg font-bold">সাম্প্রতিক অনুদান রেজিস্টার</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                নিরাপত্তার স্বার্থে এখানে ফোন নম্বর গোপন থাকে — অ্যাডমিন প্যানেল থেকে পূর্ণ নম্বর দেখা যাবে
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary-glow transition-colors hover:bg-primary/20 whitespace-nowrap"
              >
                <Lock className="size-3.5" />
                দাতার নাম ও নাম্বার দেখুন (অ্যাডমিন)
              </button>
              <div className="flex flex-wrap gap-1 rounded-lg bg-secondary p-1">
              {(
                [
                  ['all', 'সব'],
                  ['mosque', 'মসজিদ'],
                  ['food', 'খাদ্য'],
                  ['education', 'শিক্ষা'],
                  ['medical', 'চিকিৎসা'],
                  ['winter', 'শীতবস্ত্র'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                    filter === key
                      ? 'bg-background text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
              </div>
            </div>
          </div>

          <div className="mt-4 divide-y divide-border">
            {filteredDonations.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                এই খাতে এখনো সাম্প্রতিক কোনো অনুদান যোগ হয়নি।
              </p>
            ) : (
              filteredDonations.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3.5 text-sm"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{item.donorName}</span>
                      {item.isNew && (
                        <span className="text-xs font-semibold text-primary">· নতুন</span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{item.campaignTitle}</span>
                      <span aria-hidden="true">·</span>
                      <span>{getMethodLabel(item.method)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {item.trxId.includes('***')
                          ? item.trxId
                          : `${item.trxId.slice(0, 3)}***${item.trxId.slice(-3)}`}
                      </span>
                      {item.phone && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{maskPhone(item.phone)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-base font-bold text-primary-glow tabular-nums">
                      {formatBDT(item.amount)}
                    </div>
                    <div className="text-xs text-muted-foreground">{item.createdAt}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
