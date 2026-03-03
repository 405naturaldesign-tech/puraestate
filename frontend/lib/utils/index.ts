import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ─── Tailwind class merge ─────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency formatting ──────────────────────────────────────────────────────

export function formatCurrency(
  amount: number,
  currency = 'USD',
  locale = 'en-US',
  compact = false
): string {
  if (compact && Math.abs(amount) >= 1_000_000) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(num);
}

export function formatCompact(num: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(
    num
  );
}

// ─── Date formatting ──────────────────────────────────────────────────────────

export function formatDate(date: string | Date, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateShort(date: string | Date, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) {
    return 'just now';
  }
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  if (diffWeeks < 4) {
    return `${diffWeeks}w ago`;
  }
  if (diffMonths < 12) {
    return `${diffMonths}mo ago`;
  }
  return `${diffYears}y ago`;
}

// ─── String utilities ─────────────────────────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) {
    return str;
  }
  return str.slice(0, length) + '...';
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function titleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

// ─── Property utilities ───────────────────────────────────────────────────────

export function formatArea(sqft: number): string {
  if (sqft >= 1000) {
    return `${(sqft / 1000).toFixed(1)}k sqft`;
  }
  return `${sqft.toLocaleString()} sqft`;
}

export function formatPricePerSqft(price: number, sqft: number): string {
  if (!sqft) {
    return 'N/A';
  }
  return formatCurrency(price / sqft) + '/sqft';
}

export function getPropertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    house: 'House',
    apartment: 'Apartment',
    condo: 'Condo',
    townhouse: 'Townhouse',
    villa: 'Villa',
    land: 'Land',
    commercial: 'Commercial',
    industrial: 'Industrial',
    office: 'Office',
    retail: 'Retail',
  };
  return labels[type] || titleCase(type);
}

export function getListingTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    sale: 'For Sale',
    rent: 'For Rent',
    lease: 'For Lease',
    auction: 'Auction',
  };
  return labels[type] || titleCase(type);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'text-success-600 bg-success-50 dark:text-success-400 dark:bg-success-900/20',
    pending: 'text-warning-600 bg-warning-50 dark:text-warning-400 dark:bg-warning-900/20',
    sold: 'text-danger-600 bg-danger-50 dark:text-danger-400 dark:bg-danger-900/20',
    rented: 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20',
    off_market: 'text-neutral-600 bg-neutral-100 dark:text-neutral-400 dark:bg-neutral-800',
    draft: 'text-neutral-500 bg-neutral-50 dark:text-neutral-400 dark:bg-neutral-900',
    under_review: 'text-accent-600 bg-accent-50 dark:text-accent-400 dark:bg-accent-900/20',
  };
  return colors[status] || colors.off_market;
}

// ─── ROI Calculator ───────────────────────────────────────────────────────────

export interface ROIInput {
  purchasePrice: number;
  downPaymentPercent: number;
  interestRate: number;
  loanTermYears: number;
  monthlyRent: number;
  monthlyExpenses: number;
  annualAppreciation: number;
  holdYears: number;
}

export interface ROIResult {
  downPayment: number;
  loanAmount: number;
  monthlyMortgage: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  cashOnCashReturn: number;
  capRate: number;
  totalReturn: number;
  roi: number;
  futureValue: number;
}

export function calculateROI(input: ROIInput): ROIResult {
  const {
    purchasePrice,
    downPaymentPercent,
    interestRate,
    loanTermYears,
    monthlyRent,
    monthlyExpenses,
    annualAppreciation,
    holdYears,
  } = input;

  const downPayment = purchasePrice * (downPaymentPercent / 100);
  const loanAmount = purchasePrice - downPayment;
  const monthlyRate = interestRate / 100 / 12;
  const numPayments = loanTermYears * 12;

  // Monthly mortgage payment
  const monthlyMortgage =
    loanAmount > 0
      ? (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      : 0;

  const monthlyCashFlow = monthlyRent - monthlyMortgage - monthlyExpenses;
  const annualCashFlow = monthlyCashFlow * 12;
  const annualNOI = (monthlyRent - monthlyExpenses) * 12;

  const cashOnCashReturn = (annualCashFlow / downPayment) * 100;
  const capRate = (annualNOI / purchasePrice) * 100;

  // Future value with appreciation
  const futureValue = purchasePrice * Math.pow(1 + annualAppreciation / 100, holdYears);
  const totalEquityGain = futureValue - purchasePrice;
  const totalCashFlow = annualCashFlow * holdYears;
  const totalReturn = totalEquityGain + totalCashFlow;
  const roi = (totalReturn / downPayment) * 100;

  return {
    downPayment,
    loanAmount,
    monthlyMortgage,
    monthlyCashFlow,
    annualCashFlow,
    cashOnCashReturn,
    capRate,
    totalReturn,
    roi,
    futureValue,
  };
}

// ─── URL utilities ────────────────────────────────────────────────────────────

export function buildSearchUrl(filters: Record<string, unknown>): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, String(v)));
      } else {
        params.set(key, String(value));
      }
    }
  });
  return params.toString() ? `?${params.toString()}` : '';
}

export function parseSearchParams(searchParams: URLSearchParams): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};
  searchParams.forEach((value, key) => {
    if (result[key]) {
      if (Array.isArray(result[key])) {
        (result[key] as string[]).push(value);
      } else {
        result[key] = [result[key] as string, value];
      }
    } else {
      result[key] = value;
    }
  });
  return result;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^\+?[\d\s\-()]{10,}$/.test(phone);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
