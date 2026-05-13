# -*- coding: utf-8 -*-
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context()
    page = ctx.new_page()
    
    errors = []
    page.on("pageerror", lambda err: errors.append(str(err)))
    
    print("=== Step 1: Login as student ===")
    page.goto('https://sy25255.github.io/dorm-match/')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)
    page.locator('button:has-text("DEMO-UNI")').first.click()
    page.wait_for_timeout(2000)
    page.locator('button:has-text("张伟")').first.click()
    page.wait_for_timeout(2000)
    print(f"  Logged in: {page.url}")
    
    print("\n=== Step 2: Navigate to survey and fill it ===")
    page.goto('https://sy25255.github.io/dorm-match/#/DEMO-UNI/survey')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(3000)
    
    # Check initial state
    completed = page.evaluate("() => localStorage.getItem('demo_survey_completed')")
    print(f"  demo_survey_completed: {completed}")
    
    # Check Vue component data via DOM
    submitted_box = page.locator('.submitted-box')
    print(f"  submitted-box visible: {submitted_box.count() > 0}")
    
    if submitted_box.count() == 0:
        print("\n=== Step 3: Try to submit survey ===")
        # Click through a few sections answering required questions
        for i in range(3):
            btns = page.locator('button:has-text("下一部分")')
            if btns.count() > 0:
                # Try to answer some radio questions
                radios = page.locator('.el-radio:not(.is-checked)')
                for j in range(min(5, radios.count())):
                    try:
                        radios.nth(j).click()
                        page.wait_for_timeout(100)
                    except: pass
                btns.first.click()
                page.wait_for_timeout(500)
        
        # Find submit button
        submit_btn = page.locator('button:has-text("提交问卷")')
        if submit_btn.count() > 0:
            print("  Found submit button, clicking...")
            submit_btn.first.click()
            page.wait_for_timeout(1000)
            # Handle confirm dialog
            confirm_btn = page.locator('.el-message-box button:has-text("确认提交")')
            if confirm_btn.count() > 0:
                confirm_btn.first.click()
                page.wait_for_timeout(3000)
        
        completed = page.evaluate("() => localStorage.getItem('demo_survey_completed')")
        print(f"  After submit - demo_survey_completed: {completed}")
    
    print("\n=== Step 4: Reload and check ===")
    page.goto('https://sy25255.github.io/dorm-match/#/DEMO-UNI/survey')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(3000)
    
    completed = page.evaluate("() => localStorage.getItem('demo_survey_completed')")
    submitted_box = page.locator('.submitted-box')
    page.locator('h1')
    
    print(f"  demo_survey_completed: {completed}")
    print(f"  submitted-box visible: {submitted_box.count() > 0}")
    print(f"  errors: {errors}")
    
    page.screenshot(path='d:/Trae/Trae CN/88/screenshots/test_survey2.png')
    print("\nScreenshot saved: test_survey2.png")
    browser.close()
