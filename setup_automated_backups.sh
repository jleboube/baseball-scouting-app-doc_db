#!/bin/bash

# Setup automated daily backups using cron
# Run this script once to set up automatic backups

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup_database.sh"

# Make backup script executable
chmod +x "$BACKUP_SCRIPT"

# Create cron job for daily backups at 2 AM
CRON_JOB="0 2 * * * $BACKUP_SCRIPT"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$BACKUP_SCRIPT"; then
    echo "Backup cron job already exists."
else
    # Add cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "Daily backup scheduled for 2:00 AM"
    echo "Cron job added: $CRON_JOB"
fi

echo "Automated backup setup complete!"
echo ""
echo "To verify cron job: crontab -l"
echo "To remove cron job: crontab -e (then delete the line)"
echo ""
echo "Manual backup: $BACKUP_SCRIPT"