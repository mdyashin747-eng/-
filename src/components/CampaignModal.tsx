import { useState } from 'react';
import { ArrowRight, CheckCircle2, HeartHandshake, MapPin, Users, X } from 'lucide-react';
import { Campaign, formatBDT, toBengaliDigits } from '../data/foundation';

interface CampaignModalProps {
  campaign: Campaign | null;
  onClose: () => void;
  onSelectDonate: (campaignId: Campaign['id']) => void;
}

export function CampaignModal({ campaign, onClose, onSelectDonate }: CampaignModalProps) {
  const [imageError, setImageError] = useState(false);

  if (!campaign) return null;

  const percent = Math.min(100, Math.round((campaign.raisedAmount / campaign.goalAmount) * 100));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="campaign-modal-title"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="বন্ধ করুন"
          className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-background/85 text-foreground backdrop-blur transition-colors hover:bg-accent"
        >
          <X className="size-5" />
        </button>

        <div className="relative aspect-[16/9] w-full overflow-hidden bg-secondary">
          {!imageError ? (
            <img
              src={campaign.image}
              alt={campaign.title}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-secondary to-background p-6 text-center">
              <HeartHandshake className="size-10 text-primary" />
              <span className="font-display text-lg font-semibold">{campaign.title}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{campaign.categoryLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5 text-primary" />
              {campaign.location}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Users className="size-3.5 text-primary" />
              {toBengaliDigits(campaign.beneficiariesCount)}+ উপকারভোগী
            </span>
          </div>

          <h3 id="campaign-modal-title" className="mt-2 font-display text-2xl font-bold sm:text-3xl">
            {campaign.title}
          </h3>

          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {campaign.description}
          </p>

          <div className="mt-6 rounded-xl border border-border bg-background/70 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-primary-glow tabular-nums">
                সংগৃহীত {formatBDT(campaign.raisedAmount)}
              </span>
              <span className="text-muted-foreground tabular-nums">
                লক্ষ্য {formatBDT(campaign.goalAmount)} ({toBengaliDigits(percent)}%)
              </span>
            </div>
            <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-gradient-primary transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              সহায়তার প্রভাব: <span className="font-semibold text-foreground">{formatBDT(campaign.unitAmount)}</span> = {campaign.unitImpact}
            </p>
          </div>

          <div className="mt-6">
            <h4 className="font-display text-sm font-semibold text-foreground">
              মাঠপর্যায়ের চলমান কার্যক্রম
            </h4>
            <ul className="mt-3 space-y-2.5">
              {campaign.highlights.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-end gap-3 border-t border-border pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-input px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              ফিরে যান
            </button>
            <button
              type="button"
              onClick={() => {
                onSelectDonate(campaign.id);
                onClose();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-6 py-2.5 font-display text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]"
            >
              এই খাতে দান করুন
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
