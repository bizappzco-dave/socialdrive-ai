# Backup Guide - SocialDrive AI

**Last Updated:** 2026-05-02
**Status:** ✅ Active - Daily backups configured

---

## ✅ Your Current Setup

**Configured:** 2026-05-02 08:26

| Component | Location | Details |
|-----------|----------|---------|
| **Backup Repo** | `/home/dpmcg/backups/socialdrive` | Encrypted Restic repo |
| **Script** | `/home/dpmcg/bin/backup-socialdrive.sh` | Runs daily at 2 AM |
| **Log File** | `/home/dpmcg/backups/socialdrive-backup.log` | Backup logs |
| **Password** | `/home/dpmcg/.restic-password` | ⚠️ BACK THIS UP! |
| **Secure Backup** | `/home/dpmcg/backups/secure/.env.local.backup` | API keys backup |
| **Schedule** | Cron: `0 2 * * *` | Daily at 2:00 AM |
| **Retention** | 7 daily, 4 weekly, 12 monthly | Auto-cleanup |

### Quick Commands

```bash
# View snapshots
restic -r /home/dpmcg/backups/socialdrive --password-file /home/dpmcg/.restic-password snapshots

# Restore latest
restic -r /home/dpmcg/backups/socialdrive --password-file /home/dpmcg/.restic-password restore latest --target /restore/path

# Manual backup
/home/dpmcg/bin/backup-socialdrive.sh

# View logs
tail -20 /home/dpmcg/backups/socialdrive-backup.log
```

### Test Restore (Verified ✅)
```bash
restic -r /home/dpmcg/backups/socialdrive --password-file /home/dpmcg/.restic-password restore latest --target /tmp/restore-test
# Result: 88 files/dirs (535.645 KiB) restored successfully
```

---

## Critical Files to Backup

###  **Tier 1: Must Backup (Business Critical)**

These files contain your actual business data and configuration:

```
socialdrive-ai/
├── .env.local                    # ⚠️ API keys, secrets (DO NOT commit to git)
├── src/lib/supabase/queries.ts   # Database logic
├── src/lib/csv-export.ts         # CSV generation logic
├── src/app/api/                  # All API routes
└── src/app/dashboard/            # Dashboard + client UI
```

**Supabase Data (Cloud):**
- All client data, posts, preferences are in Supabase (cloud)
- No local backup needed, but export periodically for safety

**Google Drive:**
- Client brand context files
- Generated images (if stored locally first)

---

### 📋 **Tier 2: Should Backup (Project Configuration)**

```
socialdrive-ai/
├── package.json                  # Dependencies
├── next.config.mjs               # Next.js config
├── tailwind.config.ts            # Tailwind config
├── tsconfig.json                 # TypeScript config
├── components.json               # shadcn/ui config
├── src/components/               # UI components
├── src/lib/                      # Utility functions
└── src/types/                    # TypeScript types
```

---

### 📝 **Tier 3: Nice to Have (Documentation)**

```
socialdrive-ai/
├── README.md
├── BUILD-UPDATE-*.md
├── PROGRESS.md
├── MODEL-STRATEGY.md             # Model usage guide
├── BACKUP-GUIDE.md               # This file
└── docs/                         # Any documentation
```

---

## What NOT to Backup

```
socialdrive-ai/
├── node_modules/                 # Reinstall with `npm install`
├── .next/                        # Build artifacts (regenerated)
├── .git/                         # Already in git
└── *.log                         # Log files
```

---

## Backup Strategy Options (Linux)

### Option 1: **Restic** (Recommended ⭐)

**Why:** Encrypted, deduplicated, works with cloud storage, simple

**Install:**
```bash
sudo apt install restic
```

**Setup:**
```bash
# Initialize repository (local or remote)
restic init --repo /path/to/backup
# Or with cloud (Backblaze B2, S3, etc.)
restic init --repo s3:s3.amazonaws.com/bucket-name/backup
```

**Backup Script** (`/usr/local/bin/backup-socialdrive.sh`):
```bash
#!/bin/bash

REPO="/mnt/backup-drive/socialdrive-backup"
PASSWORD_FILE="/home/dpmcg/.restic-password"
SOURCE="/home/dpmcg/.openclaw/workspace/socialdrive-ai"

# Backup
restic -r $REPO --password-file $PASSWORD_FILE backup $SOURCE

# Forget old snapshots (keep 7 daily, 4 weekly, 12 monthly)
restic -r $REPO --password-file $PASSWORD_FILE forget \
  --keep-daily 7 \
  --keep-weekly 4 \
  --keep-monthly 12 \
  --prune
```

**Automate with Cron:**
```bash
# Edit crontab
crontab -e

# Add: Daily at 2 AM
0 2 * * * /usr/local/bin/backup-socialdrive.sh >> /var/log/socialdrive-backup.log 2>&1
```

**Restore:**
```bash
# List snapshots
restic -r /mnt/backup-drive/socialdrive-backup snapshots

# Restore latest
restic -r /mnt/backup-drive/socialdrive-backup restore latest --target /restore/path

# Restore specific snapshot
restic -r /mnt/backup-drive/socialdrive-backup restore <snapshot-id> --target /restore/path
```

---

### Option 2: **Rsync** (Simple, Fast)

**Why:** Built-in, fast, simple mirror backup

**Backup Script** (`/usr/local/bin/rsync-backup.sh`):
```bash
#!/bin/bash

SOURCE="/home/dpmcg/.openclaw/workspace/socialdrive-ai"
DEST="/mnt/backup-drive/socialdrive-backup"
EXCLUDE_FILE="/home/dpmcg/.openclaw/workspace/socialdrive-ai/.backup-exclude"

rsync -av --delete \
  --exclude-from=$EXCLUDE_FILE \
  $SOURCE $DEST
```

**Exclude File** (`.backup-exclude`):
```
node_modules/
.next/
.git/
*.log
```

**Automate with Cron:**
```bash
# Daily at 2 AM
0 2 * * * /usr/local/bin/rsync-backup.sh
```

**Restore:**
```bash
# Just copy back
rsync -av /mnt/backup-drive/socialdrive-backup /home/dpmcg/.openclaw/workspace/
```

---

### Option 3: **Timeshift** (System Snapshots)

**Why:** System-wide snapshots, easy rollback, GUI available

**Install:**
```bash
sudo apt install timeshift
```

**Setup:**
```bash
# Run GUI
sudo timeshift-launcher

# Or CLI
sudo timeshift --create --comments "SocialDrive Backup"
```

**Note:** Timeshift is for **system files**, not user data. Use with Restic/Rsync.

---

### Option 4: **Duplicati** (Encrypted Cloud Backup)

**Why:** Encrypted, supports many cloud providers, web UI

**Install:**
```bash
# Download from https://www.duplicati.com
# Or via snap
sudo snap install duplicati
```

**Setup:**
- Web UI at `http://localhost:8200`
- Configure backup source, destination (S3, Google Drive, etc.)
- Set encryption password
- Schedule automatic backups

---

## My Recommendation

### **For Your Setup:**

**Use Restic + Cloud Storage**

```bash
# 1. Install Restic
sudo apt install restic

# 2. Create password file
echo "your-strong-password" > ~/.restic-password
chmod 600 ~/.restic-password

# 3. Initialize backup (local external drive)
restic init --repo /mnt/external-drive/socialdrive-backup

# 4. Create backup script (see above)
sudo nano /usr/local/bin/backup-socialdrive.sh
sudo chmod +x /usr/local/bin/backup-socialdrive.sh

# 5. Test backup
/usr/local/bin/backup-socialdrive.sh

# 6. Automate with cron
crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-socialdrive.sh
```

**Optional: Add Cloud Backup**
```bash
# Use Backblaze B2 (cheap: $0.005/GB/month)
# Or AWS S3, Wasabi, etc.

restic init --repo s3:s3.backblazeb2.com/your-bucket/socialdrive-backup
```

---

## Emergency Recovery Plan

### If PC Dies:

1. **Get new machine** (or temporary)
2. **Install Node.js, Git**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt install -y nodejs git
   ```
3. **Clone/restore code**
   ```bash
   git clone <your-repo>
   # Or restore from backup
   restic -r <backup-repo> restore latest --target ~/workspace
   ```
4. **Restore .env.local** (from secure backup)
   ```bash
   cp /backup/.env.local socialdrive-ai/
   ```
5. **Install dependencies**
   ```bash
   cd socialdrive-ai
   npm install
   ```
6. **Verify Supabase connection** (cloud data is safe)
7. **Start dev server**
   ```bash
   npm run dev
   ```

---

## What's Already Safe

✅ **Supabase Database** - Cloud-hosted, automatic backups  
✅ **Google Drive** - Client files stored in cloud  
✅ **Git Repository** - If you push to GitHub/GitLab  

---

## What's NOT Safe (Backup These!)

❌ **`.env.local`** - API keys, secrets (NOT in git)  
❌ **Local files** - Any downloaded images, CSVs  
❌ **Ollama models** - Re-downloadable, but time-consuming  
❌ **OpenClaw workspace** - Your SOUL.md, MEMORY.md, etc.  

---

## Quick Checklist

- [ ] Install Restic
- [ ] Create backup script
- [ ] Test backup + restore
- [ ] Automate with cron
- [ ] Backup `.env.local` separately (encrypted)
- [ ] Push code to Git (private repo)
- [ ] Document recovery steps (this file!)
- [ ] Test recovery on another machine (yearly)

---

**Update this file when your backup strategy changes.**
