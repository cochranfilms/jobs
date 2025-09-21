# Job Listings Workflow Guide

## 🎯 **Complete System Overview**

Your job listings system has two main components:

1. **Job Listings Management** (Admin Panel + JSON)
2. **Applicant Submissions** (Google Sheet)

---

## 📋 **Step-by-Step Workflow**

### **Step 1: Manage Job Listings**
1. **Open `admin-jobs.html`** in your browser
2. **Add new jobs** using the form:
   - Job Title (required)
   - Event Date
   - Location (defaults to "Atlanta Area")
   - Pay Rate (e.g., "$150/day")
   - Description
   - Status (Active/Inactive)
3. **Edit existing jobs** by clicking "Edit" on any job
4. **Delete jobs** by clicking "Delete" (with confirmation)

### **Step 2: Export Updated Job Data**
1. **Click "Generate JSON"** in the Export section
2. **Click "Download jobs-data.json"** to save the file
3. **Replace the existing `jobs-data.json`** file on your server

### **Step 3: Update Website**
1. **Upload the new `jobs-data.json`** to your server
2. **Refresh `Job-Listings.html`** to see the updated jobs
3. **Test the job listings** to ensure they display correctly

### **Step 4: Google Sheet Handles Applicants**
- **Applicants fill out your Google Form**
- **Data goes to your Google Sheet**
- **Job loader automatically filters out applicant submissions**
- **Only job listings are displayed on the website**

---

## 🔧 **File Structure**

```
cochran-films-landing/
├── admin-jobs.html          # Admin panel for managing jobs
├── jobs-data.json           # Job listings data (updated via admin)
├── Job-Listings.html        # Public job listings page
└── Google Sheet             # Handles applicant submissions
```

---

## ✅ **Benefits of This Setup**

### **Admin Panel (`admin-jobs.html`)**
- ✅ Easy job management interface
- ✅ No coding required to add/edit jobs
- ✅ Validates job data
- ✅ Exports clean JSON format

### **Job Listings Page (`Job-Listings.html`)**
- ✅ Displays only active job listings
- ✅ Filters out applicant submissions automatically
- ✅ Supports multiple applicants per job
- ✅ Professional, responsive design

### **Google Sheet Integration**
- ✅ Handles all applicant data
- ✅ No need to manually manage applications
- ✅ Automatic form processing
- ✅ Applicant submissions don't interfere with job listings

---

## 🚀 **Quick Start**

1. **Add your first job:**
   - Open `admin-jobs.html`
   - Fill out the job form
   - Click "Save Job"

2. **Export and update:**
   - Click "Generate JSON"
   - Click "Download jobs-data.json"
   - Replace the file on your server

3. **Test the system:**
   - Open `Job-Listings.html`
   - Verify your job appears
   - Test the application form

---

## 🔍 **Troubleshooting**

### **Jobs not showing up?**
- Check that job status is "Active"
- Verify `jobs-data.json` was updated correctly
- Check browser console for errors

### **Applicant submissions appearing as jobs?**
- The filtering logic should prevent this
- Check that applicant rows have email addresses or phone numbers
- Use the test page to verify filtering

### **404 errors?**
- Ensure `jobs-data.json` exists in the same directory as `Job-Listings.html`
- Check file permissions

---

## 📊 **Example Job Entry**

```json
{
  "title": "Event Photographer",
  "date": "2024-08-15",
  "location": "Atlanta Area",
  "pay": "$150/day",
  "description": "Join our creative team for exciting photo shoots at events and celebrations. Experience with event photography preferred.",
  "status": "Active"
}
```

---

## 🎉 **You're All Set!**

This system gives you:
- **Easy job management** through the admin panel
- **Clean separation** between job listings and applicant data
- **Multiple applicant support** per job
- **Professional job listings page**
- **Automatic Google Sheet integration**

The workflow is now streamlined and user-friendly! 🚀 