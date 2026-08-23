import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function testFullRiskFlow() {
  const evId = `EVI-2026-${Math.floor(9000 + Math.random() * 900)}`;
  
  console.log("Simulating AI Risk Scan for:", evId);

  // 1. Auto-create parent evidence record
  const { data: evData, error: evErr } = await supabase.from("evidence_records").insert([{
    evidence_id: evId,
    evidence_hash: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    file_name: "MacBook_Image_04.dmg",
    file_size: 1048576,
    file_type: "Disk Image",
    submitter_address: "AI Forensic Engine",
    status: "PENDING",
  }]).select();

  if (evErr) {
    console.error("Evidence record creation error:", evErr.message);
    return;
  }
  console.log("Parent evidence record created successfully!");

  // 2. Insert into ai_risk_signals
  const { data: riskData, error: riskErr } = await supabase.from("ai_risk_signals").insert([{
    evidence_id: evId,
    target_file: "MacBook_Image_04.dmg",
    confidence_score: 98,
    risk_level: "LOW",
    flags: ["Clean EXIF Header", "Consistent File Offsets", "Entropy Score Nominal (7.82)"],
  }]).select();

  if (riskErr) {
    console.error("AI risk signal insertion error:", riskErr.message);
  } else {
    console.log("SUCCESS! AI risk signal inserted cleanly into Supabase:", riskData[0]);
  }
}

testFullRiskFlow();
