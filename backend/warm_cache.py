import asyncio
import sys
import logging

logging.basicConfig(level=logging.INFO)
sys.path.append('.')

from app.database import SessionLocal
from app.models import Property
from app.routers.feature_intelligence import property_model_to_dict, db_feature_cache
from app.services.packet_builder import build_calculation_packet
from app.services.ai_feature_analyst import generate_feature_intelligence

async def warm_cache():
    db = SessionLocal()
    prop = db.query(Property).filter(Property.id == 1).first()
    p_dict = property_model_to_dict(prop)
    for mod in ['pricing', 'commute', 'master_plan']:
        print(f"Generating AI written intelligence for {mod}...")
        pkt = build_calculation_packet(p_dict, mod)
        res = await generate_feature_intelligence(p_dict, mod, property_id=1)
        briefing_snippet = res.get("briefing")[:80] if res.get("briefing") else "None"
        print(f"[{mod.upper()}] available={res.get('ai_summary_available')}, by={res.get('generated_by')}, briefing={briefing_snippet}")
        db_feature_cache.set(db, 1, mod, pkt, res)
    db.close()
    print("All modules successfully generated and cached!")

if __name__ == "__main__":
    asyncio.run(warm_cache())
