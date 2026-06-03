# Launch migration checklist

Run these SQL files in Supabase SQL Editor, in this order:

1. `supabase/migrations/20260527_matching_rpc.sql`
2. `supabase/migrations/20260528_product_hardening.sql`
3. `supabase/migrations/20260529_accept_invite_pairing_rpc.sql`
4. `supabase/migrations/20260529_admin_invite_activation.sql`
5. `supabase/migrations/20260601_student_invite_codes.sql`
6. `supabase/migrations/20260602_platform_school_creation.sql`
7. `supabase/migrations/20260603_profiles_academic_fields.sql`
8. `supabase/migrations/20260603_invite_pairing_public_survey_rpc.sql`

After running them, verify these RPC functions exist:

- `accept_invite_and_create_pairing`
- `send_invite_to_student`
- `get_public_student_survey`
- `claim_admin_invite`
- `create_admin_invite`
- `verify_student_invite_code`

Do not publish the school test link until the RPC verification passes.
