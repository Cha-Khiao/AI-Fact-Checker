export type ScoreLevel = 1 | 2 | 3 | 4 | 5;

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
}

export interface VerdictData {
  score: ScoreLevel;
  summary: string;
  supported_points: string[];
  conflicting_points: string[];
  comparative_analysis: string;
  is_error?: boolean;
  is_rejected?: boolean;
}

export interface FactCheckResult {
  status: string;
  input: {
    content: string;
    method: "Direct Text" | "URL Link";
    original_url?: string;
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
