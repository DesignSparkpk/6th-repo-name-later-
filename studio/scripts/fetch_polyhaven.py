"""Download CC0 assets from Poly Haven (polyhaven.com, licence CC0) into public/assets/polyhaven/.
usage: python3 scripts/fetch_polyhaven.py [res=1k]   (run from studio/)
Models go to asset-library/ (big, not in git or public/; copy only what a video needs into public/). Textures: diffuse + normal (GL) + roughness JPGs. HDRIs: .hdr. Models: glTF with its textures."""
import json, os, sys, urllib.request

RES = sys.argv[1] if len(sys.argv) > 1 else "1k"
OUT = "public/assets/polyhaven"
TEXTURES = ["grass_path_2", "forest_ground_01", "cobblestone_01", "brown_planks_05", "dark_wooden_planks", "gravel", "coast_sand_01",
            "asphalt_02", "brick_4", "red_brick_03", "castle_brick_07", "clay_roof_tiles", "metal_plate", "rusty_metal_02",
            "blue_floor_tiles_01", "concrete_floor_02", "rock_wall_08", "aerial_rocks_02", "plastered_wall_04", "wood_table_001"]
HDRIS = ["kloofendal_48d_partly_cloudy_puresky", "kloofendal_43d_clear_puresky", "qwantani_sunset_puresky", "satara_night_no_lamps", "industrial_sunset_puresky"]
MODELS = ["grass_medium_01", "grass_medium_02", "grass_bermuda_01", "fern_02", "island_tree_01", "fir_tree_01", "coast_rocks_01",
          "dead_tree_trunk", "flower_gazania", "flower_ursinia", "barrel_03", "wooden_crate_02", "street_lamp_01", "bench_01", "wooden_table_02"]
UA = {"User-Agent": "asset-fetch/1.0"}

def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()

def save(url, path):
    if os.path.exists(path): return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "wb").write(get(url))

def files(aid):
    return json.loads(get(f"https://api.polyhaven.com/files/{aid}"))

ok, bad = [], []
for aid in TEXTURES:
    try:
        f = files(aid)
        for key, name in (("Diffuse", "diff"), ("nor_gl", "nor"), ("Rough", "rough")):
            if key in f and RES in f[key]: save(f[key][RES]["jpg"]["url"], f"{OUT}/textures/{aid}/{name}.jpg")
        ok.append(aid)
    except Exception as e: bad.append((aid, str(e)[:60]))
for aid in HDRIS:
    try: save(files(aid)["hdri"][RES]["hdr"]["url"], f"{OUT}/hdri/{aid}.hdr"); ok.append(aid)
    except Exception as e: bad.append((aid, str(e)[:60]))
for aid in MODELS:
    try:
        g = files(aid)["gltf"][RES]["gltf"]
        save(g["url"], f"asset-library/polyhaven-models/{aid}/{aid}.gltf")
        for rel, inc in g.get("include", {}).items(): save(inc["url"], f"asset-library/polyhaven-models/{aid}/{rel}")
        ok.append(aid)
    except Exception as e: bad.append((aid, str(e)[:60]))
open(f"{OUT}/LICENSE.txt", "w").write("All assets in this folder are from Poly Haven (https://polyhaven.com) and are CC0 (public domain).\n")
print("ok", len(ok), "failed", bad)
