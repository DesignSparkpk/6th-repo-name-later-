"""Download the CC0 Poly Haven assets (polyhaven.com) the Iacocca Blender sets use. Idempotent; run before rendering:
python3 shorts/iacocca/blender/fetch.py   (from the repo root). Models -> studio/asset-library (gitignored), textures/HDRIs -> studio/public/assets/polyhaven."""
import json, os, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "studio"))
UA = {"User-Agent": "asset-fetch/1.0"}
MODELS = ["ArmChair_01", "ClassicConsole_01", "fancy_picture_frame_01", "fancy_picture_frame_02", "potted_plant_02", "potted_plant_04",
          "book_encyclopedia_set_01", "vintage_grandfather_clock_01", "marble_bust_01", "mantel_clock_01", "Chandelier_02", "tea_set_01",
          "wine_bottles_01", "drawer_cabinet", "Sofa_01", "wooden_bookshelf_worn", "mid_century_lounge_chair", "cardboard_box_01",
          "brass_candleholders", "modern_wooden_cabinet", "vintage_cabinet_01", "chess_set", "antique_ceramic_vase_01", "side_table_01",
          "hanging_picture_frame_02", "pachira_aquatica_01", "Shelf_01", "brass_vase_01", "vintage_telephone_wall_clock", "wall_clock"]
TEXTURES = ["dark_paneled_wood", "black_walnut_veneer_01", "fabric_pattern_07", "rusty_metal_02", "dark_wooden_planks", "marble_01",
            "herringbone_parquet", "rug_pattern_01" , "plaster_grey_04", "wood_cabinet_worn_long", "leather_red_02", "wood_floor_deck"]
HDRIS = ["shanghai_bund", "rooftop_night", "the_sky_is_on_fire", "modern_buildings_night"]
def get(u): return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=120).read()
def save(u, p):
    if os.path.exists(p): return
    os.makedirs(os.path.dirname(p), exist_ok=True); b = get(u); open(p + ".part", "wb").write(b); os.replace(p + ".part", p)
def files(a): return json.loads(get(f"https://api.polyhaven.com/files/{a}"))
def model(a):
    g = files(a)["gltf"]["1k"]["gltf"]; d = f"{ROOT}/asset-library/polyhaven-models/{a}"
    save(g["url"], f"{d}/{a}.gltf")
    for rel, inc in g.get("include", {}).items(): save(inc["url"], f"{d}/{rel}")
def tex(a):
    f = files(a)
    for k, n in (("Diffuse", "diff"), ("nor_gl", "nor"), ("Rough", "rough")):
        if k in f: save(f[k]["2k"]["jpg"]["url"], f"{ROOT}/public/assets/polyhaven/textures/{a}/{a}_{n}_2k.jpg")
def hdri(a): save(files(a)["hdri"]["2k"]["hdr"]["url"], f"{ROOT}/public/assets/polyhaven/hdri/{a}_2k.hdr")
def run(fn, a):
    try: fn(a); return None
    except Exception as e: return (a, str(e)[:80])
with ThreadPoolExecutor(8) as ex:
    bad = [r for r in ex.map(lambda x: run(*x), [(model, a) for a in MODELS] + [(tex, a) for a in TEXTURES] + [(hdri, a) for a in HDRIS]) if r]
print("failed:", bad)
