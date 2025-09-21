# Email Signature Test Snippet

## Gmail Implementation (Developer Tools Method)

### Step-by-Step Instructions:
1. **Open Gmail** in Chrome or Firefox
2. **Open Developer Tools**: Press `F12` or right-click and select "Inspect"
3. **Navigate to Settings**: Click the gear icon → "See all settings"
4. **Go to Signature Section**: Scroll down to "General" tab → "Signature" section
5. **Open Signature Editor**: Click in the signature text area
6. **Inspect Element**: In Developer Tools, press `Ctrl+Shift+C` (or `Cmd+Shift+C` on Mac)
7. **Click the Signature Box**: This will highlight the signature textarea in the Elements panel
8. **Edit HTML**: Right-click the highlighted element → "Edit as HTML"
9. **Paste Signature Code**: Replace the content with the HTML from `Email-Signature.html`
10. **Save**: Click "Save Changes" at the bottom

### Alternative Method (Console):
```javascript
// In Gmail Developer Tools Console:
document.querySelector('[data-testid="signature-editor"]').innerHTML = `[PASTE_HTML_HERE]`;
```

## Outlook Implementation

### Step-by-Step Instructions:
1. **Open Outlook** (desktop application)
2. **Access Options**: File → Options → Mail → Signatures
3. **Create New Signature**: Click "New" and name your signature
4. **Switch to HTML Mode**: In the signature editor, click the `</>` button (HTML mode)
5. **Paste HTML Code**: Replace all content with the HTML from `Email-Signature.html`
6. **Set Default**: Choose this signature as default for new messages and replies
7. **Save**: Click "OK" to save changes

### For Outlook Web:
1. **Open Outlook.com** in browser
2. **Go to Settings**: Gear icon → "View all Outlook settings"
3. **Mail → Layout**: Select "Mail" → "Layout"
4. **Signature**: Scroll to "Email signature" section
5. **Paste HTML**: Use the HTML code from `Email-Signature.html`
6. **Save**: Click "Save"

## Apple Mail Implementation

### Step-by-Step Instructions:
1. **Open Apple Mail**
2. **Access Preferences**: Mail → Preferences (or Cmd+,)
3. **Signatures Tab**: Click "Signatures" tab
4. **Create New**: Click "+" to create new signature
5. **Paste HTML**: Copy the HTML from `Email-Signature.html` and paste
6. **Set Default**: Drag the signature to "Default signature" for new messages
7. **Save**: Close preferences (changes auto-save)

## Testing Your Signature

### Before Sending:
1. **Send Test Email**: Send an email to yourself
2. **Check Different Clients**: Test in Gmail, Outlook, Apple Mail, mobile apps
3. **Verify Links**: Click all links to ensure they work
4. **Check Images**: Ensure logo displays correctly
5. **Test Responsive**: View on mobile device

### Common Issues & Solutions:

**Images Not Showing:**
- Ensure logo URL is publicly accessible
- Use absolute URLs (https://...)
- Check image file size (keep under 1MB)

**Layout Broken:**
- Some email clients strip CSS
- The table-based layout should handle this
- Test in multiple email clients

**Font Issues:**
- Signature uses system fonts for compatibility
- Arial, Helvetica, sans-serif fallback stack

**Dark Mode:**
- High contrast colors ensure readability
- Test in both light and dark email themes

## Customization Checklist

Before using the signature, ensure you've replaced:
- [ ] `{{FULL_NAME}}` with your name
- [ ] `{{TITLE}}` with your job title
- [ ] `{{PHONE}}` with your phone number
- [ ] `{{EMAIL}}` with your email address
- [ ] `{{WEBSITE}}` with your website URL
- [ ] `{{LOGO_URL}}` with your logo image URL

## Brand Compliance

The signature follows Cochran Films brand guidelines:
- ✅ Uses brand colors (#FFB200, #000000, #FFFFFF)
- ✅ Includes "Atlanta's Full-Stack Media Powerhouse" tagline
- ✅ Features all social media platforms
- ✅ Includes "Book a Discovery Call" CTA
- ✅ Professional legal disclaimer included 