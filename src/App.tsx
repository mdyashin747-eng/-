import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Facebook,
  HandCoins,
  HeartHandshake,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import {
  Campaign,
  CampaignCategory,
  DonationRecord,
  FOUNDATION_FACEBOOK_URL,
  FOUNDATION_PHONE_BN,
  FOUNDATION_PHONE_RAW,
  HERO_IMAGE,
  INITIAL_CAMPAIGNS,
  INITIAL_DONATIONS,
  VolunteerRecord,
  formatBDT,
  toBengaliDigits,
} from './data/foundation';
import { CampaignModal } from './components/CampaignModal';
import { DonationSection } from './components/DonationSection';
import { TransparencySection } from './components/TransparencySection';
import { VolunteerSection } from './components/VolunteerSection';
import { GojolPlayerSection } from './components/GojolPlayerSection';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { FacebookCoverModal } from './components/FacebookCoverModal';
import {
  submitDonationToFirestore,
  submitVolunteerToFirestore,
  subscribePublicDonations,
} from './services/firestoreService';

const STORAGE_VOLUNTEERS_KEY = 'seba_foundation_volunteers_v1';

function CampaignCard({
  campaign,
  onOpenDetail,
  onSelectDonate,
}: {
  campaign: Campaign;
  onOpenDetail: (campaign: Campaign) => void;
  onSelectDonate: (id: Campaign['id']) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const percent = Math.min(100, Math.round((campaign.raisedAmount / campaign.goalAmount) * 100));

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-transform duration-200 hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {!imgError ? (
          <img
            src={campaign.image}
            alt={campaign.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-secondary to-background p-4 text-center">
            <HeartHandshake className="size-8 text-primary" />
            <span className="font-display text-sm font-semibold">{campaign.title}</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-primary-glow">{campaign.categoryLabel}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{campaign.location}</span>
        </div>

        <h3 className="mt-1.5 font-display text-lg font-bold text-foreground">
          {campaign.title}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {campaign.description}
        </p>

        <div className="mt-4 flex-1" />

        <div className="pt-2">
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gradient-primary transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-xs tabular-nums">
            <span className="font-semibold text-primary-glow">
              সংগৃহীত {formatBDT(campaign.raisedAmount)}
            </span>
            <span className="text-muted-foreground">
              লক্ষ্য {formatBDT(campaign.goalAmount)}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onOpenDetail(campaign)}
            className="rounded-xl border border-input bg-background/60 py-2.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/50 hover:bg-accent"
          >
            বিস্তারিত
          </button>
          <button
            type="button"
            onClick={() => onSelectDonate(campaign.id)}
            className="inline-flex items-center justify-center gap-1 rounded-xl bg-secondary py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            দান করুন
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

function FeaturedMosqueCard({
  campaign,
  onOpenDetail,
  onSelectDonate,
}: {
  campaign: Campaign;
  onOpenDetail: (campaign: Campaign) => void;
  onSelectDonate: (id: Campaign['id']) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const percent = Math.min(100, Math.round((campaign.raisedAmount / campaign.goalAmount) * 100));

  return (
    <article className="mb-8 overflow-hidden rounded-3xl border border-primary/30 bg-card shadow-card">
      <div className="grid items-stretch lg:grid-cols-12">
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary lg:col-span-5 lg:aspect-auto">
          {!imgError ? (
            <img
              src={campaign.image}
              alt={campaign.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="size-full object-cover lg:h-full"
            />
          ) : (
            <div className="flex size-full min-h-[240px] flex-col items-center justify-center gap-2 bg-gradient-to-br from-secondary to-background p-6 text-center">
              <HeartHandshake className="size-10 text-primary" />
              <span className="font-display text-base font-semibold">{campaign.title}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-7">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-primary-glow">{campaign.categoryLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{campaign.location}</span>
              <span aria-hidden="true">·</span>
              <span>হাজার হাজার মুসল্লির নামাজের ঘর</span>
            </div>

            <h3 className="mt-2 font-display text-2xl font-bold text-foreground sm:text-3xl">
              {campaign.title}
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {campaign.description}
            </p>

            <p className="mt-3 text-xs font-medium text-primary-glow sm:text-sm">
              {formatBDT(campaign.unitAmount)} = {campaign.unitImpact}
            </p>
          </div>

          <div className="mt-6">
            <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-gradient-primary transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className="mt-2.5 flex items-center justify-between text-xs sm:text-sm tabular-nums">
              <span className="font-semibold text-primary-glow">
                সংগৃহীত {formatBDT(campaign.raisedAmount)}
              </span>
              <span className="text-muted-foreground">
                লক্ষ্য {formatBDT(campaign.goalAmount)} ({toBengaliDigits(percent)}%)
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onSelectDonate(campaign.id)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-6 py-3 font-display text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]"
              >
                মসজিদে দান করুন
                <ArrowRight className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => onOpenDetail(campaign)}
                className="rounded-xl border border-input bg-background/60 px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/50 hover:bg-accent"
              >
                বিস্তারিত দেখুন
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroImgError, setHeroImgError] = useState(false);
  const [campaignFilter, setCampaignFilter] = useState<'all' | Campaign['id']>('all');
  const [activeModalCampaign, setActiveModalCampaign] = useState<Campaign | null>(null);
  const [selectedDonateCampaign, setSelectedDonateCampaign] =
    useState<CampaignCategory>('food');

  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [fbCoverModalOpen, setFbCoverModalOpen] = useState(false);
  const [livePublicDonations, setLivePublicDonations] = useState<DonationRecord[]>([]);

  const [volunteers, setVolunteers] = useState<VolunteerRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_VOLUNTEERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as VolunteerRecord[];
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });

  useEffect(() => {
    const unsub = subscribePublicDonations(
      (items) => {
        setLivePublicDonations(items);
      },
      () => {
        // Error already logged via handleFirestoreError
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_VOLUNTEERS_KEY, JSON.stringify(volunteers));
    } catch {
      // ignore storage errors
    }
  }, [volunteers]);

  const donations: DonationRecord[] = [...livePublicDonations, ...INITIAL_DONATIONS];

  // Compute live campaign totals from initial baseline + live Firestore donations
  const campaigns: Campaign[] = INITIAL_CAMPAIGNS.map((camp) => {
    const added = livePublicDonations
      .filter((d) => d.campaignId === camp.id)
      .reduce((sum, d) => sum + d.amount, 0);
    return {
      ...camp,
      raisedAmount: camp.raisedAmount + added,
    };
  });

  const mosqueCampaign = campaigns.find((c) => c.id === 'mosque');
  const standardCampaigns = campaigns.filter((c) => c.id !== 'mosque');
  const visibleStandardCampaigns =
    campaignFilter === 'all'
      ? standardCampaigns
      : standardCampaigns.filter((c) => c.id === campaignFilter);

  const newlyAddedTotal = livePublicDonations.reduce((sum, d) => sum + d.amount, 0);
  const totalDistributedDisplay =
    newlyAddedTotal > 0 ? formatBDT(800000 + newlyAddedTotal) : '৳ ৮ লাখ+';
  const volunteerCount = 120 + volunteers.length;

  const handleSelectDonateCampaign = (id: Campaign['id']) => {
    setSelectedDonateCampaign(id);
    const el = document.getElementById('donate');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubmitDonation = async (
    payload: Omit<DonationRecord, 'id' | 'receiptNo' | 'createdAt'>
  ): Promise<DonationRecord> => {
    return submitDonationToFirestore(payload);
  };

  const handleRegisterVolunteer = async (
    payload: Omit<VolunteerRecord, 'id' | 'joinedAt'>
  ): Promise<VolunteerRecord> => {
    const record = await submitVolunteerToFirestore(payload);
    setVolunteers((prev) => [record, ...prev]);
    return record;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Bar Contract: Zone 1 (Wordmark) — Zone 2 (4 single-line links) — Zone 3 (1 primary action) */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4">
          <a
            href="#"
            className="flex shrink-0 items-center gap-2.5 whitespace-nowrap"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-primary">
              <HeartHandshake className="size-4 text-primary-foreground" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              সেবা <span className="text-gradient-primary">ফাউন্ডেশন</span>
            </span>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a
              href="#campaigns"
              className="whitespace-nowrap shrink-0 transition-colors hover:text-foreground hover:underline hover:underline-offset-8"
            >
              ক্যাম্পেইন
            </a>
            <a
              href="#how"
              className="whitespace-nowrap shrink-0 transition-colors hover:text-foreground hover:underline hover:underline-offset-8"
            >
              কীভাবে দান করবেন
            </a>
            <a
              href="#trust"
              className="whitespace-nowrap shrink-0 transition-colors hover:text-foreground hover:underline hover:underline-offset-8"
            >
              স্বচ্ছতা
            </a>
            <a
              href="#volunteer"
              className="whitespace-nowrap shrink-0 transition-colors hover:text-foreground hover:underline hover:underline-offset-8"
            >
              স্বেচ্ছাসেবী
            </a>
            <a
              href="#gojol"
              className="whitespace-nowrap shrink-0 transition-colors hover:text-foreground hover:underline hover:underline-offset-8"
            >
              গজল
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            <a
              href="#donate"
              className="hidden whitespace-nowrap shrink-0 rounded-full bg-gradient-primary px-5 py-2 font-display text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:scale-105 md:inline-flex"
            >
              দান করুন
            </a>
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-lg text-foreground md:hidden"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}
            >
              {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="flex flex-col gap-1 border-t border-border bg-background px-4 py-3 md:hidden">
            {[
              ['ক্যাম্পেইন', '#campaigns'],
              ['কীভাবে দান করবেন', '#how'],
              ['স্বচ্ছতা', '#trust'],
              ['স্বেচ্ছাসেবী', '#volunteer'],
              ['গজল', '#gojol'],
              ['এখনই দান করুন', '#donate'],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </nav>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative flex min-h-[86vh] items-center overflow-hidden pt-16">
        {!heroImgError ? (
          <img
            src={HERO_IMAGE}
            alt="স্বেচ্ছাসেবীরা অসহায় মানুষের মাঝে খাদ্য সামগ্রী বিতরণ করছেন"
            referrerPolicy="no-referrer"
            onError={() => setHeroImgError(true)}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-card via-background to-secondary" />
        )}
        <div className="absolute inset-0 bg-hero-fade" />

        <div className="relative mx-auto w-full max-w-6xl px-4 py-20 lg:py-28">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-primary-glow">
              মানবতার ডাকে সাড়া দিন · ঢাকা ও সারা বাংলাদেশ
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              আপনার ছোট্ট অনুদান
              <br />
              <span className="text-gradient-primary">বদলে দিতে পারে একটা জীবন</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              দেশের বিভিন্ন প্রান্তে হাজারো অসহায় মানুষ দুবেলা খাবার, চিকিৎসা আর শিক্ষার অভাবে
              দিন কাটাচ্ছে। আমরা তাদের পাশে দাঁড়াতে চাই — আপনার সহযোগিতায়।
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#donate"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-7 py-3.5 font-display text-base font-bold text-primary-foreground shadow-glow transition-transform hover:scale-105 whitespace-nowrap"
              >
                এখনই দান করুন
                <ArrowRight className="size-5" />
              </a>
              <a
                href="#campaigns"
                className="inline-flex items-center gap-2 rounded-full border border-input bg-background/70 px-7 py-3.5 font-display text-base font-semibold backdrop-blur transition-colors hover:bg-accent whitespace-nowrap"
              >
                ক্যাম্পেইন দেখুন
              </a>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              আর্থিক সাহায্য না করতে পারলে অন্তত{' '}
              <a
                href={FOUNDATION_FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-primary-glow underline underline-offset-4 transition-colors hover:text-foreground"
              >
                <Facebook className="size-3.5" />
                আমাদের ফেসবুক পেজটি ফলো করে রাখুন
              </a>
              ।
            </p>
          </div>
        </div>
      </section>

      {/* Impact Stats Strip */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-12 lg:grid-cols-4">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <Users className="size-6 text-primary" />
            <span className="font-display text-3xl font-bold tabular-nums">২,৫০০+</span>
            <span className="text-sm text-muted-foreground">পরিবার সহায়তা পেয়েছে</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <HandCoins className="size-6 text-primary" />
            <span className="font-display text-3xl font-bold tabular-nums">
              {totalDistributedDisplay}
            </span>
            <span className="text-sm text-muted-foreground">মোট তহবিল বিতরণ</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <HeartHandshake className="size-6 text-primary" />
            <span className="font-display text-3xl font-bold tabular-nums">
              {toBengaliDigits(volunteerCount)}+
            </span>
            <span className="text-sm text-muted-foreground">সক্রিয় স্বেচ্ছাসেবী</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <ShieldCheck className="size-6 text-primary" />
            <span className="font-display text-3xl font-bold tabular-nums">১০০%</span>
            <span className="text-sm text-muted-foreground">স্বচ্ছ হিসাব ও প্রতিবেদন</span>
          </div>
        </div>
      </section>

      {/* Campaigns Grid */}
      <section id="campaigns" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <span className="text-sm font-semibold text-primary">চলমান ক্যাম্পেইন</span>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              কোথায় কাজ করছে আপনার অনুদান
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              প্রতিটি ক্যাম্পেইনের অগ্রগতি আমরা নিয়মিত হালনাগাদ করি, যাতে আপনি জানতে পারেন আপনার
              টাকা কোথায় যাচ্ছে।
            </p>
          </div>

          <div
            role="tablist"
            aria-label="ক্যাম্পেইন ক্যাটাগরি"
            className="flex flex-wrap gap-1 rounded-xl bg-card p-1 border border-border self-start"
          >
            {(
              [
                ['all', 'সবগুলো'],
                ['mosque', 'মসজিদ নির্মাণ'],
                ['food', 'খাদ্য'],
                ['education', 'শিক্ষা'],
                ['medical', 'চিকিৎসা'],
                ['winter', 'শীতবস্ত্র'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={campaignFilter === key}
                onClick={() => setCampaignFilter(key)}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                  campaignFilter === key
                    ? 'bg-gradient-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10">
          {mosqueCampaign && (campaignFilter === 'all' || campaignFilter === 'mosque') && (
            <FeaturedMosqueCard
              campaign={mosqueCampaign}
              onOpenDetail={setActiveModalCampaign}
              onSelectDonate={handleSelectDonateCampaign}
            />
          )}

          {visibleStandardCampaigns.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {visibleStandardCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onOpenDetail={setActiveModalCampaign}
                  onSelectDonate={handleSelectDonateCampaign}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Gojol & Audio Player */}
      <GojolPlayerSection />

      {/* How to Donate + Interactive TrxID Confirmation Form */}
      <DonationSection
        campaigns={campaigns}
        selectedCampaign={selectedDonateCampaign}
        onChangeCampaign={setSelectedDonateCampaign}
        onSubmitDonation={handleSubmitDonation}
      />

      {/* Transparency, Audit Ledger & Recent Donations */}
      <TransparencySection
        donations={donations}
        onOpenAdmin={() => setAdminModalOpen(true)}
      />

      {/* Volunteer Registration */}
      <VolunteerSection
        volunteerCount={volunteerCount}
        onRegisterVolunteer={handleRegisterVolunteer}
      />

      {/* Final CTA Banner */}
      <section className="border-t border-border bg-gradient-primary">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-16 text-center">
          <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            আজই হোন একজন অসহায় মানুষের পাশে
          </h2>
          <p className="max-w-xl text-primary-foreground/90">
            আপনার ১০০ টাকাও কারো একদিনের খাবার, কারো ওষুধ, কারো বই হতে পারে। আর সাহায্য না করতে পারলে আমাদের ফেসবুক পেজটি ফলো করে রাখুন।
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="#donate"
              className="inline-flex items-center gap-2 rounded-full bg-background px-8 py-3.5 font-display text-base font-bold text-foreground shadow-card transition-transform hover:scale-105"
            >
              দান করুন
              <ArrowRight className="size-5" />
            </a>
            <a
              href={FOUNDATION_FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-7 py-3.5 font-display text-base font-semibold text-primary-foreground backdrop-blur transition-colors hover:bg-primary-foreground/20"
            >
              <Facebook className="size-5" />
              ফেসবুক পেজ ফলো করুন
            </a>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-primary">
                <HeartHandshake className="size-4 text-primary-foreground" />
              </span>
              <span className="font-display text-lg font-bold">
                সেবা <span className="text-gradient-primary">ফাউন্ডেশন</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              অসহায় ও দুস্থ মানুষের কল্যাণে নিবেদিত একটি অলাভজনক স্বেচ্ছাসেবী উদ্যোগ।
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold">যোগাযোগ</h4>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>
                <a
                  href={`tel:+88${FOUNDATION_PHONE_RAW}`}
                  className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
                >
                  <Phone className="size-4 text-primary" />
                  {FOUNDATION_PHONE_BN}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                ঢাকা, বাংলাদেশ
              </li>
              <li>
                <a
                  href={FOUNDATION_FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
                >
                  <Facebook className="size-4 text-primary" />
                  আমাদের ফেসবুক পেজ ফলো করুন
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold">দ্রুত লিংক</h4>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="#campaigns" className="transition-colors hover:text-foreground">
                  চলমান ক্যাম্পেইন
                </a>
              </li>
              <li>
                <a href="#how" className="transition-colors hover:text-foreground">
                  কীভাবে দান করবেন
                </a>
              </li>
              <li>
                <a href="#trust" className="transition-colors hover:text-foreground">
                  স্বচ্ছতা ও হিসাব
                </a>
              </li>
              <li>
                <a href="#volunteer" className="transition-colors hover:text-foreground">
                  স্বেচ্ছাসেবী হোন
                </a>
              </li>
              <li>
                <a href="#gojol" className="transition-colors hover:text-foreground">
                  গজল ও সুর
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setFbCoverModalOpen(true)}
                  className="font-medium text-foreground transition-colors hover:text-primary hover:underline"
                >
                  ফেসবুক কভার ফটো তৈরি ও ডাউনলোড
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setAdminModalOpen(true)}
                  className="font-semibold text-primary-glow transition-colors hover:underline"
                >
                  অ্যাডমিন প্যানেল (দাতার তালিকা)
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
          © ২০২৬ সেবা ফাউন্ডেশন — মানবতার সেবায় নিবেদিত
        </div>
      </footer>

      <CampaignModal
        campaign={activeModalCampaign}
        onClose={() => setActiveModalCampaign(null)}
        onSelectDonate={handleSelectDonateCampaign}
      />

      <AdminDashboardModal
        open={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
      />

      <FacebookCoverModal
        open={fbCoverModalOpen}
        onClose={() => setFbCoverModalOpen(false)}
      />
    </div>
  );
}

