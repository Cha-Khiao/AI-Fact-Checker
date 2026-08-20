export type ScoreLevel = 1 | 2 | 3 | 4 | 5;

export interface SubClaimItem {
  claim_text: string;
  score: number;
  verdict_tier?: number;
  verdict_label: string;
  detail?: string;
}

export interface SecurityWarning {
  is_suspicious: boolean;
  risk_level: "HIGH" | "MEDIUM" | "LOW" | "SAFE";
  reasons: string[];
  is_official_authority?: boolean;
  authority_name?: string;
  clean_domain?: string;
}

export interface ReferenceItem {
  title: string;
  url?: string;
  href?: string;
  link?: string;
  pub_date?: string;
  snippet?: string;
  match_score?: number;
  relevance_pct?: number;
  source?: string;
  tier_label?: string;
  is_official_authority?: boolean;
  authority_name?: string;
  is_suspicious?: boolean;
}

export interface VerdictData {
  score: ScoreLevel;
  summary: string;
  supported_points: string[];
  conflicting_points: string[];
  comparative_analysis: string;
  disinformation_category?: string;
  disinformation_category_label?: string;
  sub_claims?: SubClaimItem[];
  security_warning?: SecurityWarning;
  is_error?: boolean;
  is_rejected?: boolean;
  timeline?: string;
  publish_date?: string;
  timestamp_display?: string;
}

export interface FactCheckResult {
  status: string;
  is_demo_mode?: boolean;
  input: {
    content: string;
    method: "Direct Text" | "URL Link";
    original_url?: string;
    timeline?: string;
    publish_date?: string;
    timestamp?: string;
    timestamp_display?: string;
  };
  verdict: VerdictData;
  references: ReferenceItem[];
  timing: Record<string, number>;
  execution_time_seconds: number;
}

export interface ProgressEventPayload {
  type: "progress" | "complete" | "error" | "ping";
  pct?: number;
  message?: string;
  data?: FactCheckResult;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  input_text: string;
  score: ScoreLevel;
  summary: string;
  ref_count: number;
}
