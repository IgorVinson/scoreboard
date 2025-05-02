// Export all types from this file
export * from '@/lib/types';

// Define IPricing interface for pricing tiers
export interface IPricing {
  name: string;
  price: number | string;
  priceId?: string;
  features: string[];
}

// Define ResultReport type if missing
export interface ResultReport {
  id: string;
  user_id: string;
  type: 'weekly' | 'monthly';
  start_date: string;
  end_date: string;
  summary: string;
  next_goals: string;
  comments: string;
  metrics_summary: Record<string, { plan: number; fact: number }>;
  reviewed: boolean;
  quantity_rating?: number;
  quality_rating?: number;
  title?: string;
  description?: string;
  objectives?: ResultReportObjective[];
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ResultReportObjective {
  name: string;
  metrics: ResultReportMetric[];
  totalPlan: number;
  totalActual: number;
}

export interface ResultReportMetric {
  id: string;
  name: string;
  plan: number;
  actual: number;
}

// Daily Report interface
export interface DailyReport {
  id: string;
  user_id: string;
  date: string;
  metrics_data: {
    [metricId: string]: {
      plan: number;
      fact: number;
    };
  };
  created_at: string;
  updated_at: string;
} 