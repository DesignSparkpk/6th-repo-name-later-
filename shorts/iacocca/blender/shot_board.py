"""Boardroom stills/test shots. usage: blender -b -P shot_board.py -- out.png W H SPP shot [haze]"""
import bpy, sys, os, math
sys.path.insert(0, os.path.dirname(__file__)); from lib import *; from sets import *
a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = a[0] if a else os.path.join(GEN, "b2.png"); W, H = (int(a[1]), int(a[2])) if len(a) > 2 else (540, 960); SPP = int(a[3]) if len(a) > 3 else 32
SHOT = a[4] if len(a) > 4 else "close"; HAZE = (a[5] != "0") if len(a) > 5 else True
reset(); sc = bpy.context.scene
A = build_boardroom()
world_hdri("shanghai_bund", strength_cam=0.9, strength_light=0.08, rot=math.radians(200))
# cast
person("boss", A["boss"], outfit="#25242c", kind="suit", tie="#7a1822", hair="#a8a8b0", hairstyle="slick",
       face=face_png("boss_cold", eyes="lid", brow=9, mouth="flat"),
       arm_r=[(0, 0, 0), (0.14, -0.06, -0.12), (0.2, -0.12, 0.1), (0.2, -0.14, 0.3)], arm_l=[(0, 0, 0), (-0.06, -0.14, -0.2), (0.04, -0.36, -0.3)])
if SHOT != "close":
    person("hero", A["visitor"], outfit="#2b3550", kind="suit", tie="#1c2a4a", hair="#3a2a22", hairstyle="slick",
           face=face_png("hero_shock", eyes="wide", brow=-6, mouth="O", specs=True), yaw=math.radians(-20),
           leg_r=[(0.06, 0, 0), (0.08, 0, -0.4), (0.1, 0, -0.8)], leg_l=[(-0.06, 0, 0), (-0.07, 0.02, -0.4), (-0.08, 0.04, -0.8)])
    prop("cardboard_box_01", (1.05, -0.55, 0), 0.3, 0.85)
# lights: the lamp + chandelier + sconces are practicals; a soft warm key from the lamp side, a cool moonlit fill from the windows, an orange rim
area((-1.0, 0.3, 1.7), (0, 1.65, 1.6), 45, (1.0, 0.72, 0.45), 0.6, "key")
area((0.0, 3.0, 2.6), (0, 0.5, 1.0), 220, (0.55, 0.65, 1.0), 3.5, "window_fill")
area((1.3, 2.7, 2.1), (0, 1.65, 1.5), 140, (1.0, 0.5, 0.22), 0.5, "rim")
area((0.5, -3.5, 2.6), (0, 1.0, 1.0), 70, (0.9, 0.85, 1.0), 4.0, "front_fill")
if HAZE: haze(-4.4, -4.5, 0, 4.4, 3.2, 3.4, density=0.006)
# camera
cams = {"close": ((0.2, -0.65, 1.38), (0.0, 1.6, 1.33), 28, 2.0),
        "wide": ((-0.45, -3.4, 1.25), (0.2, 0.8, 1.15), 24, 4.0),
        "est": ((-2.2, -4.2, 2.3), (0.3, 1.2, 1.0), 18, 8.0)}
pos, look, lens, fs = cams[SHOT]
bpy.ops.object.camera_add(location=pos); cam = bpy.context.object; sc.camera = cam; look = Vector(look)
cam.rotation_euler = (look - cam.location).to_track_quat("-Z", "Y").to_euler()
cam.data.lens = lens; cam.data.sensor_width = 24; cam.data.dof.use_dof = True; cam.data.dof.aperture_fstop = fs
foc = Vector(A["boss"]) + Vector((0, 0, 1.5)) if SHOT == "close" else Vector(A["visitor"]) + Vector((0, 0, 1.3))
cam.data.dof.focus_distance = (foc - cam.location).length
# render
sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = SPP; sc.cycles.use_denoising = True; sc.cycles.denoiser = "OPENIMAGEDENOISE"
sc.cycles.max_bounces = 6; sc.cycles.volume_bounces = 0; sc.cycles.volume_step_rate = 4; sc.cycles.caustics_reflective = sc.cycles.caustics_refractive = False
sc.cycles.light_sampling_threshold = 0.01; sc.render.resolution_x, sc.render.resolution_y = W, H; sc.render.filepath = OUT
sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Medium High Contrast"; sc.view_settings.exposure = 0.3
sc.use_nodes = True; nt = sc.node_tree; rl = nt.nodes["Render Layers"]; comp = nt.nodes["Composite"]
gl = nt.nodes.new("CompositorNodeGlare"); gl.glare_type = "FOG_GLOW"; gl.quality = "HIGH"; gl.threshold = 0.8; gl.size = 8; gl.mix = -0.55
lens_d = nt.nodes.new("CompositorNodeLensdist"); lens_d.inputs["Dispersion"].default_value = 0.012; lens_d.inputs["Distortion"].default_value = -0.01
ell = nt.nodes.new("CompositorNodeEllipseMask"); ell.width = 1.25; ell.height = 1.1
blur = nt.nodes.new("CompositorNodeBlur"); blur.size_x = blur.size_y = 200; blur.filter_type = "GAUSS"
vig = nt.nodes.new("CompositorNodeMixRGB"); vig.blend_type = "MULTIPLY"; vig.inputs[0].default_value = 0.45
nt.links.new(rl.outputs["Image"], gl.inputs["Image"]); nt.links.new(gl.outputs["Image"], lens_d.inputs["Image"])
nt.links.new(ell.outputs[0], blur.inputs[0]); nt.links.new(lens_d.outputs[0], vig.inputs[1]); nt.links.new(blur.outputs[0], vig.inputs[2]); nt.links.new(vig.outputs[0], comp.inputs["Image"])
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(GEN, f"board_{SHOT}.blend"))
bpy.ops.render.render(write_still=True)
