export interface Competitor {
  id: string;
  client_id: string;
  account_name: string;
  platform: 'instagram' | 'facebook' | 'tiktok' | 'linkedin';
  profile_url?: string;
  instagram_handle?: string;
  is_active: boolean;
  added_at: string;
  last_analyzed?: string;
}

export interface CompetitorPost {
  id: string;
  competitor_id: string;
  post_url?: string;
  post_type: 'image' | 'video' | 'carousel' | 'reel';
  caption_text?: string;
  caption_length: number;
  hashtag_count: number;
  hashtags?: string[];
  posted_at?: string;
  likes_count?: number;
  comments_count?: number;
  fetched_at: string;
}

export interface IndustryTrend {
  id: string;
  client_id: string;
  industry_category: string;
  trend_report: {
    winning_formats?: string[];
    trending_hashtags?: string[];
    caption_patterns?: string[];
    recommended_actions?: string[];
  };
  generated_at: string;
  valid_through?: string;
}
