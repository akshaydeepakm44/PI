import os
import urllib.request

output_dir = "frontend/public/design"
os.makedirs(output_dir, exist_ok=True)

assets = [
    "buyer-1.jpeg",
    "buyer-2.jpeg",
    "buyer-3.jpeg",
    "buyer-4.jpeg",
    "clubhouse.jpeg",
    "entrance.jpeg",
    "garden.jpeg",
    "hero.jpeg",
    "project.jpeg",
    "master-plan.jpeg",
    "unit-2bhk.jpeg",
    "unit-3bhk-east.jpeg",
    "unit-3bhk-west.jpeg",
    "icon-automation.png",
    "icon-ev.png",
    "icon-games.png",
    "icon-gym.png",
    "icon-jogging.png",
    "icon-party.png",
    "icon-play.png",
    "icon-podium.png",
    "icon-pool.png",
    "icon-rainwater.png",
    "icon-recycle.png",
    "icon-security-story.png",
    "icon-smart.png",
    "icon-solar.png",
    "icon-sun-story.png",
    "icon-waste.png",
    "icon-water.png"
]

base_url = "https://portal-property.netlify.app/design/"

for asset in assets:
    target_path = os.path.join(output_dir, asset)
    remote_url = base_url + asset
    try:
        req = urllib.request.Request(remote_url, headers={'User-Agent': 'Mozilla/5.0'})
        data = urllib.request.urlopen(req, timeout=15).read()
        with open(target_path, "wb") as f:
            f.write(data)
        print(f"Downloaded: {asset} ({len(data)} bytes)")
    except Exception as e:
        print(f"Failed to download {asset}: {e}")

print("Assets download completed!")
