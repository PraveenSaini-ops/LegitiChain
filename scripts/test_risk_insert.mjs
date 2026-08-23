import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAnon = createClient(supabaseUrl, anonKey);
const supabaseAdmin = createClient(supabaseUrl, serviceKey);

async function testInsert() {
  console.log("Testing insert into ai_risk_signals...");

  // 1. Test with random evidence_id (does not exist in evidence_records)
  const fakeId = `EVI-TEST-${Date.now()}`;
  const { data: d1, error: e1 } = await supabaseAdmin.from("ai_risk_signals").insert([{
    evidence_id: fakeId,
    target_file: "test.dmg",
    confidence_score: 95,
    risk_level: "LOW",
    flags: ["Test Flag"]
  }]).select();

  console.log("Insert with non-existent evidence_id error:", e1?.message, e1?.details, e1?.hint);

  // 2. First create a valid evidence_record
  const validEvId = `EVI-VALID-${Date.now()}`;
  await supabaseAdmin.from("evidence_records").insert([{
    evidence_id: validEvId,
    evidence_hash: "0x1234567890123456789012345678901234567890123456789012345678901234",
    file_name: "test.dmg",
    file_size: 1024,
    file_type: "Disk Image",
    submitter_address: "Admin Test",
    status: "PENDING"
  }]);

  // Now insert into ai_risk_signals with valid evidence_id
  const { data: d2, error: e2 } = await supabaseAdmin.from("ai_risk_signals").insert([{
    evidence_id: validEvId,
    target_file: "test.dmg",
    confidence_score: 95,
    risk_level: "LOW",
    flags: ["Test Flag"]
  }]).select();

  console.log("Insert with valid evidence_id result:", d2 ? "SUCCESS" : "FAILED", "Error:", e2?.message);

  // Test anon client (RLS check)
  const { data: d3, error: e3 } = await supabaseAnon.from("ai_risk_signals").insert([{
    evidence_id: validEvId,
    target_file: "test.dmg",
    confidence_score: 95,
    risk_level: "LOW",
    flags: ["Test Flag"]
  }]).select();

  console.log("Insert with anon client (RLS check) Error:", e3?.message);
}

testInsert();
