import httpx

query = """[out:json][timeout:15];
(
  node(around:3000,17.7944,83.3574)["amenity"];
  node(around:3000,17.7944,83.3574)["shop"];
  node(around:3000,17.7944,83.3574)["highway"~"bus_stop"];
);
out center 40;
"""

endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
]

for ep in endpoints:
    try:
        r = httpx.post(ep, data={"data": query}, headers={"User-Agent": "HI-IN-Property-Directory/2.0"}, timeout=15.0)
        print(f"Endpoint: {ep} -> Status: {r.status_code}")
        if r.status_code == 200:
            elements = r.json().get("elements", [])
            print(f"  Got {len(elements)} elements!")
            for el in elements[:3]:
                tags = el.get("tags", {})
                print("   -", tags.get("name", "Unnamed"), f"({tags.get('amenity') or tags.get('shop') or tags.get('highway')})")
            break
    except Exception as e:
        print(f"Endpoint: {ep} -> Error: {e}")
