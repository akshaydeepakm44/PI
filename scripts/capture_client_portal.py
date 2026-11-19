import os
import time
from playwright.sync_api import sync_playwright

output_dir = r"C:\Users\aksha\.gemini\antigravity\brain\aa3729f7-33d3-4572-8bec-32244996d55c\client_screenshots"
os.makedirs(output_dir, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()

    # 1. Capture Home Page
    print("Navigating to Home Page...")
    page.goto("https://portal-property.netlify.app/", wait_until="networkidle")
    time.sleep(2)
    home_path = os.path.join(output_dir, "01_home_page.png")
    page.screenshot(path=home_path, full_page=True)
    print(f"Saved: {home_path}")

    # 2. Capture Listings / Projects Page
    print("Navigating to Listings / Projects...")
    # Try finding link to projects or clicking on Listings
    try:
        listings_link = page.query_selector("nav a:has-text('Listings'), nav a:has-text('Projects'), a[href*='projects']")
        if listings_link:
            listings_link.click()
            time.sleep(2)
        else:
            page.goto("https://portal-property.netlify.app/projects", wait_until="networkidle")
            time.sleep(2)
        projects_path = os.path.join(output_dir, "02_projects_directory.png")
        page.screenshot(path=projects_path, full_page=True)
        print(f"Saved: {projects_path}")
    except Exception as e:
        print(f"Error navigating to projects: {e}")

    # 3. Open Ramky Kingston Park Orbit Detail Page
    print("Opening Ramky Kingston Park Orbit detail page...")
    try:
        ramky_card = page.query_selector("text=Ramky Kingston Park Orbit")
        if ramky_card:
            ramky_card.click()
            time.sleep(2)
        else:
            # Look for project links
            links = page.query_selector_all("a[href*='ramky'], a[href*='project']")
            if links:
                links[0].click()
                time.sleep(2)
        detail_path = os.path.join(output_dir, "03_ramky_detail_overview.png")
        page.screenshot(path=detail_path, full_page=True)
        print(f"Saved: {detail_path}")
    except Exception as e:
        print(f"Error navigating to Ramky: {e}")

    # 4. Cycle through detail tabs if available
    tabs = [
        ("Unit plans & pricing", "04_unit_plans_pricing.png"),
        ("Neighbourhood", "05_neighbourhood.png"),
        ("Liveability", "06_liveability.png"),
        ("My Commute", "07_my_commute.png"),
        ("Master plan", "08_master_plan.png"),
        ("Towers & blocks", "09_towers_blocks.png"),
        ("Amenities", "10_amenities.png"),
        ("Sustainability", "11_sustainability.png"),
        ("Safety & security", "12_safety_security.png"),
    ]

    for tab_name, filename in tabs:
        try:
            print(f"Clicking tab: {tab_name}...")
            btn = page.query_selector(f"button:has-text('{tab_name}'), a:has-text('{tab_name}')")
            if btn:
                btn.click()
                time.sleep(1)
                tab_path = os.path.join(output_dir, filename)
                page.screenshot(path=tab_path, full_page=True)
                print(f"Saved: {tab_path}")
            else:
                print(f"Tab not found: {tab_name}")
        except Exception as e:
            print(f"Error on tab {tab_name}: {e}")

    browser.close()
    print("Screenshot capture complete!")
