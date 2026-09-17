export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const providers = {
    openrouter: {
      configured: Boolean(process.env.OPENROUTER_API_KEY),
    },
    supabase: {
      configured: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      ),
    },
    clerk: {
      configured: Boolean(
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
      ),
    },
    razorpay: {
      configured: Boolean(
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID
      ),
    },
  };

  const allProvidersConfigured = Object.values(providers).every((p) => p.configured);

  return Response.json(
    {
      status: allProvidersConfigured ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      providers,
    },
    { status: 200 }
  );
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { type, error, context, previewId, timestamp } = body || {};

    if (!type || !error) {
      return Response.json(
        { error: 'Bad Request: "type" and "error" are required fields' },
        { status: 400 }
      );
    }

    const sanitizedReport = {
      type: String(type).slice(0, 100),
      error: typeof error === 'string' ? error.slice(0, 2000) : JSON.stringify(error).slice(0, 2000),
      previewId: previewId ? String(previewId).slice(0, 100) : null,
      context: context ? String(JSON.stringify(context)).slice(0, 2000) : null,
      timestamp: timestamp || new Date().toISOString(),
      receivedAt: new Date().toISOString(),
    };

    if (process.env.NODE_ENV !== 'test') {
      console.error(
        `[CLIENT_MONITORING] [${sanitizedReport.type}] [previewId: ${sanitizedReport.previewId || 'none'}] ${sanitizedReport.error}`
      );
    }

    return Response.json(
      {
        success: true,
        receivedAt: sanitizedReport.receivedAt,
      },
      { status: 200 }
    );
  } catch (err) {
    return Response.json(
      { error: 'Internal Server Error processing monitoring report' },
      { status: 500 }
    );
  }
}
