import { getServerAuthSession } from '../../../src/services/serverAuth.js';
import { getServiceSupabase } from '../../../src/services/supabaseClient.js';

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
  const defaultPersonal = {
    id: `ws_personal_${userId}`,
    name: 'Personal Workspace',
    owner_id: userId,
    plan: 'free',
    isPersonal: true,
    created_at: new Date().toISOString()
  };

  if (!supabase) {
    return Response.json({ workspaces: [defaultPersonal] });
  }

  try {
    const { data: owned } = await supabase
      .from('workspaces')
      .select('*')
      .eq('owner_id', userId);

    const { data: memberOf } = await supabase
      .from('workspace_members')
      .select('workspace_id, role, workspaces(*)')
      .eq('user_id', userId);

    const list = [];
    if (Array.isArray(owned)) list.push(...owned);
    if (Array.isArray(memberOf)) {
      memberOf.forEach(m => {
        if (m.workspaces && !list.some(w => w.id === m.workspaces.id)) {
          list.push({ ...m.workspaces, role: m.role });
        }
      });
    }

    if (list.length === 0) {
      list.push(defaultPersonal);
    }

    return Response.json({ workspaces: list });
  } catch (e) {
    return Response.json({ workspaces: [defaultPersonal] });
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
  const { action = 'create' } = body;
  const supabase = getServiceSupabase();

  if (action === 'create') {
    const { name, plan = 'pro' } = body;
    if (!name) {
      return Response.json({ error: 'Workspace name is required' }, { status: 400 });
    }

    const newWorkspace = {
      id: `ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      owner_id: userId,
      plan,
      is_personal: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      try {
        await supabase.from('workspaces').insert(newWorkspace);
        await supabase.from('workspace_members').insert({
          workspace_id: newWorkspace.id,
          user_id: userId,
          role: 'owner'
        });
      } catch (e) {}
    }

    return Response.json({ workspace: newWorkspace });
  }

  if (action === 'invite') {
    const { workspaceId, email, role = 'member' } = body;
    if (!workspaceId || !email) {
      return Response.json({ error: 'Workspace ID and email are required' }, { status: 400 });
    }

    const memberRecord = {
      workspace_id: workspaceId,
      email: email.trim().toLowerCase(),
      role,
      invited_at: new Date().toISOString()
    };

    if (supabase) {
      try {
        await supabase.from('workspace_members').insert(memberRecord);
      } catch (e) {}
    }

    return Response.json({ invite: memberRecord });
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 });
}
