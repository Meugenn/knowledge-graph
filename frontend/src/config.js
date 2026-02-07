// Contract addresses - update after deployment
export const CONTRACTS = {
  RESEARCH_GRAPH: process.env.REACT_APP_RESEARCH_GRAPH || '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82',
  RESEARCH_TOKEN: process.env.REACT_APP_RESEARCH_TOKEN || '0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0',
  USDC: process.env.REACT_APP_USDC || '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e',
};

export const NETWORKS = {
  FLARE_TESTNET: {
    chainId: '0x72', // 114
    chainName: 'Flare Testnet Coston2',
    nativeCurrency: { name: 'Flare', symbol: 'FLR', decimals: 18 },
    rpcUrls: ['https://coston2-api.flare.network/ext/C/rpc'],
    blockExplorerUrls: ['https://coston2-explorer.flare.network/'],
  },
  PLASMA_TESTNET: {
    chainId: '0x1E61', // 7777
    chainName: 'Plasma Testnet',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://rpc-testnet.plasma.xyz'],
    blockExplorerUrls: ['https://explorer-testnet.plasma.xyz/'],
  },
};

export const ABIS = {
  RESEARCH_GRAPH: [
    'function submitPaper(string ipfsHash, string doi) external returns (uint256)',
    'function submitReview(uint256 paperId, uint8 score, string ipfsHash) external',
    'function addCitation(uint256 citingPaperId, uint256 citedPaperId) external',
    'function registerAsReviewer(uint256 stakeAmount) external',
    'function verifyExternalData(uint256 paperId) external',
    'function getPaper(uint256 paperId) external view returns (tuple(uint256 id, address author, string ipfsHash, string doi, uint8 status, uint256 submissionFee, uint256 timestamp, uint256 citationCount, uint256 replicationCount, bytes32 fdcRequestId, bool externalDataVerified))',
    'function getPaperReviewers(uint256 paperId) external view returns (address[])',
    'function getCitations(uint256 paperId) external view returns (uint256[])',
    'function paperCount() external view returns (uint256)',
    'function submissionFeeUSD() external view returns (uint256)',
    'function reviewRewardUSD() external view returns (uint256)',
    'event PaperSubmitted(uint256 indexed paperId, address indexed author, string ipfsHash, string doi)',
    'event ReviewSubmitted(uint256 indexed reviewId, uint256 indexed paperId, address indexed reviewer)',
    'event CitationAdded(uint256 indexed citingPaper, uint256 indexed citedPaper)',
  ],
  ERC20: [
    'function approve(address spender, uint256 amount) external returns (bool)',
    'function allowance(address owner, address spender) external view returns (uint256)',
    'function balanceOf(address account) external view returns (uint256)',
    'function decimals() external view returns (uint8)',
    'function symbol() external view returns (string)',
  ],
};
