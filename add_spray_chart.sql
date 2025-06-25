-- Add spray chart image column to scouting_reports table
ALTER TABLE scouting_reports ADD COLUMN IF NOT EXISTS spray_chart_image VARCHAR(255);