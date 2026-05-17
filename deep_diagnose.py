# -*- coding: utf-8 -*-
"""深度诊断：邀请发送后localStorage为什么没更新"""
from playwright.sync_api import sync_playwright
import os, sys, json
sys.stdout.reconfigure(encoding='utf-8')

SITE = "https://sy25255.github.io/dorm-match"

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    
    console_logs = []
    pg.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
    errors = []
    pg.on("pageerror", lambda e: errors.append(f"[ERROR] {str(e)}"))

    pg.goto(SITE, wait_until="domcontentloaded")
    pg.wait_for_timeout(3000)
    
    print("=== Step 1: Login as Zhang Wei ===")
    btn = pg.locator("button", has_text="张伟").first
    btn.click(force=True)
    pg.wait_for_timeout(3000)
    pg.wait_for_load_state("domcontentloaded")
    
    token = pg.evaluate("() => localStorage.getItem('token')")
    userId = pg.evaluate("() => localStorage.getItem('userId')")
    print(f"  Token: {token}")
    print(f"  UserId: {userId}")
    
    print("\n=== Step 2: Navigate to Matches ===")
    pg.goto(f"{SITE}/#/DEMO-UNI/matches", wait_until="domcontentloaded")
    pg.wait_for_timeout(3000)
    
    print("\n=== Step 3: Check pre-existing localStorage ===")
    sent_before = pg.evaluate("() => localStorage.getItem('demo_sent_invites')")
    recv_before = pg.evaluate("() => localStorage.getItem('demo_received_invites')")
    pairs_before = pg.evaluate("() => localStorage.getItem('demo_pair_groups')")
    print(f"  sent_invites before: {sent_before}")
    print(f"  received_invites before: {recv_before}")
    print(f"  pair_groups before: {pairs_before}")
    
    print("\n=== Step 4: Click first 'send invite' button ===")
    inv_btns = pg.locator("button", has_text="发送邀请")
    count = inv_btns.count()
    print(f"  Found {count} invite buttons")
    
    if count > 0:
        inv_btns.first.click(force=True)
        pg.wait_for_timeout(4000)  # Wait longer for API call
        pg.screenshot(path=r"d:\Trae\Trae CN\88\test_report\deep_diag_after_click.png", full_page=True)
    
    print("\n=== Step 5: Check localStorage AFTER invite ===")
    sent_after = pg.evaluate("() => localStorage.getItem('demo_sent_invites')")
    recv_after = pg.evaluate("() => localStorage.getItem('demo_received_invites')")
    pairs_after = pg.evaluate("() => localStorage.getItem('demo_pair_groups')")
    print(f"  sent_invites after: {sent_after}")
    print(f"  received_invites after: {recv_after}")
    print(f"  pair_groups after: {pairs_after}")
    
    # List all localStorage keys
    all_keys = pg.evaluate("""() => {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            keys.push(localStorage.key(i));
        }
        return keys;
    }""")
    print(f"\n  All localStorage keys: {all_keys}")
    
    print("\n=== Step 6: Console logs from invite flow ===")
    invite_logs = [l for l in console_logs if 'invite' in l.lower() or 'send' in l.lower() or 'mock' in l.lower()]
    for log in invite_logs:
        print(f"  {log[:200]}")
    
    print("\n=== Step 7: Page errors ===")
    for e in errors:
        print(f"  {e[:200]}")
    if not errors:
        print("  None")
    
    print("\n=== Step 8: Check if handleMock was called ===")
    # The mock should log '[Mock] POST /invite/send'
    mock_logs = [l for l in console_logs if '[Mock]' in l]
    for log in mock_logs:
        print(f"  {log[:250]}")
    
    b.close()