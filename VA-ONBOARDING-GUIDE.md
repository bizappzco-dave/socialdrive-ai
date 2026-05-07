# VA Onboarding Guide - SocialDrive AI

**Welcome to SocialDrive AI!** This is your complete guide to onboarding new clients.

---

## 🚀 Quick Start (5 Minutes Per Client)

### **Step 1: Access the Dashboard**

Go to: `https://socialdrive.ai/agency/clients` (or localhost URL during testing)

---

### **Step 2: Add New Client**

1. Click **"Add Client"** button (top right)
2. Fill in:
   - **Client/Business Name:** "No Label Barber"
   - **Industry:** Select from dropdown (Barber/Salon, Retail, etc.)
3. Click **"Create Client & Generate Upload Link"**

✅ **Done!** The system automatically creates the client AND generates their upload link.

---

### **Step 3: Send Upload Link to Client**

1. You'll see the client in the list with a **"Copy WhatsApp"** button
2. Click **"Copy WhatsApp"**
3. Paste into WhatsApp and send to client

**The message looks like this:**
```
Hi No Label Barber! 👋

Here's your personal content upload link:
https://socialdrive.ai/upload/abc123xyz

💡 Save this link! Use it whenever you want to upload new content.

Just upload your images and add a brief note about what you'd like to post. We'll handle the rest! ✨
```

---

## 📋 What Happens Next

### **Client Side:**

1. **Client clicks the link** → Sees upload page
2. **Uploads 5 images** (drag-drop or browse)
3. **Adds brief note:** "Sale this week - 20% off all services"
4. **Clicks "Submit for Review"**
5. **AI generates 15 posts** automatically (1-2 minutes)
6. **Client gets review link** (shown on success page)
7. **Client reviews posts:**
   - Clicks ❤️ heart to select favorites
   - Clicks 🗑️ trash to delete unwanted posts
8. **Clicks "Ready for Posting"**
9. **CSV downloads automatically**
10. **Client uploads CSV to Sociamonials** → Posts scheduled!

---

### **Your Side:**

**Monitor from Dashboard:**

- Go to `/agency/clients` anytime
- See which clients have been onboarded (green "Onboarded" badge)
- See which clients are pending (orange "Needs Onboarding" badge)
- Copy upload links anytime (they're permanent!)

---

## 🎯 Best Practices

### **When Onboarding:**

✅ **Use clear business names** - "No Label Barber" not "John's Shop"  
✅ **Select correct industry** - helps AI generate better content  
✅ **Test the link yourself first** - upload a test image to verify it works  
✅ **Save client's phone number** - for WhatsApp follow-up

### **When Client Has Issues:**

❓ **"Link doesn't work"** → Check they're using the exact URL (no typos)  
❓ **"Can't upload images"** → Check image format (JPG, PNG, WebP only)  
❓ **"AI generated weird posts"** → Review their brief, regenerate if needed  
❓ **"CSV won't upload to SM"** → Verify Sociamonials account is active

---

## 🔧 Troubleshooting

### **Upload Link Not Working**

1. Check the URL is correct (no missing characters)
2. Make sure dev server is running (if using localhost)
3. Try generating a new link (click "Generate Upload Link" again)

### **Client Can't See Their Posts**

1. Check submission status in database
2. Verify AI generation completed (should take 1-2 minutes)
3. Try refreshing the review page

### **CSV Export Fails**

1. Make sure client selected at least one post (heart icon)
2. Check Sociamonials format is correct (should be 21 columns)
3. Try different browser (Chrome recommended)

---

## 📊 Dashboard Features

### **Client List View**

- **Total Clients:** Shows all clients in system
- **Onboarded:** Clients who have upload links
- **Pending:** Clients needing onboarding

### **Client Actions**

| Status | Available Actions |
|--------|------------------|
| **Not Onboarded** | "Generate Upload Link" button |
| **Onboarded** | "Copy Link", "Copy WhatsApp", "View" |

---

## 💡 Pro Tips

1. **Bookmark the dashboard** - you'll use it daily
2. **Save client phone numbers** - in a spreadsheet or CRM
3. **Follow up after 24h** - "Did you get a chance to upload?"
4. **Monitor first upload** - make sure AI generates good content
5. **Keep the WhatsApp template** - consistency builds trust

---

## 🆘 When to Escalate

Contact David if:

- ❗ Client reports major bugs (upload fails, posts don't generate)
- ❗ AI generates inappropriate content
- ❗ Client wants custom features
- ❗ Technical issues you can't resolve

---

## 📝 Quick Reference

**Dashboard URL:** `/agency/clients`  
**Add Client URL:** `/agency/clients/add`  
**Upload Link Format:** `https://socialdrive.ai/upload/[32-char-token]`  
**Review Link Format:** `https://socialdrive.ai/review/[32-char-token]`

**Upload links are PERMANENT** - clients can reuse them forever!

---

## ✅ Onboarding Checklist

For each new client:

- [ ] Add client in dashboard
- [ ] Generate upload link
- [ ] Send WhatsApp message
- [ ] Wait for client to upload (24-48h)
- [ ] Follow up if no upload
- [ ] Monitor first submission quality
- [ ] Confirm client successfully published

---

**You're all set! Start onboarding clients!** 🎉

Questions? Ask David or check the full documentation in `CLIENT-UPLOAD-FLOW.md`.
