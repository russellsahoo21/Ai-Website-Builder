/**
 * diffApplier.js
 * Resilient Search/Replace and Unified Diff Patch Engine.
 * Enables LLMs to emit surgical diffs (<50 tokens) instead of re-emitting 400+ lines of full files.
 */

function normalizeLineEndings(str) {
  return (str || '').replace(/\r\n/g, '\n');
}

/**
 * Applies a single search-and-replace block to base text.
 * Uses exact match first, then falls back to whitespace-tolerant matching.
 */
function applySearchReplaceBlock(baseText, searchBlock, replaceBlock) {
  const normBase = normalizeLineEndings(baseText);
  const normSearch = normalizeLineEndings(searchBlock);
  const normReplace = normalizeLineEndings(replaceBlock);

  // 1. Exact match
  const exactIdx = normBase.indexOf(normSearch);
  if (exactIdx !== -1) {
    return {
      success: true,
      content: normBase.slice(0, exactIdx) + normReplace + normBase.slice(exactIdx + normSearch.length),
    };
  }

  // 2. Trimmed lines match (handles trailing spaces and minor indent differences)
  const baseLines = normBase.split('\n');
  const searchLines = normSearch.split('\n');
  const searchLinesTrimmed = searchLines.map(l => l.trim());

  // Filter out empty leading/trailing lines in search for matching anchor
  let firstNonEmpty = 0;
  while (firstNonEmpty < searchLinesTrimmed.length && !searchLinesTrimmed[firstNonEmpty]) {
    firstNonEmpty++;
  }

  if (firstNonEmpty < searchLinesTrimmed.length) {
    const targetAnchor = searchLinesTrimmed[firstNonEmpty];
    for (let i = 0; i <= baseLines.length - (searchLines.length - firstNonEmpty); i++) {
      if (baseLines[i].trim() === targetAnchor) {
        // Check if subsequent lines match trimmed
        let match = true;
        for (let j = 0; j < searchLines.length - firstNonEmpty; j++) {
          const sLine = searchLinesTrimmed[firstNonEmpty + j];
          const bLine = baseLines[i + j]?.trim();
          if (sLine !== bLine) {
            match = false;
            break;
          }
        }
        if (match) {
          const before = baseLines.slice(0, i);
          const after = baseLines.slice(i + (searchLines.length - firstNonEmpty));
          const replaceLines = normReplace.split('\n');
          return {
            success: true,
            content: [...before, ...replaceLines, ...after].join('\n'),
          };
        }
      }
    }
  }

  return { success: false, content: baseText };
}

/**
 * Extracts and applies all search/replace blocks from patch text.
 * Supports:
 * <<<< SEARCH (or <<<<<<< SEARCH)
 * ...
 * ==== (or ======= or ==== REPLACE)
 * ...
 * >>>> (or >>>>>>>)
 */
export function applySearchReplacePatch(baseText, patchText) {
  if (!baseText) return { success: false, content: patchText };
  if (!patchText || typeof patchText !== 'string') return { success: true, content: baseText };

  // Match search-replace delimiters
  const blockRegex = /<{4,7}\s*(?:SEARCH)?\r?\n([\s\S]*?)\r?\n={4,7}(?:\s*REPLACE)?\r?\n([\s\S]*?)\r?\n>{4,7}/g;
  let match;
  let currentContent = baseText;
  let appliedCount = 0;
  let totalCount = 0;

  while ((match = blockRegex.exec(patchText)) !== null) {
    totalCount++;
    const searchPart = match[1];
    const replacePart = match[2];

    const result = applySearchReplaceBlock(currentContent, searchPart, replacePart);
    if (result.success) {
      currentContent = result.content;
      appliedCount++;
    } else {
      console.warn('[DiffApplier] Search block could not be matched:', searchPart.slice(0, 80));
    }
  }

  // If no SEARCH/REPLACE blocks were found, check for Unified Diff syntax
  if (totalCount === 0 && patchText.includes('@@') && (patchText.includes('\n-') || patchText.includes('\n+'))) {
    return applyUnifiedDiffPatch(baseText, patchText);
  }

  return {
    success: appliedCount > 0,
    content: currentContent,
    appliedCount,
    totalCount,
  };
}

/**
 * Fallback parser for standard unified diff format (@@ -line,count +line,count @@)
 */
export function applyUnifiedDiffPatch(baseText, diffText) {
  const normBase = normalizeLineEndings(baseText);
  const baseLines = normBase.split('\n');
  const lines = normalizeLineEndings(diffText).split('\n');

  const hunks = [];
  let currentHunk = null;

  for (const line of lines) {
    if (line.startsWith('@@')) {
      if (currentHunk) hunks.push(currentHunk);
      currentHunk = { lines: [] };
    } else if (currentHunk) {
      if (line.startsWith('+') || line.startsWith('-') || line.startsWith(' ') || line === '') {
        currentHunk.lines.push(line);
      }
    }
  }
  if (currentHunk) hunks.push(currentHunk);

  if (hunks.length === 0) {
    return { success: false, content: baseText, appliedCount: 0, totalCount: 0 };
  }

  let resultLines = [...baseLines];
  let appliedCount = 0;

  for (const hunk of hunks) {
    const removals = [];
    const additions = [];
    for (const hLine of hunk.lines) {
      if (hLine.startsWith('-')) removals.push(hLine.slice(1).trim());
      else if (hLine.startsWith('+')) additions.push(hLine.slice(1));
    }

    if (removals.length > 0) {
      const anchor = removals[0];
      const matchIdx = resultLines.findIndex(l => l.trim() === anchor);
      if (matchIdx !== -1) {
        resultLines.splice(matchIdx, removals.length, ...additions);
        appliedCount++;
      }
    } else if (additions.length > 0) {
      resultLines.push(...additions);
      appliedCount++;
    }
  }

  return {
    success: appliedCount > 0,
    content: resultLines.join('\n'),
    appliedCount,
    totalCount: hunks.length,
  };
}
