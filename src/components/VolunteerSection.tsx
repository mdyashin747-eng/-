import { useState, FormEvent } from 'react';
import { CheckCircle2, UserPlus } from 'lucide-react';
import { DISTRICTS, VolunteerRecord, normalizeDigits } from '../data/foundation';

interface VolunteerSectionProps {
  volunteerCount: number;
  onRegisterVolunteer: (
    volunteer: Omit<VolunteerRecord, 'id' | 'joinedAt'>
  ) => Promise<VolunteerRecord>;
}

const FOCUS_AREAS = [
  'খাদ্য ও ত্রাণ বিতরণ',
  'মেডিকেল ক্যাম্প ও রক্তদান',
  'শিক্ষা উপকরণ ও পাঠদান',
  'শীতবস্ত্র ও জরুরি উদ্ধার',
];

export function VolunteerSection({
  volunteerCount,
  onRegisterVolunteer,
}: VolunteerSectionProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState(DISTRICTS[0]);
  const [focusArea, setFocusArea] = useState(FOCUS_AREAS[0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [joinedRecord, setJoinedRecord] = useState<VolunteerRecord | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (name.trim().length < 2 || name.trim().length > 80) {
      setErrorMsg('অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন (২ থেকে ৮০ অক্ষরের মধ্যে)।');
      return;
    }

    const cleanPhone = normalizeDigits(phone).replace(/\D/g, '');
    if (!/^01[0-9]{9}$/.test(cleanPhone)) {
      setErrorMsg('ঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।');
      return;
    }

    setSubmitting(true);
    try {
      const created = await onRegisterVolunteer({
        name: name.trim(),
        phone: cleanPhone,
        district,
        focusArea,
      });
      setJoinedRecord(created);
      setName('');
      setPhone('');
    } catch {
      setErrorMsg('আবেদন জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="volunteer" className="scroll-mt-20 border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-6">
          <span className="text-sm font-semibold text-primary">স্বেচ্ছাসেবক হিসেবে যোগ দিন</span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            সময় ও শ্রম দিয়েও বদলে দিতে পারেন একটি জীবন
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            আপনি দেশের যে প্রান্তেই থাকুন না কেন, আপনার জেলায় আমাদের ত্রাণ বিতরণ, মেডিকেল ক্যাম্প
            এবং শিক্ষা কার্যক্রমে স্বেচ্ছাসেবী হিসেবে যুক্ত হতে পারেন।
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-border pt-6 text-sm text-muted-foreground">
            <div>
              <span className="block font-display text-2xl font-bold text-foreground tabular-nums">
                {volunteerCount}+ জন
              </span>
              <span>সক্রিয় স্বেচ্ছাসেবী</span>
            </div>
            <div>
              <span className="block font-display text-2xl font-bold text-foreground tabular-nums">
                ২৪টি জেলা
              </span>
              <span>মাঠপর্যায়ের কার্যক্রম</span>
            </div>
            <div>
              <span className="block font-display text-2xl font-bold text-foreground">
                সার্টিফিকেট
              </span>
              <span>সক্রিয় স্বেচ্ছাসেবীদের জন্য</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-background p-6 shadow-card sm:p-8 lg:col-span-6">
          {joinedRecord ? (
            <div className="space-y-4 py-4">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <CheckCircle2 className="size-5" />
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold">
                    স্বাগতম, {joinedRecord.name}!
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {joinedRecord.district} জেলার «{joinedRecord.focusArea}» টিমে আপনার নাম নিবন্ধন
                    করা হয়েছে। পরবর্তী কার্যক্রমের আগে আমাদের সমন্বয়ক আপনার সাথে যোগাযোগ করবেন।
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setJoinedRecord(null)}
                className="rounded-xl border border-input bg-card px-5 py-2.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
              >
                আরেকজন স্বেচ্ছাসেবী যুক্ত করুন
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <h3 className="font-display text-xl font-bold">স্বেচ্ছাসেবী নিবন্ধন ফর্ম</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="vol-name" className="block text-xs text-muted-foreground">
                    পূর্ণ নাম
                  </label>
                  <input
                    id="vol-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="আপনার নাম লিখুন"
                    className="mt-1.5 w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="vol-phone" className="block text-xs text-muted-foreground">
                    মোবাইল নম্বর
                  </label>
                  <input
                    id="vol-phone"
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
                  <label htmlFor="vol-district" className="block text-xs text-muted-foreground">
                    জেলা / বিভাগ
                  </label>
                  <select
                    id="vol-district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="vol-focus" className="block text-xs text-muted-foreground">
                    আগ্রহের ক্ষেত্র
                  </label>
                  <select
                    id="vol-focus"
                    value={focusArea}
                    onChange={(e) => setFocusArea(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    {FOCUS_AREAS.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
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
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 font-display text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:scale-[1.01] disabled:opacity-60"
              >
                <UserPlus className="size-4" />
                {submitting ? 'আবেদন জমা হচ্ছে...' : 'স্বেচ্ছাসেবী হিসেবে আবেদন করুন'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
