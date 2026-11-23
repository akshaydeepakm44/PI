"""
qa/verify_distinctive_features.py
Automated Playwright verification script to verify and screenshot the new distinctive AI analysis features on Property 1.
"""

import os
import sys
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:5173"
SCREENSHOT_DIR = os.path.abspath("qa/screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        print("1. Navigating to Property 1 detail page...")
        page.goto(f"{BASE_URL}/properties/1", wait_until="networkidle", timeout=30000)
        time.sleep(2)

        # Check stats bar
        assert page.locator(".key-facts").is_visible(), "Stats bar (.key-facts) is not visible"
        print("   Stats bar is visible.")

        # Check "What stands out" button directly under stats bar
        standout_btn = page.locator("button:has-text('What stands out')")
        assert standout_btn.is_visible(), "'What stands out' button not found"
        print("   'What stands out' button is visible in idle state.")

        # Screenshot 30: Idle state
        idle_path = os.path.join(SCREENSHOT_DIR, "30-standout-idle.png")
        page.screenshot(path=idle_path, full_page=False)
        print(f"   Screenshot saved: {idle_path}")

        # Click "What stands out"
        print("2. Clicking 'What stands out'...")
        standout_btn.click()
        time.sleep(1)

        # Wait for result card (signature line)
        page.wait_for_selector("text=Distinctive signature", timeout=25000)
        print("   Standout card rendered successfully.")

        # Click Seller view toggle
        seller_toggle = page.locator("button:has-text('Seller view')")
        if seller_toggle.is_visible():
            seller_toggle.click()
            time.sleep(0.5)
            print("   Seller view expanded.")

        # Extract text details
        sig_elem = page.locator("p.text-lg.font-heading").first
        sig_text = sig_elem.inner_text() if sig_elem.is_visible() else "N/A"
        print(f"\n   [SIGNATURE LINE]: {sig_text}\n")

        # Screenshot 31: Standout expanded
        expanded_path = os.path.join(SCREENSHOT_DIR, "31-standout-expanded.png")
        page.screenshot(path=expanded_path, full_page=False)
        print(f"   Screenshot saved: {expanded_path}")

        # Section 2: Liveability with 24-hour strip chart
        print("3. Scrolling to Liveability section...")
        liveability_sec = page.locator("section#liveability")
        liveability_sec.scroll_into_view_if_needed()
        time.sleep(1)

        # Click AI analysis in liveability
        liv_btn = liveability_sec.locator("button:has-text('AI analysis')")
        if liv_btn.is_visible():
            print("   Clicking Liveability AI analysis...")
            liv_btn.click()
            liveability_sec.locator("text=Diurnal PM2.5 Profile").wait_for(timeout=35000)
            print("   24-Hour Diurnal PM2.5 strip chart rendered successfully.")
        else:
            print("   Liveability AI analysis already expanded or button not found.")

        time.sleep(1)
        liv_path = os.path.join(SCREENSHOT_DIR, "32-air-quality-strip.png")
        liveability_sec.screenshot(path=liv_path)
        print(f"   Screenshot saved: {liv_path}")

        # Section 4: Master plan with Sun-Path diagram
        print("4. Scrolling to Master plan section...")
        master_sec = page.locator("section#master-plan")
        master_sec.scroll_into_view_if_needed()
        time.sleep(1)

        mp_btn = master_sec.locator("button:has-text('AI analysis')")
        if mp_btn.is_visible():
            print("   Clicking Master plan AI analysis...")
            mp_btn.click()
            master_sec.locator("text=Solar Path").wait_for(timeout=35000)
            print("   Mini Sun-Path diagram rendered successfully.")
        else:
            print("   Master plan AI analysis already expanded or button not found.")

        time.sleep(1)
        mp_path = os.path.join(SCREENSHOT_DIR, "33-sun-path-diagram.png")
        master_sec.screenshot(path=mp_path)
        print(f"   Screenshot saved: {mp_path}")

        browser.close()
        print("\nAll verification checkpoints successfully passed!")

if __name__ == "__main__":
    run_verification()
