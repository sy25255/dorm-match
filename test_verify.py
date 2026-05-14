"""快速验证：管理员反馈管理页面「处理」按钮和弹窗"""
from playwright.sync_api import sync_playwright
import time

BASE = "http://localhost:5173/dorm-match"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    page.on("console", lambda msg: print(f"  [CONSOLE {msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: print(f"  [PAGE_ERROR] {err}"))

    # 1. Enter school
    print("1. Opening school entry...")
    page.goto(f"{BASE}/#/", wait_until='networkidle', timeout=15000)
    page.wait_for_timeout(2000)
    page.locator('input[placeholder*="例如"]').first.fill("DEMO-UNI")
    page.locator('button').filter(has_text='进入学校系统').first.click()
    page.wait_for_timeout(2000)
    print(f"   URL: {page.url}")

    # 2. Admin login
    print("2. Admin login...")
    admin_btn = page.locator('button').filter(has_text='管理员').first
    if admin_btn.is_visible(timeout=5000):
        admin_btn.click()
        page.wait_for_timeout(3000)
        print(f"   Admin URL: {page.url}")
    else:
        print("   ERROR: Admin button not visible!")
        browser.close()
        exit(1)

    # 3. Go to feedback management
    print("3. Navigating to feedback management...")
    page.goto(f"{BASE}/#/DEMO-UNI/admin/feedback", wait_until='networkidle', timeout=15000)
    page.wait_for_timeout(2000)
    print(f"   URL: {page.url}")

    # Take screenshot
    page.screenshot(path="d:/Trae/Trae CN/88/test_results/verify_before_click.png", full_page=True)

    # 4. Check if the page loaded correctly
    title_el = page.locator('h2:has-text("反馈管理")').first
    if title_el.is_visible():
        print("   [OK] Feedback management page loaded")
    else:
        print("   [FAIL] Feedback management page not loaded")

    # 5. Find and click "处理" button
    print("4. Finding '处理' button...")
    process_btns = page.locator('button').filter(has_text='处理').all()
    print(f"   Found {len(process_btns)} '处理' button(s)")

    if process_btns:
        for i, btn in enumerate(process_btns):
            is_visible = btn.is_visible()
            is_enabled = btn.is_enabled()
            print(f"   Button {i}: visible={is_visible}, enabled={is_enabled}")

        # Click first visible one
        first_btn = process_btns[0]
        if first_btn.is_visible():
            print("5. Clicking '处理' button...")
            first_btn.click()
            page.wait_for_timeout(2000)

            # Check if dialog opened
            dialog = page.locator('.el-dialog, .el-overlay-dialog, [role="dialog"]').first
            dialog_visible = page.locator('.el-dialog__wrapper:not([style*="display: none"])').first.is_visible(timeout=3000)
            has_dialog_content = page.locator('text=处理反馈').first.is_visible()

            print(f"   Dialog visible (wrapper): {dialog_visible}")
            print(f"   Dialog content '处理反馈': {has_dialog_content}")

            page.screenshot(path="d:/Trae/Trae CN/88/test_results/verify_after_click.png", full_page=True)

            # 6. Fill in reply
            if dialog_visible or has_dialog_content:
                print("6. Filling reply...")
                # Select "采纳并解决"
                adopt_radio = page.locator('text=采纳并解决').first
                if adopt_radio.is_visible():
                    adopt_radio.click()
                    print("   [OK] Selected '采纳并解决'")
                
                # Fill reply text
                textarea = page.locator('textarea').first
                if textarea.is_visible():
                    textarea.fill("已收到你的反馈，我们已经安排后勤人员前往维修，预计明天下午前完成。感谢你的反馈！")
                    print("   [OK] Reply text filled")
                
                # Click confirm
                confirm_btn = page.locator('button').filter(has_text='确认处理').first
                if confirm_btn.is_visible():
                    confirm_btn.click()
                    page.wait_for_timeout(2000)
                    print("   [OK] Confirmed reply")
                
                page.screenshot(path="d:/Trae/Trae CN/88/test_results/verify_after_submit.png", full_page=True)
            else:
                print("   [FAIL] Dialog did not open!")
        else:
            print("   [FAIL] First button is not visible!")
    else:
        print("   [FAIL] No '处理' buttons found!")

    # 7. Switch to student to verify reply
    print("7. Switching to student to check reply...")
    page.evaluate("localStorage.clear()")
    page.goto(f"{BASE}/#/", wait_until='networkidle', timeout=15000)
    page.wait_for_timeout(2000)
    page.locator('input[placeholder*="例如"]').first.fill("DEMO-UNI")
    page.locator('button').filter(has_text='进入学校系统').first.click()
    page.wait_for_timeout(2000)
    
    # Login as李明 (the one with PENDING status)
    li_btn = page.locator('button').filter(has_text='赵刚').first
    if li_btn.is_visible(timeout=5000):
        li_btn.click()
        page.wait_for_timeout(2000)
    
    page.goto(f"{BASE}/#/DEMO-UNI/feedback", wait_until='networkidle', timeout=15000)
    page.wait_for_timeout(2000)
    
    # Check for reply sections
    reply_sections = page.locator('.reply-section').all()
    print(f"   Reply sections visible: {len(reply_sections)}")
    
    page.screenshot(path="d:/Trae/Trae CN/88/test_results/verify_student_feedback.png", full_page=True)
    
    browser.close()
    print("\nDone!")