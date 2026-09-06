// Converts a public YouTube "watch" URL (https://www.youtube.com/watch?v=ID)
// into an embeddable iframe src (https://www.youtube.com/embed/ID). Returns
// null for anything that doesn't match, so callers fail closed instead of
// embedding an unexpected iframe src.
//
// Only handles the watch?v= form — that's all the fixed demo video URLs
// use. Not intended for arbitrary user-submitted links (see the admin
// exercise-request view, which renders those as plain links, not embeds).
export function toYouTubeEmbedUrl(watchUrl: string): string | null {
  try {
    const url = new URL(watchUrl);
    const id = url.searchParams.get("v");
    if (!id) return null;
    return `https://www.youtube.com/embed/${id}`;
  } catch {
    return null;
  }
}
