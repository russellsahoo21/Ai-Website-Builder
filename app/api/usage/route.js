export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FREE_TIER_MONTHLY_TOKEN_CAP = 100000;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    return Response.json({
      total: FREE_TIER_MONTHLY_TOKEN_CAP,
      period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      tier: 'developer_free',
      unrestrictedModels: true,
      features: {
        tokenCap: FREE_TIER_MONTHLY_TOKEN_CAP,
        modelFreedom: true,
        byokBypass: true,
      },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
