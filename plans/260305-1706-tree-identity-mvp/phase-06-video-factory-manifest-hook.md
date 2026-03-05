# Phase 6: Video-Factory Manifest Hook

## Context Links
- [Phase 2](./phase-02-payload-collections-schema.md) — video group fields
- [Payload Hooks Research](../reports/researcher-260305-1704-payload-cms-3-nextjs-integration.md) — Section 3.3

## Overview
- **Priority:** P2
- **Status:** Pending
- **Effort:** 3h
- **Depends on:** Phase 2 (collections with video fields)
- Implement Payload `afterChange` hook that generates a JSON manifest and uploads to R2 when a seed is published with `video.enabled = true`

## Key Insights
- Hook fires after doc save — must NOT block/fail the save operation
- Upload manifest to R2 at `manifests/{slug}.json` using `@aws-sdk/client-s3` directly
- Same R2 credentials as storage adapter but different path prefix
- video-factory reads R2 manifests directly — no API calls needed
- Manifest schema versioned (`treeIdentityVersion: '1.0'`)

## Requirements

### Functional
- When `doc.video.enabled === true AND doc.status === 'published'` → generate manifest JSON → upload to R2
- Manifest includes: slug, title, type, style, sections, cover, publishedAt, treeIdentityVersion
- Upload path: `manifests/{slug}.json`
- Errors logged but do NOT fail the save operation
- Hook attached to Articles + Notes collections

### Non-Functional
- Upload completes within 5s (non-blocking via try/catch)
- Manifest JSON < 1MB per document

## Architecture

```
src/
├── collections/hooks/
│   └── generate-video-manifest.ts   # afterChange hook
└── lib/r2/
    └── upload-manifest.ts           # R2 upload utility
```

### Manifest Schema (LOCKED)
```json
{
  "slug": "article-slug",
  "title": "Article Title",
  "type": "article",
  "style": "cinematic",
  "sections": [
    {
      "id": "intro",
      "timestamp": "0:00",
      "narration": "Welcome to...",
      "bRollQuery": "city skyline",
      "onScreenText": "Introduction",
      "mediaRefs": ["ref1", "ref2"]
    }
  ],
  "cover": {
    "url": "https://cdn.example.com/cover.jpg",
    "alt": "Cover image"
  },
  "publishedAt": "2026-03-05T12:00:00Z",
  "treeIdentityVersion": "1.0"
}
```

## Related Code Files

### Create
- `src/lib/r2/upload-manifest.ts`
- `src/collections/hooks/generate-video-manifest.ts`

### Modify
- `src/collections/Articles.ts` — add hook
- `src/collections/Notes.ts` — add hook

## Implementation Steps

1. **Install `@aws-sdk/client-s3`:**
   ```bash
   npm install @aws-sdk/client-s3
   ```

2. **Create `src/lib/r2/upload-manifest.ts`:**
   ```typescript
   import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

   let s3Client: S3Client | null = null

   function getS3Client(): S3Client {
     if (!s3Client) {
       s3Client = new S3Client({
         region: process.env.R2_REGION || 'auto',
         endpoint: `https://${process.env.R2_ENDPOINT}`,
         credentials: {
           accessKeyId: process.env.R2_ACCESS_KEY_ID!,
           secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
         },
       })
     }
     return s3Client
   }

   export async function uploadManifest(slug: string, manifest: Record<string, unknown>): Promise<void> {
     const client = getS3Client()
     const key = `manifests/${slug}.json`
     const body = JSON.stringify(manifest, null, 2)

     await client.send(new PutObjectCommand({
       Bucket: process.env.R2_BUCKET!,
       Key: key,
       Body: body,
       ContentType: 'application/json',
     }))
   }
   ```

3. **Create `src/collections/hooks/generate-video-manifest.ts`:**
   ```typescript
   import type { CollectionAfterChangeHook } from 'payload'
   import { uploadManifest } from '@/lib/r2/upload-manifest'

   export const generateVideoManifest: CollectionAfterChangeHook = async ({ doc, collection }) => {
     // Only fire when published + video enabled
     if (doc.status !== 'published' || !doc.video?.enabled) return doc

     try {
       const manifest = {
         slug: doc.slug,
         title: doc.title,
         type: collection.slug, // 'articles' or 'notes'
         style: doc.video.style || null,
         sections: (doc.video.sections || []).map((s: any) => ({
           id: s.sectionId,
           timestamp: s.timestamp || null,
           narration: s.narration || null,
           bRollQuery: s.bRollQuery || null,
           onScreenText: s.onScreenText || null,
           mediaRefs: (s.mediaRefs || []).map((r: any) => r.ref),
         })),
         cover: doc.cover ? { url: doc.cover.url, alt: doc.cover.alt } : null,
         publishedAt: doc.publishedAt,
         treeIdentityVersion: '1.0',
       }

       await uploadManifest(doc.slug, manifest)
       console.log(`[video-manifest] Uploaded manifests/${doc.slug}.json`)
     } catch (error) {
       // Log error but do NOT fail the save
       console.error(`[video-manifest] Failed to upload manifest for ${doc.slug}:`, error)
     }

     return doc
   }
   ```

4. **Update Articles collection** — add hook:
   ```typescript
   hooks: {
     afterChange: [revalidatePage, generateVideoManifest],
     beforeValidate: [autoSlug],
     beforeChange: [setPublishedAt],
   }
   ```

5. **Update Notes collection** — same hook addition.

6. **Test:** Create an article with `video.enabled = true`, set status to published, verify `manifests/{slug}.json` appears in R2 bucket.

## Todo List

- [ ] Install `@aws-sdk/client-s3`
- [ ] Create `src/lib/r2/upload-manifest.ts`
- [ ] Create `src/collections/hooks/generate-video-manifest.ts`
- [ ] Add hook to Articles collection
- [ ] Add hook to Notes collection
- [ ] Test manifest upload to R2
- [ ] Verify manifest JSON matches locked schema
- [ ] Verify hook doesn't fail save on R2 error

## Success Criteria
- Publishing a seed with `video.enabled = true` creates `manifests/{slug}.json` in R2
- Manifest JSON matches the locked schema exactly
- R2 upload failure does NOT prevent the document from saving
- Hook does NOT fire for drafts or seeds with `video.enabled = false`

## Risk Assessment
- **R2 credentials missing:** If env vars not set, S3Client throws on init. Wrap in try/catch to degrade gracefully.
- **Manifest schema drift:** Version field (`treeIdentityVersion: '1.0'`) enables backward-compatible evolution. Document in Phase 7.
- **Duplicate uploads:** Every save triggers hook, not just status changes. Could add `previousDoc.status` check, but non-blocking upload makes this acceptable for MVP.

## Security Considerations
- R2 credentials only used server-side (Payload hooks run on server)
- Manifest JSON does not include sensitive data (no API keys, no user data)
- R2 bucket should have restricted write access (only server credentials)

## Next Steps
- Phase 7 documents manifest schema in `docs/video-factory-contract.md`
