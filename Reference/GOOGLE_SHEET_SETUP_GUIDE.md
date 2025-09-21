# Google Sheet Setup Guide for Job Listings

## The Problem
Your Google Sheet currently mixes job listings with applicant submissions, which confuses the job loader. The loader tries to process ALL rows as job listings, but some rows contain applicant information instead.

## The Solution
The updated job loader now filters out rows that contain applicant information (like email addresses, phone numbers, etc.) and only displays actual job listings.

## How to Structure Your Google Sheet

### Option 1: Single Sheet with Clear Separation (Recommended)
Keep your current sheet structure, but the job loader will now automatically filter out applicant submissions.

**Job Listing Rows** (will be displayed):
- Have "Active" status
- Don't contain email addresses, phone numbers, or applicant names
- Example:
  ```
  Title: "Backdrop Photographer Base"
  Date: "10/24/2025"
  Location: "Douglasville, GA"
  Pay: "$300"
  Description: "You will be taking pictures"
  Status: "Active"
  ```

**Applicant Submission Rows** (will be filtered out):
- Contain applicant information like emails, phone numbers, names
- Example:
  ```
  Title: "Backdrop Photographer Base"
  Date: "11/8/2025"
  Location: "Douglasville, GA"
  Pay: "$400"
  Description: "You will be taking pictur"
  Status: ""
  Email Address: "njstanner@yahoo.com"
  Full Name: "Nick Stanner"
  Phone Number: "8183973460"
  ```

### Option 2: Separate Sheets (Alternative)
Create two separate Google Sheets:
1. **Job Listings Sheet**: Only contains job openings
2. **Applicant Responses Sheet**: Contains all applicant submissions

## Testing the Fix

1. **Open the test page**: `test-job-filter.html`
2. **Click "Run Filter Test"** to see how the filtering works
3. **Check the console** in your browser's developer tools when loading `Job-Listings.html` to see debug information

## What the Filter Checks For

The job loader now excludes rows that have:
- Email addresses (`Email Address`, `email`, etc.)
- Phone numbers (`Phone Number`, `phone`, etc.)
- Applicant names (`Full Name`, `name`, etc.)
- Instagram/portfolio links
- "How did you hear about us" responses
- Timestamps (applicants have timestamps, job listings usually don't)
- "Applying For Which Job" fields
- Titles that look like person names instead of job titles

## Multiple Applicants Per Job

✅ **This is now supported!** Multiple people can apply for the same job because:
- Job listings are displayed once (from the job listing row)
- Each applicant submission is filtered out (not displayed as a job)
- All applicants can still apply through the same application form

## Troubleshooting

If jobs aren't showing up:
1. Check that the job row has `Status: "Active"`
2. Make sure the job row doesn't contain applicant information
3. Open browser console to see debug information
4. Use the test page to verify filtering logic

## Example of Correct Job Listing Row
```
Title: "Event Photographer"
Date: "2024-08-15"
Location: "Atlanta Area"
Pay: "$150/day"
Description: "Join our creative team for exciting photo shoots..."
Status: "Active"
```

## Example of Applicant Submission Row (will be filtered out)
```
Title: "Event Photographer"
Date: "2024-08-15"
Location: "Atlanta Area"
Pay: "$150/day"
Description: "Join our creative team..."
Status: ""
Email Address: "applicant@email.com"
Full Name: "John Doe"
Phone Number: "555-123-4567"
``` 