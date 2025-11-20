# Admin Token Management Guide

**Last Updated:** November 2025
**Purpose:** Securely invite and manage administrator accounts using registration tokens

---

## What Are Admin Tokens?

Admin tokens are **secure, time-limited invitation links** that allow you to grant administrator privileges to new users.

**Key Features:**
- **Email-locked:** Each token is tied to a specific email address
- **Time-limited:** Automatically expire after set number of days
- **Single-use:** Cannot be reused after account creation
- **Trackable:** Monitor status (Active, Used, Expired)

**Why use tokens instead of manual admin grants?**
- More secure than sharing admin credentials
- Prevents unauthorized admin access
- Creates audit trail of who was invited when
- Easy to revoke by deleting unused tokens

---

## Token Lifecycle States

### Active (Green Badge)
**Status:** Token is valid and has not been used yet

**What this means:**
- Token was recently created
- Invitation link can still be used
- Expiration date has not passed
- No account has been created with this token

**Actions you can take:**
- Share the registration link with the intended recipient
- Delete the token if you change your mind
- Monitor when it gets used or expires

### Used (Blue Badge)
**Status:** Token was successfully consumed to create an admin account

**What this means:**
- Someone created an account using this token
- That account now has admin privileges
- Token is no longer valid for additional uses
- Check "Used" column for timestamp

**Actions you can take:**
- Review who used the token (email in table)
- Verify the new admin appears in your admin list
- Delete the token record for cleanup (safe to do)

### Expired (Grey Badge)
**Status:** Token expiration date passed before it was used

**What this means:**
- Time limit ran out (1, 7, or 30 days depending on settings)
- Registration link no longer works
- No account was created
- Invitation was never accepted

**Actions you can take:**
- Create a new token for the same email if still needed
- Delete the expired token record
- Follow up with intended recipient to see why they didn't register

---

## Creating an Admin Token

**Access:** Admin Panel > Administration > Admin Tokens

### Step-by-Step Process

1. **Click "Create Token"** button (top right)
2. **Enter recipient's email address**
   - Use the exact email they will register with
   - Email cannot be changed after token creation
   - Double-check for typos
3. **Choose expiration period:**
   - **1 day:** For immediate, urgent invitations
   - **7 days:** Standard option for most cases (recommended)
   - **30 days:** For non-urgent or external collaborators
4. **Click "Generate Token"**
5. **Copy the registration link** that appears
6. **Share the link securely** with the recipient

### What the Registration Link Looks Like

```
https://sistahology.com/register?token=abc123xyz456...
```

**Important:** The `token` parameter is a long random string. Do not modify or truncate it.

---

## Sharing Admin Tokens Securely

### Recommended Secure Channels

**Best options:**
- Encrypted email (ProtonMail, Tutanota)
- Direct message in encrypted chat (Signal, WhatsApp)
- Password manager shared vault
- In-person or phone call (read token aloud)

**Avoid these channels:**
- Public social media posts
- Unencrypted email if possible
- SMS text messages (can be intercepted)
- Shared documents with public links

### Security Best Practices

**1. Use Short Expiration Times**
- Default to 7 days for most invitations
- Use 1 day for time-sensitive or high-security situations
- Only use 30 days if recipient has limited availability

**2. Verify Recipient Identity**
- Confirm email address via separate channel
- Call or message to verify they expect the invitation
- Watch for typos in email addresses

**3. Delete Unused Tokens**
- If invitation plans change, delete the token immediately
- Regularly clean up expired tokens
- Revoke access by deleting active tokens if needed

**4. Monitor Token Usage**
- Check "Used" column to see when accounts were created
- Verify new admins appear in your user list
- Follow up if token expires without being used

**5. Limit Token Distribution**
- Only create tokens for people who genuinely need admin access
- Consider whether user-level access is sufficient first
- Keep admin team small for security

---

## For New Users: Using an Admin Token

### If You're a New User (No Account Yet)

1. **Click the registration link** you received
2. **You'll see a purple "Admin Registration" banner** at the top
   - Confirms you're registering as an admin
   - Shows the email address locked to this token
3. **Fill in the registration form:**
   - Full name
   - Email (pre-filled and locked - you cannot change it)
   - Password (minimum 6 characters)
   - Confirm password
4. **Click "Create Account"**
5. **You're automatically logged in with admin privileges**
6. **Access Admin Panel** via the navigation menu

**Important notes:**
- Email field will be disabled (greyed out)
- If email is wrong, contact the person who sent the token
- Password must match confirmation field
- Account is created with admin role immediately

### If You're an Existing User (Already Have Account)

1. **Click the registration link** you received
2. **You'll see a blue banner** saying "Already have an account?"
3. **Click "Click here to login instead"** link in the banner
4. **You'll be redirected to the login page**
5. **Login with your existing password**
6. **Admin role is automatically added to your account**
7. **Refresh the page** and you'll see Admin Panel link

**Important notes:**
- You must login with the email that matches the token
- Your existing password still works
- No need to create a new account
- Admin access is granted upon successful login

---

## Monitoring Active Tokens

### Tokens Dashboard Stats

At the top of the Admin Tokens page, you'll see three stat cards:

**Active Tokens (Green)**
- Number of valid, unused tokens
- These can still be used to create admin accounts
- Monitor to ensure no tokens are forgotten or leaked

**Used Tokens (Blue)**
- Number of successfully consumed tokens
- Represents admin accounts created via tokens
- Safe to delete these records after verification

**Expired Tokens (Grey)**
- Number of tokens that expired before use
- Indicates invitations that were not accepted
- Safe to delete these records for cleanup

### Tokens Table Columns

**Email:** The email address this token is locked to
**Status:** Active, Used, or Expired (color-coded badge)
**Created:** When token was generated
**Expires:** When token will/did expire
**Used:** When token was consumed (blank if unused)
**Actions:** Delete button

---

## Troubleshooting

### "Invalid or Expired Token" Error

**Recipient sees this message when clicking registration link**

**Possible causes:**
- Token expiration date has passed
- Token was already used to create an account
- Token was deleted by admin
- URL was truncated or modified

**Solutions:**
- Create a new token for the same email
- Verify recipient doesn't already have an admin account
- Check token status in admin table
- Ensure full URL was copied (no line breaks)

### "Email Must Match Invited Email" Error

**Recipient tries to use different email than token specifies**

**Cause:**
- Token is locked to specific email address
- Recipient entered different email in form

**Solution:**
- Tell recipient to use the email shown in purple banner
- If wrong email was used for token, delete it and create new one
- Recipient cannot change email field (it's locked/disabled)

### "Failed to Create Token" Error

**Admin sees this when generating new token**

**Possible causes:**
- Invalid email format
- Database connection issue
- Permissions problem

**Solutions:**
- Check email address has valid format (user@domain.com)
- Try again after a few seconds
- Check browser console for detailed error
- Contact developer if problem persists

### Can't Delete Token

**Delete button doesn't work or shows error**

**Possible causes:**
- Token is currently in use
- Database error
- Permission issue

**Solutions:**
- Wait a few moments and try again
- Refresh the page and retry
- Check browser console for errors
- Verify you have admin permissions

### User Registered But Not Admin

**Account was created but no admin access**

**Possible causes:**
- Token consumption failed silently
- User didn't use the token link
- Database error during role grant

**Solutions:**
- Check if token shows as "Used" in admin table
- Create new token and have user login (existing user flow)
- Manually grant admin via developer assistance
- Check browser console during registration for errors

---

## Common Scenarios

### Scenario 1: Inviting a Co-Admin Who's Never Used the Site

**Steps:**
1. Create token with their email, 7-day expiration
2. Send token link via encrypted email
3. Recipient creates account via link
4. Token marked as "Used"
5. Verify new admin appears in your admin list
6. Delete used token record (optional cleanup)

### Scenario 2: Granting Admin Access to Existing User

**Steps:**
1. Create token with their existing email, 7-day expiration
2. Send token link and explain to click "login instead" banner
3. Recipient logs in with existing password
4. Token marked as "Used"
5. Recipient refreshes and sees Admin Panel
6. Delete used token record (optional cleanup)

### Scenario 3: Urgent Same-Day Admin Grant

**Steps:**
1. Create token with 1-day expiration
2. Call or message recipient immediately
3. Walk them through registration process
4. Monitor token table to see when used
5. Confirm admin access works
6. Delete token after successful use

### Scenario 4: Invitation Plans Changed

**Steps:**
1. Go to Admin Tokens table
2. Find the active token by email
3. Click "Delete" button
4. Confirm deletion
5. Token is immediately invalidated
6. Registration link no longer works

### Scenario 5: Token Expired Before Use

**Steps:**
1. Contact recipient to understand why they didn't register
2. Create new token with same email
3. Use longer expiration (30 days) if availability is issue
4. Resend link via secure channel
5. Delete old expired token record
6. Follow up to ensure timely use

---

## Security Warnings

**Never do these:**
- Share tokens in public forums or social media
- Email tokens to wrong recipient
- Create tokens with long expirations by default
- Leave unused tokens active indefinitely
- Share your own admin password instead of using tokens

**Always do these:**
- Verify recipient identity before creating token
- Use shortest practical expiration time
- Delete tokens if plans change
- Monitor token usage regularly
- Use encrypted communication channels

**Red flags to watch for:**
- Tokens being used from unexpected IP addresses
- Multiple tokens used simultaneously
- Tokens used immediately after creation (may indicate leak)
- Tokens for unknown email addresses

---

## Best Practices Checklist

Before creating a token:
- [ ] Verified recipient needs admin access (not just user access)
- [ ] Confirmed correct email address
- [ ] Chosen appropriate expiration time
- [ ] Identified secure channel for sharing link

After creating a token:
- [ ] Copied full registration URL
- [ ] Shared via secure channel
- [ ] Notified recipient to expect invitation
- [ ] Documented who was invited and when

After token is used:
- [ ] Verified new admin can access Admin Panel
- [ ] Confirmed admin appears in user list
- [ ] Tested admin can perform expected tasks
- [ ] Deleted token record (optional)

Regular maintenance:
- [ ] Review active tokens weekly
- [ ] Delete expired tokens monthly
- [ ] Audit who has admin access quarterly
- [ ] Update this guide with lessons learned

---

## Getting Help

**For token-related issues:**
- Check this guide's troubleshooting section
- Review browser console for error messages
- Verify email addresses match exactly (case-insensitive)
- Try different browser or clear cache

**For security concerns:**
- If you suspect token was leaked, delete it immediately
- Create new token with different expiration
- Review who has accessed admin panel recently
- Contact your security team or developer

**For technical support:**
- Document exact error message
- Note when error occurs (creation, usage, deletion)
- Provide screenshots if possible
- Include browser and OS information
