const KnowledgeGraph = require('../services/kg');
const AgentGateway = require('../services/agent-gateway');
const DataOracle = require('../services/data-oracle');
const ForensicsService = require('../services/forensics');
const TRiSM = require('../services/trism');
const Paper2AgentService = require('../services/paper2agent');
const HumanChain = require('../services/blockchain/human-chain');
const AIChain = require('../services/blockchain/ai-chain');
const Bridge = require('../services/blockchain/bridge');
const EventListener = require('../services/blockchain/event-listener');

function createRepublic({ anthropicApiKey, s2ApiKey, wss } = {}) {
  // Layer 1: Knowledge Graph
  const kg = new KnowledgeGraph();

  // Layer 2: Agent Gateway
  const agentGateway = new AgentGateway({ kg, anthropicApiKey });

  // Layer 3: Data Oracle
  const dataOracle = new DataOracle({ kg, s2ApiKey });

  // Layer 4: Forensics
  const forensics = new ForensicsService({ kg });

  // Layer 5: TRiSM
  const trism = new TRiSM({ kg });

  // Wire TRiSM as post-response hook on agent gateway
  const originalChat = agentGateway.chat.bind(agentGateway);
  agentGateway.chat = async function (agentId, task, context) {
    const result = await originalChat(agentId, task, context);
    const check = await trism.evaluateResponse(agentId, result.response);
    result.trism = check;
    return result;
  };

  // Layer 6: Paper2Agent
  const paper2agent = new Paper2AgentService({ kg, agentGateway, forensics });

  // Layer 7: Blockchain
  const humanChain = new HumanChain();
  const aiChain = new AIChain({ walletManager: agentGateway.wallets });
  const bridge = new Bridge({ humanChain, aiChain });
  const eventListener = new EventListener({ humanChain, aiChain, bridge, wss });

  return {
    kg,
    agentGateway,
    dataOracle,
    forensics,
    trism,
    paper2agent,
    humanChain,
    aiChain,
    bridge,
    eventListener,
  };
}

module.exports = { createRepublic };
