import { getServerAuthSession } from '../../../src/services/serverAuth.js';
import { getServiceSupabase } from '../../../src/services/supabaseClient.js';
import { ensureStandardReactStructure } from '../../../src/utils/projectStructure.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getEffectiveUserId(req) {
  let authenticatedUserId = null;
  try {
    const session = getServerAuthSession(req);
    authenticatedUserId = session?.userId || null;
  } catch (e) {}

  const testUserId = process.env.NODE_ENV === 'test'
    ? req.headers.get('x-test-user-id')
    : null;

  return authenticatedUserId || testUserId;
}

export async function GET(req) {
  const userId = getEffectiveUserId(req);
  if (!userId) {
    return Response.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return Response.json({ projects: [] });
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      return Response.json({ projects: [] });
    }
    return Response.json({ projects: data || [] });
  } catch (err) {
    return Response.json({ projects: [] });
  }
}

export async function POST(req) {
  const userId = getEffectiveUserId(req);
  if (!userId) {
    return Response.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  if (!body.name && !body.id) {
    return Response.json({ error: 'Project name or ID is required' }, { status: 400 });
  }

  const projectId = body.id || `proj_${Date.now()}`;
  const validatedFiles = ensureStandardReactStructure(body.files || {});

  const row = {
    id: projectId,
    user_id: userId,
    name: (body.name || 'Untitled App').trim(),
    description: (body.description || body.prompt || '').trim(),
    files: validatedFiles,
    updated_at: new Date().toISOString()
  };

  const supabase = getServiceSupabase();
  if (!supabase) {
    return Response.json({ project: row });
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      return Response.json({ project: row });
    }
    return Response.json({ project: data });
  } catch (err) {
    return Response.json({ project: row });
  }
}

export async function DELETE(req) {
  const userId = getEffectiveUserId(req);
  if (!userId) {
    return Response.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const projectId = url.searchParams.get('id');
  if (!projectId) {
    return Response.json({ error: 'Project ID required' }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  if (supabase) {
    try {
      await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', userId);
    } catch (e) {}
  }

  return Response.json({ success: true, id: projectId });
}
