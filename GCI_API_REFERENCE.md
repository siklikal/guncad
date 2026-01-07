# GunCAD Index (GCI) API Reference

This document provides comprehensive documentation for the GunCAD Index API endpoints, query parameters, and data structures used in the GunCAD project.

## Base URL
```
https://guncadindex.com
```

---

## API Endpoints

### 1. Get Tags
**Endpoint:** `/api/tags/`

**Method:** `GET`

**Description:** Fetch all available tags/categories for filtering projects.

**Query Parameters:**
- `format` (string): Response format (default: `json`)
- `limit` (number): Maximum number of results (max: `200`)
- `offset` (number): Pagination offset

**Response Structure:**
```typescript
{
  count: number;
  next: string | null;
  previous: string | null;
  results: [
    {
      id: string;
      slug: string;
      name: string;
      description: string;
      color: string;        // Hex color code
      text_color: string;   // Hex color code
    }
  ]
}
```

**Example:**
```bash
GET https://guncadindex.com/api/tags/?format=json&limit=200
```

---

### 2. Get Releases
**Endpoint:** `/api/releases/`

**Method:** `GET`

**Description:** Fetch project releases with pagination.

**Query Parameters:**
- `format` (string): Response format (default: `json`)
- `limit` (number): Maximum number of results
- `offset` (number): Pagination offset
- `ordering` (string): Sort order (e.g., `-released` for newest first)
- `search` (string): Search query
- `tag` (string): Filter by tag slug

**Response Structure:**
```typescript
{
  count: number;
  next: string | null;
  previous: string | null;
  results: [
    {
      id: string;
      name: string;
      description: string;
      released: string;      // ISO date string
      thumbnail: string;     // URL to thumbnail image
    }
  ]
}
```

**Example:**
```bash
GET https://guncadindex.com/api/releases/?format=json&limit=20&ordering=-released
```

---

### 3. Project Detail Page (HTML Scraping)
**Endpoint:** `/detail/{projectId}`

**Method:** `GET`

**Description:** Get detailed project information by scraping the HTML page. Used to extract views, likes, and tags.

**URL Format:**
```
https://guncadindex.com/detail/{projectId}
```

**Extracted Data:**
- **Views:** Extracted from `.odysee-stats-wrapper` (first SVG icon + number)
- **Likes:** Extracted from span with class `upvote`
- **Tags:** Extracted from links matching pattern `/search?tag={tagName}`

**Example:**
```bash
GET https://guncadindex.com/detail/Hello-Kitty-Beta-1:7
```

**Scraped Data Structure:**
```typescript
{
  views: number;
  likes: number;
  tags: string[];  // Array of tag names
}
```

---

### 4. Search by Tag
**Endpoint:** `/search`

**Method:** `GET`

**Description:** Search for projects by tag.

**Query Parameters:**
- `tag` (string): URL-encoded tag name to filter by

**Example:**
```bash
GET https://guncadindex.com/search?tag=pistol
```

---

## LBRY Integration

The GunCAD project also integrates with LBRY (Odysee) for decentralized content storage.

### LBRY Resolve API
**Your Internal Endpoint:** `/api/lbry-resolve`

**Method:** `POST`

**Description:** Resolve LBRY claim names to get detailed project information including metadata from both LBRY and GCI.

**Request Body:**
```typescript
{
  claimNames: string[];  // Array of LBRY claim names (project IDs)
}
```

**Response Structure:**
```typescript
{
  projects: [
    {
      id: string;                    // Claim name
      title: string;
      description: string;
      image: string;                 // Thumbnail URL
      tags: string[];                // From GCI scraping
      views: number;                 // From GCI scraping
      likes: number;                 // From GCI scraping
      releaseTime: number | null;    // Unix timestamp
      claimId: string;
      permanentUrl: string;
      canonicalUrl: string;
      user: {
        username: string;
        avatar: string;
        channelUrl: string;
      };
      source: {
        mediaType: string;
        size: number;
        name: string;
        hash: string;
      };
    }
  ]
}
```

**Example:**
```bash
POST /api/lbry-resolve
Content-Type: application/json

{
  "claimNames": ["Hello-Kitty-Beta-1:7", "Chode-Muzzle-Brake:c"]
}
```

---

## Internal API Endpoints (Your App)

### 1. Spotlight API
**Endpoint:** `/api/spotlight`

**Method:** `GET`

**Description:** Get spotlight projects for homepage hero sections.

**Query Parameters:**
- `type` (string): Spotlight type - `exclusive` | `featured` | `trending`

**Response Structure:**
```typescript
{
  title: string;
  image: string;   // Thumbnail URL
  url: string;     // GCI project URL
  views: number;
  likes: number;
  id?: string;     // Project ID extracted from URL
}
```

---

### 2. Project Details API
**Endpoint:** `/api/project-details`

**Method:** `POST`

**Description:** Fetch multiple project details using LBRY resolve.

**Request Body:**
```typescript
{
  urls: string[];  // Array of GCI project URLs
}
```

**Response Structure:**
```typescript
{
  projects: [
    {
      // Same structure as LBRY resolve response
      badge: 'exclusive' | 'featured' | 'trending';
      id: string;  // Project ID
      // ... (other fields from LBRY response)
    }
  ]
}
```

---

### 3. Collection Images API
**Endpoint:** `/api/collection-images`

**Method:** `POST`

**Description:** Fetch thumbnail images for a collection of projects.

**Request Body:**
```typescript
{
  urls: string[];  // Array of GCI project URLs
}
```

**Response Structure:**
```typescript
{
  images: string[];  // Array of thumbnail URLs
}
```

---

## Common Query Parameters

### Pagination
- `limit` (number): Number of results per page
- `offset` (number): Skip this many results

### Sorting
- `ordering` (string): Field to sort by
  - Prefix with `-` for descending order
  - Examples: `released`, `-released`, `name`, `-name`

### Filtering
- `tag` (string): Filter by tag slug or name
- `search` (string): Free text search

### Response Format
- `format` (string): Response format
  - `json` (default)
  - `api` (browsable API)

---

## Project ID Format

GCI uses LBRY claim names as project IDs. Format:
```
{project-name}:{claim-sequence}
```

**Examples:**
- `Hello-Kitty-Beta-1:7`
- `Chode-Muzzle-Brake:c`
- `DeadTrolls-PA6CF-20:0`

---

## Thumbnail URLs

GCI serves optimized WebP thumbnails in multiple sizes:

**Format:**
```
https://guncadindex.com/media/thumbnails/thumbnail-{uuid}-{size}.webp
```

**Common Sizes:**
- `768` - Standard thumbnail
- `384` - Small thumbnail
- `1536` - Large thumbnail

**Example:**
```
https://guncadindex.com/media/thumbnails/thumbnail-d06fa14f-ffb0-4224-a851-bf241e474500-768.webp
```

---

## Rate Limiting

⚠️ **Note:** The GCI API doesn't explicitly document rate limits, but it's good practice to:
- Cache responses when possible
- Batch requests when fetching multiple projects
- Use reasonable request delays in production

---

## Error Handling

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad request
- `404` - Resource not found
- `500` - Server error

**Best Practices:**
- Always check `response.ok` before parsing JSON
- Provide fallback data for failed requests
- Log errors for debugging

---

## Data Sources

The GunCAD project combines data from two sources:

1. **GCI API** - Project metadata, tags, releases
2. **LBRY/Odysee** - Decentralized content, creator info, file details

This hybrid approach provides:
- Rich metadata from GCI
- Decentralized file hosting via LBRY
- Creator information and channels
- Community engagement stats (views, likes)

---

## Examples in Your Project

### Fetch All Tags
```typescript
const response = await fetch(
  'https://guncadindex.com/api/tags/?format=json&limit=200',
  { headers: { Accept: 'application/json' } }
);
const data = await response.json();
const tags = data.results;
```

### Get Project Details
```typescript
const response = await fetch('/api/lbry-resolve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ claimNames: ['Hello-Kitty-Beta-1:7'] })
});
const data = await response.json();
const project = data.projects[0];
```

### Scrape GCI Stats
```typescript
const gciUrl = `https://guncadindex.com/detail/${projectId}`;
const response = await fetch(gciUrl);
const html = await response.text();
// Parse HTML to extract views, likes, tags
```

---

## Additional Resources

- **GCI Website:** https://guncadindex.com
- **Odysee/LBRY:** Content hosting platform
- **LBRY Protocol:** https://lbry.com

---

## Notes

- GCI uses server-side rendering, so some data requires HTML scraping
- LBRY claim names are permanent identifiers
- Always handle missing/null data gracefully
- Consider implementing caching for frequently accessed data
