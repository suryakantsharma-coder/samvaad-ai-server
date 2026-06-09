export interface CallAnalyticsTotals {
  totalCalls: number;
  totalDuration: number;
  totalCreditsUsed: number;
  answeredCalls: number;
  missedCalls: number;
  averageCallDuration: number;
}

export interface CallAnalyticsCallRow {
  _id: string;
  callSid?: string;
  from?: string;
  to?: string;
  direction?: string;
  duration?: number;
  creditUsed?: number;
  status?: string;
  answeredBy?: string;
  startTime?: string;
  endTime?: string;
  createdAt?: string;
}

export interface CallAnalyticsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CallAnalyticsPayload {
  hospitalId?: string;
  hospitalName?: string;
  voiceAgentNumber?: string;
  totals: CallAnalyticsTotals;
  calls: CallAnalyticsCallRow[];
  pagination: CallAnalyticsPagination;
}
