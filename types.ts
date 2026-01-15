
export interface ChartDataItem {
  name: string;
  value: number;
}

export interface PieChartConfig {
  title: string;
  data: ChartDataItem[];
}

export interface ScheduleItem {
  time: string;
  content: string;
  location: string;
  handler: string;
}

export interface DeadlineRecord {
  id: string;
  applicant: string;
  handler: string;
  deadline: string;
}

export interface AnalysisData {
  reportTitle: string;
  reportStats: {
    totalDossiers: number;
    resolvedDossiers: number;
    pendingDossiers: number;
    totalTourists: number;
    internationalTourists: number;
    businessLũyKế: number;
  };
  charts: PieChartConfig[];
  schedules: ScheduleItem[];
  deadlines: DeadlineRecord[];
}
