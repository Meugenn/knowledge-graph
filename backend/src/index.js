require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');
const http = require('http');

// Detect working Python command (python3 on Linux/Mac, python on Windows)
const PYTHON_CMD = process.platform === 'win32' ? 'python' : 'python3';

// ——— Environment Variable Validation ———
function validateEnvironment() {
  const warnings = [];
  const errors = [];

  // Check optional but recommended variables
  if (!process.env.ANTHROPIC_API_KEY && !process.env.GEMINI_API_KEY) {
    warnings.push('⚠️  No AI provider API key found (ANTHROPIC_API_KEY or GEMINI_API_KEY). AI agent features will use mock responses.');
  }
  
  if (!process.env.S2_API_KEY) {
    warnings.push('⚠️  S2_API_KEY not set. Semantic Scholar API will have rate limits.');
  }

  // Log warnings
  warnings.forEach(w => console.warn(w));

  // Check if private key is the default placeholder
  if (process.env.PRIVATE_KEY === 'your_private_key_here') {
    errors.push('❌ PRIVATE_KEY is still set to placeholder value. Update .env with a real private key.');
  }

  // If there are critical errors, exit
  if (errors.length > 0) {
    errors.forEach(e => console.error(e));
    console.error('\n❌ Environment validation failed. Please check your .env file.\n');
    process.exit(1);
  }

  if (warnings.length === 0) {
    console.log('✅ Environment validation passed\n');
  }
}

validateEnvironment();

// Republic services
const KnowledgeGraph = require('../services/kg');
const AgentGateway = require('../services/agent-gateway');
const DataOracle = require('../services/data-oracle');
const Forensics = require('../services/forensics');
const TRiSM = require('../services/trism');
const Paper2AgentService = require('../services/paper2agent');
const Blockchain = require('../services/blockchain');
const SwarmEngine = require('../services/swarm');
const RepublicEngine = require('../services/republic-engine');

// Route factories
const kgRoutes = require('./routes/kg');
const agentRoutes = require('./routes/agents');
const oracleRoutes = require('./routes/oracle');
const forensicsRoutes = require('./routes/forensics');
const trismRoutes = require('./routes/trism');
const paper2agentRoutes = require('./routes/paper2agent');
const blockchainRoutes = require('./routes/blockchain');
const swarmRoutes = require('./routes/swarm');
const republicRoutes = require('./routes/republic');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting for sensitive routes
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket server for real-time logs
const wss = new WebSocket.Server({ server });

// ——— Instantiate Republic services ———
const kg = new KnowledgeGraph();
const agentGateway = new AgentGateway({ kg });
const oracle = new DataOracle();
const forensics = new Forensics({ kg });
const trism = new TRiSM({ kg });
const paper2agent = new Paper2AgentService({ kg, agentGateway, forensics });
const blockchain = new Blockchain();
const swarm = new SwarmEngine({ kg, agentGateway, dataOracle: oracle, forensics, paper2agent });
const republic = new RepublicEngine({ kg, agentGateway, dataOracle: oracle, forensics, trism, wss });

// Wire TRiSM into AgentGateway as post-response hook
agentGateway.setTRiSMHook(async (agentId, content, context) => {
  return trism.evaluateResponse(agentId, content, context);
});

// ——— Mount Republic routes ———
app.use('/api/kg', kgRoutes(kg));
app.use('/api/agents', apiLimiter, agentRoutes(agentGateway));
app.use('/api/oracle', oracleRoutes(oracle, kg));
app.use('/api/forensics', forensicsRoutes(forensics));
app.use('/api/trism', trismRoutes(trism));
app.use('/api/papers', paper2agentRoutes(paper2agent));
app.use('/api/blockchain', blockchainRoutes(blockchain));
app.use('/api/swarm', swarmRoutes(swarm, wss));
app.use('/api/republic', republicRoutes(republic, wss));

// ——— Polymarket proxy (avoids CORS in browser) ———
app.get('/api/polymarket/events', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const url = `https://gamma-api.polymarket.com/events?closed=false&active=true&limit=${limit}&order=volume24hr&ascending=false`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Gamma API ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Polymarket proxy error:', err.message);
    res.status(502).json({ error: 'Failed to fetch from Polymarket' });
  }
});

// ——— Semantic Scholar API proxy (keeps API key secure on backend) ———
app.get('/api/semantic-scholar/:path(*)', async (req, res) => {
  try {
    const apiPath = req.params.path;
    const queryParams = new URLSearchParams(req.query).toString();
    const url = `https://api.semanticscholar.org/${apiPath}${queryParams ? '?' + queryParams : ''}`;

    const headers = { 'Accept': 'application/json' };
    if (process.env.S2_API_KEY) {
      headers['x-api-key'] = process.env.S2_API_KEY;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`Semantic Scholar API ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Semantic Scholar proxy error:', err.message);
    res.status(502).json({ error: 'Failed to fetch from Semantic Scholar' });
  }
});

// ——— LLM helper (reusable by route handler + internal callers like Kaggle AI) ———

// Auto-detect provider from API key prefix
function detectProviderFromKey(key) {
  if (!key) return null;
  if (key.startsWith('AIza')) return 'gemini';
  if (key.startsWith('sk-')) return 'openai';
  return 'claude'; // Anthropic keys don't have a standard prefix
}

async function callLLMInternal({ provider, model, systemPrompt, messages, maxTokens = 1500, temperature = 0.7, userApiKey }) {
  if (!messages || !Array.isArray(messages)) {
    throw new Error('messages array is required');
  }

  // Auto-detect provider from key prefix to prevent key/provider mismatch
  if (userApiKey) {
    const detectedProvider = detectProviderFromKey(userApiKey);
    if (detectedProvider && detectedProvider !== provider) {
      provider = detectedProvider;
    }
  }

  if (provider === 'gemini') {
    const apiKey = userApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Gemini API key not available. Add your key in Settings.');

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const genModel = genAI.getGenerativeModel({
      model: model || 'gemini-2.5-flash',
      systemInstruction: systemPrompt || undefined,
    });

    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

    const result = await genModel.generateContent({
      contents,
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    });

    return result.response.text();

  } else if (provider === 'claude') {
    const apiKey = userApiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('Anthropic API key not available. Add your key in Settings.');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-5-20250929',
        system: systemPrompt || '',
        messages: messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Claude API error: ${errBody.slice(0, 300)}`);
    }

    const data = await response.json();
    const textBlock = data.content?.find(b => b.type === 'text');
    return textBlock?.text || '';

  } else {
    // OpenAI / OpenRouter / custom
    const apiKey = userApiKey || process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OpenAI/OpenRouter API key not available. Add your key in Settings.');

    const url = provider === 'openrouter'
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt || '' },
          ...messages.filter(m => m.role !== 'system'),
        ],
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`API error: ${errBody.slice(0, 300)}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}

// ——— LLM proxy route (thin wrapper around callLLMInternal) ———
const llmLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many LLM requests, please slow down.' },
});

app.post('/api/llm/chat', llmLimiter, async (req, res) => {
  try {
    const { provider, model, systemPrompt, messages, maxTokens, temperature, userApiKey } = req.body;
    const content = await callLLMInternal({ provider, model, systemPrompt, messages, maxTokens, temperature, userApiKey });
    return res.json({ content });
  } catch (err) {
    console.error('LLM proxy error:', err.message);
    const status = err.message.includes('not available') ? 500 : err.message.includes('API error') ? 502 : 500;
    res.status(status).json({ error: err.message });
  }
});

// ——— AI Paper Search for Kaggle pipeline ———
async function runAIPaperSearch(dataDir, competition, sessionId, { provider, model, userApiKey }) {
  // 1. Read analysis.json
  const analysisPath = path.join(dataDir, 'analysis.json');
  if (!fs.existsSync(analysisPath)) {
    throw new Error('analysis.json not found — data analyzer may not have run');
  }
  const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));

  // 2. Extract dataset context
  const ctx = {
    rows: analysis.train_rows || analysis.rows || '?',
    features: analysis.num_features || '?',
    numeric: analysis.numeric_features?.length || 0,
    categorical: analysis.categorical_features?.length || 0,
    problemType: analysis.problem_type || 'unknown',
    target: analysis.target || '?',
    missing: (analysis.missing_columns || []).slice(0, 10).join(', ') || 'none',
    classImbalance: analysis.class_imbalance_ratio || 'N/A',
    correlations: (analysis.top_correlations || []).slice(0, 5).map(c => `${c.feature}: ${c.correlation}`).join(', ') || 'N/A',
  };

  // 3. Build prompt
  const systemPrompt = `You are an ML research advisor for Kaggle competitions. Given a dataset analysis, suggest 3-5 relevant academic papers and the sklearn techniques they inspire. Respond with ONLY a valid JSON array, no markdown or explanation.`;

  const userMessage = `Dataset: ${competition}
- ${ctx.rows} training rows, ${ctx.features} features (${ctx.numeric} numeric, ${ctx.categorical} categorical)
- Problem type: ${ctx.problemType}, Target: ${ctx.target}
- Missing data columns: ${ctx.missing}
- Class imbalance ratio: ${ctx.classImbalance}
- Top correlations: ${ctx.correlations}

Suggest 3-5 ADDITIONAL papers/techniques. For each, provide:
[{
  "paper_id": "author_year",
  "paper_title": "Full title",
  "technique": "Technique name",
  "reason": "Why relevant for this dataset",
  "sklearn_strategy": "gradient_boosting|random_forest|logistic_regression|ensemble|feature_selection|pca|hyperparameter_search"
}]`;

  // 4. Call LLM — smart provider resolution
  let effectiveProvider = provider;
  if (userApiKey) {
    // Auto-detect from key prefix (e.g. AIza → gemini, sk- → openai)
    effectiveProvider = detectProviderFromKey(userApiKey) || provider;
  } else if (!effectiveProvider || (effectiveProvider === 'claude' && !process.env.ANTHROPIC_API_KEY)) {
    // Frontend sent default 'claude' but no Claude key — fall back to available env key
    if (process.env.GEMINI_API_KEY) effectiveProvider = 'gemini';
    else if (process.env.ANTHROPIC_API_KEY) effectiveProvider = 'claude';
    else if (process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY) effectiveProvider = 'openai';
  }
  if (!effectiveProvider && !userApiKey) {
    throw new Error('No LLM provider available for AI paper search');
  }

  broadcastLog(sessionId, 'paper_search', 'Querying AI for paper suggestions...', 'running');

  const content = await callLLMInternal({
    provider: effectiveProvider,
    model: model || undefined,
    systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    maxTokens: 2000,
    temperature: 0.4,
    userApiKey,
  });

  // 5. Parse response — extract JSON from possible markdown wrapping
  let suggestions;
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
  } catch {
    throw new Error('Failed to parse AI response as JSON');
  }

  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    throw new Error('AI returned no suggestions');
  }

  // 6. Write ai_suggestions.json
  fs.writeFileSync(path.join(dataDir, 'ai_suggestions.json'), JSON.stringify(suggestions, null, 2));

  // 7. Broadcast paper_matched events
  suggestions.forEach(s => {
    broadcastLog(sessionId, 'paper_search', `AI: ${s.technique} (${s.paper_id})`, 'running', {
      event: 'paper_matched',
      paper_id: `ai_${s.paper_id}`,
      technique: s.technique,
      source: 'ai',
    });
  });

  return suggestions;
}

// ——— Existing Kaggle pipeline routes ———

const activeSessions = new Map();

function broadcastLog(sessionId, stage, message, status = 'running', extra = {}) {
  const data = {
    sessionId,
    stage,
    message,
    status,
    timestamp: new Date().toISOString(),
    ...extra
  };

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

function runPythonScript(scriptName, args, sessionId, stage, env = {}) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', 'python', scriptName);
    const pythonProcess = spawn(PYTHON_CMD, [scriptPath, ...args], {
      env: { ...process.env, ...env }
    });

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      const message = data.toString();
      output += message;
      broadcastLog(sessionId, stage, message.trim(), 'running');
    });

    pythonProcess.stderr.on('data', (data) => {
      const message = data.toString();
      errorOutput += message;
      broadcastLog(sessionId, stage, message.trim(), 'running');
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        broadcastLog(sessionId, stage, 'Completed successfully', 'completed');
        resolve({ success: true, output, stage });
      } else {
        broadcastLog(sessionId, stage, `Failed with code ${code}`, 'error');
        reject({ success: false, error: errorOutput, stage, code });
      }
    });
  });
}

function runExperimentRunner(args, sessionId, env = {}) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', 'python', 'paper_experiment_runner.py');
    const pythonProcess = spawn(PYTHON_CMD, [scriptPath, ...args], {
      env: { ...process.env, ...env }
    });

    let output = '';
    let errorOutput = '';
    let lineBuffer = '';

    const session = activeSessions.get(sessionId);

    pythonProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      lineBuffer += chunk;

      const lines = lineBuffer.split('\n');
      lineBuffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        let parsed = null;
        try { parsed = JSON.parse(trimmed); } catch { broadcastLog(sessionId, 'experiment', trimmed, 'running'); continue; }

        const event = parsed.event;
        if (event === 'pipeline_start') {
          broadcastLog(sessionId, 'experiment', `Starting paper-driven pipeline on ${parsed.competition}`, 'running', { event: 'pipeline_start', target: parsed.target, problemType: parsed.problem_type });
        } else if (event === 'paper_matched') {
          if (session) { session.matchedPapers = session.matchedPapers || []; session.matchedPapers.push({ paperId: parsed.paper_id, technique: parsed.technique }); }
          broadcastLog(sessionId, 'paper_search', `Matched: ${parsed.technique} (${parsed.paper_id})`, 'running', { event: 'paper_matched' });
        } else if (event === 'experiment_result') {
          if (session) { session.experimentResults = session.experimentResults || []; session.experimentResults.push({ id: parsed.id, technique: parsed.technique, cvScore: parsed.cv_score }); }
          broadcastLog(sessionId, 'experiment', `${parsed.technique}: CV=${parsed.cv_score}`, 'running', { event: 'experiment_result' });
        } else if (event === 'submission_ready') {
          broadcastLog(sessionId, 'experiment', `Submission ready: ${parsed.rows} predictions`, 'completed', { event: 'submission_ready' });
        } else {
          broadcastLog(sessionId, 'experiment', parsed.message || trimmed, 'running');
        }
      }
    });

    pythonProcess.stderr.on('data', (data) => { errorOutput += data.toString(); });

    pythonProcess.on('close', (code) => {
      if (lineBuffer.trim()) broadcastLog(sessionId, 'experiment', lineBuffer.trim(), 'running');
      if (code === 0) resolve({ success: true, output }); else reject({ success: false, error: errorOutput, code });
    });
  });
}

// Kaggle routes
app.post('/api/kaggle/start', apiLimiter, async (req, res) => {
  const { competition, apiToken, llmProvider, llmModel, userApiKey } = req.body;
  if (!competition) return res.status(400).json({ error: 'Competition name is required' });

  // Sanitize competition name to prevent path traversal
  const safeCompetition = competition.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!safeCompetition) return res.status(400).json({ error: 'Invalid competition name' });

  const sessionId = `session_${Date.now()}`;
  const dataDir = path.join(__dirname, '..', 'data', safeCompetition);
  const submissionsDir = path.join(__dirname, '..', 'submissions', safeCompetition);
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.mkdirSync(submissionsDir, { recursive: true });
  } catch (err) {
    console.error('Failed to create directories:', err.message);
    return res.status(500).json({ error: 'Failed to initialize session directories' });
  }

  activeSessions.set(sessionId, { competition: safeCompetition, status: 'running', startTime: new Date(), stages: {}, matchedPapers: [], experimentResults: [] });

  (async () => {
    try {
      const effectiveToken = apiToken || process.env.KAGGLE_API_TOKEN || '';
      const kaggleEnv = effectiveToken ? { KAGGLE_API_TOKEN: effectiveToken } : {};
      await runPythonScript('kaggle_downloader.py', [competition, effectiveToken, dataDir], sessionId, 'download', kaggleEnv);
      await runPythonScript('data_analyzer.py', [dataDir, competition], sessionId, 'explore');

      // AI Paper Search (non-blocking — falls back to static registry on failure)
      broadcastLog(sessionId, 'paper_search', 'Starting AI paper search...', 'running');
      try {
        const aiSuggestions = await runAIPaperSearch(dataDir, safeCompetition, sessionId, {
          provider: llmProvider, model: llmModel, userApiKey
        });
        broadcastLog(sessionId, 'paper_search', `AI found ${aiSuggestions.length} additional techniques`, 'completed');
      } catch (aiErr) {
        broadcastLog(sessionId, 'paper_search', `AI search unavailable: ${aiErr.message} — using static registry`, 'completed');
      }

      await runExperimentRunner([dataDir, submissionsDir, competition], sessionId, kaggleEnv);
      activeSessions.get(sessionId).status = 'completed';
    } catch (error) {
      activeSessions.get(sessionId).status = 'error';
      broadcastLog(sessionId, error.stage || 'unknown', `Error: ${error.error || error.message}`, 'error');
    }
  })();

  res.json({ sessionId, message: 'Pipeline started', competition });
});

app.get('/api/kaggle/status/:sessionId', (req, res) => {
  const session = activeSessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

app.get('/api/kaggle/sessions', (req, res) => {
  res.json(Array.from(activeSessions.entries()).map(([id, data]) => ({ id, ...data })));
});

app.get('/api/kaggle/submission/:competition', (req, res) => {
  const safeComp = req.params.competition.replace(/[^a-zA-Z0-9_-]/g, '');
  const p = path.join(__dirname, '..', 'submissions', safeComp, 'submission.csv');
  if (fs.existsSync(p)) res.download(p); else res.status(404).json({ error: 'Not found' });
});

app.get('/api/kaggle/knowledge-graph/:competition', (req, res) => {
  const safeComp = req.params.competition.replace(/[^a-zA-Z0-9_-]/g, '');
  const p = path.join(__dirname, '..', 'data', safeComp, 'knowledge_graph.json');
  if (fs.existsSync(p)) { try { res.json(JSON.parse(fs.readFileSync(p, 'utf8'))); } catch { res.status(500).json({ error: 'Parse error' }); } }
  else res.status(404).json({ error: 'Not found' });
});

// Republic health
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    republic: {
      kg: kg.healthCheck(),
      agents: agentGateway.healthCheck(),
      oracle: oracle.healthCheck(),
      forensics: forensics.healthCheck(),
      trism: trism.healthCheck(),
      blockchain: blockchain.healthCheck(),
    },
  });
});

// WebSocket
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  ws.on('close', () => console.log('Client disconnected'));
});

// Start server
server.listen(PORT, () => {
  console.log(`The Republic backend running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
  console.log(`KG loaded: ${kg.getStats().paperCount} papers, ${kg.getStats().relationCount} relations`);
});
