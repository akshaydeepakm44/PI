import requests
import json

base_url = "http://127.0.0.1:8000/api/properties/1/feature-intelligence"

# 1. Advisor Read (General)
print("\n" + "="*35 + " ADVISOR READ (GENERAL) " + "="*35)
advisor_resp = requests.post(f"{base_url}/advisor", json={})
if advisor_resp.status_code == 200:
    adv = advisor_resp.json()
    print(f"Signature line: \"{adv.get('signature_line')}\"\n")
    print("What Matters Most (Top 3):")
    for idx, item in enumerate(adv.get("what_matters_most", [])):
        fam = item.get("family", "").upper()
        src = item.get("source", "")
        conf = item.get("confidence", 0)
        print(f"  {idx+1}. [{fam} | {src} | conf={conf}] {item.get('claim')}")
        print(f"     Why: {item.get('why')}")
        print(f"     Changes if: {item.get('changes_if')}")
    t = adv.get("tension", {})
    print(f"\nTension: {t.get('contrast')}")
    print(f"  Trade-off: {t.get('why')}")
    s = adv.get("settle_first", {})
    print(f"\nSettle First: {s.get('recommendation')}")
    print(f"  Priority action: {s.get('why')}")
    print("\nChecks You Can Make Now:")
    for chk in adv.get("checks_you_can_make_now", []):
        print(f"  - {chk}")
    print(f"\nEvidence Panel: {adv.get('where_this_comes_from')}")
    print(f"Footer Disclaimer: {adv.get('footer', {}).get('disclaimer')}")

# 2. Advisor Read (For You - School child + Oakridge International School)
print("\n" + "="*35 + " ADVISOR READ (FOR YOU) " + "="*35)
buyer_profile = {
    "household": {"adults": 2, "children": 1, "school_going": True},
    "places": [{"name": "Oakridge International School", "destination_type": "school"}],
    "priorities": ["commute time", "noise and air"]
}
advisor_for_you_resp = requests.post(f"{base_url}/advisor", json={"buyer_profile": buyer_profile})
if advisor_for_you_resp.status_code == 200:
    adv_fy = advisor_for_you_resp.json()
    print(f"Signature line: \"{adv_fy.get('signature_line')}\"\n")
    print("What Matters Most (Personalized):")
    for idx, item in enumerate(adv_fy.get("what_matters_most", [])):
        fam = item.get("family", "").upper()
        print(f"  {idx+1}. [{fam}] {item.get('claim')}")
        print(f"     For you: {item.get('for_you')}")

# 3. Section Intelligence
for module in ["standout", "liveability", "master_plan"]:
    print(f"\n{'='*30} MODULE: {module.upper()} {'='*30}")
    resp = requests.get(f"{base_url}?module={module}")
    if resp.status_code != 200:
        print(f"Failed with status: {resp.status_code}")
        continue
    data = resp.json()

    if module == "standout":
        print(f"Signature Line: {data.get('signature_line')}\n")
        print("Standouts (Top 3):")
        for st in data.get("standouts", []):
            print(f"  • [{st.get('peer_context')}] {st.get('claim')}")
            print(f"    Why: {st.get('why')}")
        ww = data.get("worth_weighing", {})
        print(f"\nWorth Weighing: {ww.get('claim')}")
        print(f"  Why: {ww.get('why')}")
    else:
        briefing = data.get("briefing")
        print(f"Briefing: {briefing}\n")
        print("Findings:")
        for f in data.get("findings", []):
            print(f"  • Claim: {f.get('claim')}")
            print(f"    Why: {f.get('why_it_follows')}")
