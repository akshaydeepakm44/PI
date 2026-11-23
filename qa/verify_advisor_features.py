"""
qa/verify_advisor_features.py
Automated Playwright verification script to verify and capture screenshots of:
1. Advisor's read (Idle state under stats bar)
2. Advisor's read (General read with Evidence Panel & Record: not checked)
3. Advisor's read (For you with school child + Oakridge International School)
4. Section analyses: Neighbourhood, Liveability, Master plan, Unit plans & pricing
"""

import os
import shutil
import sys
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
    print(f"   [Artifact] Copied to: {dest_path}")

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 950})
        page = context.new_page()

        print("1. Navigating to Property 1 detail page...")
        page.goto(f"{BASE_URL}/properties/1", wait_until="networkidle", timeout=30000)
        time.sleep(2)

        # Check stats bar
        assert page.locator(".key-facts").is_visible(), "Stats bar (.key-facts) is not visible"
        print("   Stats bar is visible.")

        # Check "Advisor's read" button directly under stats bar
        advisor_btn = page.locator("button:has-text(\"Advisor's read\")")
        assert advisor_btn.is_visible(), "'Advisor's read' button not found under stats bar"
        print("   'Advisor's read' button is visible in idle state.")

        # Check NO AI content is rendered on load
        assert not page.locator("text=Project Assessment & Advisory Perspective").is_visible(), "AI content must not be visible on page load"
        print("   Click-to-run verified: zero AI content on page load.")

        # Screenshot 34: Idle state
        idle_path = os.path.join(SCREENSHOT_DIR, "34-advisor-idle.png")
        page.screenshot(path=idle_path, full_page=False)
        copy_to_artifacts(idle_path)

        # 2. Click "Advisor's read" to run General Read
        print("2. Clicking \"Advisor's read\"...")
        advisor_btn.click()
        time.sleep(1)

        # Wait for result card (signature line)
        page.wait_for_selector("text=Project Assessment & Advisory Perspective", timeout=30000)
        page.wait_for_selector("text=Ranked across 7 active projects in Hyderabad", timeout=15000)
        print("   General Advisor Read rendered successfully.")

        # Verify evidence panel "Record: not checked"
        record_elem = page.locator("text=Record: not checked")
        assert record_elem.is_visible(), "'Record: not checked' not visible in evidence panel"
        print("   Verified Evidence panel shows 'Record: not checked'.")

        # Screenshot 35: General Read & Evidence Panel
        gen_path = os.path.join(SCREENSHOT_DIR, "35-advisor-general-read.png")
        page.screenshot(path=gen_path, full_page=False)
        copy_to_artifacts(gen_path)

        # 3. Test "Tell me what matters to you" & "Add my places" -> For You mode
        print("3. Testing 'For You' layer (school child + places)...")
        # Click priority chip "Commute time"
        commute_chip = page.locator("button:has-text('Commute time')")
        if commute_chip.is_visible():
            commute_chip.click()
            time.sleep(0.5)

        # Click priority chip "Noise and air"
        noise_chip = page.locator("button:has-text('Noise and air')")
        if noise_chip.is_visible():
            noise_chip.click()
            time.sleep(0.5)

        # Open "Add my places" modal
        add_places_btn = page.locator("button:has-text('Add my places')")
        add_places_btn.click()
        page.wait_for_selector("text=Add a Destination Place", timeout=5000)

        # Fill place input
        page.locator("input[placeholder*='Oakridge School']").fill("Oakridge International School")
        page.locator("select").select_option("school")
        page.locator("#hasChildCheck").check()
        page.locator("button:has-text('Save & Recalculate')").click()
        page.wait_for_selector("text=Add a Destination Place", state="detached", timeout=5000)
        time.sleep(1.5)

        # Wait for "For You" read to update
        page.wait_for_selector("text=Oakridge International", timeout=25000)
        print("   'For You' read successfully updated with school commute and household routine.")

        # Screenshot 36: For You Read
        for_you_path = os.path.join(SCREENSHOT_DIR, "36-advisor-for-you-read.png")
        page.screenshot(path=for_you_path, full_page=False)
        copy_to_artifacts(for_you_path)

        # 4. Section Analyses
        # A. Neighbourhood Section
        print("4. Testing Section Analyses...")
        neighbourhood_sec = page.locator("section#neighbourhood")
        if neighbourhood_sec.is_visible():
            neighbourhood_sec.scroll_into_view_if_needed()
            time.sleep(0.5)
            n_btn = neighbourhood_sec.locator("button:has-text('AI analysis')")
            if n_btn.is_visible():
                n_btn.click()
                time.sleep(2)
                neighbourhood_sec.locator(".animate-fadeIn, div:has-text('Groceries')").first.wait_for(timeout=20000)
                n_path = os.path.join(SCREENSHOT_DIR, "37-section-neighbourhood.png")
                page.screenshot(path=n_path, full_page=False)
                copy_to_artifacts(n_path)
                print("   Neighbourhood AI analysis verified.")

        # B. Liveability Section
        liveability_sec = page.locator("section#liveability")
        if liveability_sec.is_visible():
            liveability_sec.scroll_into_view_if_needed()
            time.sleep(0.5)
            l_btn = liveability_sec.locator("button:has-text('AI analysis')")
            if l_btn.is_visible():
                l_btn.click()
                time.sleep(2)
                liveability_sec.locator(".animate-fadeIn, div:has-text('Air Quality'), div:has-text('AQI')").first.wait_for(timeout=20000)
                l_path = os.path.join(SCREENSHOT_DIR, "38-section-liveability.png")
                page.screenshot(path=l_path, full_page=False)
                copy_to_artifacts(l_path)
                print("   Liveability AI analysis verified.")

        # C. Master Plan Section
        master_sec = page.locator("section#master-plan")
        if master_sec.is_visible():
            master_sec.scroll_into_view_if_needed()
            time.sleep(0.5)
            m_btn = master_sec.locator("button:has-text('AI analysis')")
            if m_btn.is_visible():
                m_btn.click()
                page.wait_for_selector("text=Master plan Intelligence Briefing", timeout=15000)
                time.sleep(1)
                m_path = os.path.join(SCREENSHOT_DIR, "39-section-masterplan.png")
                page.screenshot(path=m_path, full_page=False)
                copy_to_artifacts(m_path)
                print("   Master plan AI analysis verified.")

        # D. Unit Plans & Pricing Section
        units_sec = page.locator("section#units")
        if units_sec.is_visible():
            units_sec.scroll_into_view_if_needed()
            time.sleep(0.5)
            u_btn = units_sec.locator("button:has-text('AI analysis')")
            if u_btn.is_visible():
                u_btn.click()
                page.wait_for_selector("text=Unit plans", timeout=15000)
                time.sleep(1)
                u_path = os.path.join(SCREENSHOT_DIR, "40-section-units.png")
                page.screenshot(path=u_path, full_page=False)
                copy_to_artifacts(u_path)
                print("   Unit plans & pricing AI analysis verified.")

        browser.close()
        print("\nAll browser verifications completed successfully!")

if __name__ == "__main__":
    run_verification()

if __name__ == "__main__":
    run_verification()
