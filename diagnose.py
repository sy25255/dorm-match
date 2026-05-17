# -*- coding: utf-8 -*-
"""诊断脚本：检查部署站点的问题"""
from playwright.sync_api import sync_playwright
import os, sys, json
sys.stdout.reconfigure(encoding='utf-8')

SITE = "https://sy25255.github.io/dorm-match"

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    
    # 收集控制台消息
    console_logs = []
    pg.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
    pg.on("pageerror", lambda e: console_logs.append(f"[ERROR] {str(e)}"))

    # 访问首页
    pg.goto(SITE, wait_until="networkidle")
    pg.wait_for_timeout(3000)
    
    # 查看页面HTML
    body = pg.inner_text("body")
    print("=== PAGE BODY (first 500 chars) ===")
    print(body[:500])
    print()
    
    # 登录张伟
    btn = pg.locator("button").filter(has_text="张伟").first
    if btn.count() > 0:
        btn.click(force=True)
        pg.wait_for_timeout(3000)
        pg.wait_for_load_state("networkidle")
        print("=== AFTER LOGIN ===")
        body2 = pg.inner_text("body")
        print(body2[:500])
        print()
        
        # 检查 localStorage
        token = pg.evaluate("() => localStorage.getItem('token')")
        userId = pg.evaluate("() => localStorage.getItem('userId')")
        surveyDone = pg.evaluate("() => localStorage.getItem('demo_survey_completed')")
        sentInvites = pg.evaluate("() => localStorage.getItem('demo_sent_invites')")
        receivedInvites = pg.evaluate("() => localStorage.getItem('demo_received_invites')")
        pairGroups = pg.evaluate("() => localStorage.getItem('demo_pair_groups')")
        
        print(f"token: {token}")
        print(f"userId: {userId}")
        print(f"surveyDone: {surveyDone}")
        print(f"sentInvites: {sentInvites}")
        print(f"receivedInvites: {receivedInvites}")
        print(f"pairGroups: {pairGroups}")
        print()
        
        # 导航到匹配页面
        pg.goto(f"{SITE}/#/DEMO-UNI/matches", wait_until="networkidle")
        pg.wait_for_timeout(3000)
        body3 = pg.inner_text("body")
        print("=== MATCHES PAGE ===")
        print(body3[:800])
        print()
        
        # 看看"发送邀请"按钮
        btns = pg.locator("button")
        count = btns.count()
        print(f"Total buttons: {count}")
        for i in range(min(count, 20)):
            try:
                text = btns.nth(i).inner_text()
                print(f"  Button {i}: '{text}'")
            except: pass
    
    print("\n=== CONSOLE LOGS ===")
    for log in console_logs[-30:]:
        print(log)
    
    pg.screenshot(path=r"d:\Trae\Trae CN\88\test_report\diagnostic.png", full_page=True)
    b.close()