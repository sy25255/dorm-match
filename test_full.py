"""
宿舍选舍系统 - 全流程自动化测试脚本
模拟用户实际操作：点击、输入、导航
测试学生端、管理员端所有页面及交互功能
"""
from playwright.sync_api import sync_playwright
import os, time, json

BASE = "http://localhost:5173/dorm-match"
OUT = "d:/Trae/Trae CN/88/test_results"
os.makedirs(OUT, exist_ok=True)

results = {  # type: ignore
    "test_time": time.strftime("%Y-%m-%d %H:%M:%S"),
    "student_flow": {},
    "admin_flow": {},
    "interaction_flow": {},
    "overall_score": 0,
}

def log_result(category, step, status, detail="", duration_ms=0):
    entry = {"status": status, "detail": detail, "duration_ms": duration_ms}
    results[category][step] = entry
    icon = "[OK]" if status == "PASS" else "[FAIL]" if status == "FAIL" else "[WARN]"
    print(f"  {icon} [{category}][{step}] {status} ({duration_ms}ms) {detail[:80]}")

def log_section(title):
    print(f"\n{'='*70}")
    print(f"  >>> {title}")
    print(f"{'='*70}")

def interact_step(category, name, page, action_fn, wait_ms=500):
    t0 = time.time()
    try:
        action_fn(page)
        page.wait_for_timeout(wait_ms)
        dur = int((time.time() - t0) * 1000)
        log_result(category, name, "PASS", f"操作成功", dur)
        return "PASS"
    except Exception as e:
        dur = int((time.time() - t0) * 1000)
        err = str(e)[:100]
        log_result(category, name, "FAIL", err, dur)
        return "FAIL"

def nav_step(category, name, page, url, wait_ms=1500):
    t0 = time.time()
    try:
        page.goto(url, wait_until='networkidle', timeout=15000)
        page.wait_for_timeout(wait_ms)
        dur = int((time.time() - t0) * 1000)
        # Check if we're on the expected page (not bounced back to school entry)
        has_school_input = page.locator('text=请输入学校专属编码').first.is_visible()
        if has_school_input:
            log_result(category, name, "FAIL", "页面被拦截，回到学校入口页", dur)
            return "FAIL"
        has_error = page.locator('.el-message--error').first.is_visible()
        if has_error:
            log_result(category, name, "FAIL", "页面显示错误消息", dur)
            return "FAIL"
        log_result(category, name, "PASS", f"页面加载正常 ({url})", dur)
        return "PASS"
    except Exception as e:
        dur = int((time.time() - t0) * 1000)
        err = str(e)[:100]
        log_result(category, name, "FAIL", err, dur)
        return "FAIL"

def screenshot(page, name):
    path = os.path.join(OUT, f"{name}.png")
    page.screenshot(path=path, full_page=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # ================================================================
    # 第一阶段：学生端完整流程
    # ================================================================
    log_section("第一阶段：学生端完整操作流程")

    # 1.1 学校入口页
    log_section("1.1 学校入口 - 输入学校编码")
    interact_step("student_flow", "01_打开系统首页", page,
        lambda p: p.goto(BASE, wait_until='networkidle', timeout=15000),
        wait_ms=2000)

    # 截图
    screenshot(page, "step01_school_entry")

    # 检测页面元素
    has_title = page.locator('text=新生宿舍舍友选择系统').first.is_visible()
    has_input = page.locator('input[placeholder*=DEMO]').first.is_visible()
    has_btn = page.locator('button').filter(has_text='进入学校系统').first.is_visible()
    log_result("student_flow", "02_学校入口页元素检查", "PASS" if (has_title and has_input and has_btn) else "FAIL",
               f"标题:{has_title} 输入框:{has_input} 按钮:{has_btn}")

    # 1.2 输入学校编码
    interact_step("student_flow", "03_输入学校编码DEMO-UNI", page,
        lambda p: p.locator('input').first.fill("DEMO-UNI"),
        wait_ms=500)

    # 1.3 点击进入
    interact_step("student_flow", "04_点击进入学校系统", page,
        lambda p: p.locator('button').filter(has_text='进入学校系统').first.click(),
        wait_ms=2000)

    screenshot(page, "step02_after_school_entry")

    # 1.4 验证登录页
    log_section("1.2 登录页 - 演示模式登录")
    has_demo_btns = page.locator('button:has-text("张伟")').first.is_visible(timeout=5000)
    if not has_demo_btns:
        # Fallback: try waiting longer
        page.wait_for_timeout(3000)
        has_demo_btns = page.locator('button:has-text("张伟")').first.is_visible()
    log_result("student_flow", "05_登录页面加载", "PASS" if has_demo_btns else "FAIL",
               f"演示按钮可见:{has_demo_btns}")
    screenshot(page, "step03_login_page")

    # 1.5 点击学生演示登录 (张伟)
    interact_step("student_flow", "06_点击张伟演示登录", page,
        lambda p: p.locator('button').filter(has_text='张伟').first.click(),
        wait_ms=2000)

    screenshot(page, "step04_after_student_login")

    # 1.6 验证进入首页
    log_section("1.3 学生首页 - 登录后首页检查")
    page.wait_for_timeout(1000)
    on_home = not page.locator('text=请输入学校专属编码').first.is_visible()
    log_result("student_flow", "07_学生首页加载", "PASS" if on_home else "FAIL",
               f"不在学校入口页:{on_home}")
    screenshot(page, "step05_student_home")

    # ================================================================
    # 1.7 逐一访问学生端各页面
    # ================================================================
    student_pages = [
        ("08_偏好问卷页", "survey", "问卷填写界面"),
        ("09_舍友匹配页", "matches", "匹配推荐列表"),
        ("10_搜索舍友页", "search", "搜索筛选页"),
        ("11_邀请管理页", "invites", "邀请列表"),
        ("12_我的配对页", "pairing", "配对管理"),
        ("13_宿舍分配页", "allocation", "分配结果"),
        ("14_个人信息页", "profile", "个人资料"),
        ("15_消息中心页", "notifications", "通知列表"),
        ("16_建议反馈页", "feedback", "反馈表单"),
    ]

    log_section("1.4 学生端各功能页面逐个访问")
    for sid, route, desc in student_pages:
        result = nav_step("student_flow", sid, page, f"{BASE}/#/DEMO-UNI/{route}")
        screenshot(page, f"student_{route}")
        print(f"    [{sid}] -> {result}")

    # ================================================================
    # 1.8 偏好问卷填写交互测试
    # ================================================================
    log_section("1.5 偏好问卷 - 交互操作测试")
    nav_step("student_flow", "17_回到问卷页", page, f"{BASE}/#/DEMO-UNI/survey")

    # 检查问卷是否有题目
    has_questions = page.locator('[class*=question], .survey-item, .question-item').first.is_visible()
    if not has_questions:
        has_questions = page.locator('div:has-text("生活作息"), div:has-text("睡眠"), div:has-text("题目")').first.is_visible()
    log_result("student_flow", "18_问卷内容加载", "PASS" if has_questions else "WARN",
               f"题目可见:{has_questions}")

    # 尝试点击选项
    radio_btns = page.locator('.el-radio, .el-radio__original, [role="radio"]').all()
    if radio_btns:
        try:
            radio_btns[0].click()
            log_result("student_flow", "19_点击问卷选项", "PASS", f"找到{len(radio_btns)}个选项")
        except:
            log_result("student_flow", "19_点击问卷选项", "FAIL", "无法点击选项")
    else:
        log_result("student_flow", "19_点击问卷选项", "WARN", "未找到单选题选项")

    screenshot(page, "step06_survey_page")

    # ================================================================
    # 1.9 搜索舍友交互测试
    # ================================================================
    log_section("1.6 搜索舍友 - 级联选择测试")
    nav_step("student_flow", "20_打开搜索页", page, f"{BASE}/#/DEMO-UNI/search")

    # 检查级联选择器
    cascaders = page.locator('.el-cascader, [class*=cascader]').all()
    selects = page.locator('.el-select, [class*=select]').all()
    log_result("student_flow", "21_搜索筛选器", "PASS" if (cascaders or selects) else "WARN",
               f"级联:{len(cascaders)} 选择器:{len(selects)}")

    screenshot(page, "step07_search_page")

    # ================================================================
    # 1.10 反馈表单交互测试
    # ================================================================
    log_section("1.7 建议反馈 - 表单交互测试")
    nav_step("student_flow", "22_打开反馈页", page, f"{BASE}/#/DEMO-UNI/feedback")

    # 检查是否有"给管理员"和"给开发者"的切换
    admin_target = page.locator('text=给管理员, text=管理员').first.is_visible()
    dev_target = page.locator('text=给开发者, text=开发者, text=系统开发者').first.is_visible()
    log_result("student_flow", "23_反馈目标切换", "PASS" if (admin_target or dev_target) else "WARN",
               f"管理员选项:{admin_target} 开发者选项:{dev_target}")

    # 检查输入框
    text_areas = page.locator('textarea, [contenteditable="true"]').all()
    inputs = page.locator('input:not([type="hidden"])').all()
    log_result("student_flow", "24_反馈表单输入", "PASS" if (text_areas or inputs) else "WARN",
               f"文本框:{len(text_areas)} 输入框:{len(inputs)}")

    screenshot(page, "step08_feedback_page")

    # ================================================================
    # 1.11 邀请管理交互测试
    # ================================================================
    log_section("1.8 邀请管理 - 发送邀请测试")
    nav_step("student_flow", "25_打开邀请页", page, f"{BASE}/#/DEMO-UNI/invites")

    # 检查邀请列表和按钮
    send_btns = page.locator('button').filter(has_text='发送').all()
    invite_items = page.locator('[class*=invite], [class*=card]').all()
    log_result("student_flow", "26_邀请页面功能", "PASS" if (send_btns or invite_items) else "WARN",
               f"发送按钮:{len(send_btns)} 邀请项:{len(invite_items)}")

    screenshot(page, "step09_invites_page")

    # ================================================================
    # 1.12 学生端总结
    # ================================================================
    student_pass = sum(1 for v in results["student_flow"].values() if v["status"] == "PASS")
    student_fail = sum(1 for v in results["student_flow"].values() if v["status"] == "FAIL")
    student_warn = sum(1 for v in results["student_flow"].values() if v["status"] == "WARN")
    student_total = student_pass + student_fail + student_warn
    print(f"\n--- 学生端测试总结: 通过{student_pass}/{student_total}, 失败{student_fail}, 警告{student_warn} ---")

    # ================================================================
    # 第二阶段：管理员端完整流程
    # ================================================================
    log_section("第二阶段：管理员端后台管理操作流程")

    # 2.1 退出当前登录 → 回到学校入口
    log_section("2.1 切换角色 - 退出学生登录")
    try:
        page.evaluate("localStorage.clear()")
        log_result("admin_flow", "A01_清除学生登录状态", "PASS", "localStorage cleared")
    except Exception as e:
        log_result("admin_flow", "A01_清除学生登录状态", "FAIL", str(e)[:80])

    # 2.2 重新进入学校
    interact_step("admin_flow", "A02_重新进入学校入口", page,
        lambda p: p.goto(BASE, wait_until='networkidle', timeout=15000),
        wait_ms=1000)

    interact_step("admin_flow", "A03_输入DEMO-UNI", page,
        lambda p: p.locator('input').first.fill("DEMO-UNI"),
        wait_ms=500)

    interact_step("admin_flow", "A04_点击进入", page,
        lambda p: p.locator('button').filter(has_text='进入学校系统').first.click(),
        wait_ms=2000)

    screenshot(page, "step10_admin_login")

    # 2.3 管理员演示登录
    log_section("2.2 管理员演示登录")
    admin_btn_visible = page.locator('button').filter(has_text='管理员').first.is_visible(timeout=5000)
    if not admin_btn_visible:
        page.wait_for_timeout(3000)
        admin_btn_visible = page.locator('button').filter(has_text='管理员').first.is_visible()
    log_result("admin_flow", "A05_管理员按钮可见", "PASS" if admin_btn_visible else "FAIL",
               f"可见:{admin_btn_visible}")
    screenshot(page, "step11_admin_btn")

    interact_step("admin_flow", "A06_点击管理员登录", page,
        lambda p: p.locator('button').filter(has_text='管理员').first.click(),
        wait_ms=2000)

    screenshot(page, "step12_admin_logged_in")

    # 2.4 验证登录后
    is_admin_page = not page.locator('text=请输入学校专属编码').first.is_visible()
    log_result("admin_flow", "A07_管理员登录成功", "PASS" if is_admin_page else "FAIL",
               f"进入管理后台:{is_admin_page}")

    # ================================================================
    # 2.5 逐一访问管理员端各页面
    # ================================================================
    admin_pages = [
        ("A08_数据统计", "statistics", "仪表盘/统计图表"),
        ("A09_学校管理", "school", "学校配置"),
        ("A10_学生管理", "students", "学生列表/导入"),
        ("A11_问卷管理", "survey", "问卷题目管理"),
        ("A12_宿舍管理", "dormitory", "宿舍楼/房间"),
        ("A13_分配管理", "allocation", "宿舍分配执行"),
        ("A14_异议处理", "objections", "申诉处理"),
        ("A15_反馈管理", "feedback", "学生反馈处理"),
        ("A16_审计日志", "audit-logs", "操作审计记录"),
    ]

    log_section("2.3 管理员端各页面逐个访问")
    for aid, route, desc in admin_pages:
        result = nav_step("admin_flow", aid, page, f"{BASE}/#/DEMO-UNI/admin/{route}")
        screenshot(page, f"admin_{route}")
        print(f"    [{aid}] -> {result}")

    # ================================================================
    # 2.6 管理员关键功能交互测试
    # ================================================================
    log_section("2.4 管理员端关键交互测试")

    # 统计页面检查图表
    nav_step("admin_flow", "A17_统计页交互", page, f"{BASE}/#/DEMO-UNI/admin/statistics")
    charts = page.locator('canvas, [class*=chart], [class*=echarts]').all()
    log_result("admin_flow", "A18_统计图表", "PASS" if charts else "WARN",
               f"图表元素:{len(charts)}")
    screenshot(page, "admin_statistics_detail")

    # 学生管理页面检查表格
    nav_step("admin_flow", "A19_学生管理页交互", page, f"{BASE}/#/DEMO-UNI/admin/students")
    tables = page.locator('.el-table, table, [class*=table]').all()
    search_inputs = page.locator('input[placeholder*=搜索], input[placeholder*=查找]').all()
    add_btns = page.locator('button').filter(has_text='导入').all()
    log_result("admin_flow", "A20_学生管理功能", "PASS" if (tables or add_btns) else "WARN",
               f"表格:{len(tables)} 搜索:{len(search_inputs)} 导入按钮:{len(add_btns)}")
    screenshot(page, "admin_students_detail")

    # 反馈管理页面交互
    nav_step("admin_flow", "A21_反馈管理页交互", page, f"{BASE}/#/DEMO-UNI/admin/feedback")
    feedback_tabs = page.locator('.el-radio-button, [class*=tab]').all()
    feedback_table = page.locator('.el-table, table').first.is_visible()
    log_result("admin_flow", "A22_反馈管理功能", "PASS" if feedback_table else "WARN",
               f"选项卡:{len(feedback_tabs)} 表格:{feedback_table}")
    screenshot(page, "admin_feedback_detail")

    # 审计日志检查
    nav_step("admin_flow", "A23_审计日志交互", page, f"{BASE}/#/DEMO-UNI/admin/audit-logs")
    log_table = page.locator('.el-table, table').first.is_visible()
    log_result("admin_flow", "A24_审计日志表格", "PASS" if log_table else "WARN",
               f"日志表格:{log_table}")
    screenshot(page, "admin_audit_detail")

    # ================================================================
    # 2.7 管理员端总结
    # ================================================================
    admin_pass = sum(1 for v in results["admin_flow"].values() if v["status"] == "PASS")
    admin_fail = sum(1 for v in results["admin_flow"].values() if v["status"] == "FAIL")
    admin_warn = sum(1 for v in results["admin_flow"].values() if v["status"] == "WARN")
    admin_total = admin_pass + admin_fail + admin_warn
    print(f"\n--- 管理员端测试总结: 通过{admin_pass}/{admin_total}, 失败{admin_fail}, 警告{admin_warn} ---")

    # ================================================================
    # 第三阶段：学生-管理员交互测试
    # ================================================================
    log_section("第三阶段：学生-管理员交互功能测试")

    # 3.1 学生提交反馈
    log_section("3.1 学生端提交反馈 → 管理员查看")
    page.evaluate("localStorage.clear()")
    page.goto(BASE, wait_until='networkidle', timeout=15000)
    page.wait_for_timeout(1000)
    page.locator('input').first.fill("DEMO-UNI")
    page.locator('button').filter(has_text='进入学校系统').first.click()
    page.wait_for_timeout(2000)
    page.locator('button').filter(has_text='张伟').first.click()
    page.wait_for_timeout(2000)

    # 导航到反馈页
    page.goto(f"{BASE}/#/DEMO-UNI/feedback", wait_until='networkidle', timeout=15000)
    page.wait_for_timeout(1500)
    screenshot(page, "interaction_student_feedback")

    # 查找并填写反馈表单
    # 检查是否有目标选择（给管理员 vs 给开发者）
    target_select = page.locator('.el-radio, [class*=target], [class*=role]').all()
    feedback_form_found = page.locator('textarea, input[placeholder*=标题], input[placeholder*=主题]').first.is_visible(timeout=3000)
    log_result("interaction_flow", "I01_学生反馈表单", "PASS" if feedback_form_found else "WARN",
               f"表单可见:{feedback_form_found} 目标选择:{len(target_select)}")

    # 尝试选择"给管理员"目标
    try:
        admin_target_radio = page.locator('text=给管理员').first
        if admin_target_radio.is_visible():
            admin_target_radio.click()
            page.wait_for_timeout(500)
            log_result("interaction_flow", "I02_选择反馈目标", "PASS", "已选择: 给管理员")
        else:
            log_result("interaction_flow", "I02_选择反馈目标", "WARN", "未找到目标选择器")
    except Exception as e:
        log_result("interaction_flow", "I02_选择反馈目标", "FAIL", str(e)[:80])

    # 填写标题和内容
    try:
        title_inputs = page.locator('input[placeholder*=标题], input[placeholder*=主题]').first
        if title_inputs.is_visible():
            title_inputs.fill("测试反馈-宿舍设施问题")
            page.wait_for_timeout(300)
        content_area = page.locator('textarea').first
        if content_area.is_visible():
            content_area.fill("空调漏水需要维修，请管理员尽快处理。")
            page.wait_for_timeout(300)
        log_result("interaction_flow", "I03_填写反馈内容", "PASS", "标题和内容已填写")
    except Exception as e:
        log_result("interaction_flow", "I03_填写反馈内容", "FAIL", str(e)[:80])

    # 尝试提交
    try:
        submit_btn = page.locator('button').filter(has_text='提交').first
        if submit_btn.is_visible():
            submit_btn.click()
            page.wait_for_timeout(1500)
            log_result("interaction_flow", "I04_提交反馈", "PASS", "已点击提交")
        else:
            log_result("interaction_flow", "I04_提交反馈", "WARN", "未找到提交按钮")
    except Exception as e:
        log_result("interaction_flow", "I04_提交反馈", "FAIL", str(e)[:80])

    screenshot(page, "interaction_after_submit")

    # 3.2 切换到管理员查看反馈
    log_section("3.2 切换到管理员 → 查看反馈")
    page.evaluate("localStorage.clear()")
    page.goto(BASE, wait_until='networkidle', timeout=15000)
    page.wait_for_timeout(1000)
    page.locator('input').first.fill("DEMO-UNI")
    page.locator('button').filter(has_text='进入学校系统').first.click()
    page.wait_for_timeout(2000)
    page.locator('button').filter(has_text='管理员').first.click()
    page.wait_for_timeout(2000)

    # 导航到反馈管理页
    page.goto(f"{BASE}/#/DEMO-UNI/admin/feedback", wait_until='networkidle', timeout=15000)
    page.wait_for_timeout(2000)
    screenshot(page, "interaction_admin_feedback")

    # 检查反馈列表是否有内容
    feedback_rows = page.locator('.el-table__row, tbody tr, [class*=row]').all()
    feedback_items = page.locator('[class*=feedback], [class*=item]').all()
    total_items = max(len(feedback_rows), len(feedback_items))
    log_result("interaction_flow", "I05_管理员反馈列表", "PASS" if total_items > 0 else "WARN",
               f"反馈条目数:{total_items}")

    # 检查是否有"处理"按钮
    process_btns = page.locator('button').filter(has_text='处理').all()
    log_result("interaction_flow", "I06_反馈处理按钮", "PASS" if process_btns else "WARN",
               f"处理按钮数:{len(process_btns)}")

    # 如果找到处理按钮，点击第一个
    if process_btns:
        try:
            process_btns[0].click()
            page.wait_for_timeout(1500)
            screenshot(page, "interaction_admin_reply")
            log_result("interaction_flow", "I07_管理员处理反馈", "PASS", "已打开处理对话框")
        except Exception as e:
            log_result("interaction_flow", "I07_管理员处理反馈", "FAIL", str(e)[:80])

    # ================================================================
    # 3.3 学生查看通知
    # ================================================================
    log_section("3.3 切回学生 → 查看通知")
    page.evaluate("localStorage.clear()")
    page.goto(BASE, wait_until='networkidle', timeout=15000)
    page.wait_for_timeout(1000)
    page.locator('input').first.fill("DEMO-UNI")
    page.locator('button').filter(has_text='进入学校系统').first.click()
    page.wait_for_timeout(2000)
    page.locator('button').filter(has_text='张伟').first.click()
    page.wait_for_timeout(2000)

    page.goto(f"{BASE}/#/DEMO-UNI/notifications", wait_until='networkidle', timeout=15000)
    page.wait_for_timeout(2000)
    screenshot(page, "interaction_student_notifications")

    notif_items = page.locator('[class*=notification], [class*=notice], .el-timeline-item').all()
    log_result("interaction_flow", "I08_学生通知列表", "PASS" if notif_items else "WARN",
               f"通知条目:{len(notif_items)}")

    # ================================================================
    # 交互测试总结
    # ================================================================
    inter_pass = sum(1 for v in results["interaction_flow"].values() if v["status"] == "PASS")
    inter_fail = sum(1 for v in results["interaction_flow"].values() if v["status"] == "FAIL")
    inter_warn = sum(1 for v in results["interaction_flow"].values() if v["status"] == "WARN")
    inter_total = inter_pass + inter_fail + inter_warn

    browser.close()

    # ================================================================
    # 最终报告
    # ================================================================
    print("\n" + "="*70)
    print("                    最 终 测 试 报 告")
    print("="*70)
    print(f"  测试时间: {results['test_time']}")
    print(f"  测试环境: http://localhost:5173/dorm-match/")
    print(f"  学校编码: DEMO-UNI (示范大学)")
    print()
    print(f"  {'模块':<30} {'通过':>6} {'失败':>6} {'警告':>6} {'通过率':>8}")
    print(f"  {'-'*30} {'-'*6} {'-'*6} {'-'*6} {'-'*8}")

    for cat, label in [("student_flow", "学生端操作流程"), ("admin_flow", "管理员端后台管理"), ("interaction_flow", "学生-管理员交互")]:
        p_ct = sum(1 for v in results[cat].values() if v["status"] == "PASS")
        f_ct = sum(1 for v in results[cat].values() if v["status"] == "FAIL")
        w_ct = sum(1 for v in results[cat].values() if v["status"] == "WARN")
        total = p_ct + f_ct + w_ct
        rate = f"{p_ct/total*100:.0f}%" if total > 0 else "N/A"
        print(f"  {label:<30} {p_ct:>6} {f_ct:>6} {w_ct:>6} {rate:>8}")

    all_pass = sum(1 for cat in results if cat != "test_time" and cat != "overall_score"
                   for v in results[cat].values() if v["status"] == "PASS")
    all_fail = sum(1 for cat in results if cat != "test_time" and cat != "overall_score"
                   for v in results[cat].values() if v["status"] == "FAIL")
    all_warn = sum(1 for cat in results if cat != "test_time" and cat != "overall_score"
                   for v in results[cat].values() if v["status"] == "WARN")
    all_total = all_pass + all_fail + all_warn
    print(f"  {'─'*50}")
    print(f"  {'总计':<30} {all_pass:>6} {all_fail:>6} {all_warn:>6} {all_pass/all_total*100:.0f}%")
    print()

    if all_fail > 0:
        print("  [FAIL] 发现失败项:")
        for cat in ["student_flow", "admin_flow", "interaction_flow"]:
            for name, detail in results[cat].items():
                if detail["status"] == "FAIL":
                    print(f"     [{cat}] {name}: {detail['detail'][:100]}")
    print()

    # 保存JSON结果
    with open(os.path.join(OUT, "test_report.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2, default=str)
    print(f"  详细报告已保存: {OUT}/test_report.json")
    print(f"  截图已保存: {OUT}/")
    print("="*70)