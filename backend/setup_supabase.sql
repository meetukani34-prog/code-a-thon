-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- Creates all tables for Aegis AI Platform

-- Users table for citizen registration
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    aadhaar TEXT,
    password_hash TEXT,
    face_enrolled BOOLEAN DEFAULT FALSE,
    face_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Cases table for fraud investigations
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number TEXT UNIQUE,
    title TEXT,
    description TEXT,
    threat_level TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'active',
    pipeline_status TEXT DEFAULT 'INGESTION',
    tenant_type TEXT DEFAULT 'personal',
    ai_trust_metric FLOAT DEFAULT 0.5,
    created_at TIMESTAMPTZ DEFAULT now(),
    document_type TEXT,
    surname TEXT,
    given_names TEXT,
    document_number TEXT,
    issue_date TEXT,
    signature_integrity FLOAT,
    hologram_match FLOAT,
    font_consistency FLOAT,
    analyst TEXT,
    document_url TEXT,
    verified_by TEXT,
    authorized_by TEXT
);

-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT,
    location TEXT,
    status TEXT DEFAULT 'success',
    created_at TIMESTAMPTZ DEFAULT now(),
    ip TEXT,
    tenant_type TEXT
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_name TEXT,
    action TEXT,
    ip TEXT,
    status TEXT DEFAULT 'success',
    created_at TIMESTAMPTZ DEFAULT now(),
    version TEXT,
    severity TEXT DEFAULT 'info'
);

-- Pipeline transitions
CREATE TABLE IF NOT EXISTS transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID,
    case_number TEXT,
    from_state TEXT,
    to_state TEXT,
    actor TEXT,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (required by Supabase)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transitions ENABLE ROW LEVEL SECURITY;

-- Allow full access for anon role (hackathon mode)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'anon_all_users') THEN
        CREATE POLICY anon_all_users ON users FOR ALL TO anon USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cases' AND policyname = 'anon_all_cases') THEN
        CREATE POLICY anon_all_cases ON cases FOR ALL TO anon USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_logs' AND policyname = 'anon_all_activity') THEN
        CREATE POLICY anon_all_activity ON activity_logs FOR ALL TO anon USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'anon_all_audit') THEN
        CREATE POLICY anon_all_audit ON audit_logs FOR ALL TO anon USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transitions' AND policyname = 'anon_all_transitions') THEN
        CREATE POLICY anon_all_transitions ON transitions FOR ALL TO anon USING (true) WITH CHECK (true);
    END IF;
END $$;
