import urllib.request
import ssl
import os

ssl_context = ssl._create_unverified_context()

assets = {
    # Park3Med Cubemap (for Golden Hour / Outdoor Day reflection and ambient lighting)
    "public/textures/cube/park/px.jpg": "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/cube/Park3Med/px.jpg",
    "public/textures/cube/park/nx.jpg": "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/cube/Park3Med/nx.jpg",
    "public/textures/cube/park/py.jpg": "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/cube/Park3Med/py.jpg",
    "public/textures/cube/park/ny.jpg": "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/cube/Park3Med/ny.jpg",
    "public/textures/cube/park/pz.jpg": "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/cube/Park3Med/pz.jpg",
    "public/textures/cube/park/nz.jpg": "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/cube/Park3Med/nz.jpg",

    # Pisa Cubemap (for Paris / Bastille Architecture reflection)
    "public/textures/cube/pisa/px.png": "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/cube/pisa/px.png",
    "public/textures/cube/pisa/nx.png": "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/cube/pisa/nx.png",
    "public/textures/cube/pisa/py.png": "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/cube/pisa/py.png",
    "public/textures/cube/pisa/ny.png": "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/cube/pisa/ny.png",
    "public/textures/cube/pisa/pz.png": "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/cube/pisa/pz.png",
    "public/textures/cube/pisa/nz.png": "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/cube/pisa/nz.png",

    # PBR Material Maps
    "public/textures/pbr/brick_diffuse.jpg": "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/brick_diffuse.jpg",
    "public/textures/pbr/brick_bump.jpg": "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/brick_bump.jpg",
    "public/textures/pbr/brick_roughness.jpg": "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/brick_roughness.jpg",
    "public/textures/pbr/hardwood2_diffuse.jpg": "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/hardwood2_diffuse.jpg",
    "public/textures/pbr/hardwood2_bump.jpg": "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/hardwood2_bump.jpg",
    "public/textures/pbr/hardwood2_roughness.jpg": "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/hardwood2_roughness.jpg",
    "public/textures/pbr/FloorsCheckerboard_S_Diffuse.jpg": "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/floors/FloorsCheckerboard_S_Diffuse.jpg",
    "public/textures/pbr/FloorsCheckerboard_S_Normal.jpg": "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/floors/FloorsCheckerboard_S_Normal.jpg",
}

print(f"Starting download of {len(assets)} assets...")
for path, url in assets.items():
    if os.path.exists(path) and os.path.getsize(path) > 1000:
        print(f"Already downloaded: {path}")
        continue
    os.makedirs(os.path.dirname(path), exist_ok=True)
    try:
        print(f"Downloading {path} from {url}...")
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ssl_context) as response, open(path, 'wb') as out_file:
            out_file.write(response.read())
        print(f"✓ Saved {path} ({os.path.getsize(path)} bytes)")
    except Exception as e:
        print(f"✗ Failed {path}: {e}")

print("Download complete.")
