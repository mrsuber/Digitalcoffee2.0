# Legal Documents Management System

## Overview
This implementation adds a comprehensive legal documents management system that allows admin users to edit Terms of Service and Privacy Policy from the dashboard. The documents are stored in the database and synced to both the website and mobile app.

## What Was Implemented

### 1. Database (✅ Completed)
- **File**: `backend/migrations/create_legal_documents.sql`
- **Tables Created**:
  - `legal_documents`: Main table for storing legal documents
  - `legal_documents_history`: Version history tracking table
- **Features**:
  - Supports multiple document types (terms_of_service, privacy_policy)
  - Version tracking
  - Update history with user attribution
  - Default documents pre-populated

### 2. Backend API (✅ Completed)
- **File**: `backend/routes/legal.js`
- **Endpoints**:
  - `GET /api/legal/documents/:type` - Public endpoint to get a legal document
  - `GET /api/legal/documents` - Public endpoint to get all legal documents
  - `GET /api/legal/admin/documents/:type` - Admin: Get document for editing
  - `PUT /api/legal/admin/documents/:type` - Admin: Update document
  - `GET /api/legal/admin/documents/:type/history` - Admin: Get document history
  - `GET /api/legal/admin/documents` - Admin: Get all documents

- **File**: `backend/index.js`
  - Added legal routes to Express app

### 3. Admin Dashboard (✅ Completed)
- **File**: `admin/src/pages/LegalDocuments.jsx`
- **Features**:
  - Tabbed interface for Terms of Service and Privacy Policy
  - Rich text editing with Markdown support
  - Version management
  - Document history viewer
  - Last updated timestamp and user tracking
  - Preview functionality
  - Save/Update functionality

- **Files Updated**:
  - `admin/src/App.jsx` - Added route for Legal Documents page
  - `admin/src/components/Layout.jsx` - Added "Legal Documents" to navigation menu

### 4. Mobile App (✅ Completed)
- **Files Updated**:
  - `mobile/src/services/api.js` - Added legalAPI endpoints
  - `mobile/src/screens/TermsOfServiceScreen.js` - Updated to fetch from API
  - `mobile/src/screens/PrivacyPolicyScreen.js` - Updated to fetch from API
- **Features**:
  - Fetches latest documents from API on screen load
  - Markdown rendering support
  - Version and last updated display
  - Loading states and error handling
  - Retry functionality

- **Package Added**:
  - `react-native-markdown-display` - For rendering markdown content

## Deployment Instructions

### Step 1: Deploy Backend Changes

1. **Run the database migration**:
```bash
ssh root@76.13.41.99
cd /var/www/digitalcoffee/backend
PGPASSWORD='digitalcoffee2024' psql -h localhost -U postgres -d digitalcoffee -f migrations/create_legal_documents.sql
```

2. **Copy backend files to server**:
```bash
# From your local machine
scp backend/routes/legal.js root@76.13.41.99:/var/www/digitalcoffee/backend/routes/
scp backend/routes/auth.js root@76.13.41.99:/var/www/digitalcoffee/backend/routes/
scp backend/index.js root@76.13.41.99:/var/www/digitalcoffee/backend/
scp backend/migrations/create_legal_documents.sql root@76.13.41.99:/var/www/digitalcoffee/backend/migrations/
```

3. **Restart the backend**:
```bash
ssh root@76.13.41.99
pm2 restart digitalcoffee-api
pm2 logs digitalcoffee-api
```

### Step 2: Deploy Admin Dashboard

```bash
# From your local machine
cd admin
npm run build
rsync -avz --delete build/ root@76.13.41.99:/var/www/digitalcoffee/admin/
```

### Step 3: Test the Implementation

1. **Test Admin Dashboard**:
   - Log into admin dashboard: https://digitalcoffee.cafe/admin
   - Navigate to "Legal Documents" in the sidebar
   - Try editing Terms of Service
   - Save changes
   - View history

2. **Test API Endpoints**:
```bash
# Public endpoint (should work without auth)
curl https://digitalcoffee.cafe/api/legal/documents/terms_of_service

# Should return JSON with document content
```

3. **Test Mobile App**:
   - Open mobile app
   - Navigate to Settings > Terms of Service
   - Navigate to Settings > Privacy Policy
   - Verify content loads from API
   - Verify markdown formatting is rendered correctly

### Step 4: Update Initial Content

After deployment, you can customize the legal documents through the admin dashboard:

1. Go to https://digitalcoffee.cafe/admin/legal-documents
2. Edit the Terms of Service tab
3. Update content as needed (Markdown supported)
4. Update version number if desired
5. Click "Save Changes"
6. Repeat for Privacy Policy tab

## Features

### For Administrators
- ✅ Edit Terms of Service and Privacy Policy from web dashboard
- ✅ Markdown support for formatting
- ✅ Version tracking
- ✅ View edit history
- ✅ See who made last update
- ✅ Preview documents

### For Users (Mobile App)
- ✅ Always see the latest version of legal documents
- ✅ Proper markdown formatting
- ✅ Version and last updated date displayed
- ✅ Offline support (cached after first load)
- ✅ Error handling with retry

### For Developers
- ✅ Simple API to fetch legal documents
- ✅ Version control for all changes
- ✅ Audit trail of who changed what
- ✅ Easy to add new document types

## File Structure

```
backend/
├── migrations/
│   └── create_legal_documents.sql       # Database schema
├── routes/
│   ├── legal.js                         # Legal documents API routes
│   ├── auth.js                          # Updated with subscription fields
│   └── index.js                         # Updated with legal routes

admin/
├── src/
│   ├── pages/
│   │   └── LegalDocuments.jsx          # Legal documents management page
│   ├── components/
│   │   └── Layout.jsx                  # Updated navigation
│   └── App.jsx                         # Updated routes

mobile/
├── src/
│   ├── screens/
│   │   ├── TermsOfServiceScreen.js     # Updated to use API
│   │   └── PrivacyPolicyScreen.js      # Updated to use API
│   └── services/
│       └── api.js                      # Added legalAPI endpoints
└── package.json                        # Added react-native-markdown-display
```

## API Usage Examples

### Public Endpoints (No Auth Required)

```javascript
// Get Terms of Service
fetch('https://digitalcoffee.cafe/api/legal/documents/terms_of_service')
  .then(res => res.json())
  .then(data => console.log(data.data));

// Get Privacy Policy
fetch('https://digitalcoffee.cafe/api/legal/documents/privacy_policy')
  .then(res => res.json())
  .then(data => console.log(data.data));

// Get all documents
fetch('https://digitalcoffee.cafe/api/legal/documents')
  .then(res => res.json())
  .then(data => console.log(data.data));
```

### Admin Endpoints (Requires Admin Auth Token)

```javascript
// Get document for editing
fetch('https://digitalcoffee.cafe/api/legal/admin/documents/terms_of_service', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
})
.then(res => res.json())
.then(data => console.log(data.data));

// Update document
fetch('https://digitalcoffee.cafe/api/legal/admin/documents/terms_of_service', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Terms of Service',
    content: '# Updated Terms\n\nNew content here...',
    version: '2.0'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

## Markdown Support

The content field supports full Markdown syntax:

```markdown
# Heading 1
## Heading 2
### Heading 3

**Bold text**
*Italic text*

- Bullet point 1
- Bullet point 2

1. Numbered item 1
2. Numbered item 2

`Inline code`

> Blockquote
```

## Security Considerations

- ✅ Admin-only access for editing (checked by `isAdmin` middleware)
- ✅ Public read access for viewing documents
- ✅ Input validation on all endpoints
- ✅ SQL injection protection (parameterized queries)
- ✅ Version history preserved (no data loss)
- ✅ User attribution for all changes

## Future Enhancements (Optional)

- [ ] Add WYSIWYG markdown editor
- [ ] Email notifications when documents are updated
- [ ] Require users to re-accept updated terms
- [ ] Add more document types (e.g., Cookie Policy, GDPR notices)
- [ ] Export documents to PDF
- [ ] Rollback to previous versions
- [ ] Compare versions side-by-side

## Support

For questions or issues:
- Backend API: Check logs with `pm2 logs digitalcoffee-api`
- Admin Dashboard: Check browser console
- Mobile App: Check React Native debugger

## Summary

This implementation provides a complete, production-ready legal documents management system that:
1. Allows admins to edit documents from a web interface
2. Automatically syncs changes to mobile app and website
3. Maintains version history
4. Supports markdown formatting
5. Provides audit trails
6. Is secure and scalable

All code is ready for deployment!
