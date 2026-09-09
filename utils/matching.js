/**
 * Rule-Based Explainable Matching Engine for LostLink
 * 
 * Compares two items (typically a Lost item and a Found item) and calculates
 * a similarity score between 0 and 100 based on four clear, explainable factors:
 * 
 * 1. Category Match:      30 points (exact match)
 * 2. Location Similarity: 25 points (exact or token overlap)
 * 3. Title Overlap:       20 points (keyword overlap)
 * 4. Description Overlap: 25 points (keyword overlap)
 * Total Maximum:          100 points
 */

// Common English stop words to filter out during tokenization
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'up', 'about', 'into', 'over', 'after', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do',
  'does', 'did', 'and', 'but', 'or', 'so', 'it', 'its', 'this', 'that'
]);

/**
 * Tokenize a text string into normalized, unique keyword tokens.
 * Strips punctuation, lowercases, removes stop words, and keeps tokens >= 2 chars.
 */
function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length >= 2 && !STOP_WORDS.has(token));
}

/**
 * Calculate Jaccard-like overlap coefficient between two token arrays:
 * count(intersection) / max(count(set1), count(set2))
 * Returns a float between 0.0 and 1.0.
 */
function calculateTokenOverlap(tokensA, tokensB) {
  if (!tokensA.length || !tokensB.length) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  
  let intersectionCount = 0;
  for (const t of setA) {
    if (setB.has(t)) {
      intersectionCount++;
    }
  }

  const base = Math.max(setA.size, setB.size);
  return base > 0 ? intersectionCount / base : 0;
}

/**
 * Calculates a match score between 0 and 100 between two items.
 * @param {Object} itemA 
 * @param {Object} itemB 
 * @returns {number} Integer between 0 and 100
 */
function calculateMatchScore(itemA, itemB) {
  if (!itemA || !itemB) return 0;

  let totalScore = 0;

  // 1. Category Match (30 pts)
  const catA = (itemA.category || '').toString().trim().toLowerCase();
  const catB = (itemB.category || '').toString().trim().toLowerCase();
  if (catA && catB && catA === catB) {
    totalScore += 30;
  }

  // 2. Location Similarity (25 pts)
  const locA = (itemA.location || '').toString().trim().toLowerCase();
  const locB = (itemB.location || '').toString().trim().toLowerCase();
  if (locA && locB) {
    if (locA === locB) {
      totalScore += 25;
    } else {
      const tokensLocA = tokenize(locA);
      const tokensLocB = tokenize(locB);
      const overlap = calculateTokenOverlap(tokensLocA, tokensLocB);
      totalScore += Math.round(overlap * 25);
    }
  }

  // 3. Title Overlap (20 pts)
  const titleTokensA = tokenize(itemA.title);
  const titleTokensB = tokenize(itemB.title);
  if (titleTokensA.length && titleTokensB.length) {
    const titleOverlap = calculateTokenOverlap(titleTokensA, titleTokensB);
    totalScore += Math.round(titleOverlap * 20);
  }

  // 4. Description Overlap (25 pts)
  const descTokensA = tokenize(itemA.description);
  const descTokensB = tokenize(itemB.description);
  if (descTokensA.length && descTokensB.length) {
    const descOverlap = calculateTokenOverlap(descTokensA, descTokensB);
    totalScore += Math.round(descOverlap * 25);
  }

  // Ensure result is an integer clamped securely within [0, 100]
  if (isNaN(totalScore)) totalScore = 0;
  return Math.min(100, Math.max(0, Math.round(totalScore)));
}

/**
 * Finds and ranks matching candidate items for a given item.
 * Typically used to match a Lost item against approved Found items,
 * or a Found item against approved Lost items.
 * 
 * @param {Object} sourceItem - The base item
 * @param {Array<Object>} candidates - Candidate items of the opposite type
 * @param {number} [threshold=25] - Minimum score required to be considered a match
 * @returns {Array<Object>} Matches sorted by matchScore descending
 */
function findMatchesForItem(sourceItem, candidates, threshold = 25) {
  if (!sourceItem || !Array.isArray(candidates)) return [];

  const matches = [];

  for (const candidate of candidates) {
    // Avoid self comparison
    if (sourceItem._id && candidate._id && sourceItem._id.toString() === candidate._id.toString()) {
      continue;
    }

    const score = calculateMatchScore(sourceItem, candidate);
    if (score >= threshold) {
      matches.push({
        item: candidate,
        matchScore: score
      });
    }
  }

  // Sort descending by matchScore
  matches.sort((a, b) => b.matchScore - a.matchScore);
  return matches;
}

module.exports = {
  calculateMatchScore,
  findMatchesForItem
};
