export interface Client {
  id: string;
  user_id: string;
  name: string;
  industry?: string;
  drive_folder_id?: string;
  drive_folder_url?: string;
  rss_feed_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrandContext {
  id: string;
  client_id: string;
  brand_name?: string;
  industry?: string;
  location?: string;
  website?: string;
  target_audience?: string;
  tone?: string;
  personality?: string;
  avoid_words?: string[];
  key_messages?: string[];
  products_services?: string[];
  usps?: string[];
  cta?: string;
  hashtags?: string[];
  emoji_style?: string;
  post_length_pref?: string;
  platforms?: string[];
  brand_history?: string;
  sample_posts?: string[];
  competitor_brands?: string[];
  competitors_to_monitor?: CompetitorInfo[];
  file_content?: string;
  created_at: string;
  updated_at: string;
}

export interface CompetitorInfo {
  name: string;
  handle?: string;
  url?: string;
}
