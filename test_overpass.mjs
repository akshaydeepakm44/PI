const lat = 17.7944, lng = 83.3574;
const query = '[out:json][timeout:15];(node[" amenity\](around:3500,' + lat + ',' + lng + ');node[\shop\](around:3500,' + lat + ',' + lng + '););out 25;';
const endpoints = [
 'https://overpass.kumi.systems/api/interpreter',
 'https://api-overpass.openstreetmap.fr/api/interpreter',
 'https://overpass-api.de/api/interpreter'
];
for (const ep of endpoints) {
 try {
 const res = await fetch(ep, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/x-www-form-urlencoded',
 'User-Agent': 'HI-IN-Property-Platform/1.0'
 },
 body: 'data=' + encodeURIComponent(query)
 });
 const text = await res.text();
 if (text.startsWith('{')) {
 const data = JSON.parse(text);
 console.log(ep, 'SUCCESS. Elements:', data.elements?.length);
 const named = (data.elements || []).filter(e => e.tags?.name);
 named.slice(0, 5).forEach(e => console.log(' *', e.tags.name, e.lat, e.lon, e.tags.amenity || e.tags.shop));
 break;
 } else {
 console.log(ep, 'returned non-json:', text.slice(0, 80));
 }
 } catch(e) {
 console.log(ep, 'failed:', e.message);
 }
}
