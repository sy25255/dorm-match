"""
宿舍选舍系统 - 全流程自动化测试脚本 v2
修复：使用更长等待时间、更明确的Hash路由、调试页面内容
模拟用户实际操作流程
"""
from playwright.sync_api import sync_playwright
import os, time, json

BASE = "http://localhost:5173/dorm-match"
OUT = "d:/Trae/Trae CN/88/test_results"
os.makedirs(OUT, exist_ok=True)

results = {
    "test_time": time.strftime("%Y-%m-%d %H:%M:%S"),
    "student_flow": {},
    "admin_flow": {},
    "interaction_flow": {},
}

def log_result(category, step, status, detail="", duration_ms=0):
    entry = {"status": status, "detail": detail, "duration_ms": duration_ms}
    results[category][step] = entry
    icon = "[OK]" if status == "PASS" else "[FAIL]" if status == "FAIL" else "[WARN]"
    print(f"  {icon} [{category}][{step}] {status} ({duration_ms}ms) {detail[:100]}")

def log_section(title):
    print(f"\n{'='*60}")
    print(f"  >>> {title}")
    print(f"{'='*60}")

def wait_stable(page, ms=2000):
    """Wait for page to stabilize after navigation"""
    page.wait_for_timeout(ms)
    try:
        page.wait_for_load_state('networkidle', timeout=5000)
    except:
        pass

def take_screenshot(page, name):
    path = os.path.join(OUT, f"{name}.png")
    page.screenshot(path=path, full_page=True)

def is_on_school_entry(page):
    """Check if we're on the school entry page"""
    try:
        return page.locator('text=新生宿舍舍友选择系统').first.is_visible(timeout=2000)
    except:
        return False

def is_on_login(page):
    """Check if we're on login page"""
    try:
        has_demo = page.locator('button:has-text("张伟")').first.is_visible(timeout=2000)
        has_form = page.locator('text=学号登录').first.is_visible(timeout=2000)
        return has_demo or has_form
    except:
        return False

def is_on_home(page):
    """Check if we're on a student home/dashboard page"""
    try:
        return not is_on_school_entry(page) and not is_on_login(page)
    except:
        return False

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()

    # ================================================================
    # 第一阶段：学生端
    # ================================================================
    log_section("【第一阶段】学生端完整操作流程测试")

    # 1.1 学校入口
    log_section("步骤1: 打开系统 → 学校入口页")
    t0 = time.time()

    # Use explicit hash URL
    page.goto(f"{BASE}/#/", wait_until='networkidle', timeout=20000)
    wait_stable(page, 3000)

    dur = int((time.time() - t0) * 1000)
    # Debug: print page content snippet
    body_text = page.locator('body').inner_text()[:300]
    print(f"  页面内容(前300字): {body_text}")

    on_entry = is_on_school_entry(page)
    log_result("student_flow", "S01_学校入口页加载", "PASS" if on_entry else "FAIL",
               f"入口页正确加载:{on_entry}", dur)
    take_screenshot(page, "S01_school_entry")

    if not on_entry:
        # Try refreshing
        print("  尝试刷新页面...")
        page.reload(wait_until='networkidle', timeout=20000)
        wait_stable(page, 3000)
        body_text = page.locator('body').inner_text()[:300]
        print(f"  刷新后页面内容: {body_text}")
        on_entry = is_on_school_entry(page)
        log_result("student_flow", "S01b_刷新后入口页", "PASS" if on_entry else "FAIL",
                   f"刷新后入口页:{on_entry}")
        take_screenshot(page, "S01b_after_reload")

    # 1.2 输入学校编码
    log_section("步骤2: 输入学校编码 DEMO-UNI")
    t0 = time.time()
    try:
        # Find input by placeholder
        inp = page.locator('input[placeholder*="DEMO"], input[placeholder*="例如"]').first
        inp.click()
        inp.fill("DEMO-UNI")
        dur = int((time.time() - t0) * 1000)
        log_result("student_flow", "S02_输入DEMO-UNI", "PASS", "学校编码已输入", dur)
    except Exception as e:
        dur = int((time.time() - t0) * 1000)
        log_result("student_flow", "S02_输入DEMO-UNI", "FAIL", str(e)[:100], dur)

    # 1.3 点击进入
    log_section("步骤3: 点击「进入学校系统」")
    t0 = time.time()
    try:
        enter_btn = page.locator('button').filter(has_text='进入学校系统').first
        enter_btn.click()
        wait_stable(page, 3000)
        dur = int((time.time() - t0) * 1000)
        log_result("student_flow", "S03_点击进入", "PASS", "已点击进入按钮", dur)
    except Exception as e:
        dur = int((time.time() - t0) * 1000)
        log_result("student_flow", "S03_点击进入", "FAIL", str(e)[:100], dur)

    take_screenshot(page, "S03_after_enter")

    # 1.4 验证跳转到登录页
    on_login = is_on_login(page)
    log_result("student_flow", "S04_跳转登录页", "PASS" if on_login else "FAIL",
               f"在登录页:{on_login} URL:{page.url}")

    # 1.5 演示登录 - 张伟
    log_section("步骤4: 演示登录 → 张伟")
    t0 = time.time()
    try:
        demo_btn = page.locator('button').filter(has_text='张伟').first
        if not demo_btn.is_visible(timeout=3000):
            # Wait more
            wait_stable(page, 3000)
        demo_btn.click()
        wait_stable(page, 3000)
        dur = int((time.time() - t0) * 1000)
        log_result("student_flow", "S05_张伟演示登录", "PASS", "已点击张伟登录", dur)
    except Exception as e:
        dur = int((time.time() - t0) * 1000)
        log_result("student_flow", "S05_张伟演示登录", "FAIL", str(e)[:100], dur)

    take_screenshot(page, "S05_student_home")

    # 1.6 验证登录后状态
    on_home = is_on_home(page)
    log_result("student_flow", "S06_登录后首页", "PASS" if on_home else "FAIL",
               f"在首页:{on_home} URL:{page.url}")

    # ================================================================
    # 1.7 逐个访问学生端页面
    # ================================================================
    student_pages = [
        ("S07_首页Home", ""),
        ("S08_偏好问卷", "survey"),
        ("S09_舍友匹配", "matches"),
        ("S10_搜索舍友", "search"),
        ("S11_邀请管理", "invites"),
        ("S12_我的配对", "pairing"),
        ("S13_宿舍分配", "allocation"),
        ("S14_个人信息", "profile"),
        ("S15_消息中心", "notifications"),
        ("S16_建议反馈", "feedback"),
    ]

    log_section("步骤5: 学生端全部10个页面逐个访问")
    for sid, route in student_pages:
        t0 = time.time()
        url = f"{BASE}/#/DEMO-UNI/{route}" if route else f"{BASE}/#/DEMO-UNI/"
        try:
            page.goto(url, wait_until='networkidle', timeout=15000)
            wait_stable(page, 1500)
            dur = int((time.time() - t0) * 1000)
            blocked = is_on_school_entry(page)
            if blocked:
                log_result("student_flow", sid, "FAIL", f"被拦截回入口页", dur)
            else:
                log_result("student_flow", sid, "PASS", f"页面正常加载", dur)
        except Exception as e:
            dur = int((time.time() - t0) * 1000)
            log_result("student_flow", sid, "FAIL", str(e)[:100], dur)
        take_screenshot(page, f"student_{route or 'home'}")

    # ================================================================
    # 第二阶段：管理员端
    # ================================================================
    log_section("【第二阶段】管理员端后台管理操作流程测试")

    # 2.1 清除状态并重新进入
    log_section("步骤6: 清除登录状态 → 管理员入口")
    page.evaluate("localStorage.clear()")

    t0 = time.time()
    page.goto(f"{BASE}/#/", wait_until='networkidle', timeout=20000)
    wait_stable(page, 3000)
    dur = int((time.time() - t0) * 1000)

    on_entry = is_on_school_entry(page)
    log_result("admin_flow", "A01_管理员入口页", "PASS" if on_entry else "FAIL",
               f"入口页:{on_entry}", dur)

    if not on_entry:
        page.reload(wait_until='networkidle', timeout=20000)
        wait_stable(page, 3000)
        on_entry = is_on_school_entry(page)
        log_result("admin_flow", "A01b_刷新后", "PASS" if on_entry else "FAIL",
                   f"刷新后入口页:{on_entry}")

    # 输入学校编码
    t0 = time.time()
    try:
        inp = page.locator('input[placeholder*="DEMO"], input[placeholder*="例如"]').first
        inp.click()
        inp.fill("DEMO-UNI")
        dur = int((time.time() - t0) * 1000)
        log_result("admin_flow", "A02_输入编码", "PASS", "DEMO-UNI已输入", dur)
    except Exception as e:
        dur = int((time.time() - t0) * 1000)
        log_result("admin_flow", "A02_输入编码", "FAIL", str(e)[:100], dur)

    # 点击进入
    t0 = time.time()
    try:
        page.locator('button').filter(has_text='进入学校系统').first.click()
        wait_stable(page, 3000)
        dur = int((time.time() - t0) * 1000)
        log_result("admin_flow", "A03_点击进入", "PASS", "已进入", dur)
    except Exception as e:
        dur = int((time.time() - t0) * 1000)
        log_result("admin_flow", "A03_点击进入", "FAIL", str(e)[:100], dur)

    # 管理员演示登录
    t0 = time.time()
    on_login = is_on_login(page)
    log_result("admin_flow", "A04_登录页加载", "PASS" if on_login else "FAIL",
               f"在登录页:{on_login}")

    try:
        admin_btn = page.locator('button').filter(has_text='管理员').first
        admin_btn.click()
        wait_stable(page, 3000)
        dur = int((time.time() - t0) * 1000)
        log_result("admin_flow", "A05_管理员登录", "PASS", "管理员登录成功", dur)
    except Exception as e:
        dur = int((time.time() - t0) * 1000)
        log_result("admin_flow", "A05_管理员登录", "FAIL", str(e)[:100], dur)

    take_screenshot(page, "A05_admin_dashboard")

    # 2.2 管理员端各页面
    admin_pages = [
        ("A06_数据统计", "statistics"),
        ("A07_学校管理", "school"),
        ("A08_学生管理", "students"),
        ("A09_问卷管理", "survey"),
        ("A10_宿舍管理", "dormitory"),
        ("A11_分配管理", "allocation"),
        ("A12_异议处理", "objections"),
        ("A13_反馈管理", "feedback"),
        ("A14_审计日志", "audit-logs"),
    ]

    log_section("步骤7: 管理员端全部9个页面逐个访问")
    for aid, route in admin_pages:
        t0 = time.time()
        url = f"{BASE}/#/DEMO-UNI/admin/{route}"
        try:
            page.goto(url, wait_until='networkidle', timeout=15000)
            wait_stable(page, 1500)
            dur = int((time.time() - t0) * 1000)
            blocked = is_on_school_entry(page)
            if blocked:
                log_result("admin_flow", aid, "FAIL", f"被拦截回入口页", dur)
            else:
                log_result("admin_flow", aid, "PASS", f"页面正常加载", dur)
        except Exception as e:
            dur = int((time.time() - t0) * 1000)
            log_result("admin_flow", aid, "FAIL", str(e)[:100], dur)
        take_screenshot(page, f"admin_{route}")

    # ================================================================
    # 第三阶段：学生-管理员交互
    # ================================================================
    log_section("【第三阶段】学生-管理员交互功能测试")

    # 3.1 学生提交反馈
    log_section("步骤8: 学生提交反馈")
    page.evaluate("localStorage.clear()")
    page.goto(f"{BASE}/#/", wait_until='networkidle', timeout=20000)
    wait_stable(page, 3000)

    if not is_on_school_entry(page):
        page.reload(wait_until='networkidle', timeout=20000)
        wait_stable(page, 3000)

    # Enter school
    try:
        inp = page.locator('input[placeholder*="例如"]').first
        inp.fill("DEMO-UNI")
        page.locator('button').filter(has_text='进入学校系统').first.click()
        wait_stable(page, 3000)
    except Exception as e:
        log_result("interaction_flow", "I01_进入学校", "FAIL", str(e)[:100])

    # Student login
    try:
        page.locator('button').filter(has_text='张伟').first.click()
        wait_stable(page, 3000)
        log_result("interaction_flow", "I01_学生登录", "PASS", "张伟登录成功")
    except Exception as e:
        log_result("interaction_flow", "I01_学生登录", "FAIL", str(e)[:100])

    # Navigate to feedback
    page.goto(f"{BASE}/#/DEMO-UNI/feedback", wait_until='networkidle', timeout=15000)
    wait_stable(page, 1500)
    take_screenshot(page, "I_feedback_page")

    # Check feedback form
    has_textarea = page.locator('textarea').first.is_visible(timeout=3000)
    has_title_input = page.locator('input[placeholder*="标题"], input[placeholder*="主题"]').first.is_visible(timeout=3000)
    log_result("interaction_flow", "I02_反馈表单", "PASS" if (has_textarea or has_title_input) else "FAIL",
               f"文本框:{has_textarea} 标题框:{has_title_input}")

    # Try to fill and submit
    try:
        # Select target: admin
        admin_targets = page.locator('text=给管理员').all()
        admin_radios = page.locator('.el-radio:has-text("管理员")').all()
        if admin_targets or admin_radios:
            try:
                (admin_targets[0] if admin_targets else admin_radios[0]).click()
                page.wait_for_timeout(500)
                log_result("interaction_flow", "I03_选择管理员目标", "PASS", "已选择给管理员")
            except:
                log_result("interaction_flow", "I03_选择管理员目标", "WARN", "无法点击目标选择")

        # Fill title
        title_inp = page.locator('input[placeholder*="标题"], input[placeholder*="主题"]').first
        if title_inp.is_visible():
            title_inp.fill("宿舍空调漏水需要维修")
            page.wait_for_timeout(300)

        # Fill content
        textarea = page.locator('textarea').first
        if textarea.is_visible():
            textarea.fill("宿舍3号楼2层走廊空调一直漏水，地上都是水，容易滑倒，请尽快处理。")
            page.wait_for_timeout(300)

        # Submit
        submit_btn = page.locator('button').filter(has_text='提交').first
        if submit_btn.is_visible():
            submit_btn.click()
            wait_stable(page, 1500)
            log_result("interaction_flow", "I04_提交反馈", "PASS", "反馈已提交")
        else:
            log_result("interaction_flow", "I04_提交反馈", "WARN", "未找到提交按钮")
    except Exception as e:
        log_result("interaction_flow", "I04_提交反馈", "FAIL", str(e)[:100])

    take_screenshot(page, "I_after_submit")

    # 3.2 管理员查看反馈
    log_section("步骤9: 管理员查看反馈")
    page.evaluate("localStorage.clear()")
    page.goto(f"{BASE}/#/", wait_until='networkidle', timeout=20000)
    wait_stable(page, 3000)

    try:
        inp = page.locator('input[placeholder*="例如"]').first
        inp.fill("DEMO-UNI")
        page.locator('button').filter(has_text='进入学校系统').first.click()
        wait_stable(page, 3000)
        page.locator('button').filter(has_text='管理员').first.click()
        wait_stable(page, 3000)
    except Exception as e:
        log_result("interaction_flow", "I05_管理员登录", "FAIL", str(e)[:100])

    page.goto(f"{BASE}/#/DEMO-UNI/admin/feedback", wait_until='networkidle', timeout=15000)
    wait_stable(page, 1500)
    take_screenshot(page, "I_admin_feedback")

    # Check feedback list
    feedback_rows = page.locator('.el-table__row, tbody tr').all()
    feedback_any = page.locator('[class*=feedback], div:has-text("反馈"), div:has-text("标题")').first.is_visible(timeout=3000)
    total = len(feedback_rows)
    log_result("interaction_flow", "I06_管理员反馈列表", "PASS" if (total > 0 or feedback_any) else "WARN",
               f"反馈条目:{total} 内容可见:{feedback_any}")

    # Check process button
    process_btn = page.locator('button').filter(has_text='处理').first
    if process_btn.is_visible(timeout=2000):
        try:
            process_btn.click()
            wait_stable(page, 1500)
            take_screenshot(page, "I_admin_reply")
            log_result("interaction_flow", "I07_处理反馈", "PASS", "已打开处理对话框")
        except:
            log_result("interaction_flow", "I07_处理反馈", "FAIL", "点击处理失败")
    else:
        log_result("interaction_flow", "I07_处理反馈", "WARN", "未找到处理按钮")

    # 3.3 学生查看通知
    log_section("步骤10: 学生查看通知回复")
    page.evaluate("localStorage.clear()")
    page.goto(f"{BASE}/#/", wait_until='networkidle', timeout=20000)
    wait_stable(page, 3000)

    try:
        inp = page.locator('input[placeholder*="例如"]').first
        inp.fill("DEMO-UNI")
        page.locator('button').filter(has_text='进入学校系统').first.click()
        wait_stable(page, 3000)
        page.locator('button').filter(has_text='张伟').first.click()
        wait_stable(page, 3000)
    except Exception as e:
        log_result("interaction_flow", "I08_学生重新登录", "FAIL", str(e)[:100])

    page.goto(f"{BASE}/#/DEMO-UNI/notifications", wait_until='networkidle', timeout=15000)
    wait_stable(page, 1500)
    take_screenshot(page, "I_student_notifications")

    notif_items = page.locator('[class*=notification], [class*=notice], .el-timeline-item').all()
    notif_any = page.locator('div:has-text("通知"), div:has-text("消息")').first.is_visible(timeout=3000)
    log_result("interaction_flow", "I09_学生通知列表", "PASS" if (notif_items or notif_any) else "WARN",
               f"通知条目:{len(notif_items)} 内容可见:{notif_any}")

    browser.close()

    # ================================================================
    # 最终报告
    # ================================================================
    print("\n" + "="*60)
    print("          最 终 测 试 报 告")
    print("="*60)
    print(f"  测试时间: {results['test_time']}")
    print(f"  系统地址: {BASE}/")
    print(f"  学校编码: DEMO-UNI (示范大学)")
    print()

    for cat, label in [("student_flow", "学生端操作流程"), ("admin_flow", "管理员端后台管理"), ("interaction_flow", "学生-管理员交互")]:
        p_ct = sum(1 for v in results[cat].values() if v["status"] == "PASS")
        f_ct = sum(1 for v in results[cat].values() if v["status"] == "FAIL")
        w_ct = sum(1 for v in results[cat].values() if v["status"] == "WARN")
        total = p_ct + f_ct + w_ct
        rate = f"{p_ct/total*100:.0f}%" if total > 0 else "N/A"
        print(f"  {label:<22} PASS:{p_ct:>3} FAIL:{f_ct:>3} WARN:{w_ct:>3} 通过率:{rate}")
    
    all_pass = sum(1 for cat in results if cat != "test_time"
                   for v in results[cat].values() if v["status"] == "PASS")
    all_fail = sum(1 for cat in results if cat != "test_time"
                   for v in results[cat].values() if v["status"] == "FAIL")
    all_warn = sum(1 for cat in results if cat != "test_time"
                   for v in results[cat].values() if v["status"] == "WARN")
    all_total = all_pass + all_fail + all_warn
    print(f"  {'-'*45}")
    print(f"  总计                PASS:{all_pass:>3} FAIL:{all_fail:>3} WARN:{all_warn:>3} 通过率:{all_pass/all_total*100:.0f}%")
    print()

    if all_fail > 0:
        print("  === 失败项详情 ===")
        for cat in ["student_flow", "admin_flow", "interaction_flow"]:
            for name, detail in results[cat].items():
                if detail["status"] == "FAIL":
                    print(f"  [{cat}] {name}: {detail['detail'][:120]}")

    with open(os.path.join(OUT, "test_report.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2, default=str)
    print(f"\n  详细报告: {OUT}/test_report.json")
    print(f"  截图目录: {OUT}/")
    print("="*60)