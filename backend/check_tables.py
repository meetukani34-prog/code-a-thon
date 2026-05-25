from supabase import create_client

sb = create_client('https://ejeiuzepulbcglrvqqdl.supabase.co', 'sb_publishable_uFR8zsffIV1cDemIVXXQ6g_xfgEJu6r')

# Try many common table names
tables = ['citizens', 'users', 'profiles', 'documents', 'cases', 'fraud_cases',
          'reports', 'verifications', 'identity', 'activity', 'activity_logs',
          'audit_logs', 'audits', 'transitions', 'alerts', 'sessions',
          'face_data', 'kyc', 'complaints', 'notifications']

for t in tables:
    try:
        r = sb.table(t).select('*').limit(1).execute()
        cols = list(r.data[0].keys()) if r.data else 'empty'
        print(f"  {t}: EXISTS ({len(r.data)} rows) -> {cols}")
    except Exception as e:
        if 'PGRST205' not in str(e):
            print(f"  {t}: ERROR -> {e}")
