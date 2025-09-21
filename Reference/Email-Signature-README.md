# Cochran Films Email Signature

## Customization Fields

Replace the following placeholders in `Email-Signature.html`:

### Personal Information
- `{{FULL_NAME}}` - Your full name (e.g., "Cody Cochran")
- `{{TITLE}}` - Your job title (e.g., "Founder, Cochran Films")
- `{{PHONE}}` - Your phone number (e.g., "(470) 420-2169")
- `{{EMAIL}}` - Your email address (e.g., "cody@cochranfilms.com")
- `{{WEBSITE}}` - Your website URL (e.g., "www.cochranfilms.com")
- `{{LOGO_URL}}` - URL to your logo image (should be ~120px width, retina-safe)

### Social Media Links (Already configured)
- LinkedIn: https://www.linkedin.com/company/cochranfilms
- Instagram: https://www.instagram.com/cochran.films
- YouTube: https://www.youtube.com/@cochranfilmsllc
- Facebook: https://www.facebook.com/cochranfilmsllc/

## Implementation Guides

### Gmail Implementation
1. Open Gmail in Chrome/Firefox
2. Press F12 to open Developer Tools
3. Go to Settings > General > Signature
4. Click the signature editor
5. Press Ctrl+Shift+I (or Cmd+Option+I on Mac) to open Elements panel
6. Find the signature textarea and paste the HTML code
7. Save the signature

### Outlook Implementation
1. Open Outlook
2. Go to File > Options > Mail > Signatures
3. Create a new signature
4. Click the HTML button (</>) in the signature editor
5. Paste the HTML code
6. Save the signature

### Apple Mail Implementation
1. Open Apple Mail
2. Go to Mail > Preferences > Signatures
3. Create a new signature
4. Copy the HTML code and paste it into the signature field
5. Save the signature

## Features

- **Responsive Design**: Adapts to mobile and desktop email clients
- **Brand Colors**: Uses Cochran Films brand colors (#FFB200, #000000, #FFFFFF)
- **Email-Client Safe**: Tables-based layout with inline CSS
- **Dark Mode Friendly**: High contrast design works in dark mode
- **Social Media Integration**: Inline SVG icons for all social platforms
- **CTA Integration**: "Book a Discovery Call" button linking to Google Forms
- **Legal Disclaimer**: Professional confidentiality notice included

## Technical Specifications

- **Max Width**: 600px (responsive)
- **Logo Size**: 120px width (retina-safe)
- **Font Stack**: Arial, Helvetica, sans-serif (email-client safe)
- **Brand Accent**: 4px left border in #FFB200
- **Social Icons**: 20px x 20px inline SVG
- **Color Scheme**: 
  - Primary: #FFB200 (yellow)
  - Text: #000000 (black) / #333333 (dark gray)
  - Background: #FFFFFF (white)
  - Accent: #666666 (medium gray)

## Troubleshooting

- **Images not showing**: Ensure the logo URL is publicly accessible
- **Layout broken**: Some email clients may strip certain CSS - the table-based layout ensures maximum compatibility
- **Font issues**: The signature uses system fonts for maximum compatibility
- **Dark mode issues**: The design uses high contrast colors that work in both light and dark modes 