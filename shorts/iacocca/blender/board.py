"""Style test: the hook's boardroom. A real 3D room (Poly Haven CC0 woods, a glTF bookshelf and chair), a banker's lamp as
the key light, a dusk city through the window, and the 2.5D boss behind the desk raising one finger."""
import bpy, sys, os, math
sys.path.insert(0, os.path.dirname(__file__)); import lib; from lib import *
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else os.path.join(GEN, "board.png"); W, H = (int(argv[1]), int(argv[2])) if len(argv) > 2 else (540, 960); SPP = int(argv[3]) if len(argv) > 3 else 48; SHOT = argv[4] if len(argv) > 4 else 'close'
reset(); sc = bpy.context.scene
# ---- room 7 m wide, 6 m deep, 3.2 m high; camera looks +Y ----
wall = mat_pbr("dark_paneled_wood", 0.55); floorm = mat_pbr("dark_wooden_planks", 0.5); desk = mat_pbr("black_walnut_veneer_01", 0.7, tint=(0.42, 0.28, 0.2))
box("floor", -4, -4, -0.1, 4, 4, 0, floorm)
box("back", -4, 3.0, 0, -0.9, 3.2, 3.2, wall); box("back2", 0.9 + 1.4, 3.0, 0, 4, 3.2, 3.2, wall)   # window gap x -0.9..2.3
box("sill", -0.9, 3.0, 0, 2.3, 3.2, 0.9, wall); box("head", -0.9, 3.0, 2.6, 2.3, 3.2, 3.2, wall)
box("left", -3.6, -4, 0, -3.4, 3.2, 3.2, wall); box("ceil", -4, -4, 3.2, 4, 3.2, 3.4, mat_color("ceil", (0.08, 0.06, 0.05), rough=0.9))
# window: mullions and a dusk city plate far behind it
fr = mat_color("frame", (0.03, 0.025, 0.02), rough=0.4)
for x in (-0.9, 0.7, 2.3): box(f"mul{x}", x - 0.04, 3.02, 0.9, x + 0.04, 3.14, 2.6, fr)
box("tran", -0.9, 3.02, 1.72, 2.3, 3.14, 1.78, fr)
from PIL import Image, ImageDraw, ImageFilter
import random; random.seed(4); sky = Image.new("RGB", (1024, 768)); d = ImageDraw.Draw(sky)
for y in range(768):
    t = y / 767; c0, c1, c2 = (38, 30, 70), (210, 92, 60), (255, 170, 90)
    c = tuple(int(c0[i] + (c1[i] - c0[i]) * min(1, t / 0.7)) if t < 0.7 else int(c1[i] + (c2[i] - c1[i]) * (t - 0.7) / 0.3) for i in range(3)); d.line([(0, y), (1024, y)], fill=c)
for k in range(40):
    x = random.randint(-40, 1024); w = random.randint(40, 110); h = random.randint(150, 560); dk = random.randint(12, 26)
    d.rectangle([x, 768 - h, x + w, 768], fill=(dk, dk - 4, dk + 10))
    for wy in range(768 - h + 12, 760, 18):
        for wx in range(x + 6, x + w - 6, 14):
            if random.random() < 0.35: d.rectangle([wx, wy, wx + 6, wy + 8], fill=(255, 196, 110))
sky = sky.filter(ImageFilter.GaussianBlur(3)); skyp = os.path.join(GEN, "dusk_city.png"); sky.save(skyp)
plane("city", 9, 6.75, (0.7, 9, 2.4), (math.pi / 2, 0, 0), mat_image("citym", skyp, emit=2.2))
# ---- props ----
box("desk_top", -1.5, 0.2, 0.74, 1.5, 1.3, 0.8, desk, bevel=0.015); box("desk_front", -1.45, 0.24, 0.0, 1.45, 0.34, 0.74, desk, bevel=0.01)
for x in (-1.42, 1.42): box(f"desk_leg{x}", x - 0.05, 0.25, 0, x + 0.05, 1.25, 0.74, desk)
leather = mat_color("leather", (0.12, 0.03, 0.025), rough=0.45)
box("blotter", -0.55, 0.4, 0.8, 0.55, 0.95, 0.808, leather, bevel=0.004)
try: gltf("wooden_bookshelf_worn", (-2.6, 2.75, 0), 0, 1.25)
except Exception as e: print("shelf", e)
try: gltf("mid_century_lounge_chair", (2.9, 1.6, 0), -2.3, 1.0)
except Exception as e: print("chair", e)
# the boss's chair: a tall leather back behind him
box("chair_back", -0.42, 2.0, 0.5, 0.42, 2.16, 2.0, leather, bevel=0.05)
# banker's lamp: brass base and stem, green glass shade, a real bulb light inside
brass = mat_color("brass", (0.8, 0.55, 0.22), rough=0.25, metal=1.0); green = mat_color("shade", (0.02, 0.25, 0.08), rough=0.15, emit=(0.1, 0.9, 0.3), strength=0.6)
LX, LY = -0.5, 0.62
cyl("lamp_base", 0.11, 0.09, 0.03, (LX, LY, 0.815), brass); cyl("lamp_stem", 0.012, 0.012, 0.34, (LX, LY, 0.99), brass)
bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.1, depth=0.42, location=(LX, LY - 0.02, 1.18), rotation=(0, math.pi / 2, 0)); sh = bpy.context.object
bpy.ops.object.mode_set(mode="EDIT"); import bmesh; bm = bmesh.from_edit_mesh(sh.data); [bm.verts.remove(v) for v in [v for v in bm.verts if v.co.x > 0.02]]; bmesh.update_edit_mesh(sh.data); bpy.ops.object.mode_set(mode="OBJECT")
md = sh.modifiers.new("s", "SOLIDIFY"); md.thickness = 0.006; sh.data.materials.append(green); bpy.ops.object.shade_smooth()
bpy.ops.object.light_add(type="POINT", location=(LX, LY - 0.02, 1.12)); L = bpy.context.object.data; L.energy = 40; L.color = (1.0, 0.78, 0.5); L.shadow_soft_size = 0.06
# papers + a phone on the desk
paper = mat_color("paper", (0.85, 0.82, 0.74), rough=0.8)
for i, (x, y, r) in enumerate([(-0.25, 0.62, 0.1), (-0.05, 0.7, -0.2), (-1.0, 0.65, 0.4)]):
    plane(f"paper{i}", 0.21, 0.297, (x, y, 0.81 + i * 0.001), (0, 0, r), paper)
bak = mat_color("bakelite", (0.015, 0.015, 0.015), rough=0.25); box("phone", -1.25, 0.45, 0.8, -0.95, 0.68, 0.88, bak, bevel=0.03)
# nameplate, whiskey glass, ashtray with a cigar, folders, and a little red model coupe (his past, on the boss's desk)
box("plate", -0.28, 0.36, 0.808, 0.28, 0.42, 0.87, mat_color("plate_wood", (0.05, 0.02, 0.01), rough=0.3), bevel=0.006)
bpy.ops.object.text_add(location=(0, 0.355, 0.84), rotation=(math.pi / 2, 0, 0)); tx = bpy.context.object; tx.data.body = "CHAIRMAN"; tx.data.align_x = "CENTER"; tx.data.align_y = "CENTER"; tx.data.size = 0.05; tx.data.extrude = 0.002; tx.data.materials.append(brass)
glass = bpy.data.materials.new("glass"); glass.use_nodes = True; gb = glass.node_tree.nodes["Principled BSDF"]; gb.inputs["Transmission Weight"].default_value = 1; gb.inputs["Roughness"].default_value = 0.02; gb.inputs["IOR"].default_value = 1.45
cyl("tumbler", 0.045, 0.05, 0.1, (0.55, 0.5, 0.86), glass); cyl("whisky", 0.042, 0.046, 0.05, (0.55, 0.5, 0.835), mat_color("whisky", (0.55, 0.22, 0.04), rough=0.05))
cyl("ashtray", 0.09, 0.08, 0.03, (0.95, 0.65, 0.825), mat_color("ashglass", (0.15, 0.12, 0.1), rough=0.1, metal=0.3))
cyl("cigar", 0.012, 0.012, 0.16, (0.95, 0.6, 0.85), mat_color("cigar", (0.25, 0.12, 0.05), rough=0.8), rot=(math.pi / 2, 0, 0.4))
cyl("ember", 0.012, 0.012, 0.01, (0.92, 0.53, 0.85), mat_color("ember", (1, 0.3, 0.05), emit=(1, 0.35, 0.05), strength=8), rot=(math.pi / 2, 0, 0.4))
fold = mat_color("folder", (0.55, 0.42, 0.25), rough=0.8)
for i in range(4): box(f"folder{i}", -1.3 + i * 0.01, 0.75, 0.8 + i * 0.02, -0.9 + i * 0.01, 1.05, 0.818 + i * 0.02, fold)
red = mat_color("carpaint", (0.6, 0.02, 0.02), rough=0.15, metal=0.4); chrome = mat_color("chrome", (0.9, 0.9, 0.9), rough=0.05, metal=1)
box("car_body", 0.75, 1.0, 0.83, 1.15, 1.18, 0.88, red, bevel=0.02); box("car_cab", 0.86, 1.02, 0.88, 1.03, 1.16, 0.92, red, bevel=0.02)
for x in (0.83, 1.07):
    for y in (1.0, 1.18): cyl(f"wheel{x}{y}", 0.025, 0.025, 0.015, (x, y, 0.83), mat_color("tyre", (0.02, 0.02, 0.02), rough=0.7), rot=(math.pi / 2, 0, 0))
# ---- the boss (2.5D) behind the desk, right finger raised ----
fp = face_png("boss_cold", eyes="lid", brow=9, mouth="flat")
person("boss", (0, 1.55, 0), outfit="#23222a", kind="suit", tie="#7a1822", hair="#6c6c74", hairstyle="sides", face=fp, height=1.0,
       arm_r=[(0, 0, 0), (0.14, -0.06, -0.12), (0.2, -0.12, 0.1), (0.2, -0.14, 0.3)], arm_l=[(0, 0, 0), (-0.08, -0.16, -0.2), (0.02, -0.4, -0.28)])
if SHOT == "wide":   # the hero stands in front of the desk, shoulders up, glasses, a box of his things at his feet
    hf = face_png("hero_shock", eyes="wide", brow=-6, mouth="O", specs=True)
    person("hero", (0.45, -0.25, 0), outfit="#2b3550", kind="suit", tie="#1c2a4a", hair="#3a2a22", hairstyle="cap", face=hf, height=1.0, yaw=math.radians(-20),
           arm_r=[(0, 0, 0), (0.06, -0.02, -0.22), (0.05, -0.08, -0.4)], arm_l=[(0, 0, 0), (-0.06, -0.02, -0.22), (-0.04, -0.08, -0.4)],
           leg_r=[(0.06, 0, 0), (0.08, 0, -0.4), (0.1, 0, -0.8)], leg_l=[(-0.06, 0, 0), (-0.07, 0.02, -0.4), (-0.08, 0.04, -0.8)])
    try: gltf("cardboard_box_01", (0.95, -0.35, 0), 0.3, 0.9)
    except Exception as e: print("box", e)
# key: warm soft light from the lamp side, low, onto his face; the lamp itself sells it
bpy.ops.object.light_add(type="AREA", location=(-0.9, 0.2, 1.25)); K = bpy.context.object; K.data.energy = 70; K.data.color = (1.0, 0.72, 0.45); K.data.size = 0.5
K.rotation_euler = (Vector((0, 1.55, 1.55)) - K.location).to_track_quat("-Z", "Y").to_euler()
# rim: hot orange from behind-right, outlines the head against the dark panels
bpy.ops.object.light_add(type="AREA", location=(1.1, 2.6, 2.0)); Rm = bpy.context.object; Rm.data.energy = 120; Rm.data.color = (1.0, 0.55, 0.25); Rm.data.size = 0.6
Rm.rotation_euler = (Vector((0, 1.55, 1.5)) - Rm.location).to_track_quat("-Z", "Y").to_euler()
# fill + rim
bpy.ops.object.light_add(type="AREA", location=(0.7, 2.9, 2.0), rotation=(math.radians(-90 - 15), 0, 0)); R = bpy.context.object.data; R.energy = 260; R.color = (1.0, 0.55, 0.35); R.size = 3
bpy.ops.object.light_add(type="AREA", location=(-2.2, -2.5, 2.4)); F = bpy.context.object; F.data.energy = 60; F.data.color = (0.45, 0.55, 1.0); F.data.size = 3
F.rotation_euler = (math.radians(55), 0, math.radians(-40))
w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True; w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.01, 0.01, 0.02, 1); w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.3
# ---- camera: low, slight up-angle, the boss and the lamp framed, shallow focus ----
bpy.ops.object.camera_add(location=(0.2, -0.75, 1.36) if SHOT == "close" else (-0.25, -3.0, 1.1)); cam = bpy.context.object; sc.camera = cam
look = Vector((0.0, 1.5, 1.33)) if SHOT == "close" else Vector((0.3, 0.6, 1.0)); cam.rotation_euler = (look - cam.location).to_track_quat("-Z", "Y").to_euler()
cam.data.lens = 28; cam.data.sensor_width = 24; cam.data.dof.use_dof = True; cam.data.dof.focus_distance = (look - cam.location).length - 0.25 if SHOT == "close" else (Vector((0.45, -0.25, 1.2)) - cam.location).length; cam.data.dof.aperture_fstop = 2.2
sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = SPP; sc.cycles.use_denoising = True; sc.cycles.denoiser = "OPENIMAGEDENOISE"
sc.cycles.max_bounces = 6; sc.cycles.caustics_reflective = False; sc.cycles.caustics_refractive = False
sc.render.resolution_x, sc.render.resolution_y = W, H; sc.render.filepath = OUT
sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Punchy"
sc.render.film_transparent = False
sc.use_nodes = True; nt = sc.node_tree; rl = nt.nodes["Render Layers"]; comp = nt.nodes["Composite"]
gl = nt.nodes.new("CompositorNodeGlare"); gl.glare_type = "FOG_GLOW"; gl.quality = "HIGH"; gl.threshold = 0.9; gl.size = 7; gl.mix = -0.6
nt.links.new(rl.outputs["Image"], gl.inputs["Image"]); nt.links.new(gl.outputs["Image"], comp.inputs["Image"])
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(GEN, "board.blend"))
bpy.ops.render.render(write_still=True)
