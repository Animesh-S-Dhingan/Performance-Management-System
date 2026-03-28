# 📬 Gmail + Slack Notification Setup Guide

This guide explains how to configure **Gmail email notifications** and **Slack webhook notifications** for the PMS Platform.

---

## 1. Gmail Setup (App Password)

Gmail requires you to use an **App Password** instead of your regular password for SMTP access.

### Steps:

1. **Enable 2-Factor Authentication** on your Google Account:
   - Go to → [myaccount.google.com/security](https://myaccount.google.com/security)
   - Turn on **2-Step Verification**

2. **Generate an App Password**:
   - Go to → [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Select app: **Mail**
   - Select device: **Other (Custom name)** → type "PMS Platform"
   - Click **Generate**
   - Copy the **16-character password** shown

3. **Set the environment variables** (create `.env` from `.env.example`):
   ```bash
   cd backend/
   cp .env.example .env
   ```
   Edit `.env`:
   ```
   EMAIL_HOST_USER=your-gmail@gmail.com
   EMAIL_HOST_PASSWORD=abcd efgh ijkl mnop   ← the 16-char app password (spaces OK)
   DEFAULT_FROM_EMAIL=PMS Platform <your-gmail@gmail.com>
   ```

4. **Load `.env`** before starting Django (install python-dotenv if needed):
   ```bash
   pip install python-dotenv
   ```
   Then add to the top of `gms/settings.py`:
   ```python
   from dotenv import load_dotenv
   load_dotenv()
   ```

---

## 2. Slack Webhook Setup

The PMS Platform sends rich Block Kit messages to Slack on:
- ✅ New user registration
- 🎯 New goal created
- ✅ Goal approved

### Steps:

1. **Create a Slack App**:
   - Go to → [api.slack.com/apps](https://api.slack.com/apps)
   - Click **Create New App** → **From scratch**
   - Name: `PMS Platform` | Workspace: your workspace
   - Click **Create App**

2. **Enable Incoming Webhooks**:
   - In your app's settings → **Incoming Webhooks** → Toggle **ON**
   - Click **Add New Webhook to Workspace**
   - Select the channel (e.g., `#hr-notifications` or `#general`)
   - Click **Allow**

3. **Copy the Webhook URL**:
   - It looks like: `https://hooks.slack.com/services/T.../B.../XXXXXXXX`

4. **Set the environment variable** in `.env`:
   ```
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/TXXXXXX/BXXXXXX/XXXXXXXXXX
   ```

---

## 3. Notifications Triggered

| Event | Email | Slack |
|---|---|---|
| User registers (signup) | ✅ Welcome email | ✅ New member alert |
| Goal created/assigned | ✅ Goal details email | ✅ Rich goal card |
| Goal approved | ❌ (in-app notification) | ✅ Approval message |

---

## 4. Testing Notifications

### Test Email (Django shell):
```bash
cd backend/
python manage.py shell
```
```python
from core.utils import send_custom_email
send_custom_email(
    subject="Test Email",
    template_name="emails/welcome_email.html",
    context={"user": type("U", (), {"first_name": "Test", "get_full_name": lambda self: "Test User", "email": "test@test.com", "role": "employee", "username": "testuser"})()},
    recipient_list=["your-email@gmail.com"]
)
```

### Test Slack:
```python
from core.utils import send_slack_notification
send_slack_notification("🧪 Test message from PMS Platform!")
```

---

## 5. Development Mode (No real emails)

To avoid sending real emails during development, set in `.env`:
```
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```
Emails will be printed to the terminal instead of sent.
