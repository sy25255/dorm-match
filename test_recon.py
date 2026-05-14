"""侦察脚本：快速浏览每个页面，截图并收集关键元素"""
from playwright.sync_api import sync_playwright
import os, time

BASE = "http://localhost:5173/dorm-match"
OUT = "d:/Trae/Trae CN/88/test_screenshots"
os.makedirs(OUT, exist_ok=True)

def screenshot(page, name):
    path = os.path.join(OUT, name)
    page.screenshot(path=path, full_page=True)
    print(f"[SCREENSHOT] {name}")

def get_links(page):
    links = page.locator('a').all()
    result = []
    for l in links:
        try:
            href = l.get_attribute('href')
            text = l.inner_text().strip()
            if text:
                result.append(f"  a: [{text}] -> {href}")
        except:
            pass
    return result

def get_buttons(page):
    btns = page.locator('button').all()
    result = []
    for b in btns:
        try:
            text = b.inner_text().strip()
            if text:
                result.append(f"  button: [{text}]")
        except:
            pass
    return result

def get_inputs(page):
    inputs = page.locator('input, select, textarea').all()
    result = []
    for inp in inputs:
        try:
            ph = inp.get_attribute('placeholder') or ''
            name = inp.get_attribute('name') or ''
            tp = inp.get_attribute('type') or ''
            tag = inp.evaluate('el => el.tagName')
            result.append(f"  {tag}: type={tp} name={name} placeholder={ph}")
        except:
            pass
    return result

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # === 1. School Entry Page ===
    print("\n=== 1. School Entry ===")
    page.goto(BASE, wait_until='networkidle', timeout=15000)
    page.wait_for_timeout(1000)
    screenshot(page, "01_school_entry.png")
    print("Title:", page.title())
    btns = get_buttons(page)
    inputs = get_inputs(page)
    print("Buttons:", btns)
    print("Inputs:", inputs)

    # === Enter school code ===
    try:
        inp = page.locator('input').first
        inp.fill("DEMO-UNI")
        page.wait_for_timeout(500)
        btn = page.locator('button').filter(has_text="进入").first
        if btn.is_visible():
            btn.click()
    except Exception as e:
        print(f"School entry error: {e}")

    page.wait_for_timeout(2000)
    screenshot(page, "02_after_school_entry.png")
    print("After entry URL:", page.url)

    # === 2. Login Page ===
    print("\n=== 2. Login Page ===")
    btns = get_buttons(page)
    inputs = get_inputs(page)
    print("Buttons:", btns)
    print("Inputs:", inputs)

    # Click demo login
    try:
        demo_btn = page.locator('button').filter(has_text="演示").first
        if demo_btn.is_visible():
            demo_btn.click()
            page.wait_for_timeout(2000)
        else:
            # Try student login
            sid = page.locator('input').first
            sid.fill("2024001")
            login_btn = page.locator('button').filter(has_text="登录").first
            if login_btn.is_visible():
                login_btn.click()
                page.wait_for_timeout(2000)
    except Exception as e:
        print(f"Login error: {e}")

    screenshot(page, "03_after_login.png")
    print("After login URL:", page.url)

    # === 3. Navigate Student Pages ===
    student_pages = [
        ("home", "#/DEMO-UNI/home"),
        ("survey", "#/DEMO-UNI/survey"),
        ("matches", "#/DEMO-UNI/matches"),
        ("search", "#/DEMO-UNI/search"),
        ("invites", "#/DEMO-UNI/invites"),
        ("pairing", "#/DEMO-UNI/pairing"),
        ("allocation", "#/DEMO-UNI/allocation"),
        ("profile", "#/DEMO-UNI/profile"),
        ("notifications", "#/DEMO-UNI/notifications"),
        ("feedback", "#/DEMO-UNI/feedback"),
    ]

    for name, hash_url in student_pages:
        print(f"\n=== Student: {name} ===")
        page.goto(f"{BASE}/#/{'DEMO-UNI'}/{name}" if '#' not in hash_url else f"{BASE}/{hash_url}", wait_until='networkidle', timeout=15000)
        page.wait_for_timeout(1500)
        screenshot(page, f"04_student_{name}.png")
        btns = get_buttons(page)
        inputs = get_inputs(page)
        links = get_links(page)
        print("Buttons:", btns[:5])
        print("Inputs:", inputs[:5])
        print("Links:", links[:5])
        # Check for error elements
        errors = page.locator('.el-message--error, [class*="error"]').all()
        if errors:
            for e in errors:
                try:
                    print(f"[ERROR] {e.inner_text()}")
                except:
                    pass

    # === 4. Admin Login ===
    print("\n=== 5. Admin Login ===")
    # Clear localStorage and go to admin login
    page.evaluate("localStorage.clear()")
    page.goto(f"{BASE}/#/DEMO-UNI/login", wait_until='networkidle', timeout=15000)
    page.wait_for_timeout(1000)

    # Try admin login
    try:
        # Check if there's role selection
        admin_tabs = page.locator('text=管理员').first
        if admin_tabs.is_visible():
            admin_tabs.click()
            page.wait_for_timeout(500)

        # Admin demo login
        admin_demo = page.locator('button').filter(has_text="演示").first
        if admin_demo.is_visible():
            admin_demo.click()
            page.wait_for_timeout(2000)
        else:
            # Try input
            sid = page.locator('input').first
            if sid.is_visible():
                sid.fill("admin001")
            pwd_inputs = page.locator('input[type="password"]')
            if pwd_inputs.count() > 0:
                pwd_inputs.first.fill("admin123")
            login_btn = page.locator('button').filter(has_text="登录").first
            if login_btn.is_visible():
                login_btn.click()
                page.wait_for_timeout(2000)
    except Exception as e:
        print(f"Admin login error: {e}")

    screenshot(page, "05_admin_after_login.png")
    print("Admin URL:", page.url)

    # === 5. Admin Pages ===
    admin_pages = [
        ("statistics", "statistics"),
        ("school_manage", "school"),
        ("students", "students"),
        ("survey_manage", "survey"),
        ("dormitory", "dormitory"),
        ("allocation", "allocation"),
        ("objections", "objections"),
        ("feedback_manage", "feedback"),
        ("audit_logs", "audit-logs"),
    ]

    for name, route in admin_pages:
        print(f"\n=== Admin: {name} ===")
        page.goto(f"{BASE}/#/DEMO-UNI/admin/{route}", wait_until='networkidle', timeout=15000)
        page.wait_for_timeout(1500)
        screenshot(page, f"06_admin_{name}.png")
        btns = get_buttons(page)
        inputs = get_inputs(page)
        links = get_links(page)
        print("Buttons:", btns[:5])
        print("Inputs:", inputs[:5])
        errors = page.locator('.el-message--error, [class*="error"]').all()
        if errors:
            for e in errors:
                try:
                    print(f"[ERROR] {e.inner_text()}")
                except:
                    pass

    browser.close()
    print("\n=== Reconnaissance Complete ===")