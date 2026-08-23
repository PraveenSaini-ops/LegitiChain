import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Connecting to Supabase at:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  try {
    const { data: evidence, error: err1 } = await supabase.from("evidence_records").select("*").limit(5);
    console.log("Evidence records count:", evidence?.length, "Error:", err1);
    if (evidence?.length) console.log("Sample evidence:", evidence[0]);

    const { data: custody, error: err2 } = await supabase.from("custody_logs").select("*").limit(5);
    console.log("Custody logs count:", custody?.length, "Error:", err2);
    if (custody?.length) console.log("Sample custody log:", custody[0]);

    const { data: risk, error: err3 } = await supabase.from("ai_risk_signals").select("*").limit(5);
    console.log("AI Risk Signals count:", risk?.length, "Error:", err3);
    if (risk?.length) console.log("Sample risk signal:", risk[0]);

    // Test inserting long submitter address to check if ALTER COLUMN submitter_address TYPE TEXT was executed
    const testId = `TEST-${Date.now()}`;
    const longAddress = "Investigator John Doe (Badge #49201, Lead Forensics Officer) <john.doe@forensics.gov>";
    const { data: insData, error: insErr } = await supabase.from("evidence_records").insert([{
      evidence_id: testId,
      evidence_hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      file_name: "test.txt",
      file_size: 123,
      file_type: "text/plain",
      submitter_address: longAddress,
      status: "PENDING"
    }]).select();

    if (insErr) {
      console.log("Test insertion error:", insErr.message);
      if (insErr.message.includes("value too long") || insErr.message.includes("character varying(42)") || insErr.message.includes("varchar(42)")) {
        console.log("MIGRATION_STATUS: NOT_APPLIED (submitter_address is still VARCHAR(42))");
      } else {
        console.log("MIGRATION_TEST_ERROR:", insErr.message);
      }
    } else {
      console.log("Test insertion succeeded! Cleaning up test record...");
      await supabase.from("evidence_records").delete().eq("evidence_id", testId);
      console.log("MIGRATION_STATUS: APPLIED (submitter_address accepts text > 42 chars)");
    }
  } catch (err) {
    console.error("Script exception:", err);
  }
}

checkTables();
