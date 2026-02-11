// Shared paper normalization — one output shape for all sources
// { id, paperId, title, authors, year, citationCount, abstract, fieldsOfStudy, doi, source, val, _refs }

// ── Helpers (OpenAlex-specific) ───────────────────────────────

export function reconstructAbstract(invertedIndex) {
  if (!invertedIndex) return '';
  const words = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      words[pos] = word;
    }
  }
  return words.join(' ').slice(0, 500);
}

export function oaId(fullId) {
  if (!fullId) return null;
  if (fullId.startsWith('https://openalex.org/')) return fullId.slice(20);
  return fullId;
}

export function mapFieldsOfStudy(work) {
  if (!work.topics || work.topics.length === 0) {
    if (work.concepts && work.concepts.length > 0) {
      return work.concepts.slice(0, 2).map(c => c.display_name);
    }
    return [];
  }
  const fields = [];
  const seen = new Set();
  for (const topic of work.topics.slice(0, 3)) {
    const domain = topic.domain?.display_name;
    const field = topic.field?.display_name;
    const name = field || domain || topic.display_name;
    if (name && !seen.has(name)) {
      seen.add(name);
      fields.push(name);
    }
  }
  return fields;
}

// ── Semantic Scholar ──────────────────────────────────────────

export function normalizeS2Paper(paper) {
  return {
    id: paper.paperId,
    paperId: paper.paperId,
    title: paper.title || 'Untitled',
    authors: (paper.authors || []).map(a => a.name || a),
    year: paper.year,
    citationCount: paper.citationCount || 0,
    influentialCitationCount: paper.influentialCitationCount || 0,
    abstract: paper.abstract || '',
    tldr: paper.tldr?.text || '',
    fieldsOfStudy: paper.fieldsOfStudy || [],
    doi: paper.externalIds?.DOI || null,
    arxivId: paper.externalIds?.ArXiv || null,
    source: 'semantic_scholar',
    references: (paper.references || []).filter(r => r.paperId).map(r => r.paperId),
    citations: (paper.citations || []).filter(c => c.paperId).map(c => c.paperId),
    val: Math.max(3, Math.log10((paper.citationCount || 0) + 1) * 3),
  };
}

// ── OpenAlex ──────────────────────────────────────────────────

export function normalizeOpenAlexWork(work) {
  const id = oaId(work.id);
  if (!id || !work.display_name) return null;

  return {
    id,
    paperId: id,
    title: work.display_name,
    authors: (work.authorships || []).slice(0, 8).map(a => a.author?.display_name || 'Unknown'),
    year: work.publication_year,
    citationCount: work.cited_by_count || 0,
    abstract: reconstructAbstract(work.abstract_inverted_index),
    fieldsOfStudy: mapFieldsOfStudy(work),
    doi: work.doi ? work.doi.replace('https://doi.org/', '') : null,
    source: 'openalex',
    val: Math.max(3, Math.log10((work.cited_by_count || 0) + 1) * 3),
    _refs: (work.referenced_works || []).map(oaId).filter(Boolean),
  };
}

// ── Crossref ──────────────────────────────────────────────────

export function normalizeCrossrefWork(item) {
  const doi = item.DOI;
  if (!doi || !item.title?.[0]) return null;

  const id = `cr_${doi.replace(/[^a-zA-Z0-9]/g, '_')}`;

  // Strip JATS XML tags from abstract
  let abstract = item.abstract || '';
  abstract = abstract.replace(/<[^>]+>/g, '').slice(0, 500);

  const year =
    item.published?.['date-parts']?.[0]?.[0] ||
    item['published-print']?.['date-parts']?.[0]?.[0] ||
    item['published-online']?.['date-parts']?.[0]?.[0] ||
    null;

  const refs = (item.reference || [])
    .map(r => r.DOI ? `cr_${r.DOI.replace(/[^a-zA-Z0-9]/g, '_')}` : null)
    .filter(Boolean);

  return {
    id,
    paperId: id,
    title: item.title[0],
    authors: (item.author || []).slice(0, 8).map(a =>
      [a.given, a.family].filter(Boolean).join(' ') || 'Unknown'
    ),
    year,
    citationCount: item['is-referenced-by-count'] || 0,
    abstract,
    fieldsOfStudy: (item.subject || []).slice(0, 3),
    doi,
    source: 'crossref',
    val: Math.max(3, Math.log10((item['is-referenced-by-count'] || 0) + 1) * 3),
    _refs: refs,
  };
}

// ── World Bank ────────────────────────────────────────────────

export function normalizeWorldBankDoc(doc) {
  if (!doc.display_title) return null;

  const id = `wb_${doc.id || doc.docdt || ''}_${Math.random().toString(36).slice(2, 6)}`;

  const authors = doc.authr
    ? doc.authr.split(';').map(a => a.trim()).filter(Boolean)
    : [];

  const year = doc.docdt ? new Date(doc.docdt).getFullYear() : null;

  let abstract = '';
  if (doc.abstracts) {
    abstract = typeof doc.abstracts === 'string'
      ? doc.abstracts
      : (doc.abstracts.cdata || doc.abstracts || '');
    if (typeof abstract === 'object') abstract = '';
    abstract = abstract.slice(0, 500);
  }

  let fields = [];
  if (doc.topic) {
    if (Array.isArray(doc.topic)) {
      fields = doc.topic.map(t => typeof t === 'string' ? t : (t.name || '')).filter(Boolean).slice(0, 3);
    } else if (typeof doc.topic === 'string') {
      fields = [doc.topic];
    }
  }

  return {
    id,
    paperId: id,
    title: doc.display_title,
    authors: authors.slice(0, 8),
    year: (year && year > 1900 && year < 2100) ? year : null,
    citationCount: 0,
    abstract,
    fieldsOfStudy: fields,
    doi: doc.doi || null,
    source: 'worldbank',
    val: 3,
    _refs: [],
  };
}
