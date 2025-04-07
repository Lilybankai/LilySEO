/**
 * Interface for audit issue data
 */
export interface AuditIssue {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low' | 'info';
  category: string;
  examples?: string[];
  urls?: string[];
  impact?: number;
}

/**
 * Interface for audit strength data
 */
export interface AuditStrength {
  id: string;
  title: string;
  description: string;
  category: string;
}

/**
 * Interface for audit category scores
 */
export interface CategoryScores {
  [category: string]: number;
}

/**
 * Interface for audit report data
 */
export interface AuditReport {
  overall_score: number;
  category_scores: CategoryScores;
  issues: AuditIssue[];
  strengths: AuditStrength[];
  created_at: string;
  updated_at: string;
}

/**
 * Interface for project data
 */
export interface Project {
  id: string;
  name: string;
  domain: string;
  created_at: string;
  updated_at: string;
}

/**
 * Audit data type definitions for use across the application
 */

export interface AuditData {
  id: string;
  url: string;
  domain: string;
  createdAt: string;
  updatedAt: string;
  score?: number;
  status: 'completed' | 'pending' | 'failed';
  errors?: string[];
  results?: {
    seo?: {
      issues?: Array<{
        id: string;
        title: string;
        description: string;
        severity: 'critical' | 'warning' | 'info';
        category: string;
        impact?: number;
      }>;
      score?: number;
      categories?: Record<string, number>;
    };
    performance?: {
      score?: number;
      metrics?: Record<string, number>;
    };
    accessibility?: {
      score?: number;
      issues?: Array<{
        id: string;
        title: string;
        description: string;
        severity: string;
      }>;
    };
    bestPractices?: {
      score?: number;
      issues?: Array<{
        id: string;
        title: string;
        description: string;
        severity: string;
      }>;
    };
  };
  metadata?: {
    keywords?: Array<{
      keyword: string;
      volume: number;
      position?: number;
      difficulty?: number;
    }>;
    backlinks?: {
      count: number;
      domains: number;
      quality?: number;
    };
    competitors?: Array<{
      domain: string;
      score?: number;
      backlinks?: number;
      keywords?: number;
    }>;
  };
} 