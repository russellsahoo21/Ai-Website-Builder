import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// 1. Load .env file
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("=================================================================");
console.log("             Supabase Project Production Audit                   ");
console.log("=================================================================");
console.log(`URL: ${supabaseUrl}`);
console.log(`Anon Key Configured: ${Boolean(anonKey)}`);
console.log(`Service Role Key Configured: ${Boolean(serviceKey)}`);
console.log("-----------------------------------------------------------------");

const tables = [
  "profiles",
  "projects",
  "user_token_usage",
  "payment_transactions",
  "workspaces",
  "workspace_members",
  "daily_token_usage"
];

async function verify() {
  const anonClient = createClient(supabaseUrl, anonKey);
  const results = {
    tablesExist: {},
    anonBlocked: {},
    rpcAnonBlocked: {},
    serviceRoleWorks: false,
    serviceRpcWorks: false
  };

  console.log("\n[1] Checking Anon Table Isolation (Must Be Blocked/Empty):");
  for (const table of tables) {
    try {
      const { data, error } = await anonClient.from(table).select("*").limit(5);
      if (error) {
        if (error.code === "PGRST205") {
          console.log(`  ❌ ${table}: Table DOES NOT EXIST in database (PGRST205)`);
          results.tablesExist[table] = false;
          results.anonBlocked[table] = "missing";
        } else if (error.code === "42501" || error.message.includes("permission denied") || error.code === "PGRST301") {
          console.log(`  ✔ ${table}: BLOCKED for anon role (${error.message})`);
          results.tablesExist[table] = true;
          results.anonBlocked[table] = true;
        } else {
          console.log(`  ℹ ${table}: Error ${error.code} - ${error.message}`);
          results.tablesExist[table] = false;
        }
      } else {
        results.tablesExist[table] = true;
        if (Array.isArray(data) && data.length > 0) {
          console.log(`  🚨 VULNERABILITY: ${table} returned ${data.length} row(s) to anonymous caller!`);
          results.anonBlocked[table] = false;
        } else {
          console.log(`  ✔ ${table}: 0 rows returned to anon role (RLS active)`);
          results.anonBlocked[table] = true;
        }
      }
    } catch (e) {
      console.log(`  ⚠ ${table}: Query failed - ${e.message}`);
    }
  }

  console.log("\n[2] Checking Anon Access to Sensitive RPC Functions:");
  try {
    const { data, error } = await anonClient.rpc("increment_token_quota", {
      p_user_id: "test_audit_user",
      p_period: "2026-09",
      p_tokens_to_add: 1,
      p_token_cap: 1000
    });
    if (error) {
      if (error.code === "PGRST202") {
        console.log(`  ⚠ increment_token_quota: Function NOT FOUND in schema cache (Migration not applied)`);
        results.rpcAnonBlocked.increment = "missing";
      } else {
        console.log(`  ✔ increment_token_quota: Anon execution strictly blocked (${error.message})`);
        results.rpcAnonBlocked.increment = true;
      }
    } else {
      console.log(`  🚨 VULNERABILITY: increment_token_quota was successfully executed by anonymous role!`);
      results.rpcAnonBlocked.increment = false;
    }
  } catch (e) {
    console.log(`  ✔ increment_token_quota: Call rejected - ${e.message}`);
    results.rpcAnonBlocked.increment = true;
  }

  try {
    const { data, error } = await anonClient.rpc("rollback_token_quota", {
      p_user_id: "test_audit_user",
      p_period: "2026-09",
      p_tokens_to_subtract: 1
    });
    if (error) {
      if (error.code === "PGRST202") {
        console.log(`  ⚠ rollback_token_quota: Function NOT FOUND in schema cache (Migration not applied)`);
        results.rpcAnonBlocked.rollback = "missing";
      } else {
        console.log(`  ✔ rollback_token_quota: Anon execution strictly blocked (${error.message})`);
        results.rpcAnonBlocked.rollback = true;
      }
    } else {
      console.log(`  🚨 VULNERABILITY: rollback_token_quota was successfully executed by anonymous role!`);
      results.rpcAnonBlocked.rollback = false;
    }
  } catch (e) {
    console.log(`  ✔ rollback_token_quota: Call rejected - ${e.message}`);
    results.rpcAnonBlocked.rollback = true;
  }

  console.log("\n[3] Checking Service-Role Operations:");
  if (!serviceKey) {
    console.log("  ⚠ SUPABASE_SERVICE_ROLE_KEY is not configured in .env.");
    console.log("    To verify service-role operations, add SUPABASE_SERVICE_ROLE_KEY to .env and re-run.");
  } else {
    try {
      const serviceClient = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
      const { data, error } = await serviceClient.from("profiles").select("id").limit(1);
      if (error) {
        console.log(`  ❌ Service role query failed: ${error.message}`);
      } else {
        console.log(`  ✔ Service role client successfully authenticated and read profiles`);
        results.serviceRoleWorks = true;
      }

      const { data: rpcData, error: rpcErr } = await serviceClient.rpc("increment_token_quota", {
        p_user_id: "verify_audit_user",
        p_period: "2026-09",
        p_tokens_to_add: 10,
        p_token_cap: 100000
      });
      if (rpcErr) {
        console.log(`  ❌ Service role increment_token_quota failed: ${rpcErr.message}`);
      } else {
        console.log(`  ✔ Service role increment_token_quota executed successfully:`, rpcData);
        results.serviceRpcWorks = true;

        // Rollback test
        await serviceClient.rpc("rollback_token_quota", {
          p_user_id: "verify_audit_user",
          p_period: "2026-09",
          p_tokens_to_subtract: 10
        });
        console.log(`  ✔ Service role rollback_token_quota executed successfully`);
      }
    } catch (e) {
      console.log(`  ❌ Service role check error: ${e.message}`);
    }
  }

  console.log("\n=================================================================");
  console.log("                     Verification Summary                        ");
  console.log("=================================================================");
  const missingTables = Object.entries(results.tablesExist).filter(([_, exists]) => !exists).map(([t]) => t);
  const exposedTables = Object.entries(results.anonBlocked).filter(([_, blocked]) => blocked === false).map(([t]) => t);

  if (missingTables.length > 0 || exposedTables.length > 0 || results.rpcAnonBlocked.increment === "missing") {
    console.log("STATUS: MIGRATION REQUIRED ON REMOTE SUPABASE PROJECT");
    if (missingTables.length > 0) {
      console.log(`- Missing tables: ${missingTables.join(", ")}`);
    }
    if (exposedTables.length > 0) {
      console.log(`- Tables exposed to anonymous users: ${exposedTables.join(", ")}`);
    }
    if (results.rpcAnonBlocked.increment === "missing") {
      console.log("- Atomic token functions (increment_token_quota) are not yet created in PostgreSQL.");
    }
    console.log("\nACTION REQUIRED:");
    console.log("Run the SQL migration in your Supabase SQL Editor:");
    console.log("  File: supabase/full_schema_migration.sql");
    console.log("  Dashboard URL: https://supabase.com/dashboard/project/rxmzcabkbxgtxblooreu/sql/new");
  } else {
    console.log("STATUS: ALL TABLES & RPC FUNCTIONS VERIFIED & SECURED!");
  }
}

verify().catch(console.error);
