// Evidence retrieval for Source-Grounded Claim Review.
// Deterministic lexical search (BM25) over passages of APPROVED reference
// documents only. No AI is involved here, so every returned excerpt is a
// verbatim slice of a stored document version.

const STOPWORDS = new Set((
  'a an and are as at be been being but by can could did do does for from had has have he her his how i if in into is it its ' +
  'may might of on or our she should so than that the their them then there these they this those to was we were what when ' +
  'where which who will with would you your not no'
).split(' '));

const MAX_PASSAGE_CHARS = 600;
const DEFAULT_LIMIT = 5;

function stem(word) {
  if (word.length > 5 && word.endsWith('ing')) return word.slice(0, -3);
  if (word.length > 4 && word.endsWith('ed')) return word.slice(0, -2);
  if (word.length > 4 && word.endsWith('es')) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

function tokenize(text) {
  const words = String(text || '').toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  return words.filter((word) => word.length > 1 && !STOPWORDS.has(word)).map(stem);
}

function lineNumberAt(content, offset) {
  let line = 1;
  for (let i = 0; i < offset && i < content.length; i += 1) {
    if (content.charCodeAt(i) === 10) line += 1;
  }
  return line;
}

// Splits a document into passages (paragraphs; long paragraphs are cut into
// sentence groups). Each passage records where it came from in the source.
function chunkDocument(content) {
  const text = String(content || '').replace(/\r\n?/g, '\n');
  const passages = [];
  let section = '';
  let paragraph = 0;
  const blocks = /[^\n]+(?:\n(?!\s*\n)[^\n]+)*/g;
  let match;

  while ((match = blocks.exec(text)) !== null) {
    const block = match[0];
    const blockStart = match.index;
    const trimmedBlock = block.trim();
    if (!trimmedBlock) continue;

    const heading = /^#{1,6}\s+(.+)$/.exec(trimmedBlock);
    if (heading && !trimmedBlock.includes('\n')) {
      section = heading[1].trim().slice(0, 160);
      continue;
    }
    paragraph += 1;

    const pieces = [];
    if (trimmedBlock.length <= MAX_PASSAGE_CHARS) {
      pieces.push({ start: blockStart + block.indexOf(trimmedBlock), text: trimmedBlock });
    } else {
      const sentenceRegex = /[^.!?\n]+(?:[.!?]+(?=\s|$)|$)/g;
      let sentence;
      let current = null;
      while ((sentence = sentenceRegex.exec(block)) !== null) {
        const raw = sentence[0];
        const clean = raw.trim();
        if (!clean) continue;
        const start = blockStart + sentence.index + raw.indexOf(clean);
        if (current && current.text.length + clean.length + 1 <= MAX_PASSAGE_CHARS) {
          current.text = text.slice(current.start, start + clean.length);
        } else {
          if (current) pieces.push(current);
          current = { start, text: clean.length > MAX_PASSAGE_CHARS * 2 ? clean.slice(0, MAX_PASSAGE_CHARS * 2) : clean };
        }
      }
      if (current) pieces.push(current);
    }

    pieces.forEach((piece) => {
      passages.push({
        text: piece.text,
        section,
        paragraph,
        line: lineNumberAt(text, piece.start),
        startOffset: piece.start,
        endOffset: piece.start + piece.text.length,
      });
    });
  }
  return passages;
}

// documents: [{ documentId, title, owner, version, contentHash, content }]
function retrieveEvidence(claim, documents, { limit = DEFAULT_LIMIT } = {}) {
  const queryTerms = [...new Set(tokenize(claim))];
  if (!queryTerms.length) return [];

  const corpus = [];
  documents.forEach((doc) => {
    chunkDocument(doc.content).forEach((passage) => {
      const terms = tokenize(passage.text);
      if (!terms.length) return;
      const frequencies = new Map();
      terms.forEach((term) => frequencies.set(term, (frequencies.get(term) || 0) + 1));
      corpus.push({ doc, passage, frequencies, length: terms.length });
    });
  });
  if (!corpus.length) return [];

  const totalLength = corpus.reduce((sum, item) => sum + item.length, 0);
  const averageLength = totalLength / corpus.length || 1;
  const docFrequency = new Map();
  queryTerms.forEach((term) => {
    docFrequency.set(term, corpus.filter((item) => item.frequencies.has(term)).length);
  });

  const k1 = 1.4;
  const b = 0.75;
  const minMatched = queryTerms.length >= 4 ? 2 : 1;

  const scored = corpus.map((item) => {
    let score = 0;
    let matched = 0;
    queryTerms.forEach((term) => {
      const frequency = item.frequencies.get(term);
      if (!frequency) return;
      matched += 1;
      const n = docFrequency.get(term);
      const idf = Math.log(1 + (corpus.length - n + 0.5) / (n + 0.5));
      score += idf * ((frequency * (k1 + 1)) / (frequency + k1 * (1 - b + b * (item.length / averageLength))));
    });
    return { item, score, matched };
  }).filter((entry) => entry.score > 0 && entry.matched >= minMatched)
    .sort((a, b2) => b2.score - a.score);

  if (!scored.length) return [];
  const top = scored[0].score;
  return scored
    .filter((entry) => entry.score >= top * 0.25)
    .slice(0, limit)
    .map(({ item, score }) => ({
      documentId: item.doc.documentId,
      documentTitle: item.doc.title,
      documentOwner: item.doc.owner,
      version: item.doc.version,
      contentHash: item.doc.contentHash,
      excerpt: item.passage.text,
      location: {
        section: item.passage.section,
        paragraph: item.passage.paragraph,
        line: item.passage.line,
        startOffset: item.passage.startOffset,
        endOffset: item.passage.endOffset,
      },
      score: Math.round(score * 1000) / 1000,
    }));
}

module.exports = { chunkDocument, retrieveEvidence, tokenize };