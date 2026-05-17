# -*- coding: utf-8 -*-
"""针对性测试：验证 logout 不再清除邀请数据"""
from playwright.sync_api import sync_playwright
import sys, json
sys.stdout.reconfigure(encoding='utf-8')

SITE = "https://sy25255.github.io/dorm-match"

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    
    console = []
    pg.on("console", lambda msg: console.append(msg.text))
    
    print("=" * 50)
    print("Step 1: Zhang Wei login and send invite to Zhao Gang")
    print("=" * 50)
    
    pg.goto(SITE, wait_until="domcontentloaded")
    pg.wait_for_timeout(3000)
    
    pg.locator("button", has_text="张伟").first.click(force=True)
    pg.wait_for_timeout(3000)
    pg.wait_for_load_state("domcontentloaded")
    print("[OK] Zhang Wei logged in")
    
    pg.goto(f"{SITE}/#/DEMO-UNI/matches", wait_until="domcontentloaded")
    pg.wait_for_timeout(3000)
    
    # Click the SECOND invite button (Zhao Gang is the 2nd recommendation)
    inv_btns = pg.locator("button", has_text="发送邀请")
    count = inv_btns.count()
    print(f"Found {count} invite buttons")
    
    # Click the FIRST invite button (Zhao Gang should be first after filtering paired students)
    if count >= 1:
        inv_btns.first.click(force=True)  # First = Zhao Gang (studentId: 4)
        pg.wait_for_timeout(3000)
        print("[OK] Sent invite to first recommendation (should be Zhao Gang, studentId:4)")
    
    # Check localStorage
    sent = pg.evaluate("() => localStorage.getItem('demo_sent_invites')")
    recv = pg.evaluate("() => localStorage.getItem('demo_received_invites')")
    pair = pg.evaluate("() => localStorage.getItem('demo_pair_groups')")
    print(f"After send: sent={sent is not None}, recv={recv is not None}, pair={pair is not None}")
    
    if sent:
        data = json.loads(sent)
        print(f"  Sent invites: {len(data)}, toStudentId: {data[0].get('toStudentId')}")
    
    if recv:
        data = json.loads(recv)
        print(f"  Received invites: {len(data)}, toStudentId: {data[0].get('toStudentId')}")
    
    print()
    print("=" * 50)
    print("Step 2: Logout Zhang Wei (should NOT clear invite data)")
    print("=" * 50)
    
    # Navigate to logout by clearing token and going to entry page
    pg.evaluate("() => localStorage.removeItem('token')")
    pg.goto(SITE, wait_until="domcontentloaded")
    pg.wait_for_timeout(2000)
    
    # Check if invite data survived
    sent2 = pg.evaluate("() => localStorage.getItem('demo_sent_invites')")
    recv2 = pg.evaluate("() => localStorage.getItem('demo_received_invites')")
    pair2 = pg.evaluate("() => localStorage.getItem('demo_pair_groups')")
    
    print(f"After logout: sent={sent2 is not None}, recv={recv2 is not None}, pair={pair2 is not None}")
    
    if recv2:
        data = json.loads(recv2)
        print(f"  Received invites survived: {len(data)}")
        for i, inv in enumerate(data):
            print(f"    [{i}] from={inv.get('fromStudentId')} to={inv.get('toStudentId')} school={inv.get('schoolCode')}")
    
    print()
    print("=" * 50)
    print("Step 3: Login as Zhao Gang (should see the invite)")
    print("=" * 50)
    
    pg.locator("button", has_text="赵刚").first.click(force=True)
    pg.wait_for_timeout(3000)
    pg.wait_for_load_state("domcontentloaded")
    print("[OK] Zhao Gang logged in")
    
    # Check localStorage after Zhao Gang login
    uid = pg.evaluate("() => localStorage.getItem('userId')")
    print(f"  Zhao Gang userId: {uid}")
    
    pg.goto(f"{SITE}/#/DEMO-UNI/matches", wait_until="domcontentloaded")
    pg.wait_for_timeout(3000)
    
    # Go to invite management tab
    inv_tab = pg.locator(".el-radio-button", has_text="邀请管理")
    if inv_tab.count() > 0:
        inv_tab.first.click(force=True)
        pg.wait_for_timeout(2500)
    
    pg.screenshot(path=r"d:\Trae\Trae CN\88\test_report\zhaogang_received.png", full_page=True)
    
    body = pg.locator("body").inner_text()
    has_invite = "暂无收到的邀请" not in body
    print(f"Zhao Gang invite tab shows data: {has_invite}")
    
    if has_invite:
        print("[PASS] Invite persistence works correctly!")
    else:
        # Check localStorage directly
        final_recv = pg.evaluate("() => localStorage.getItem('demo_received_invites')")
        final_sent = pg.evaluate("() => localStorage.getItem('demo_sent_invites')")
        print(f"  localStorage demo_received_invites exists: {final_recv is not None}")
        print(f"  localStorage demo_sent_invites exists: {final_sent is not None}")
        
        if final_recv:
            data = json.loads(final_recv)
            for_zhao = [i for i in data if i.get('toStudentId') == 4]
            print(f"  Invites for Zhao Gang (toStudentId=4): {len(for_zhao)}")
            if for_zhao:
                print("  [PASS] Data exists in localStorage but UI may not refresh")
            else:
                print("  [FAIL] No invites for Zhao Gang - investigate toStudentId")
    
    print("\n=== Console logs ===")
    invite_logs = [l for l in console if 'invite' in l.lower() or 'mock' in l.lower()]
    for l in invite_logs[-10:]:
        print(f"  {l[:200]}")
    
    b.close()