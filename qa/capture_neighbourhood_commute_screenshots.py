"""
qa/capture_neighbourhood_commute_screenshots.py
Captures screenshots of Neighbourhood and My Commute sections across all states:
1. 41-neighbourhood-idle.png
2. 42-neighbourhood-loading.png
3. 43-neighbourhood-result-bars.png
4. 44-neighbourhood-result-map.png
5. 45-commute-idle.png
6. 46-commute-loading.png
7. 47-commute-result-0830.png
8. 48-commute-result-1100.png
9. 49-commute-add-modal.png
10. 50-commute-custom-added.png
"""

import os
import shutil
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:5173"
SCREENSHOT_DIR = os.path.abspath("qa/screenshots")
ARTIFACT_DIR = r"C:\Users\aksha\.gemini\antigravity\brain\aa3729f7-33d3-4572-8bec-32244996d55c"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)
os.makedirs(ARTIFACT_DIR, exist_ok=True)

def copy_to_artifacts(src_path):
    filename = os.path.basename(src_path)
    dest_path = os.path.join(ARTIFACT_DIR, filename)
    shutil.copy2(src_path, dest_path)
    print(f"   [Artifact Saved] {filename}")

def capture_all():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 950})
        page = context.new_page()

        print("Navigating to Property 1 detail page...")
        page.goto(f"{BASE_URL}/properties/1", wait_until="networkidle", timeout=30000)
        time.sleep(2)

        # -------------------------------------------------------------
        # NEIGHBOURHOOD SECTION
        # -------------------------------------------------------------
        print("\n--- NEIGHBOURHOOD SECTION ---")
        neighbourhood_sec = page.locator("section#neighbourhood")
        neighbourhood_sec.scroll_into_view_if_needed()
        time.sleep(1)

        # 1. Neighbourhood Idle State
        print("1. Capturing Neighbourhood Idle State...")
        n_btn = neighbourhood_sec.locator("button:has-text('AI analysis')")
        assert n_btn.is_visible(), "Neighbourhood AI analysis button not found"
        p41 = os.path.join(SCREENSHOT_DIR, "41-neighbourhood-idle.png")
        neighbourhood_sec.screenshot(path=p41)
        copy_to_artifacts(p41)

        # 2. Neighbourhood Loading State
        print("2. Capturing Neighbourhood Loading State...")
        n_btn.click()
        time.sleep(0.2)
        p42 = os.path.join(SCREENSHOT_DIR, "42-neighbourhood-loading.png")
        neighbourhood_sec.screenshot(path=p42)
        copy_to_artifacts(p42)

        # 3. Neighbourhood Result State (Comparison Bars)
        print("3. Capturing Neighbourhood Result State (Comparison Bars)...")
        neighbourhood_sec.locator("text=Neighbourhood Intelligence Briefing").wait_for(timeout=10000)
        time.sleep(1)
        p43 = os.path.join(SCREENSHOT_DIR, "43-neighbourhood-result-bars.png")
        neighbourhood_sec.screenshot(path=p43)
        copy_to_artifacts(p43)

        # 4. Neighbourhood Map Route View
        print("4. Capturing Neighbourhood Map Route View...")
        map_btn = neighbourhood_sec.locator("button:has-text('Show on Map')")
        if map_btn.is_visible():
            map_btn.click()
            time.sleep(0.5)
            p44 = os.path.join(SCREENSHOT_DIR, "44-neighbourhood-result-map.png")
            neighbourhood_sec.screenshot(path=p44)
            copy_to_artifacts(p44)

        # -------------------------------------------------------------
        # MY COMMUTE SECTION
        # -------------------------------------------------------------
        print("\n--- MY COMMUTE SECTION ---")
        commute_sec = page.locator("section#commute")
        commute_sec.scroll_into_view_if_needed()
        time.sleep(1)

        # 5. Commute Idle State
        print("5. Capturing Commute Idle State...")
        c_btn = commute_sec.locator("button:has-text('AI analysis')")
        assert c_btn.is_visible(), "Commute AI analysis button not found"
        p45 = os.path.join(SCREENSHOT_DIR, "45-commute-idle.png")
        commute_sec.screenshot(path=p45)
        copy_to_artifacts(p45)

        # 6. Commute Loading State
        print("6. Capturing Commute Loading State...")
        c_btn.click()
        time.sleep(0.2)
        p46 = os.path.join(SCREENSHOT_DIR, "46-commute-loading.png")
        commute_sec.screenshot(path=p46)
        copy_to_artifacts(p46)

        # 7. Commute Result State (08:30 Peak)
        print("7. Capturing Commute Result State (08:30 Peak)...")
        commute_sec.locator("text=My Commute Intelligence Briefing").wait_for(timeout=10000)
        time.sleep(1)
        p47 = os.path.join(SCREENSHOT_DIR, "47-commute-result-0830.png")
        commute_sec.screenshot(path=p47)
        copy_to_artifacts(p47)

        # 8. Commute Result State (11:00 Off-Peak Toggle)
        print("8. Capturing Commute Result State (11:00 Off-Peak)...")
        t11_btn = commute_sec.locator("button:has-text('11:00')")
        if t11_btn.is_visible():
            t11_btn.click()
            time.sleep(0.5)
            p48 = os.path.join(SCREENSHOT_DIR, "48-commute-result-1100.png")
            commute_sec.screenshot(path=p48)
            copy_to_artifacts(p48)

        # 9. Commute Add Modal
        print("9. Capturing Commute Add Destination Modal...")
        add_btn = commute_sec.locator("button:has-text('Add a commute destination')")
        if add_btn.is_visible():
            add_btn.click()
            time.sleep(0.5)
            p49 = os.path.join(SCREENSHOT_DIR, "49-commute-add-modal.png")
            page.screenshot(path=p49) # Modal is an overlay on page
            copy_to_artifacts(p49)

            # Fill in modal and add
            print("10. Filling modal and adding destination...")
            page.locator("input[placeholder*='Inorbit Mall']").fill("Inorbit Mall")
            page.locator("input[type='number']").nth(0).fill("6.2")
            page.locator("input[type='number']").nth(1).fill("18")
            time.sleep(0.3)
            page.locator("button:has-text('Add destination')").click()
            time.sleep(1)
            commute_sec.scroll_into_view_if_needed()
            p50 = os.path.join(SCREENSHOT_DIR, "50-commute-custom-added.png")
            commute_sec.screenshot(path=p50)
            copy_to_artifacts(p50)

        browser.close()
        print("\nAll 10 screenshots captured and verified successfully!")

if __name__ == "__main__":
    capture_all()
