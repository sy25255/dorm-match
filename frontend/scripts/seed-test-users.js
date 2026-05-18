/**
 * 模拟脚本：批量创建10个学生 + 填写相同问卷
 *
 * 用法：
 *   1. Supabase Dashboard → Settings → API → service_role secret
 *      (以 sb_secret_ 开头，不是 anon key)
 *   2. 运行：node scripts/seed-test-users.js "你的service_role密钥"
 *
 *   也可以设置环境变量：$env:SUPABASE_SERVICE_KEY="你的密钥"
 *   然后运行：node scripts/seed-test-users.js
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadEnv() {
  const envPath = resolve(__dirname, '..', '.env')
  const content = readFileSync(envPath, 'utf-8')
  const env = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1).replace(/^["']|["']$/g, '')
  }
  return env
}

const env = loadEnv()
const SUPABASE_URL = env.VITE_SUPABASE_URL
const SERVICE_KEY = process.argv[2] || process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL) {
  console.error('❌ 缺少 VITE_SUPABASE_URL，请检查 frontend/.env')
  process.exit(1)
}
if (!SERVICE_KEY) {
  console.error('❌ 缺少 service_role 密钥')
  console.error('')
  console.error('   用法 1: node scripts/seed-test-users.js "你的service_role密钥"')
  console.error('   用法 2: $env:SUPABASE_SERVICE_KEY="你的密钥"; node scripts/seed-test-users.js')
  console.error('')
  console.error('   获取密钥: Supabase Dashboard → Settings → API → service_role secret')
  console.error('   (以 sb_secret_ 开头，注意不是 anon key)')
  process.exit(1)
}

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const SCHOOL_CODE = 'DEMO-UNI'
const STUDENT_COUNT = 10

async function main() {
  console.log('═══════════════════════════════════════════')
  console.log('  宿舍系统模拟脚本 — 批量创建10个测试学生')
  console.log('═══════════════════════════════════════════\n')

  // Step 1: 创建 10 个用户
  console.log('[Step 1] 创建 10 个用户（service_role 直接创建，跳过邮箱验证）...')
  const users = []

  for (let i = 1; i <= STUDENT_COUNT; i++) {
    const email = `seed_test_${i}@mock.university`
    const password = 'Test123456'
    const name = `种子学生${i}`
    const studentNo = `SEED2024${String(i).padStart(3, '0')}`

    try {
      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, school_code: SCHOOL_CODE, student_no: studentNo, role: 'STUDENT' },
      })

      if (error) {
        if (error.message?.includes('already') || error.message?.includes('exists')) {
          console.log(`  ⚠ ${name} 已存在，查找已有用户...`)
          const { data: existing } = await adminClient.auth.admin.listUsers()
          const found = existing?.users?.find(u => u.email === email)
          if (found) {
            users.push({ id: found.id, name, email })
            console.log(`  ✓ ${name} (已有) → ${found.id.slice(0, 12)}...`)
          }
        } else {
          console.error(`  ✗ ${name} 创建失败:`, error.message)
        }
      } else if (data.user) {
        users.push({ id: data.user.id, name, email })
        console.log(`  ✓ ${name} (${email}) → ${data.user.id.slice(0, 12)}...`)
      }
    } catch (err) {
      console.error(`  ✗ ${name} 异常:`, err.message?.slice(0, 80))
    }
  }

  if (users.length === 0) {
    console.error('\n❌ 没有成功创建任何用户，退出')
    process.exit(1)
  }
  console.log(`  📊 共 ${users.length} 个用户\n`)

  // Step 1b: 确保 profiles 表中有记录
  console.log('[Step 1b] 确保 profiles 表数据完整...')
  for (const u of users) {
    try {
      await adminClient.from('profiles').upsert({
        id: u.id,
        school_code: SCHOOL_CODE,
        name: u.name,
        role: 'STUDENT',
        gender: 1,
      }, { onConflict: 'id' })
      console.log(`  ✓ ${u.name} profile OK`)
    } catch (err) {
      console.log(`  ⚠ ${u.name} profile:`, err.message?.slice(0, 60))
    }
  }

  // Step 2: 获取问卷题目
  console.log('\n[Step 2] 获取问卷题目...')
  const { data: questions, error: qsErr } = await adminClient
    .from('survey_questions')
    .select('id, question_type')
    .eq('status', 1)
    .order('sort_order')

  if (qsErr || !questions) {
    console.error('  ❌ 获取题目失败:', qsErr?.message)
    process.exit(1)
  }
  console.log(`  ✓ 获取到 ${questions.length} 道题目`)

  // Step 3: 为每个学生写入完全相同的问卷答案
  console.log('\n[Step 3] 为每个学生写入相同问卷答案...')
  const now = new Date().toISOString()

  for (const user of users) {
    const answers = questions.map(q => ({
      user_id: user.id,
      question_id: q.id,
      answer_value: '2',
      updated_at: now,
    }))

    let ok = 0
    for (let i = 0; i < answers.length; i += 30) {
      const batch = answers.slice(i, i + 30)
      try {
        await adminClient.from('survey_answers').upsert(batch, {
          onConflict: 'user_id,question_id',
          ignoreDuplicates: false,
        })
        ok += batch.length
      } catch (err) {
        console.log(`  ⚠ ${user.name} batch ${i}:`, err.message?.slice(0, 60))
      }
    }

    // 标记问卷完成
    try {
      await adminClient.from('profiles')
        .update({ survey_status: 'COMPLETED' })
        .eq('id', user.id)
    } catch (err) {
      console.log(`  ⚠ ${user.name} status:`, err.message?.slice(0, 60))
    }

    process.stdout.write(`  ✓ ${user.name} — ${answers.length} 题全部回答，COMPLETED\n`)
  }

  // Step 4: 验证
  console.log('\n[Step 4] 验证结果...')
  const { data: completed } = await adminClient
    .from('profiles')
    .select('name, id, survey_status')
    .eq('school_code', SCHOOL_CODE)
    .eq('survey_status', 'COMPLETED')

  if (completed) {
    console.log(`  DEMO-UNI 已完成问卷学生: ${completed.length} 人`)
    for (const p of completed) {
      console.log(`    - ${p.name}`)
    }
  }

  // Step 5: 抽查前两个学生的答案是否一致
  console.log('\n[Step 5] 一致性抽查...')
  if (users.length >= 2) {
    const { data: a1 } = await adminClient
      .from('survey_answers')
      .select('question_id, answer_value')
      .eq('user_id', users[0].id)
      .order('question_id')

    const { data: a2 } = await adminClient
      .from('survey_answers')
      .select('question_id, answer_value')
      .eq('user_id', users[1].id)
      .order('question_id')

    let same = 0, diff = 0
    if (a1 && a2) {
      const m1 = new Map(a1.map(r => [r.question_id, r.answer_value]))
      const m2 = new Map(a2.map(r => [r.question_id, r.answer_value]))
      for (const [qid, v1] of m1) {
        const v2 = m2.get(qid)
        if (v2 !== undefined) {
          if (v1 === v2) same++; else diff++
        }
      }
    }
    console.log(`  ${users[0].name} vs ${users[1].name}:`)
    console.log(`    相同: ${same} 题, 不同: ${diff} 题`)
    if (same > 0 && diff === 0) {
      console.log('  ✅ 答案 100% 一致！分配算法会分到同一宿舍')
    }
  }

  console.log('\n═══════════════════════════════════════════')
  console.log('  🎉 完成！')
  console.log(`  ${users.length} 个学生已注册，问卷完全相同`)
  console.log('  管理员登录 → 宿舍管理 → 执行分配 → 同好分组验证')
  console.log('═══════════════════════════════════════════\n')
}

main().catch(err => {
  console.error('\n❌ 脚本异常:', err)
  process.exit(1)
})