export type CaptionStyle = 'short_statement' | 'mission_post' | 'brand_teaser';

export interface Post {
  id: string;
  client_id: string;
  image_url: string;
  image_filename?: string;
  caption_text: string;
  caption_style: CaptionStyle;
  caption_length: number;
  hashtag_count: number;
  hashtags?: string[];
  emoji_count: number;
  emojis_used?: string[];
  voice_note_transcript?: string;
  generated_at: string;
  
  // Curation tracking
  selected: boolean;
  selected_at?: string;
  deleted: boolean;
  deleted_at?: string;
  edited: boolean;
  edited_caption_text?: string;
  edited_at?: string;
  saved_for_later: boolean;
  
  // RSS/Scheduling tracking
  rss_added: boolean;
  rss_added_at?: string;
  scheduled_for?: string;
  published_at?: string;
  
  // Engagement (if pulled from Sociamonials)
  engagement_likes?: number;
  engagement_comments?: number;
  engagement_shares?: number;
  engagement_saves?: number;
  
  // Ads module (future v2)
  is_ad_candidate: boolean;
  ad_performance_score?: number;
  audience_signals?: Record<string, any>;
  conversion_intent?: Record<string, any>;
  
  created_at: string;
  updated_at: string;
}

export type PostStatus = 'pending' | 'selected' | 'scheduled' | 'published' | 'deleted';
