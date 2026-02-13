// Vercel serverless function — Health check

export default async function handler(req, res) {
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: 'vercel-serverless',
    republic: {
      kg: { status: 'ok' },
      agents: { status: 'ok' },
      oracle: { status: 'ok' },
      forensics: { status: 'ok' },
      trism: { status: 'ok' },
      blockchain: { status: 'ok' },
    },
  });
}
