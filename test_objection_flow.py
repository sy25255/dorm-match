# -*- coding: utf-8 -*-
import sys, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from playwright.sync_api import sync_playwright
SITE = 'https://sy25255.github.io/dorm-match/'
logs = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 800})
    page.on('console', lambda msg: logs.append(f'[{msg.type}] {msg.text}'))

    print('=== Step 1: Open site ===')
    page.goto(SITE, timeout=60000)
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    print(f'OK: {page.title()}')

    print('\n=== Step 2: Enter DEMO-UNI ===')
    page.locator('.demo-school-btn').first.click()
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)

    print('\n=== Step 3: Login as Zhangwei ===')
    page.locator('text=张伟').first.click()
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    print(f'URL: {page.url}')

    print('\n=== Step 4: Inject localStorage for allocation ===')
    page.evaluate("""
        () => {
            localStorage.setItem('demo_survey_completed', 'true');
        }
    """)

    print('\n=== Step 5: Navigate to Allocation ===')
    page.goto(SITE + '#/DEMO-UNI/allocation', timeout=30000)
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(3000)
    c = page.content()
    print(f'  hasEmpty={"暂无分配结果" in c}')
    print(f'  hasConfirm={"确认无异议" in c}')
    print(f'  hasObjection={"提交异议" in c}')
    print(f'  hasRoomNumber={"M1-101" in c}')

    if '提交异议' in c:
        print('\n=== Step 6: Submit objection ===')
        page.locator('button:has-text("提交异议")').first.click()
        page.wait_for_timeout(1000)
        page.locator('textarea').last.fill('Test objection via Playwright: want lower floor')
        page.wait_for_timeout(300)
        submit_btns = page.locator('.el-message-box__btns button:has-text("提交")')
        if submit_btns.count() > 0:
            submit_btns.first.click()
        page.wait_for_timeout(2000)
        print('OK: objection submitted')

    print('\n=== Step 7: Switch to Admin ===')
    page.evaluate("""
        () => {
            localStorage.setItem('token', 'demo-admin-token');
            localStorage.setItem('userId', '99');
            localStorage.setItem('username', '管理员');
            localStorage.setItem('role', 'ADMIN');
            localStorage.setItem('schoolCode', 'DEMO-UNI');
            localStorage.setItem('schoolName', '示范大学');
        }
    """)

    print('\n=== Step 8: Go to admin objections ===')
    page.goto(SITE + '#/DEMO-UNI/admin/objections', timeout=30000)
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(4000)
    c = page.content()
    has_handle = '处理' in c
    has_empty = '暂无异议' in c
    print(f'  hasHandle={has_handle}, hasEmpty={has_empty}')

    handle_btns = page.locator('button:has-text("处理")')
    print(f'  Handle buttons: {handle_btns.count()}')

    if handle_btns.count() > 0:
        print('\n=== Step 9: Process objection ===')
        handle_btns.last.click()
        page.wait_for_timeout(1000)

        selects = page.locator('.el-dialog .el-select')
        if selects.count() > 0:
            selects.first.click()
            page.wait_for_timeout(500)
            resolved = page.locator('.el-select-dropdown__item:has-text("已解决")')
            if resolved.count() > 0:
                resolved.last.click()
                page.wait_for_timeout(300)

        ta = page.locator('.el-dialog textarea')
        if ta.count() > 0:
            ta.last.fill('Approved: transfer to lower floor')
        page.wait_for_timeout(300)

        page.locator('.el-dialog__footer button:has-text("保存处理")').first.click()
        page.wait_for_timeout(2000)
        print('OK: objection processed')
    else:
        print('\n=== Step 9: No objections to process ===')

    browser.close()

    print('\n' + '=' * 60)
    print('[Console Logs]')
    print('=' * 60)
    kw = ['Allocation', 'Objection', 'Mock', 'allocation', 'objection']
    rel = [l for l in logs if any(k in l for k in kw)]
    if rel:
        for l in rel:
            print(f'  {l}')
    else:
        print('  None matched - all logs:')
        for l in logs[:40]:
            print(f'  {l}')
    print(f'\nTotal: {len(logs)} logs, {len(rel)} related')
