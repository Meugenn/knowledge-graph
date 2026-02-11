// Bundled sample paper collections for the Add Papers panel
// Query format matches bulkFetchPapers: { filter, label, pages }

export const SAMPLE_COLLECTIONS = [
  {
    id: 'top-ai',
    label: 'Top AI Papers',
    description: '50 landmark papers: Transformers, GPT, BERT, diffusion models, RL',
    type: 'seed',
  },
  {
    id: 'biology',
    label: 'Biology & Medicine',
    description: 'CRISPR, protein folding, mRNA vaccines, single-cell RNA-seq',
    type: 'openalex',
    queries: [
      { filter: 'default.search:CRISPR gene editing', label: 'CRISPR', pages: 2 },
      { filter: 'default.search:protein structure prediction AlphaFold', label: 'Protein Folding', pages: 2 },
      { filter: 'default.search:mRNA vaccine immunology', label: 'mRNA Vaccines', pages: 1 },
      { filter: 'default.search:single cell RNA sequencing', label: 'scRNA-seq', pages: 1 },
    ],
  },
  {
    id: 'physics',
    label: 'Quantum & Physics',
    description: 'Quantum computing, gravitational waves, topological materials',
    type: 'openalex',
    queries: [
      { filter: 'default.search:quantum computing qubit error correction', label: 'Quantum Computing', pages: 2 },
      { filter: 'default.search:gravitational waves LIGO detection', label: 'Gravitational Waves', pages: 1 },
      { filter: 'default.search:topological insulators quantum materials', label: 'Topological Materials', pages: 1 },
    ],
  },
  {
    id: 'climate',
    label: 'Climate & Energy',
    description: 'Climate modeling, solar cells, batteries, carbon capture',
    type: 'openalex',
    queries: [
      { filter: 'default.search:climate change modeling prediction', label: 'Climate Modeling', pages: 2 },
      { filter: 'default.search:perovskite solar cell efficiency', label: 'Solar Cells', pages: 1 },
      { filter: 'default.search:lithium ion battery solid state', label: 'Batteries', pages: 1 },
      { filter: 'default.search:carbon capture utilization storage', label: 'Carbon Capture', pages: 1 },
    ],
  },
  {
    id: 'neuro',
    label: 'Neuroscience',
    description: 'Connectomics, optogenetics, brain-computer interfaces',
    type: 'openalex',
    queries: [
      { filter: 'default.search:brain connectome neural circuits', label: 'Connectomics', pages: 2 },
      { filter: 'default.search:optogenetics neural activity control', label: 'Optogenetics', pages: 1 },
      { filter: 'default.search:brain computer interface decoding', label: 'BCI', pages: 1 },
    ],
  },
  // ── Social Sciences & Economics ──────────────────────────────
  {
    id: 'economics',
    label: 'Economics & Finance (SSRN/RePEc)',
    description: 'Behavioral economics, financial economics, macroeconomics, game theory, econometrics',
    type: 'openalex',
    queries: [
      { filter: 'default.search:behavioral economics prospect theory nudge', label: 'Behavioral Econ', pages: 2 },
      { filter: 'default.search:financial economics asset pricing risk', label: 'Financial Econ', pages: 2 },
      { filter: 'default.search:macroeconomics monetary policy inflation', label: 'Macroeconomics', pages: 2 },
      { filter: 'default.search:game theory mechanism design auction', label: 'Game Theory', pages: 1 },
      { filter: 'default.search:econometrics causal inference regression', label: 'Econometrics', pages: 2 },
      { filter: 'default.search:labor economics wages employment', label: 'Labor Economics', pages: 1 },
      { filter: 'default.search:international trade tariff comparative advantage', label: 'Trade', pages: 1 },
    ],
  },
  {
    id: 'polisci',
    label: 'Political Science (JSTOR)',
    description: 'Democratic institutions, international relations, political economy, comparative politics',
    type: 'openalex',
    queries: [
      { filter: 'default.search:democratic institutions electoral systems voting', label: 'Democracy', pages: 2 },
      { filter: 'default.search:international relations conflict cooperation diplomacy', label: 'Int. Relations', pages: 2 },
      { filter: 'default.search:political economy inequality redistribution welfare', label: 'Political Economy', pages: 2 },
      { filter: 'default.search:comparative politics regime authoritarian', label: 'Comparative Politics', pages: 1 },
      { filter: 'default.search:public policy governance regulation', label: 'Public Policy', pages: 1 },
    ],
  },
  {
    id: 'sociology',
    label: 'Sociology',
    description: 'Social inequality, social networks, migration, urban sociology, cultural sociology',
    type: 'openalex',
    queries: [
      { filter: 'default.search:social inequality stratification mobility class', label: 'Inequality', pages: 2 },
      { filter: 'default.search:social network analysis community ties', label: 'Social Networks', pages: 1 },
      { filter: 'default.search:immigration migration integration assimilation', label: 'Migration', pages: 2 },
      { filter: 'default.search:urban sociology gentrification neighborhood', label: 'Urban Sociology', pages: 1 },
      { filter: 'default.search:race ethnicity discrimination sociology', label: 'Race & Ethnicity', pages: 1 },
    ],
  },
  {
    id: 'dev-economics',
    label: 'Development Economics (World Bank/NBER)',
    description: 'Poverty, RCTs, economic growth, World Bank policy research, NBER working papers',
    type: 'openalex',
    queries: [
      // OpenAlex — development economics core topics
      { filter: 'default.search:development economics poverty reduction intervention', label: 'Poverty', pages: 2 },
      { filter: 'default.search:randomized controlled trial development economics', label: 'RCTs', pages: 2 },
      { filter: 'default.search:economic growth institutions developing countries', label: 'Growth', pages: 2 },
      { filter: 'default.search:microfinance financial inclusion developing', label: 'Microfinance', pages: 1 },
      { filter: 'default.search:foreign aid effectiveness development', label: 'Aid & Development', pages: 1 },
      // World Bank API — policy research documents
      { source: 'worldbank', filter: 'poverty reduction economic development', label: 'World Bank: Poverty', pages: 2 },
      { source: 'worldbank', filter: 'climate change developing countries policy', label: 'World Bank: Climate', pages: 1 },
      { source: 'worldbank', filter: 'education human capital development', label: 'World Bank: Education', pages: 1 },
      // Crossref — NBER working papers (prefix 10.3386)
      { source: 'crossref', filter: 'development economics poverty', label: 'NBER: Development', pages: 1, prefix: '10.3386' },
      { source: 'crossref', filter: 'economic growth institutions', label: 'NBER: Growth', pages: 1, prefix: '10.3386' },
    ],
  },
  {
    id: 'nber-working',
    label: 'NBER Working Papers',
    description: 'National Bureau of Economic Research: macro, labor, public finance, health economics',
    type: 'openalex',
    queries: [
      // Crossref with NBER DOI prefix for direct NBER papers
      { source: 'crossref', filter: 'macroeconomics monetary policy', label: 'NBER: Macro', pages: 1, prefix: '10.3386' },
      { source: 'crossref', filter: 'labor economics wages employment', label: 'NBER: Labor', pages: 1, prefix: '10.3386' },
      { source: 'crossref', filter: 'public finance taxation government', label: 'NBER: Public Finance', pages: 1, prefix: '10.3386' },
      { source: 'crossref', filter: 'health economics insurance', label: 'NBER: Health', pages: 1, prefix: '10.3386' },
      { source: 'crossref', filter: 'international trade finance', label: 'NBER: Trade', pages: 1, prefix: '10.3386' },
      // OpenAlex fallback for broader NBER-related content
      { filter: 'default.search:NBER working paper economics', label: 'NBER via OpenAlex', pages: 2 },
    ],
  },
  {
    id: 'full-import',
    label: 'Full OpenAlex Import',
    description: '~5,000 papers across 10 fields (takes 30-60 seconds)',
    type: 'openalex-full',
  },
];
