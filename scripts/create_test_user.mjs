import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const testEmail = "investigator@legiti.chain";
  const testPassword = "Password123!";

  console.log(`Creating test user: ${testEmail}...`);

  // 1. Create or get user in Supabase Auth
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: {
      full_name: "Det. Sarah Vance",
      organization: "LegitiChain Forensics Division",
      role: "INVESTIGATOR",
    },
  });

  let userId = userData?.user?.id;

  if (userError) {
    console.log("User creation note:", userError.message);
    if (userError.message.includes("already been registered")) {
      console.log("User already exists. Updating password...");
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existing = listData.users.find(u => u.email === testEmail);
      if (existing) {
        userId = existing.id;
        await supabase.auth.admin.updateUserById(userId, { password: testPassword });
      }
    }
  }

  if (userId) {
    // 2. Ensure profile exists in profiles table
    const { error: profErr } = await supabase.from("profiles").upsert({
      id: userId,
      email: testEmail,
      full_name: "Det. Sarah Vance",
      organization: "LegitiChain Forensics Division",
      role: "INVESTIGATOR",
    });

    if (profErr) {
      console.error("Profile upsert error:", profErr.message);
    } else {
      console.log("SUCCESS! Test account created & verified.");
      console.log(`Email: ${testEmail}`);
      console.log(`Password: ${testPassword}`);
    }
  }
}

main();
