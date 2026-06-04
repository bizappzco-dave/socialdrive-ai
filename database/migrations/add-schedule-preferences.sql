-- Add schedule preferences to clients table
-- For Social-Drive automated posting

ALTER TABLE clients 
ADD COLUMN default_schedule_type TEXT DEFAULT 'mwf' CHECK (default_schedule_type IN ('mwf', 'daily')),
ADD COLUMN default_posting_time TIME DEFAULT '10:00:00',
ADD COLUMN schedule_randomization INTEGER DEFAULT 30 CHECK (schedule_randomization >= 0 AND schedule_randomization <= 120);

-- Add comment
COMMENT ON COLUMN clients.default_schedule_type IS 'Mon/Wed/Fri or Daily posting';
COMMENT ON COLUMN clients.default_posting_time IS 'Base posting time (e.g., 10:00 AM)';
COMMENT ON COLUMN clients.schedule_randomization IS 'Minutes of variation for anti-bot detection (±30 min default)';

-- Update existing clients with defaults
UPDATE clients SET 
  default_schedule_type = 'mwf',
  default_posting_time = '10:00:00',
  schedule_randomization = 30
WHERE default_schedule_type IS NULL;
