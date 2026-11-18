import { useEffect, useRef, useState } from 'react';
import { Download, Facebook, Image as ImageIcon, Sparkles, X } from 'lucide-react';
import { FOUNDATION_PHONE_BN } from '../data/foundation';

interface FacebookCoverModalProps {
  open: boolean;
  onClose: () => void;
}

type CoverFormat = 'fb-cover' | 'hd-wide';

const COVER_IMAGE_SRC = '/src/assets/images/seba_facebook_cover_1794990325871.jpg';

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function FacebookCoverModal({ open, onClose }: FacebookCoverModalProps) {
  const [format, setFormat] = useState<CoverFormat>('fb-cover');
  const [customTagline, setCustomTagline] = useState(
    'আর্থিক সাহায্য না করতে পারলে পেজটি ফলো করে পাশে থাকুন'
  );
  const [downloading, setDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = COVER_IMAGE_SRC;

    const renderCover = async () => {
      try {
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready;
        }
      } catch {
        // ignore font loading failures
      }

      if (cancelled) return;

      const width = format === 'fb-cover' ? 1640 : 1920;
      const height = format === 'fb-cover' ? 624 : 1080;

      const canvas = canvasRef.current ?? document.createElement('canvas');
      canvasRef.current = canvas;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Background image cover-fit (align right slightly so mosque & people stay crisp)
      const imgRatio = img.width / img.height;
      const canvasRatio = width / height;
      let drawW = width;
      let drawH = height;
      let offsetX = 0;
      let offsetY = 0;

      if (imgRatio > canvasRatio) {
        drawH = height;
        drawW = height * imgRatio;
        offsetX = width - drawW; // Keep right side subject fully visible
      } else {
        drawW = width;
        drawH = width / imgRatio;
        offsetY = (height - drawH) * 0.48;
      }

      ctx.fillStyle = '#0c0b09';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

      // 2. Smooth warm charcoal gradient fade from left for crisp Bengali typography
      const grad = ctx.createLinearGradient(0, 0, width * 0.72, 0);
      grad.addColorStop(0, 'rgba(12, 11, 9, 0.96)');
      grad.addColorStop(0.55, 'rgba(12, 11, 9, 0.84)');
      grad.addColorStop(0.82, 'rgba(12, 11, 9, 0.38)');
      grad.addColorStop(1, 'rgba(12, 11, 9, 0.10)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Subtle bottom warm border accent
      const accentGrad = ctx.createLinearGradient(0, 0, width, 0);
      accentGrad.addColorStop(0, '#f59e0b');
      accentGrad.addColorStop(0.55, '#fbbf24');
      accentGrad.addColorStop(1, 'rgba(245, 158, 11, 0.15)');
      ctx.fillStyle = accentGrad;
      ctx.fillRect(0, height - 8, width, 8);

      const scale = format === 'fb-cover' ? 1 : 1.24;
      const padX = Math.round(92 * scale);
      const centerY = height / 2;

      // 3. Eyebrow label
      ctx.fillStyle = '#fbbf24';
      ctx.font = `600 ${Math.round(24 * scale)}px "Hind Siliguri", "Figtree", sans-serif`;
      ctx.fillText(
        'মানবতার সেবায় নিবেদিত · ঢাকা ও সারা বাংলাদেশ',
        padX,
        centerY - Math.round(145 * scale)
      );

      // 4. Main Title: সেবা ফাউন্ডেশন
      ctx.fillStyle = '#faf8f5';
      ctx.font = `700 ${Math.round(86 * scale)}px "Hind Siliguri", "Outfit", sans-serif`;
      ctx.fillText('সেবা ফাউন্ডেশন', padX, centerY - Math.round(58 * scale));

      // 5. Campaign summary line
      ctx.fillStyle = '#e7e1d7';
      ctx.font = `600 ${Math.round(30 * scale)}px "Hind Siliguri", sans-serif`;
      ctx.fillText(
        'মসজিদ নির্মাণ (সদকায়ে জারিয়াহ) · খাদ্য · শিক্ষা · চিকিৎসা · শীতবস্ত্র',
        padX,
        centerY + Math.round(8 * scale)
      );

      // 6. Payment box
      const boxY = centerY + Math.round(42 * scale);
      const boxW = Math.round(690 * scale);
      const boxH = Math.round(72 * scale);
      drawRoundedRect(ctx, padX, boxY, boxW, boxH, Math.round(14 * scale));
      ctx.fillStyle = 'rgba(245, 158, 11, 0.16)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
      ctx.stroke();

      ctx.fillStyle = '#fde68a';
      ctx.font = `700 ${Math.round(29 * scale)}px "Hind Siliguri", sans-serif`;
      ctx.fillText(
        `বিকাশ / নগদ / রকেট (পার্সোনাল): ${FOUNDATION_PHONE_BN}`,
        padX + Math.round(24 * scale),
        boxY + Math.round(47 * scale)
      );

      // 7. Follow note
      const noteText =
        customTagline.trim() || 'আর্থিক সাহায্য না করতে পারলে পেজটি ফলো করে পাশে থাকুন';
      ctx.fillStyle = '#d6cfc4';
      ctx.font = `500 ${Math.round(25 * scale)}px "Hind Siliguri", sans-serif`;
      ctx.fillText(noteText, padX, boxY + boxH + Math.round(46 * scale));

      setPreviewUrl(canvas.toDataURL('image/png'));
    };

    img.onload = () => {
      void renderCover();
    };

    return () => {
      cancelled = true;
    };
  }, [open, format, customTagline]);

  if (!open) return null;

  const handleDownloadDesignedCover = () => {
    if (!previewUrl) return;
    setDownloading(true);
    try {
      const link = document.createElement('a');
      link.href = previewUrl;
      link.download =
        format === 'fb-cover'
          ? 'seba-foundation-facebook-cover-1640x624.png'
          : 'seba-foundation-banner-1920x1080.png';
      link.click();
    } finally {
      setTimeout(() => setDownloading(false), 300);
    }
  };

  const handleDownloadRawPhoto = () => {
    const link = document.createElement('a');
    link.href = COVER_IMAGE_SRC;
    link.download = 'seba-foundation-cover-photo-clean.jpg';
    link.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fb-cover-modal-title"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
              <Facebook className="size-5" />
            </span>
            <div>
              <h2 id="fb-cover-modal-title" className="font-display text-xl font-bold sm:text-2xl">
                ফেসবুক পেজের কভার ফটো
              </h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                সরাসরি ডাউনলোড করে আপনার সেবা ফাউন্ডেশন ফেসবুক পেজে আপলোড করুন।
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="flex size-9 items-center justify-center rounded-full border border-border bg-background/70 text-foreground transition-colors hover:bg-accent"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-xl border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => setFormat('fb-cover')}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                format === 'fb-cover'
                  ? 'bg-gradient-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              ফেসবুক কভার সাইজ (১৬৪০×৬২৪)
            </button>
            <button
              type="button"
              onClick={() => setFormat('hd-wide')}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                format === 'hd-wide'
                  ? 'bg-gradient-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              ওয়াইড ব্যানার (১৯২০×১০৮০)
            </button>
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs text-primary-glow">
            <Sparkles className="size-3.5" />
            অফিশিয়াল HD কোয়ালিটি
          </span>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-background">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="সেবা ফাউন্ডেশন ফেসবুক কভার ফটো প্রিভিউ"
              referrerPolicy="no-referrer"
              className="w-full object-contain"
            />
          ) : (
            <div className="flex aspect-[1640/624] items-center justify-center text-sm text-muted-foreground">
              কভার ফটো প্রস্তুত হচ্ছে...
            </div>
          )}
        </div>

        <div className="mt-5">
          <label htmlFor="cover-tagline" className="block text-xs font-semibold text-muted-foreground">
            নিচের বার্তা চাইলে পরিবর্তন করতে পারেন
          </label>
          <input
            id="cover-tagline"
            type="text"
            value={customTagline}
            onChange={(e) => setCustomTagline(e.target.value)}
            maxLength={90}
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!previewUrl || downloading}
            onClick={handleDownloadDesignedCover}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-primary px-6 py-3.5 font-display text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:scale-[1.01] disabled:opacity-60"
          >
            <Download className="size-4" />
            {downloading ? 'ডাউনলোড হচ্ছে...' : 'লেখাসহ কভার ফটো ডাউনলোড (PNG)'}
          </button>

          <button
            type="button"
            onClick={handleDownloadRawPhoto}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-input bg-background px-5 py-3.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/50 hover:bg-accent"
          >
            <ImageIcon className="size-4 text-primary" />
            লেখা ছাড়া মূল ছবি ডাউনলোড
          </button>
        </div>
      </div>
    </div>
  );
}
