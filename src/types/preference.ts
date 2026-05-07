export interface ClientPreferences {
  client_id: string;
  
  // Caption style preferences (selection rates)
  preferred_caption_styles?: {
    short_statement?: number;
    mission_post?: number;
    brand_teaser?: number;
  };
  
  // Tone patterns
  liked_words?: string[];
  avoided_words?: string[];
  preferred_opening_styles?: string[];
  avoided_opening_styles?: string[];
  
  // Hashtag strategy
  optimal_hashtag_count?: number;
  preferred_hashtags?: string[];
  avoided_hashtags?: string[];
  
  // Emoji usage
  preferred_emojis?: string[];
  avoided_emojis?: string[];
  optimal_emoji_count?: number;
  
  // Post length
  optimal_post_length?: number;
  min_post_length?: number;
  max_post_length?: number;
  
  // Content type performance
  best_performing_content?: {
    [key: string]: number;
  };
  
  // Posting times
  preferred_days?: string[];
  preferred_hours?: string[];
  
  // Market intelligence (updated weekly)
  competitor_insights?: Record<string, any>;
  industry_benchmarks?: Record<string, any>;
  opportunity_gaps?: Record<string, any>;
  
  // Metadata
  total_posts_curated: number;
  last_updated: string;
  last_enriched?: string;
}
