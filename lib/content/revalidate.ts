// =============================================================================
// FILE: lib/content/revalidate.ts
// Call from admin server actions after saving, e.g.
//   await db.program.update(...); refreshContent('programs');
// `updateTag` = the editor sees their change on the very next request.
// =============================================================================

import 'server-only';
import { updateTag } from 'next/cache';
import { TAGS, type ContentTag } from './tags';

export function refreshContent(...tags: ContentTag[]) {
  for (const t of tags.length ? tags : Object.values(TAGS)) updateTag(t);
}
