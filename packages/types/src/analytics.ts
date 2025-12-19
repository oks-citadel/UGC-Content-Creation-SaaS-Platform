// =============================================================================
// Analytics Types - Reporting & Insights
// =============================================================================

import type {
  UUID,
  ISODateString,
  BaseEntity,
  AuditableEntity,
  Money,
  SocialPlatform,
  DateRange,
} from './common';

export type MetricType =
  | 'count'
  | 'sum'
  | 'average'
  | 'percentage'
  | 'rate'
  | 'currency';

export type TimeGranularity =
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year';

// Dashboard
export interface Dashboard extends AuditableEntity {
  organizationId: UUID;

  name: string;
  description?: string;

  type: 'overview' | 'campaign' | 'creator' | 'content' | 'commerce' | 'custom';

  isDefault: boolean;
  isShared: boolean;

  layout: DashboardLayout;

  widgets: DashboardWidget[];

  filters?: DashboardFilters;

  refreshInterval?: number;
}

export interface DashboardLayout {
  columns: number;
  rowHeight: number;
}

export interface DashboardWidget {
  id: UUID;

  type: WidgetType;

  title: string;
  description?: string;

  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };

  config: WidgetConfig;

  data?: unknown;
  lastUpdatedAt?: ISODateString;
}

export type WidgetType =
  | 'metric'
  | 'chart'
  | 'table'
  | 'list'
  | 'map'
  | 'funnel'
  | 'heatmap'
  | 'leaderboard'
  | 'comparison';

export interface WidgetConfig {
  dataSource: DataSource;

  visualization?: VisualizationConfig;

  comparison?: ComparisonConfig;

  drilldown?: DrilldownConfig;
}

export interface DataSource {
  type: 'campaigns' | 'content' | 'creators' | 'commerce' | 'custom';

  metrics: string[];
  dimensions?: string[];

  filters?: Record<string, unknown>;

  dateRange?: DateRange | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'this_month' | 'this_quarter';

  granularity?: TimeGranularity;

  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface VisualizationConfig {
  chartType?: 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'scatter' | 'radar';

  colors?: string[];

  showLegend?: boolean;
  showLabels?: boolean;
  showGrid?: boolean;
  showTooltips?: boolean;

  stacked?: boolean;

  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
}

export interface AxisConfig {
  label?: string;
  format?: string;
  min?: number;
  max?: number;
}

export interface ComparisonConfig {
  enabled: boolean;
  type: 'previous_period' | 'previous_year' | 'custom';
  customRange?: DateRange;
}

export interface DrilldownConfig {
  enabled: boolean;
  levels: string[];
}

export interface DashboardFilters {
  dateRange?: DateRange;
  campaigns?: UUID[];
  creators?: UUID[];
  platforms?: SocialPlatform[];
  products?: UUID[];
  customFilters?: Record<string, unknown>;
}

// Reports
export interface Report extends AuditableEntity {
  organizationId: UUID;

  name: string;
  description?: string;

  type: ReportType;

  status: 'draft' | 'published' | 'archived';

  config: ReportConfig;

  schedule?: ReportSchedule;

  lastGeneratedAt?: ISODateString;

  exports?: ReportExport[];
}

export type ReportType =
  | 'campaign_performance'
  | 'creator_performance'
  | 'content_analytics'
  | 'commerce_attribution'
  | 'audience_insights'
  | 'roi_analysis'
  | 'custom';

export interface ReportConfig {
  dateRange: DateRange;

  sections: ReportSection[];

  filters?: Record<string, unknown>;

  branding?: ReportBranding;
}

export interface ReportSection {
  id: UUID;
  type: 'summary' | 'metrics' | 'chart' | 'table' | 'text';
  title: string;

  dataSource?: DataSource;
  visualization?: VisualizationConfig;

  content?: string;

  order: number;
}

export interface ReportBranding {
  logo?: string;
  primaryColor?: string;
  companyName?: string;
  footerText?: string;
}

export interface ReportSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  timezone: string;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
}

export interface ReportExport extends BaseEntity {
  reportId: UUID;

  format: 'pdf' | 'excel' | 'csv' | 'json';

  status: 'pending' | 'processing' | 'completed' | 'failed';

  fileUrl?: string;
  fileSize?: number;

  dateRange: DateRange;

  error?: string;

  expiresAt: ISODateString;
}

// Metrics & KPIs
export interface MetricDefinition {
  id: string;
  name: string;
  description?: string;

  category: 'engagement' | 'reach' | 'conversion' | 'revenue' | 'performance';

  type: MetricType;

  formula?: string;

  unit?: string;

  benchmarks?: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface MetricValue {
  metricId: string;
  value: number;
  formattedValue: string;

  change?: {
    value: number;
    percentage: number;
    direction: 'up' | 'down' | 'neutral';
    period: string;
  };

  trend?: TrendData[];

  benchmark?: {
    value: number;
    comparison: 'above' | 'below' | 'at';
  };
}

export interface TrendData {
  date: ISODateString;
  value: number;
}

// Funnel Analytics
export interface Funnel extends AuditableEntity {
  organizationId: UUID;

  name: string;
  description?: string;

  type: 'conversion' | 'engagement' | 'custom';

  stages: FunnelStage[];

  settings: FunnelSettings;
}

export interface FunnelStage {
  id: UUID;
  name: string;
  order: number;

  event: string;
  filters?: Record<string, unknown>;

  color?: string;
}

export interface FunnelSettings {
  conversionWindow: number;
  countUnique: boolean;
  includeAnonymous: boolean;
}

export interface FunnelAnalysis {
  funnelId: UUID;

  dateRange: DateRange;

  stages: FunnelStageAnalysis[];

  overallConversion: number;

  bySegment?: FunnelSegmentAnalysis[];

  timeline?: FunnelTimelineAnalysis[];
}

export interface FunnelStageAnalysis {
  stageId: UUID;
  name: string;

  count: number;
  conversionRate: number;
  dropoffRate: number;

  avgTimeToConvert?: number;
}

export interface FunnelSegmentAnalysis {
  segment: string;
  value: string;
  stages: FunnelStageAnalysis[];
  overallConversion: number;
}

export interface FunnelTimelineAnalysis {
  date: ISODateString;
  stages: { stageId: UUID; count: number }[];
  overallConversion: number;
}

// Cohort Analysis
export interface CohortAnalysis {
  cohortType: 'acquisition' | 'first_purchase' | 'first_content' | 'custom';

  dateRange: DateRange;
  granularity: TimeGranularity;

  metric: string;

  cohorts: Cohort[];

  matrix: CohortMatrix;
}

export interface Cohort {
  id: string;
  startDate: ISODateString;
  size: number;
}

export interface CohortMatrix {
  periods: string[];
  data: { cohortId: string; values: number[] }[];
}

// Attribution
export interface AttributionModel {
  id: string;
  name: string;
  type: 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based' | 'data_driven';
  description: string;
}

export interface AttributionAnalysis {
  model: AttributionModel;

  dateRange: DateRange;

  conversions: number;
  revenue: Money;

  byChannel: ChannelAttribution[];
  byContent: ContentAttribution[];
  byCampaign: CampaignAttribution[];
  byCreator: CreatorAttribution[];

  paths?: ConversionPath[];
}

export interface ChannelAttribution {
  channel: string;
  conversions: number;
  revenue: Money;
  percentage: number;
  assistedConversions: number;
}

export interface ContentAttribution {
  contentId: UUID;
  conversions: number;
  revenue: Money;
  percentage: number;
}

export interface CampaignAttribution {
  campaignId: UUID;
  campaignName: string;
  conversions: number;
  revenue: Money;
  percentage: number;
  roi: number;
}

export interface CreatorAttribution {
  creatorId: UUID;
  creatorName: string;
  conversions: number;
  revenue: Money;
  percentage: number;
}

export interface ConversionPath {
  id: UUID;
  touchpoints: PathTouchpoint[];
  conversionValue: Money;
  timeToConvert: number;
}

export interface PathTouchpoint {
  timestamp: ISODateString;
  channel: string;
  source?: string;
  contentId?: UUID;
  campaignId?: UUID;
}

// Alerts
export interface Alert extends AuditableEntity {
  organizationId: UUID;

  name: string;
  description?: string;

  status: 'active' | 'paused' | 'triggered' | 'resolved';

  condition: AlertCondition;

  actions: AlertAction[];

  cooldownMinutes: number;

  lastTriggeredAt?: ISODateString;
  triggerCount: number;
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'change_pct';
  threshold: number;

  timeWindow?: number;
  granularity?: TimeGranularity;

  filters?: Record<string, unknown>;
}

export interface AlertAction {
  type: 'email' | 'slack' | 'webhook' | 'in_app';

  recipients?: string[];
  webhookUrl?: string;
  slackChannel?: string;

  messageTemplate?: string;
}

export interface AlertEvent extends BaseEntity {
  alertId: UUID;

  triggeredAt: ISODateString;
  resolvedAt?: ISODateString;

  metricValue: number;
  threshold: number;

  notificationsSent: { type: string; recipient: string; sentAt: ISODateString }[];
}

// Real-time Analytics
export interface RealtimeMetrics {
  timestamp: ISODateString;

  activeUsers: number;
  pageViews: number;
  events: number;

  topPages: { path: string; views: number }[];
  topEvents: { name: string; count: number }[];
  topReferrers: { source: string; users: number }[];
  topCountries: { country: string; users: number }[];

  recentEvents: RealtimeEvent[];
}

export interface RealtimeEvent {
  id: UUID;
  timestamp: ISODateString;
  eventType: string;
  userId?: UUID;
  sessionId: string;
  properties?: Record<string, unknown>;
}
