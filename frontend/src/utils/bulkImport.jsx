// Bulk import papers from multiple free academic APIs
// Sources: OpenAlex (250M+ works), Crossref (130M+ works), World Bank Open Knowledge
// Each query can specify a `source` field; defaults to 'openalex'

import { normalizeOpenAlexWork, normalizeCrossrefWork, normalizeWorldBankDoc } from './normalization';

const OPENALEX_BASE = 'https://api.openalex.org';
const CROSSREF_BASE = 'https://api.crossref.org';
const WORLDBANK_BASE = 'https://search.worldbank.org/api/v2/wds';
const CACHE_KEY = 'rg_bulk_openalex_v2';
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

// Polite pool: adding email gives priority and avoids shared rate limits
const MAILTO = 'research-graph-demo@example.com';

// Per-request timeout to prevent getting stuck on one dataset
const FETCH_TIMEOUT_MS = 12000;

// Diverse queries across academic fields — each fetches 200 papers via cursor pagination
const DEFAULT_QUERIES = [
  // Computer Science / AI
  { filter: 'default.search:deep learning transformer', label: 'Deep Learning', pages: 3 },
  { filter: 'default.search:large language models', label: 'LLMs', pages: 2 },
  { filter: 'default.search:computer vision object detection', label: 'Computer Vision', pages: 2 },
  { filter: 'default.search:reinforcement learning policy optimization', label: 'RL', pages: 1 },
  { filter: 'default.search:graph neural network', label: 'GNNs', pages: 1 },
  // Biology & Medicine
  { filter: 'default.search:CRISPR gene editing', label: 'CRISPR', pages: 2 },
  { filter: 'default.search:protein structure prediction folding', label: 'Protein Folding', pages: 2 },
  { filter: 'default.search:single cell RNA sequencing transcriptomics', label: 'scRNA-seq', pages: 2 },
  { filter: 'default.search:mRNA vaccine immunology', label: 'mRNA Vaccines', pages: 1 },
  { filter: 'default.search:cancer immunotherapy checkpoint', label: 'Immunotherapy', pages: 1 },
  // Physics
  { filter: 'default.search:quantum computing qubit error correction', label: 'Quantum Computing', pages: 2 },
  { filter: 'default.search:gravitational waves LIGO detection', label: 'Gravitational Waves', pages: 1 },
  { filter: 'default.search:topological insulators quantum materials', label: 'Topological Materials', pages: 1 },
  // Neuroscience
  { filter: 'default.search:brain connectome neural circuits imaging', label: 'Connectomics', pages: 2 },
  { filter: 'default.search:optogenetics neural activity', label: 'Optogenetics', pages: 1 },
  // Climate & Environment
  { filter: 'default.search:climate change modeling prediction earth system', label: 'Climate Modeling', pages: 2 },
  { filter: 'default.search:renewable energy solar photovoltaic perovskite', label: 'Solar Energy', pages: 1 },
  // Mathematics & Statistics
  { filter: 'default.search:Bayesian inference probabilistic programming', label: 'Bayesian Stats', pages: 1 },
  // Chemistry & Materials
  { filter: 'default.search:lithium ion battery solid state electrolyte', label: 'Batteries', pages: 1 },
  { filter: 'default.search:metal organic framework porous materials', label: 'MOFs', pages: 1 },
];

// ────────────────────────────────────────────────────────────────
// Fetch utilities
// ────────────────────────────────────────────────────────────────

async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw err;
  }
}

async function fetchPageSafe(url, sourceName = 'API', signal = null) {
  try {
    if (signal?.aborted) return null;
    const res = await fetchWithTimeout(url, signal ? { signal } : {});
    if (res.status === 429) {
      await new Promise(r => setTimeout(r, 2000));
      if (signal?.aborted) return null;
      const retry = await fetchWithTimeout(url, signal ? { signal } : {});
      if (retry.ok) return await retry.json();
      console.warn(`${sourceName}: rate-limited, retry also failed (${retry.status})`);
      return null;
    }
    if (!res.ok) {
      console.warn(`${sourceName}: HTTP ${res.status} for ${url.slice(0, 120)}`);
      return null;
    }
    return await res.json();
  } catch (e) {
    if (e.name === 'AbortError') return null;
    console.warn(`${sourceName} fetch failed:`, e.message);
    return null;
  }
}

// ────────────────────────────────────────────────────────────────
// Source-specific fetch queries
// ────────────────────────────────────────────────────────────────

async function fetchOpenAlexQuery(query, allPapers, onProgress, queryIndex, totalQueries, totalFetched, signal) {
  const { filter, label, pages = 1 } = query;
  let cursor = '*';
  let added = 0;

  for (let page = 0; page < pages; page++) {
    if (signal?.aborted) break;
    if (onProgress) {
      onProgress({
        phase: 'fetching',
        field: label,
        queryIndex,
        totalQueries,
        total: totalFetched + added,
        page: page + 1,
        totalPages: pages,
      });
    }

    const url = `${OPENALEX_BASE}/works?filter=${encodeURIComponent(filter)},cited_by_count:>5&per-page=200&cursor=${cursor}&sort=cited_by_count:desc&select=id,doi,display_name,publication_year,authorships,cited_by_count,referenced_works,topics,concepts,abstract_inverted_index&mailto=${MAILTO}`;

    const data = await fetchPageSafe(url, 'OpenAlex', signal);
    if (!data?.results) break;

    for (const work of data.results) {
      const paper = normalizeOpenAlexWork(work);
      if (paper && !allPapers.has(paper.id)) {
        allPapers.set(paper.id, paper);
        added++;
      }
    }

    cursor = data.meta?.next_cursor;
    if (!cursor) break;

    await new Promise(r => setTimeout(r, 50));
  }

  return added;
}

// ────────────────────────────────────────────────────────────────
// Crossref fetch  (free, no auth, 130M+ works)
// ────────────────────────────────────────────────────────────────

async function fetchCrossrefQuery(query, allPapers, onProgress, queryIndex, totalQueries, totalFetched, signal) {
  const { filter, label, pages = 1, prefix } = query;
  const rowsPerPage = 50;
  let added = 0;

  for (let page = 0; page < pages; page++) {
    if (signal?.aborted) break;
    if (onProgress) {
      onProgress({
        phase: 'fetching',
        field: label,
        queryIndex,
        totalQueries,
        total: totalFetched + added,
        page: page + 1,
        totalPages: pages,
      });
    }

    const offset = page * rowsPerPage;
    let url = `${CROSSREF_BASE}/works?query=${encodeURIComponent(filter)}&rows=${rowsPerPage}&offset=${offset}&sort=is-referenced-by-count&order=desc&mailto=${MAILTO}`;
    if (prefix) {
      url += `&filter=prefix:${encodeURIComponent(prefix)}`;
    }

    const data = await fetchPageSafe(url, 'Crossref', signal);
    if (!data?.message?.items) break;

    for (const item of data.message.items) {
      const paper = normalizeCrossrefWork(item);
      if (paper && !allPapers.has(paper.id)) {
        allPapers.set(paper.id, paper);
        added++;
      }
    }

    // If fewer results than requested, no more pages
    if (data.message.items.length < rowsPerPage) break;

    await new Promise(r => setTimeout(r, 200)); // Crossref asks for politeness
  }

  return added;
}

// ────────────────────────────────────────────────────────────────
// World Bank Open Knowledge Repository fetch (free, no auth)
// ────────────────────────────────────────────────────────────────

async function fetchWorldBankQuery(query, allPapers, onProgress, queryIndex, totalQueries, totalFetched, signal) {
  const { filter, label, pages = 1 } = query;
  const rowsPerPage = 50;
  let added = 0;

  for (let page = 0; page < pages; page++) {
    if (signal?.aborted) break;
    if (onProgress) {
      onProgress({
        phase: 'fetching',
        field: label,
        queryIndex,
        totalQueries,
        total: totalFetched + added,
        page: page + 1,
        totalPages: pages,
      });
    }

    const offset = page * rowsPerPage;
    const url = `${WORLDBANK_BASE}?format=json&qterm=${encodeURIComponent(filter)}&rows=${rowsPerPage}&os=${offset}&fl=id,display_title,authr,docdt,abstracts,topic,doi&apilang=en`;

    const data = await fetchPageSafe(url, 'World Bank', signal);
    if (!data?.documents) break;

    // World Bank returns documents as an object keyed by ID, plus metadata keys
    const docs = Object.values(data.documents).filter(
      d => d && typeof d === 'object' && d.display_title
    );

    if (docs.length === 0) break;

    for (const doc of docs) {
      const paper = normalizeWorldBankDoc(doc);
      if (paper && !allPapers.has(paper.id)) {
        allPapers.set(paper.id, paper);
        added++;
      }
    }

    if (docs.length < rowsPerPage) break;

    await new Promise(r => setTimeout(r, 100));
  }

  return added;
}

// ────────────────────────────────────────────────────────────────
// Cache (localStorage)
// ────────────────────────────────────────────────────────────────

function getCachedData() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp < CACHE_TTL) return data;
  } catch (e) {
    // Corrupted cache
  }
  return null;
}

function setCachedData(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
    // localStorage full — try to store just papers without abstracts
    try {
      const slim = {
        papers: data.papers.map(p => ({ ...p, abstract: '' })),
        citations: data.citations,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: slim, timestamp: Date.now() }));
    } catch (e2) {
      // Really full, skip caching
    }
  }
}

// ────────────────────────────────────────────────────────────────
// Main bulk fetch — routes each query to the appropriate source
// ────────────────────────────────────────────────────────────────

export async function bulkFetchPapers(queries = DEFAULT_QUERIES, onProgress = null, signal = null) {
  // Only use cache for the default full import (not custom collection queries)
  const isDefaultQueries = queries === DEFAULT_QUERIES;
  if (isDefaultQueries) {
    const cached = getCachedData();
    if (cached) {
      if (onProgress) onProgress({
        phase: 'complete',
        total: cached.papers.length,
        citations: cached.citations.length,
        field: 'cache',
      });
      return cached;
    }
  }

  const allPapers = new Map();
  let totalFetched = 0;

  for (let queryIndex = 0; queryIndex < queries.length; queryIndex++) {
    if (signal?.aborted) break;
    const query = queries[queryIndex];
    const source = query.source || 'openalex';

    try {
      let added = 0;

      switch (source) {
        case 'crossref':
          added = await fetchCrossrefQuery(query, allPapers, onProgress, queryIndex, queries.length, totalFetched, signal);
          break;
        case 'worldbank':
          added = await fetchWorldBankQuery(query, allPapers, onProgress, queryIndex, queries.length, totalFetched, signal);
          break;
        case 'openalex':
        default:
          added = await fetchOpenAlexQuery(query, allPapers, onProgress, queryIndex, queries.length, totalFetched, signal);
          break;
      }

      totalFetched += added;
    } catch (err) {
      // Per-query error isolation — log and continue to next query
      console.warn(`[bulkImport] Query "${query.label}" (${source}) failed:`, err.message);
    }

    // Small delay between queries
    await new Promise(r => setTimeout(r, 30));
  }

  // Cross-source DOI deduplication: keep the entry with higher citationCount
  const doiIndex = new Map();
  for (const [id, paper] of allPapers) {
    if (!paper.doi) continue;
    const normDoi = paper.doi.toLowerCase().trim();
    const existing = doiIndex.get(normDoi);
    if (existing) {
      const existingPaper = allPapers.get(existing);
      if ((paper.citationCount || 0) > (existingPaper?.citationCount || 0)) {
        allPapers.delete(existing);
        doiIndex.set(normDoi, id);
      } else {
        allPapers.delete(id);
      }
    } else {
      doiIndex.set(normDoi, id);
    }
  }

  // Build citation edges where both papers are in our set
  if (onProgress) onProgress({ phase: 'building_edges', total: totalFetched });

  const papers = Array.from(allPapers.values());
  const paperIds = new Set(allPapers.keys());
  const citations = [];
  const citationSet = new Set();

  for (const paper of papers) {
    if (paper._refs) {
      for (const refId of paper._refs) {
        if (paperIds.has(refId)) {
          const key = `${paper.id}->${refId}`;
          if (!citationSet.has(key)) {
            citationSet.add(key);
            citations.push({ source: paper.id, target: refId });
          }
        }
      }
    }
    delete paper._refs;
  }

  const result = { papers, citations };
  if (isDefaultQueries) setCachedData(result);

  if (onProgress) onProgress({
    phase: 'complete',
    total: papers.length,
    citations: citations.length,
  });

  return result;
}

export function clearBulkCache() {
  localStorage.removeItem(CACHE_KEY);
}
