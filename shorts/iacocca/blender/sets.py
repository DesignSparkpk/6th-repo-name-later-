"""Sets for the Iacocca short, built from CC0 Poly Haven textures/models plus simple modelling. Each build_* makes one
place at the world origin and returns named anchors (where people stand, where props sit)."""
import bpy, math, os
from mathutils import Vector
from lib import *

def world_hdri(name, strength_cam=1.0, strength_light=0.15, rot=0.0):
    """the HDRI is what the camera sees through windows; it lights the room only a little (the practicals do that)"""
    w = bpy.data.worlds.new("w"); bpy.context.scene.world = w; w.use_nodes = True; N = w.node_tree.nodes; Lk = w.node_tree.links
    for n in list(N): N.remove(n)
    out = N.new("ShaderNodeOutputWorld"); env = N.new("ShaderNodeTexEnvironment")
    env.image = bpy.data.images.load(os.path.join(PH_HDRI, name + "_2k.hdr"))
    tc = N.new("ShaderNodeTexCoord"); mp = N.new("ShaderNodeMapping"); mp.inputs["Rotation"].default_value = (0, 0, rot)
    Lk.new(tc.outputs["Generated"], mp.inputs["Vector"]); Lk.new(mp.outputs["Vector"], env.inputs["Vector"])
    b1 = N.new("ShaderNodeBackground"); b1.inputs["Strength"].default_value = strength_light; b2 = N.new("ShaderNodeBackground"); b2.inputs["Strength"].default_value = strength_cam
    Lk.new(env.outputs[0], b1.inputs[0]); Lk.new(env.outputs[0], b2.inputs[0])
    lp = N.new("ShaderNodeLightPath"); mx = N.new("ShaderNodeMixShader"); Lk.new(lp.outputs["Is Camera Ray"], mx.inputs[0])
    Lk.new(b1.outputs[0], mx.inputs[1]); Lk.new(b2.outputs[0], mx.inputs[2]); Lk.new(mx.outputs[0], out.inputs["Surface"])

def area(loc, aim, energy, color, size, name="area"):
    bpy.ops.object.light_add(type="AREA", location=loc); o = bpy.context.object; o.name = name; o.data.energy = energy; o.data.color = color; o.data.size = size
    o.rotation_euler = (Vector(aim) - Vector(loc)).to_track_quat("-Z", "Y").to_euler(); return o
def point(loc, energy, color, radius=0.05, name="pt"):
    bpy.ops.object.light_add(type="POINT", location=loc); o = bpy.context.object; o.name = name; o.data.energy = energy; o.data.color = color; o.data.shadow_soft_size = radius; return o
def haze(x0, y0, z0, x1, y1, z1, density=0.012, color=(1.0, 0.85, 0.7)):
    bpy.ops.mesh.primitive_cube_add(location=((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)); o = bpy.context.object; o.name = "haze"
    o.scale = ((x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2)
    m = bpy.data.materials.new("haze"); m.use_nodes = True; N = m.node_tree.nodes; Lk = m.node_tree.links
    N.remove(N["Principled BSDF"]); v = N.new("ShaderNodeVolumePrincipled"); v.inputs["Density"].default_value = density; v.inputs["Color"].default_value = (*color, 1)
    Lk.new(v.outputs[0], N["Material Output"].inputs["Volume"]); o.data.materials.append(m)
    o.visible_shadow = False; return o
def prop(aid, loc, rz=0.0, s=1.0):
    try: return gltf(aid, loc, rz, s)
    except Exception as e: print("prop", aid, e); return []
def art_png(key, seed, kind="landscape"):
    """an oil-painting-like canvas for the frames (generated, no real artwork)"""
    from PIL import Image, ImageDraw, ImageFilter; import random
    p = os.path.join(GEN, f"art_{key}.png")
    if os.path.exists(p): return p
    r = random.Random(seed); W, H = 640, 480; im = Image.new("RGB", (W, H)); d = ImageDraw.Draw(im)
    top = (r.randint(120, 200), r.randint(90, 150), r.randint(60, 110)); hor = (r.randint(200, 240), r.randint(150, 200), r.randint(90, 140))
    for y in range(H):
        t = y / H; c = tuple(int(top[i] + (hor[i] - top[i]) * min(1, t * 1.6)) for i in range(3)); d.line([(0, y), (W, y)], fill=c)
    for k in range(5):   # hills
        base = H * (0.55 + 0.09 * k); col = tuple(int(c * (0.75 - 0.12 * k)) for c in (r.randint(60, 110), r.randint(80, 120), r.randint(50, 80)))
        pts = [(0, H)] + [(x, base - 50 * math.sin(x / (90 + 30 * k) + r.random() * 6) - r.random() * 20) for x in range(0, W + 40, 40)] + [(W, H)]
        d.polygon(pts, fill=col)
    im = im.filter(ImageFilter.GaussianBlur(2.2))
    px = im.load()
    for _ in range(9000):   # brush texture
        x, y = r.randrange(W), r.randrange(H); c = px[x, y]; dd = r.randint(-14, 14); d.line([(x, y), (x + r.randint(3, 9), y + r.randint(-2, 2))], fill=tuple(max(0, min(255, v + dd)) for v in c), width=2)
    im.save(p); return p

def rug_png(key="rug", seed=2):
    """a generated oriental-style rug: border bands, a field of small motifs, a central medallion"""
    from PIL import Image, ImageDraw, ImageFilter; import random
    p = os.path.join(GEN, f"{key}.png")
    if os.path.exists(p): return p
    r = random.Random(seed); W, H = 1400, 1000; im = Image.new("RGB", (W, H), (110, 18, 22)); d = ImageDraw.Draw(im)
    navy, gold, cream, red2 = (22, 28, 58), (196, 150, 70), (226, 210, 176), (150, 32, 30)
    for i, (m, c) in enumerate([(0, navy), (40, gold), (52, navy), (120, gold), (132, red2)]): d.rectangle([m, m, W - m, H - m], fill=c)
    for x in range(70, W - 70, 44):
        for y in (78, H - 78): d.polygon([(x, y - 14), (x + 14, y), (x, y + 14), (x - 14, y)], fill=cream)
    for y in range(70, H - 70, 44):
        for x in (78, W - 78): d.polygon([(x, y - 14), (x + 14, y), (x, y + 14), (x - 14, y)], fill=cream)
    for x in range(180, W - 150, 70):
        for y in range(180, H - 150, 70):
            c = r.choice([navy, gold, cream, (60, 90, 70)]); d.polygon([(x, y - 12), (x + 12, y), (x, y + 12), (x - 12, y)], fill=c); d.ellipse([x - 4, y - 4, x + 4, y + 4], fill=red2)
    cx, cy = W // 2, H // 2
    for k, c in enumerate([navy, gold, red2, cream, navy, gold]):
        rr = 300 - k * 48; d.polygon([(cx, cy - rr * 0.75), (cx + rr, cy), (cx, cy + rr * 0.75), (cx - rr, cy)], fill=c)
    im = im.filter(ImageFilter.GaussianBlur(2.0)); from PIL import ImageEnhance; im = ImageEnhance.Color(im).enhance(0.75); px = im.load()
    for _ in range(120000):   # pile noise
        x, y = r.randrange(W), r.randrange(H); c = px[x, y]; dd = r.randint(-18, 10); px[x, y] = tuple(max(0, min(255, v + dd)) for v in c)
    im.save(p); return p
def mat_generated(name, path, rough=0.9, bump=None):
    m = bpy.data.materials.new(name); m.use_nodes = True; N = m.node_tree.nodes; Lk = m.node_tree.links; b = N["Principled BSDF"]
    tc = N.new("ShaderNodeTexCoord"); t = N.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(path); Lk.new(tc.outputs["Generated"], t.inputs["Vector"])
    Lk.new(t.outputs["Color"], b.inputs["Base Color"]); b.inputs["Roughness"].default_value = rough
    if bump:
        n = N.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = bump; bp = N.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.25
        Lk.new(n.outputs["Fac"], bp.inputs["Height"]); Lk.new(bp.outputs["Normal"], b.inputs["Normal"])
    return m

def build_boardroom():
    """A wood-panelled corner office at night, 9 m wide, 7 m deep, 3.4 m high. Camera side is -Y; the window wall is +Y (y=3.2).
    The desk stands at y~1.0, the chairman behind it at y~1.6, a visitor in front at y~-0.3."""
    panel = mat_pbr("dark_paneled_wood", 0.6, tint=(0.75, 0.62, 0.55)); walnut = mat_pbr("black_walnut_veneer_01", 0.8, tint=(0.5, 0.34, 0.24))
    parquet = mat_pbr("herringbone_parquet", 0.45, tint=(0.62, 0.48, 0.38)); plaster = mat_pbr("plaster_grey_04", 0.5, tint=(0.62, 0.55, 0.5))
    rug = mat_generated("rug", rug_png(), 0.95, bump=900); leather = mat_pbr("leather_red_02", 2.0, tint=(0.075, 0.012, 0.008))
    brass = mat_color("brass", (0.8, 0.55, 0.22), rough=0.28, metal=1.0); frame = mat_color("winframe", (0.035, 0.028, 0.022), rough=0.35)
    box("floor", -5, -5, -0.1, 5, 4, 0, parquet)
    box("rug", -1.9, -0.9, 0.0, 1.9, 1.9, 0.012, rug)
    # back wall: three tall windows between panelled piers
    X = [(-4.5, -2.75), (-1.35, -0.65), (0.65, 1.35), (2.75, 4.5)]
    green_wall = mat_pbr("plaster_grey_04", 0.6, tint=(0.05, 0.1, 0.075))
    for i, (a, b) in enumerate(X): box(f"pier{i}", a, 3.2, 0, b, 3.45, 3.4, green_wall); box(f"wains{i}", a, 3.16, 0, b, 3.2, 1.1, panel); box(f"rail{i}", a, 3.12, 1.08, b, 3.2, 1.14, walnut, bevel=0.01)
    for a, b in ((-2.75, -1.35), (-0.65, 0.65), (1.35, 2.75)):
        box(f"sill{a}", a, 3.2, 0, b, 3.45, 0.55, panel); box(f"head{a}", a, 3.2, 2.85, b, 3.45, 3.4, panel)
        box(f"stool{a}", a - 0.03, 3.08, 0.55, b + 0.03, 3.25, 0.6, walnut, bevel=0.01)
        for x in (a, b): box(f"mull{a}{x}", x - 0.035, 3.3, 0.55, x + 0.035, 3.38, 2.85, frame)
        box(f"tran{a}", a, 3.3, 2.15, b, 3.38, 2.2, frame); box(f"mid{a}", (a + b) / 2 - 0.02, 3.3, 0.55, (a + b) / 2 + 0.02, 3.38, 2.85, frame)
    # side walls and a coffered ceiling with a crown moulding
    box("wallL", -4.6, -5, 0, -4.4, 3.45, 3.4, green_wall); box("wallR", 4.4, -5, 0, 4.6, 3.45, 3.4, green_wall)
    box("wainsL", -4.4, -5, 0, -4.36, 3.2, 1.1, panel); box("wainsR", 4.36, -5, 0, 4.4, 3.2, 1.1, panel)
    box("railL", -4.4, -5, 1.08, -4.32, 3.2, 1.14, walnut, bevel=0.01); box("railR", 4.32, -5, 1.08, 4.4, 3.2, 1.14, walnut, bevel=0.01)
    box("crownB", -4.5, 3.05, 3.28, 4.5, 3.2, 3.4, walnut, bevel=0.02)
    box("ceil", -5, -5, 3.4, 5, 3.6, 3.7, plaster)
    for x in (-3.0, -1.0, 1.0, 3.0): box(f"beamx{x}", x - 0.08, -5, 3.22, x + 0.08, 3.4, 3.4, walnut)
    for y in (-3.0, -1.0, 1.0, 3.05): box(f"beamy{y}", -4.5, y - 0.08, 3.22, 4.5, y + 0.08, 3.4, walnut)
    box("baseB", -4.5, 3.12, 0, 4.5, 3.2, 0.14, walnut); box("baseL", -4.4, -5, 0, -4.32, 3.2, 0.14, walnut); box("baseR", 4.32, -5, 0, 4.4, 3.2, 0.14, walnut)
    # wall pieces: bookshelves, clock, cabinets, bust, plants, paintings
    prop("wooden_bookshelf_worn", (-3.6, 2.9, 0), 0, 1.15); prop("wooden_bookshelf_worn", (-4.15, 1.2, 0), -math.pi / 2, 1.15)
    for k in range(4): prop("book_encyclopedia_set_01", (-3.95 + k * 0.2, 2.85, 1.05 + 0.0), math.pi / 2, 1.0)
    prop("vintage_grandfather_clock_01", (-4.1, -0.4, 0.12), -math.pi / 2, 1.0)
    prop("vintage_cabinet_01", (3.65, 2.95, 0.34), 0, 0.95)
    prop("modern_wooden_cabinet", (4.1, 0.6, 0), math.pi / 2, 0.9)
    prop("marble_bust_01", (4.15, 0.25, 0.61), math.pi / 2 + 0.4, 1.0); prop("brass_vase_01", (4.15, 1.15, 0.61), 0, 0.8)
    prop("pachira_aquatica_01", (-2.2, 2.75, 0), 0.4, 1.0); prop("potted_plant_02", (2.15, 2.85, 0.6), 0, 0.9)
    prop("ArmChair_01", (-2.6, 0.6, 0), 0.9, 1.0); prop("side_table_01", (-2.9, -0.2, 0), 0, 1.0); prop("wine_bottles_01", (-2.95, -0.2, 0.55), 0, 1.0)
    for i, (x, y, rz, s, seed) in enumerate([(-4.38, -1.9, -math.pi / 2, 1.5, 3), (4.38, -1.6, math.pi / 2, 1.5, 7)]):
        roots = prop("fancy_picture_frame_02", (x, y, 1.85), rz, s)
        canvas = plane(f"canvas{i}", 0.44 * s, 0.6 * s, (x + (0.012 if x < 0 else -0.012), y, 1.85), (math.pi / 2, 0, rz), mat_image(f"art{i}", art_png(str(i), seed)))
    # the chandelier over the desk
    prop("Chandelier_02", (0, 1.0, 2.35), 0, 1.15)
    for a in range(6):
        point((0.33 * math.cos(a * math.pi / 3), 1.0 + 0.33 * math.sin(a * math.pi / 3), 2.68), 6, (1.0, 0.72, 0.42), 0.03, "chand")
    # the chairman's desk: walnut, panelled front, leather top inlay, brass pulls
    box("desk_top", -1.25, 0.55, 0.74, 1.25, 1.45, 0.79, walnut, bevel=0.012)
    box("desk_inlay", -1.05, 0.68, 0.79, 1.05, 1.32, 0.794, leather, bevel=0.002)
    box("desk_front", -1.2, 0.6, 0.06, 1.2, 0.7, 0.74, walnut, bevel=0.006)
    for x in (-0.75, 0.0, 0.75):
        box(f"desk_panel{x}", x - 0.3, 0.585, 0.16, x + 0.3, 0.6, 0.62, walnut, bevel=0.01)
        cyl(f"pull{x}", 0.012, 0.012, 0.12, (x, 0.575, 0.66), brass, rot=(0, math.pi / 2, 0))
    box("desk_plinth", -1.22, 0.62, 0, 1.22, 1.43, 0.06, walnut)
    for x in (-1.2, 1.2): box(f"desk_side{x}", x - 0.05, 0.6, 0.06, x + 0.05, 1.43, 0.74, walnut, bevel=0.006)
    # behind him: a tall wingback in red leather
    for o in [box("chair_seat", -0.38, 1.85, 0.0, 0.38, 2.35, 0.48, leather, bevel=0.06), box("chair_back", -0.4, 2.2, 0.4, 0.4, 2.42, 1.75, leather, bevel=0.1)] + \
            [box(f"chair_wing{sd}", sd * 0.4 - 0.08, 1.95, 0.48, sd * 0.4 + 0.08, 2.4, 1.1, leather, bevel=0.06) for sd in (-1, 1)]:
        o.modifiers["bev"].segments = 8; o.modifiers["bev"].limit_method = "NONE"; bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.shade_smooth_by_angle(angle=0.6)
    for z in (0.62, 0.9, 1.18, 1.46):
        for x in (-0.24, 0.0, 0.24): cyl(f"tuft{x}{z}", 0.012, 0.012, 0.01, (x, 2.195, z), brass, rot=(math.pi / 2, 0, 0))
    # the banker's lamp: brass base and stem, green glass shade, a real bulb
    green = mat_color("lampshade", (0.02, 0.28, 0.1), rough=0.12, emit=(0.15, 1.0, 0.35), strength=0.9)
    LX, LY = -0.78, 0.98
    cyl("lamp_base", 0.1, 0.085, 0.03, (LX, LY, 0.809), brass); cyl("lamp_stem", 0.011, 0.011, 0.33, (LX, LY, 0.97), brass)
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.1, depth=0.4, location=(LX, LY - 0.02, 1.16), rotation=(0, math.pi / 2, 0)); sh = bpy.context.object; sh.name = "lamp_shade"
    import bmesh; bm = bmesh.new(); bm.from_mesh(sh.data); [bm.verts.remove(v) for v in [v for v in bm.verts if v.co.x > 0.02]]; bm.to_mesh(sh.data); bm.free()
    md = sh.modifiers.new("s", "SOLIDIFY"); md.thickness = 0.006; sh.data.materials.append(green); bpy.ops.object.shade_smooth()
    bulb = point((LX, LY - 0.02, 1.1), 35, (1.0, 0.74, 0.45), 0.04, "lamp_bulb")
    # desk dressing
    paper = mat_color("paper", (0.5, 0.48, 0.43), rough=0.85)
    for i, (x, y, r) in enumerate([(-0.25, 0.85, 0.12), (-0.05, 0.92, -0.18), (0.25, 1.1, 0.5)]): plane(f"paper{i}", 0.21, 0.297, (x, y, 0.795 + i * 0.0015), (0, 0, r), paper)
    box("plate", -0.26, 0.6, 0.79, 0.26, 0.66, 0.85, mat_color("plate_wood", (0.04, 0.018, 0.01), rough=0.3), bevel=0.005)
    bpy.ops.object.text_add(location=(0, 0.597, 0.82), rotation=(math.pi / 2, 0, 0)); tx = bpy.context.object; tx.data.body = "CHAIRMAN"
    tx.data.align_x = "CENTER"; tx.data.align_y = "CENTER"; tx.data.size = 0.045; tx.data.extrude = 0.002; tx.data.materials.append(brass)
    prop("mantel_clock_01", (0.85, 1.25, 0.79), -0.3, 1.0); prop("tea_set_01", (0.7, 0.85, 0.79), 0.4, 0.8)
    glass = bpy.data.materials.new("glass"); glass.use_nodes = True; gb = glass.node_tree.nodes["Principled BSDF"]; gb.inputs["Transmission Weight"].default_value = 1; gb.inputs["Roughness"].default_value = 0.03
    cyl("tumbler", 0.04, 0.045, 0.09, (0.45, 0.78, 0.835), glass); cyl("whisky", 0.037, 0.041, 0.045, (0.45, 0.78, 0.814), mat_color("whisky", (0.5, 0.2, 0.03), rough=0.05))
    # a little red model coupe on the desk (generic, no badges)
    red = mat_color("carpaint", (0.55, 0.02, 0.02), rough=0.12, metal=0.5)
    box("car_body", 0.55, 1.15, 0.80, 0.95, 1.33, 0.85, red, bevel=0.02); box("car_cab", 0.66, 1.18, 0.85, 0.83, 1.3, 0.89, red, bevel=0.02)
    for x in (0.63, 0.87):
        for y in (1.15, 1.33): cyl(f"wheel{x}{y}", 0.025, 0.025, 0.014, (x, y, 0.815), mat_color("tyre", (0.02, 0.02, 0.02), rough=0.7), rot=(math.pi / 2, 0, 0))
    # sconces on the piers, practical light
    for x in (-2.05, 2.05):
        pass
    for x in (-1.0, 1.0):
        cyl(f"sconce{x}", 0.06, 0.09, 0.14, (x, 3.12, 2.35), mat_color("sconce_shade", (0.95, 0.85, 0.65), rough=0.6, emit=(1.0, 0.75, 0.45), strength=3.0))
        point((x, 3.0, 2.3), 18, (1.0, 0.7, 0.4), 0.05, "sconce")
    return {"boss": (0, 1.65, 0), "visitor": (0.45, -0.3, 0), "lamp": (LX, LY, 1.1), "bulb": bulb, "desk_z": 0.79}
