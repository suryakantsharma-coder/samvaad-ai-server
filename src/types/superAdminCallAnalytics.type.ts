export interface SuperAdminCallAnalyticsRow {
  hospitalId: string;
  hospitalName: string;
  voiceAgentNumber: string;
  totalCalls: number;
  totalDuration: number;
  totalCreditsUsed: number;
  answeredCalls: number;
  missedCalls: number;
  averageCallDuration: number;
}
