import { getServerAuthSession } from '../../../src/services/serverAuth.js';
import { getServiceSupabase } from '../../../src/services/supabaseClient.js';
import { checkRateLimit, getRateLimitHeaders } from '../../../src/services/rateLimiter.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getEffectiveUserId(req) {
  let authenticatedUserId = null;
  try {
    const session = await getServerAuthSession(req);
    authenticatedUserId = session?.userId || null;
  } catch (e) {}

  const testUserId = process.env.NODE_ENV === 'test'
    ? req.headers.get('x-test-user-id')
    : null;

  return authenticatedUserId || testUserId;
}

export async function GET(req) {
  const userId = await getEffectiveUserId(req);
  if (!userId) {
    return Response.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return Response.json({ profile: { id: userId, plan: 'free' } });
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return Response.json({ profile: { id: userId, plan: 'free' } });
    }
    return Response.json({ profile: data || { id: userId, plan: 'free' } });
  } catch (err) {
    return Response.json({ profile: { id: userId, plan: 'free' } });
  }
}

export async function POST(req) {
  const userId = await getEffectiveUserId(req);
  if (!userId) {
    return Response.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const supabase = getServiceSupabase();

  if (!supabase) {
    return Response.json({
      profile: {
        id: userId,
        email: body.email || '',
        name: body.name || 'User',
        avatar_url: body.avatar_url || '',
        plan: 'free',
        project_quota: 5,
        updated_at: new Date().toISOString()
      }
    });
  }

  try {
    const { data: existing } = await supabase
      .from('profiles')
      .select('plan, project_quota')
      .eq('id', userId)
      .maybeSingle();

    const profileData = {
      id: userId,
      email: body.email || '',
      name: body.name || 'User',
      avatar_url: body.avatar_url || '',
      plan: existing?.plan || 'free',
      project_quota: existing?.project_quota || 5,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ profile: data });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
