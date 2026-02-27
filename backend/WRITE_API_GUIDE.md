# Write.html Backend API Integration Guide

## Overview

This guide covers the 4 backend systems required for the write.html editor:

1. **Rich Text Content Storage** (sanitized HTML/JSON)
2. **Image Upload System** (Cloudinary)
3. **Tag System** (normalized tags with auto-creation)
4. **Collection System** (user-owned folders)

---

## 1. Create Poem with Rich Text

### Endpoint
```
POST /api/poems
Authorization: Bearer <access_token>
```

### Request Body
```json
{
  "title": "Midnight Mist",
  "content": "<p>The mist <strong>rolls softly</strong> over <em>silent hills</em>.</p>",
  "tagNames": ["nature", "midnight", "poetry"],
  "collectionId": "507f1f77bcf86cd799439011",
  "images": [
    "https://res.cloudinary.com/demo/image/upload/v1234567890/poemvy/poems/abc123.jpg"
  ],
  "isDraft": false
}
```

### Important Note
- **Content sanitization**: Use DOMPurify on frontend before sending
- **Content field**: Accepts sanitized HTML (max 10,000 characters)
- **tagNames**: Array of strings (max 10 tags, 30 chars each)
- **images**: Array of Cloudinary URLs (max 10 images)
- **collectionId**: Optional MongoDB ObjectId
- **isDraft**: Boolean (default: false)

### Response
```json
{
  "success": true,
  "message": "Poem created successfully",
  "poem": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Midnight Mist",
    "content": "<p>The mist <strong>rolls softly</strong>...</p>",
    "author": {
      "_id": "507f191e810c19729de860ea",
      "username": "elena_voshka",
      "name": "Elena Voshka",
      "avatar": {...}
    },
    "tags": [
      { "_id": "...", "name": "nature", "slug": "nature" },
      { "_id": "...", "name": "midnight", "slug": "midnight" }
    ],
    "images": ["https://res.cloudinary.com/..."],
    "collection": {...},
    "isDraft": false,
    "createdAt": "2026-02-15T10:30:00.000Z"
  }
}
```

---

## 2. Image Upload to Cloudinary

### Endpoint
```
POST /api/upload/poem-image
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

### Request (Form Data)
```
image: <file> (JPEG, PNG, GIF, WebP)
```

### File Limits
- **Max size**: 5MB
- **Formats**: JPEG, JPG, PNG, GIF, WebP
- **Processing**: Auto-resized to max 1200x1200, quality optimized

### Response
```json
{
  "success": true,
  "url": "https://res.cloudinary.com/demo/image/upload/v1234567890/poemvy/poems/image-1234.jpg",
  "publicId": "poemvy/poems/image-1234"
}
```

### Frontend Implementation Example
```javascript
async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('/api/upload/poem-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    body: formData
  });

  const data = await response.json();
  return data.url; // Use this URL in images array
}
```

---

## 3. Tag System

### How Tags Work

1. User types tag name (e.g., "Nature", "MIDNIGHT", "lost dreams")
2. Backend normalizes: lowercase, trim spaces → "nature", "midnight", "lost dreams"
3. Creates slug: "nature", "midnight", "lost-dreams"
4. Checks if tag exists:
   - **Exists**: Increment `usageCount`
   - **New**: Create tag with `usageCount = 1`
5. Returns tag ObjectId to store in poem

### Search Tags (Autocomplete)

**Endpoint:**
```
GET /api/tags/search?q=nat&limit=10
```

**Response:**
```json
{
  "success": true,
  "tags": [
    { "_id": "...", "name": "nature", "slug": "nature", "usageCount": 142 },
    { "_id": "...", "name": "natural", "slug": "natural", "usageCount": 38 }
  ]
}
```

### Get Popular Tags

**Endpoint:**
```
GET /api/tags/popular?limit=20
```

**Response:**
```json
{
  "success": true,
  "tags": [
    { "name": "poetry", "slug": "poetry", "usageCount": 1523 },
    { "name": "love", "slug": "love", "usageCount": 892 }
  ]
}
```

### Frontend Tag Input Example
```javascript
// User types in tag input
const tagName = "Nature & Beauty";

// Just send raw name - backend handles normalization
const poemData = {
  title: "...",
  content: "...",
  tagNames: ["Nature & Beauty", "midnight"]
};

// Backend automatically:
// - Converts to "nature & beauty", "midnight"
// - Creates slugs: "nature-beauty", "midnight"
// - Creates/updates Tag documents
// - Returns tag ObjectIds to store in poem
```

---

## 4. Collection System

### Create Collection

**Endpoint:**
```
POST /api/collections
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "name": "Dark Poetry",
  "description": "Poems about darkness and mystery",
  "isPublic": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Collection created successfully",
  "collection": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Dark Poetry",
    "description": "Poems about darkness and mystery",
    "owner": {...},
    "poems": [],
    "isPublic": true
  }
}
```

### Get User Collections

**Endpoint:**
```
GET /api/collections/user/:username
```

**Response:**
```json
{
  "success": true,
  "collections": [
    {
      "_id": "...",
      "name": "Dark Poetry",
      "poemCount": 12,
      "poems": [...]
    }
  ]
}
```

### Add Poem to Collection

When creating poem, just pass `collectionId` in request body:

```json
{
  "title": "...",
  "content": "...",
  "collectionId": "507f1f77bcf86cd799439011"
}
```

Backend automatically validates:
- Collection exists
- User owns collection
- Sets poem.collection reference

---


## 6. Update Poem

**Endpoint:**
```
PUT /api/poems/:poemId
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "title": "Updated Title",
  "content": "<p>Updated content...</p>",
  "tagNames": ["new-tag", "updated"],
  "isDraft": false
}
```

**Note:** Tags are recalculated on update (old tags decremented, new tags incremented).

---

## 7. Security Features

### Content Validation
- **Max length**: 10,000 characters
- **HTML sanitization**: Use DOMPurify on frontend
- **Backend validation**: Checks content length

### Image Upload Security
- **File type validation**: Only JPEG, PNG, GIF, WebP
- **Size limit**: 5MB max
- **Rate limiting**: 100 requests per 15 minutes
- **Cloudinary processing**: Auto-resize, optimize

### Tag Security
- **Max tags per poem**: 10
- **Max tag length**: 30 characters
- **Normalization**: Lowercase, trimmed
- **Slug generation**: URL-safe

### Collection Ownership
- Backend verifies user owns collection before adding poems
- Private collections only visible to owner

---

## 8. Complete Write.html Flow

```javascript
// 1. User writes formatted text in editor
const content = editor.getHTML(); // Get from rich text editor

// 2. Sanitize on frontend
import DOMPurify from 'dompurify';
const cleanContent = DOMPurify.sanitize(content);

// 3. Upload images (if any)
const imageUrls = [];
for (const file of selectedImages) {
  const url = await uploadImage(file);
  imageUrls.push(url);
}

// 4. Get tag names from input
const tagNames = ['nature', 'midnight', 'poetry'];

// 5. Get selected collection ID
const collectionId = selectedCollection?._id || null;

// 6. Create poem
const response = await fetch('/api/poems', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: poemTitle,
    content: cleanContent,
    tagNames: tagNames,
    collectionId: collectionId,
    images: imageUrls,
    isDraft: false
  })
});

const { poem } = await response.json();
// Redirect to poem page or feed
```

---

## 9. Environment Variables Required

Add to `.env`:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Get these from: https://cloudinary.com (free tier available)

---

## 10. NPM Packages Installed

All dependencies already in `package.json`:

- `multer` - File upload handling
- `cloudinary` - Image hosting
- `express-validator` - Input validation
- `mongoose` - MongoDB ODM

Run: `npm install`

---

## Summary

✅ **Rich Text**: Store sanitized HTML in `content` field  
✅ **Images**: Upload to Cloudinary, store URLs in `images` array  
✅ **Tags**: Send `tagNames` array, backend auto-creates/normalizes  
✅ **Collections**: Pass `collectionId`, backend validates ownership  
✅ **Drafts**: Set `isDraft: true`, only visible to author  
✅ **Security**: Content validation, rate limiting, file type checking

**All backend systems are production-ready and deployed!**
