/**
 * Pure helpers for turning a Wikipedia article extract into a short,
 * history-focused blurb. Kept free of I/O so it can be unit tested and reused
 * by the history service without pulling in the network layer.
 */

// Terms that signal a sentence actually explains *why* a place matters
// historically, rather than just describing what it looks like today.
const HISTORY_CUES =
  /\b(built|build|building|constructed|construction|founded|founding|established|commissioned|opened|opening|unveiled|designed|completed|named|inaugurated|discovered|discovery|century|centuries|era|dynasty|colonial|independence|apartheid|heritage|historic|historical|history|war|reign|empire|trek|settled|settlement|mine|mining|architect|monument|legacy|landmark|ancient|traditional)\b/i;

/** Split prose on sentence boundaries, collapsing stray whitespace. */
export function splitSentences(text: string): string[] {
  return (text ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

/**
 * Pick the most history-relevant sentences from an article extract, keeping
 * them in their original reading order. The lead sentence gets a small boost
 * because Wikipedia leads usually carry the core significance.
 */
export function condenseHistoryText(extract: string, maxSentences = 2): string {
  const sentences = splitSentences(extract);
  if (!sentences.length || maxSentences <= 0) return '';

  const ranked = sentences
    .map((sentence, index) => ({
      sentence,
      index,
      score: (HISTORY_CUES.test(sentence) ? 1 : 0) + (index === 0 ? 0.5 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  return ranked
    .slice(0, maxSentences)
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.sentence)
    .join(' ');
}
