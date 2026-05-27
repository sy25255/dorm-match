# Security Readiness Notes

## Current State

- Frontend routes now require a real Supabase access token before opening admin or developer pages.
- Admin data flows should still be protected by Supabase Row Level Security; client-side route guards are only a usability layer.
- The current matching implementation reads other students' `survey_answers` in the browser to calculate compatibility. Strict production RLS should not expose raw answers to other students, so official school usage needs server-side matching through a Supabase RPC or Edge Function.

## Required Supabase RLS Baseline

Use these rules as the minimum policy target before formal school deployment:

- Students may read and update only their own profile-sensitive data.
- Students may read public profile fields for students in the same school only when needed for search/recommendation.
- Students may insert/update only their own survey answers.
- Students must not read raw survey answers from other students.
- Admins may manage records only within their own `school_code`.
- Developers may manage platform-wide configuration and cross-school feedback.
- All tables containing `school_code` must enforce school isolation at database level.

## Tables To Audit

- `profiles`
- `survey_answers`
- `survey_questions`
- `schools`
- `colleges`
- `majors`
- `classes`
- `invites`
- `pair_groups`
- `pair_members`
- `dormitory_buildings`
- `dormitory_rooms`
- `allocations`
- `allocation_objections`
- `feedbacks`
- `notifications`
- `audit_logs`
- `invite_codes`

## Production Blocker

Move compatibility calculation out of `frontend/src/api/match.ts` before enabling strict RLS on `survey_answers`. The correct production shape is:

1. Student submits answers.
2. Supabase RPC or Edge Function calculates match scores using database-side access.
3. Frontend reads only match summaries and allowed public profile fields.
4. Detailed answer display hides sensitive dimensions and never exposes raw private answers directly.
