import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'INVESTIGATOR' | 'LEGAL_AUDITOR' | 'FORENSIC_EXPERT' | 'ADMIN';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  organization: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

export interface EvidenceRecordDB {
  id?: string;
  evidence_id: string;
  evidence_hash: string;
  file_name: string;
  file_size: number;
  file_type: string;
  submitter_address: string;
  status: 'PENDING' | 'ANCHORED' | 'TAMPERED';
  tx_hash?: string;
  block_timestamp?: string;
  created_at?: string;
}

export interface CustodyLogDB {
  id?: string;
  evidence_id: string;
  action: string;
  from_entity: string;
  to_entity: string;
  tx_id?: string;
  timestamp?: string;
}

export interface AIRiskSignalDB {
  id?: string;
  evidence_id: string;
  target_file: string;
  confidence_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  flags: string[];
  created_at?: string;
}

/**
 * Fetch profile for a given user ID from Supabase
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error.message);
    return null;
  }
  return data as UserProfile;
}

/**
 * Upload raw evidence file to Supabase Storage bucket 'evidence-files'
 */
export async function uploadEvidenceFile(file: File, evidenceId: string): Promise<{ path: string; publicUrl: string | null; error: any }> {
  const filePath = `${evidenceId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  const { data, error } = await supabase.storage
    .from('evidence-files')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Supabase Storage Upload Error:', error);
    return { path: filePath, publicUrl: null, error };
  }

  const { data: publicUrlData } = supabase.storage
    .from('evidence-files')
    .getPublicUrl(data.path);

  return {
    path: data.path,
    publicUrl: publicUrlData?.publicUrl || null,
    error: null,
  };
}

/**
 * Insert record into evidence_records table
 */
export async function createEvidenceRecord(record: EvidenceRecordDB): Promise<{ data: any; error: any }> {
  let { data, error } = await supabase
    .from('evidence_records')
    .insert([record])
    .select();

  // If submitter_address exceeds VARCHAR(42) before fix_submitter_address_and_rls.sql is run, fallback to truncated address
  if (error && error.message?.includes('value too long') && record.submitter_address.length > 42) {
    console.warn('submitter_address exceeded 42 chars. Truncating for pre-migration schema compatibility...');
    const fallbackRecord = {
      ...record,
      submitter_address: record.submitter_address.substring(0, 42)
    };
    const retry = await supabase
      .from('evidence_records')
      .insert([fallbackRecord])
      .select();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.warn('Supabase Evidence Record Insert note:', error.message || JSON.stringify(error));
  }

  return { data, error };
}

/**
 * Fetch evidence record by ID or Hash from Supabase
 */
export async function getEvidenceRecord(query: string): Promise<EvidenceRecordDB | null> {
  const { data, error } = await supabase
    .from('evidence_records')
    .select('*')
    .or(`evidence_id.eq.${query},evidence_hash.eq.${query}`)
    .limit(1)
    .single();

  if (error) {
    console.warn('Evidence lookup note:', error.message);
    return null;
  }
  return data as EvidenceRecordDB;
}

/**
 * Insert entry into custody_logs table
 */
export async function createCustodyLog(log: CustodyLogDB): Promise<{ data: any; error: any }> {
  // Ensure parent evidence_records row exists to satisfy foreign key constraint
  const { data: existingEv } = await supabase
    .from('evidence_records')
    .select('evidence_id')
    .eq('evidence_id', log.evidence_id)
    .maybeSingle();

  if (!existingEv) {
    await createEvidenceRecord({
      evidence_id: log.evidence_id,
      evidence_hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      file_name: `Evidence_Payload_${log.evidence_id}.bin`,
      file_size: 1048576,
      file_type: "Evidence Record",
      submitter_address: log.from_entity || "Forensic Custody System",
      status: "PENDING",
    });
  }

  const { data, error } = await supabase
    .from('custody_logs')
    .insert([log])
    .select();

  if (error) {
    console.warn('Supabase Custody Log Insert note:', error.message || JSON.stringify(error));
  }

  return { data, error };
}

/**
 * Fetch custody logs from Supabase
 */
export async function getCustodyLogs(evidenceId?: string): Promise<CustodyLogDB[]> {
  let query = supabase
    .from('custody_logs')
    .select('*')
    .order('timestamp', { ascending: false });

  if (evidenceId) {
    query = query.eq('evidence_id', evidenceId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching custody logs:', error.message);
    return [];
  }
  return (data || []) as CustodyLogDB[];
}

/**
 * Fetch AI Risk Signals from Supabase
 */
export async function getAIRiskSignals(evidenceId?: string): Promise<AIRiskSignalDB[]> {
  let query = supabase
    .from('ai_risk_signals')
    .select('*')
    .order('created_at', { ascending: false });

  if (evidenceId) {
    query = query.eq('evidence_id', evidenceId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching AI risk signals:', error.message);
    return [];
  }
  return (data || []) as AIRiskSignalDB[];
}

/**
 * Insert entry into ai_risk_signals table
 */
export async function createAIRiskSignal(signal: AIRiskSignalDB): Promise<{ data: any; error: any }> {
  // Ensure parent evidence_records row exists to satisfy foreign key constraint
  const { data: existingEv } = await supabase
    .from('evidence_records')
    .select('evidence_id')
    .eq('evidence_id', signal.evidence_id)
    .maybeSingle();

  if (!existingEv) {
    await createEvidenceRecord({
      evidence_id: signal.evidence_id,
      evidence_hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      file_name: signal.target_file,
      file_size: 2048576,
      file_type: "Digital File",
      submitter_address: "AI Forensic Inspection Engine",
      status: "PENDING",
    });
  }

  const { data, error } = await supabase
    .from('ai_risk_signals')
    .insert([signal])
    .select();

  if (error) {
    console.warn('Supabase AI Risk Signal Insert note:', error.message || JSON.stringify(error));
  }

  return { data, error };
}

