export type CampaignCategory = 'food' | 'education' | 'medical' | 'winter' | 'mosque' | 'general';

export type PaymentMethod = 'bkash' | 'nagad' | 'rocket';

export interface Campaign {
  id: Exclude<CampaignCategory, 'general'>;
  categoryLabel: string;
  title: string;
  location: string;
  description: string;
  image: string;
  raisedAmount: number;
  goalAmount: number;
  unitAmount: number;
  unitImpact: string;
  beneficiariesCount: number;
  highlights: string[];
}

export interface DonationRecord {
  id: string;
  receiptNo: string;
  donorName: string;
  phone: string;
  campaignId: CampaignCategory;
  campaignTitle: string;
  amount: number;
  method: PaymentMethod;
  trxId: string;
  note?: string;
  createdAt: string;
  isNew?: boolean;
}

export interface VolunteerRecord {
  id: string;
  name: string;
  phone: string;
  district: string;
  focusArea: string;
  joinedAt: string;
}

export const FOUNDATION_PHONE_RAW = '01331496395';
export const FOUNDATION_PHONE_BN = '01331496395';
export const FOUNDATION_FACEBOOK_URL =
  'https://www.facebook.com/profile.php?id=61593484464171';

export const HERO_IMAGE =
  '/src/assets/images/hero_food_distribution_1794983795750.jpg';

export const PAYMENT_METHODS: Array<{
  id: PaymentMethod;
  name: string;
  accountType: string;
  numberBn: string;
  numberRaw: string;
}> = [
  {
    id: 'bkash',
    name: 'বিকাশ',
    accountType: 'পার্সোনাল',
    numberBn: FOUNDATION_PHONE_BN,
    numberRaw: FOUNDATION_PHONE_RAW,
  },
  {
    id: 'nagad',
    name: 'নগদ',
    accountType: 'পার্সোনাল',
    numberBn: FOUNDATION_PHONE_BN,
    numberRaw: FOUNDATION_PHONE_RAW,
  },
  {
    id: 'rocket',
    name: 'রকেট',
    accountType: 'পার্সোনাল',
    numberBn: FOUNDATION_PHONE_BN,
    numberRaw: FOUNDATION_PHONE_RAW,
  },
];

export const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'mosque',
    categoryLabel: 'সদকায়ে জারিয়াহ',
    title: 'মসজিদ নির্মাণ ক্যাম্পেইন',
    location: 'প্রত্যন্ত ও চরাঞ্চল',
    description:
      'হাজার হাজার মানুষ এখানে পাঁচ ওয়াক্ত নামাজ ও জুমার জামাত আদায় করবে — আপনার সামান্য অনুদানও মৃত্যুর আগ পর্যন্ত ও মৃত্যুর পরও চলমান সওয়াবের (সদকায়ে জারিয়াহ) উসিলা হয়ে থাকবে।',
    image: '/src/assets/images/campaign_mosque_1794989625806.jpg',
    raisedAmount: 210000,
    goalAmount: 500000,
    unitAmount: 500,
    unitImpact: '১ বস্তা সিমেন্ট বা ৫০টি ইটের সদকায়ে জারিয়াহ',
    beneficiariesCount: 2000,
    highlights: [
      'হাজার হাজার মুসল্লির পাঁচ ওয়াক্ত নামাজ ও জুমার জামাতের স্থায়ী ব্যবস্থা',
      'মৃত্যুর আগ পর্যন্ত এবং পরবর্তী প্রজন্মের ইবাদতে চলমান সওয়াব (সদকায়ে জারিয়াহ)',
      'সকালবেলা শিশুদের জন্য বিনামূল্যে কোরআন শিক্ষা ও মক্তবের ব্যবস্থা',
    ],
  },
  {
    id: 'food',
    categoryLabel: 'খাদ্য',
    title: 'খাদ্য সহায়তা',
    location: 'ঢাকা ও কুড়িগ্রাম',
    description:
      'নিম্ন আয়ের পরিবার ও ভবঘুরে মানুষের মাঝে নিয়মিত খাদ্যবস্তু ও রান্না করা খাবার বিতরণ করা হয়।',
    image: '/src/assets/images/hero_food_distribution_1794983795750.jpg',
    raisedAmount: 185000,
    goalAmount: 300000,
    unitAmount: 500,
    unitImpact: 'একটি পরিবারের ৫ দিনের চাল, ডাল ও তেল',
    beneficiariesCount: 920,
    highlights: [
      'প্রতি সপ্তাহে ৩০০+ ভবঘুরে মানুষের জন্য গরম খাবারের ব্যবস্থা',
      '১০০টি দুস্থ পরিবারের জন্য মাসিক খাদ্য প্যাকেজ বিতরণ',
      'বন্যাদুর্গত এলাকায় জরুরি শুকনো খাবার পৌঁছে দেওয়া',
    ],
  },
  {
    id: 'education',
    categoryLabel: 'শিক্ষা',
    title: 'শিক্ষা সহায়তা',
    location: 'গাইবান্ধা ও সুনামগঞ্জ',
    description:
      'দরিদ্র ও মেধাবী শিক্ষার্থীদের বই, খাতা, পোশাক ও বেতনের খরচ দিয়ে পড়াশোনা চালিয়ে যেতে সাহায্য করি।',
    image: '/src/assets/images/campaign_education_1794983796885.jpg',
    raisedAmount: 95000,
    goalAmount: 200000,
    unitAmount: 1000,
    unitImpact: 'একজন শিক্ষার্থীর এক সেমিস্টারের বই, খাতা ও স্কুল ব্যাগ',
    beneficiariesCount: 340,
    highlights: [
      'চরাঞ্চলের ৪টি প্রাথমিক বিদ্যালয়ে বিনামূল্যে শিক্ষা উপকরণ',
      'ঝরে পড়া রোধে ৮৫ জন শিক্ষার্থীর মাসিক বৃত্তি',
      'এসএসসি পরীক্ষার্থীদের জন্য ফ্রি গাইড ও কোচিং সহায়তা',
    ],
  },
  {
    id: 'medical',
    categoryLabel: 'চিকিৎসা',
    title: 'চিকিৎসা সহায়তা',
    location: 'শেরপুর ও সিরাজগঞ্জ',
    description:
      'গ্রামে বিনামূল্যে মেডিকেল ক্যাম্প ও জরুরি অপারেশনের খরচ — অসুস্থ মানুষের পাশে দাঁড়াই আমরা।',
    image: '/src/assets/images/campaign_medical_1794983796730.jpg',
    raisedAmount: 140000,
    goalAmount: 250000,
    unitAmount: 2000,
    unitImpact: '১০ জন গ্রামবাসীর বিনামূল্যে স্বাস্থ্য পরীক্ষা ও ওষুধ',
    beneficiariesCount: 680,
    highlights: [
      'বিশেষজ্ঞ চিকিৎসকদের মাধ্যমে মাসে ২টি গ্রামীণ মেডিকেল ক্যাম্প',
      'গুরুতর অসুস্থ রোগীদের জরুরি অপারেশন ও রক্তদান সহায়তা',
      'প্রসূতি মা ও শিশুদের জন্য বিনামূল্যে ভিটামিন ও প্রাথমিক চিকিৎসা',
    ],
  },
  {
    id: 'winter',
    categoryLabel: 'শীতবস্ত্র',
    title: 'শীতবস্ত্র বিতরণ',
    location: 'পঞ্চগড়, রংপুর ও দিনাজপুর',
    description:
      'প্রতি শীতে উত্তরাঞ্চলসহ সারা দেশের শীতার্ত মানুষের মাঝে কম্বল ও গরম কাপড় পৌঁছে দিই।',
    image: '/src/assets/images/campaign_winter_1794983796920.jpg',
    raisedAmount: 60000,
    goalAmount: 150000,
    unitAmount: 500,
    unitImpact: 'একটি ভারী কম্বল ও গরম চাদর',
    beneficiariesCount: 560,
    highlights: [
      'উত্তরাঞ্চলের সীমান্তবর্তী গ্রামে সরাসরি কম্বল বিতরণ',
      'শিশু ও বয়স্কদের জন্য উলের সোয়েটার ও মাফলার',
      'রাতের বেলায় রেলস্টেশন ও ফুটপাতে শীতবস্ত্র পৌঁছে দেওয়া',
    ],
  },
];

export const INITIAL_DONATIONS: DonationRecord[] = [
  {
    id: 'don-1',
    receiptNo: 'SF-2026-1042',
    donorName: 'তানভীর আহমেদ',
    phone: '01711***482',
    campaignId: 'food',
    campaignTitle: 'খাদ্য সহায়তা',
    amount: 2000,
    method: 'bkash',
    trxId: 'BKS9K48M2P',
    createdAt: 'আজ, সন্ধ্যা ৭:১৫',
  },
  {
    id: 'don-2',
    receiptNo: 'SF-2026-1041',
    donorName: 'সুমাইয়া আক্তার',
    phone: '01819***210',
    campaignId: 'education',
    campaignTitle: 'শিক্ষা সহায়তা',
    amount: 1000,
    method: 'nagad',
    trxId: 'NGD7P31X9R',
    createdAt: 'আজ, দুপুর ৩:৪০',
  },
  {
    id: 'don-3',
    receiptNo: 'SF-2026-1040',
    donorName: 'নাম প্রকাশে অনিচ্ছুক',
    phone: '01912***895',
    campaignId: 'medical',
    campaignTitle: 'চিকিৎসা সহায়তা',
    amount: 5000,
    method: 'bkash',
    trxId: 'BKS4W88L1Q',
    createdAt: 'গতকাল',
  },
  {
    id: 'don-4',
    receiptNo: 'SF-2026-1039',
    donorName: 'রাশেদুল ইসলাম',
    phone: '01675***309',
    campaignId: 'winter',
    campaignTitle: 'শীতবস্ত্র বিতরণ',
    amount: 500,
    method: 'rocket',
    trxId: 'RKT2N67V4Z',
    createdAt: 'গতকাল',
  },
];

export const MONTHLY_AUDIT_LEDGER = [
  {
    sector: 'খাদ্য সামগ্রী ও রান্না করা খাবার বিতরণ',
    beneficiaries: '২৪০ পরিবার',
    allocated: 162000,
    sharePercent: 39,
  },
  {
    sector: 'গ্রামীণ মেডিকেল ক্যাম্প ও জরুরি চিকিৎসা',
    beneficiaries: '১৮৫ রোগী',
    allocated: 118000,
    sharePercent: 28,
  },
  {
    sector: 'শিক্ষা বৃত্তি ও বই-খাতা উপকরণ',
    beneficiaries: '১২০ শিক্ষার্থী',
    allocated: 82000,
    sharePercent: 20,
  },
  {
    sector: 'কম্বল ও শীতবস্ত্র ক্রয় এবং পরিবহন',
    beneficiaries: '১১০ জন',
    allocated: 54000,
    sharePercent: 13,
  },
];

export const DISTRICTS = [
  'ঢাকা',
  'চট্টগ্রাম',
  'রাজশাহী',
  'রংপুর',
  'সিলেট',
  'খুলনা',
  'বরিশাল',
  'ময়মনসিংহ',
];

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => BN_DIGITS[Number(digit)] ?? digit);
}

export function normalizeDigits(value: string): string {
  return value.replace(/[০-৯]/g, (char) => {
    const idx = BN_DIGITS.indexOf(char);
    return idx >= 0 ? String(idx) : char;
  });
}

export function formatBDT(amount: number): string {
  const formatted = new Intl.NumberFormat('en-IN').format(Math.round(amount));
  return `৳ ${toBengaliDigits(formatted)}`;
}

export function maskPhone(phone: string): string {
  const clean = normalizeDigits(phone).replace(/\D/g, '');
  if (clean.length >= 11) {
    return `${clean.slice(0, 5)}***${clean.slice(-3)}`;
  }
  return clean;
}

export function getMethodLabel(method: PaymentMethod): string {
  if (method === 'bkash') return 'বিকাশ';
  if (method === 'nagad') return 'নগদ';
  return 'রকেট';
}
