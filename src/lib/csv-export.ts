/**
 * Sociamonials CSV Export Generator
 * 
 * Generates CSV files compatible with Sociamonials bulk import format.
 * 
 * CSV Format:
 * Message,Link,ImageURL,VideoURL,Month,Day,Year,Hour,Minute,PinTitle,Category,Watermark,HashtagGroup,VideoThumbnailURL,CTAGroup,FirstComment,Story,PinBoard,AltText,PostPreset,TeamNote
 */

interface PostData {
  id: string
  caption_text: string
  image_url?: string      // For images only
  video_url?: string      // For videos/carousels
  post_type?: 'image' | 'carousel' | 'video'  // NEW: Upload type
  hashtags?: string[]
  selected_at?: string
}

interface ClientPreferences {
  preferred_days?: number[]  // 1-7 (Mon-Sun)
  preferred_hours?: string[] // ["11:00-13:00", "19:00-21:00"]
}

interface SociamonialsCSVRow {
  Message: string
  Link: string
  ImageURL: string
  VideoURL: string
  Month: string | number
  Day: string | number
  Year: string | number
  Hour: string | number
  Minute: string | number
  PinTitle: string
  Category: string
  Watermark: string
  HashtagGroup: string
  VideoThumbnailURL: string
  CTAGroup: string
  FirstComment: string
  Story: string
  PinterestBoard: string
  AltText: string
  PostPreset: string
  TeamNote: string
}

/**
 * Generate a random time within client's preferred hours
 */
function generateScheduledTime(preferences?: ClientPreferences): {
  month: number
  day: number
  year: number
  hour: number
  minute: number
} {
  const now = new Date()
  const future = new Date(now)
  
  // Default: schedule 1-7 days in future
  const daysAhead = Math.floor(Math.random() * 7) + 1
  future.setDate(future.getDate() + daysAhead)
  
  // Default: random time between 9am-5pm
  let hour = Math.floor(Math.random() * 8) + 9
  let minute = Math.floor(Math.random() * 60)
  
  // Use preferred hours if available
  if (preferences?.preferred_hours && preferences.preferred_hours.length > 0) {
    const timeRange = preferences.preferred_hours[Math.floor(Math.random() * preferences.preferred_hours.length)]
    const [startHour] = timeRange.split('-').map(h => parseInt(h))
    if (!isNaN(startHour)) {
      hour = startHour + Math.floor(Math.random() * 2) // Random within 2-hour window
    }
  }
  
  // Use preferred days if available
  if (preferences?.preferred_days && preferences.preferred_days.length > 0) {
    const preferredDay = preferences.preferred_days[Math.floor(Math.random() * preferences.preferred_days.length)]
    const currentDay = future.getDay() // 0=Sun, 1=Mon, etc.
    const dayDiff = preferredDay - currentDay
    if (dayDiff > 0) {
      future.setDate(future.getDate() + dayDiff)
    } else if (dayDiff < 0) {
      future.setDate(future.getDate() + dayDiff + 7)
    }
  }
  
  return {
    month: future.getMonth() + 1, // 1-12
    day: future.getDate(), // 1-31
    year: future.getFullYear(),
    hour: hour, // 1-24
    minute: minute, // 0-59
  }
}

/**
 * Escape CSV field (handle commas, quotes, newlines)
 */
function escapeCSVField(value: string): string {
  if (!value) return ''
  
  // If contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  
  return value
}

/**
 * Generate Sociamonials-compatible CSV from posts
 */
export function generateSociamonialsCSV(
  posts: PostData[],
  clientName: string,
  preferences?: ClientPreferences,
  options?: {
    scheduleType?: 'random' | 'specific' | 'draft'
    includeFirstComment?: boolean
    teamNote?: string
  }
): string {
  const headers: (keyof SociamonialsCSVRow)[] = [
    'Message', 'Link', 'ImageURL', 'VideoURL',
    'Month', 'Day', 'Year', 'Hour', 'Minute',
    'PinTitle', 'Category', 'Watermark', 'HashtagGroup',
    'VideoThumbnailURL', 'CTAGroup', 'FirstComment',
    'Story', 'PinterestBoard', 'AltText', 'PostPreset', 'TeamNote'
  ]
  
  const rows: string[] = []
  
  // Header row
  rows.push(headers.join(','))
  
  // Data rows
  posts.forEach((post, index) => {
    const schedule = options?.scheduleType === 'draft' 
      ? { month: '', day: '', year: '', hour: '', minute: '' }
      : generateScheduledTime(preferences)
    
    // Append hashtags to caption if they exist (with space separator)
    const fullCaption = post.hashtags && post.hashtags.length > 0
      ? `${post.caption_text} ${post.hashtags.join(' ')}`
      : post.caption_text
    
    // Handle different post types
    const isVideo = post.post_type === 'video' || post.post_type === 'carousel'
    const imageUrl = isVideo ? '' : (post.image_url || '')
    const videoUrl = isVideo ? (post.video_url || post.image_url || '') : ''
    
    const row: SociamonialsCSVRow = {
      Message: escapeCSVField(fullCaption),
      Link: '', // No external link by default
      ImageURL: imageUrl,
      VideoURL: videoUrl,
      Month: schedule.month,
      Day: schedule.day,
      Year: schedule.year,
      Hour: schedule.hour,
      Minute: schedule.minute,
      PinTitle: '',
      Category: escapeCSVField(clientName),
      Watermark: '',
      HashtagGroup: 'Default',
      VideoThumbnailURL: '',
      CTAGroup: '',
      FirstComment: options?.includeFirstComment ? 'Default' : '',
      Story: '',
      PinterestBoard: '',
      AltText: '',
      PostPreset: 'Default',
      TeamNote: options?.teamNote || (post.post_type ? `Type: ${post.post_type}` : '')
    }
    
    rows.push(
      Object.values(row).map(val => 
        val === '' ? '' : String(val)
      ).join(',')
    )
  })
  
  return rows.join('\n')
}

/**
 * Generate CSV filename with timestamp
 */
export function generateCSVFilename(clientName: string): string {
  const timestamp = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const safeName = clientName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  return `sociamonials_import_${safeName}_${timestamp}.csv`
}
