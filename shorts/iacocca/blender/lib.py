"""Blender helpers for the Iacocca short: PBR materials from Poly Haven (CC0) textures, simple modelling, glTF props, and
the 2.5D cast: a big soft-shaded white head with a drawn face, a bean-shaped suit, ink-black stick limbs, an inverted-hull
ink outline. Run inside Blender (bpy)."""
import bpy, math, os
from mathutils import Vector
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
PH_TEX = os.path.join(ROOT, "studio", "public", "assets", "polyhaven", "textures")
PH_HDRI = os.path.join(ROOT, "studio", "public", "assets", "polyhaven", "hdri")
PH_MOD = os.path.join(ROOT, "studio", "asset-library", "polyhaven-models")
GEN = os.path.join(os.path.dirname(__file__), "gen"); os.makedirs(GEN, exist_ok=True)

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

# ---------------- materials ----------------
def mat_color(name, rgb, rough=0.5, metal=0.0, emit=None, strength=0.0):
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1); b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    if emit: b.inputs["Emission Color"].default_value = (*emit, 1); b.inputs["Emission Strength"].default_value = strength
    return m
def hexrgb(h): h = h.lstrip("#"); return tuple((int(h[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4))
def mat_pbr(aid, scale=1.0, tint=None):
    """Poly Haven texture set (diff / nor_gl / rough, 2k or 1k) with box-projected object coords so no UVs are needed"""
    name = f"pbr_{aid}_{scale}"; m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; N = nt.nodes; Lk = nt.links; b = N["Principled BSDF"]
    tc = N.new("ShaderNodeTexCoord"); mp = N.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (scale, scale, scale); Lk.new(tc.outputs["Object"], mp.inputs["Vector"])
    d = os.path.join(PH_TEX, aid)
    def img(kind, colour):
        for res in ("2k", "1k"):
          for kk in ((kind, "nor_gl") if kind == "nor" else (kind,)):
            p = os.path.join(d, f"{aid}_{kk}_{res}.jpg")
            if not os.path.exists(p): p = os.path.join(d, f"{kk}.jpg")
            if os.path.exists(p):
                t = N.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(p, check_existing=True); t.projection = "BOX"; t.projection_blend = 0.2
                if not colour: t.image.colorspace_settings.name = "Non-Color"
                Lk.new(mp.outputs["Vector"], t.inputs["Vector"]); return t
    t = img("diff", True)
    if t:
        if tint: mix = N.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.blend_type = "MULTIPLY"; mix.inputs["Factor"].default_value = 1; mix.inputs[7].default_value = (*tint, 1); Lk.new(t.outputs["Color"], mix.inputs[6]); Lk.new(mix.outputs[2], b.inputs["Base Color"])
        else: Lk.new(t.outputs["Color"], b.inputs["Base Color"])
    elif tint: b.inputs["Base Color"].default_value = (*tint, 1)
    r = img("rough", False)
    if r: Lk.new(r.outputs["Color"], b.inputs["Roughness"])
    n = img("nor", False)
    if n: nm = N.new("ShaderNodeNormalMap"); nm.inputs["Strength"].default_value = 0.8; Lk.new(n.outputs["Color"], nm.inputs["Color"]); Lk.new(nm.outputs["Normal"], b.inputs["Normal"])
    return m
def mat_image(name, path, emit=0.0, alpha=False):
    m = bpy.data.materials.new(name); m.use_nodes = True; N = m.node_tree.nodes; Lk = m.node_tree.links; b = N["Principled BSDF"]
    t = N.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(path)
    Lk.new(t.outputs["Color"], b.inputs["Base Color"]); b.inputs["Roughness"].default_value = 0.6
    if emit: Lk.new(t.outputs["Color"], b.inputs["Emission Color"]); b.inputs["Emission Strength"].default_value = emit
    if alpha: Lk.new(t.outputs["Alpha"], b.inputs["Alpha"]); m.blend_method = "HASHED" if hasattr(m, "blend_method") else None
    return m
def mat_outline():
    """inverted-hull ink: black on back faces, invisible on front faces (Cycles and Eevee)"""
    m = bpy.data.materials.get("ink")
    if m: return m
    m = bpy.data.materials.new("ink"); m.use_nodes = True; nt = m.node_tree; N = nt.nodes; Lk = nt.links
    for n in list(N): N.remove(n)
    out = N.new("ShaderNodeOutputMaterial"); geo = N.new("ShaderNodeNewGeometry"); mix = N.new("ShaderNodeMixShader")
    tr = N.new("ShaderNodeBsdfTransparent"); em = N.new("ShaderNodeEmission"); em.inputs["Color"].default_value = (0.02, 0.012, 0.02, 1)
    Lk.new(geo.outputs["Backfacing"], mix.inputs["Fac"]); Lk.new(em.outputs[0], mix.inputs[1]); Lk.new(tr.outputs[0], mix.inputs[2]); Lk.new(mix.outputs[0], out.inputs["Surface"])
    return m

# ---------------- modelling ----------------
def link(o, coll=None): (coll or bpy.context.scene.collection).objects.link(o); return o
def box(name, x0, y0, z0, x1, y1, z1, mat, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(location=((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)); o = bpy.context.object; o.name = name
    o.scale = ((x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2); bpy.ops.object.transform_apply(scale=True)
    if bevel: md = o.modifiers.new("bev", "BEVEL"); md.width = bevel; md.segments = 3
    o.data.materials.append(mat); return o
def cyl(name, r0, r1, h, loc, mat, verts=32, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r0, radius2=r1, depth=h, location=loc, rotation=rot); o = bpy.context.object; o.name = name
    o.data.materials.append(mat); bpy.ops.object.shade_smooth(); return o
def plane(name, w, h, loc, rot, mat):
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot); o = bpy.context.object; o.name = name; o.scale = (w, h, 1)
    bpy.ops.object.transform_apply(scale=True); o.data.materials.append(mat); return o
def gltf(aid, loc, rot_z=0.0, scale=1.0):
    p = os.path.join(PH_MOD, aid, f"{aid}.gltf"); before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=p); new = [o for o in bpy.data.objects if o not in before]
    for o in new: o.animation_data_clear()
    roots = [o for o in new if o.parent is None]
    for r in roots: r.location = loc; r.rotation_euler = (0, 0, rot_z); r.scale = (scale, scale, scale)
    return roots
def tube(name, pts, r, mat):
    """an ink limb: a bevelled poly curve through pts"""
    cu = bpy.data.curves.new(name, "CURVE"); cu.dimensions = "3D"; cu.bevel_depth = r; cu.bevel_resolution = 4; cu.use_fill_caps = True
    sp = cu.splines.new("POLY"); sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts): sp.points[i].co = (*p, 1)
    o = bpy.data.objects.new(name, cu); o.data.materials.append(mat); return link(o)
def outline(o, t=0.012):
    """inverted hull as a separate object: the mesh pushed out along its normals with the normals flipped"""
    import bmesh
    c = o.copy(); c.data = o.data.copy(); c.name = o.name + "_ink"; c.modifiers.clear(); link(c)
    bm = bmesh.new(); bm.from_mesh(c.data); sx = max(o.scale) or 1
    for v in bm.verts: v.co += v.normal * (t / sx)
    bmesh.ops.reverse_faces(bm, faces=bm.faces); bm.to_mesh(c.data); bm.free()
    c.data.materials.clear(); c.data.materials.append(mat_outline())
    c.visible_shadow = c.visible_diffuse = c.visible_glossy = c.visible_transmission = c.visible_volume_scatter = False; return c

# ---------------- the 2.5D cast ----------------
INK = (40, 22, 40, 255)   # dark plum, the line colour of the whole cast

def face_png(key, eyes="dot", brow=0, mouth="flat", specs=False, blush=False, size=1024):
    """a stick-figure face: small dark eyes, short thick brows, a small mouth, drawn on a transparent square.
    The head's projection maps its width to ~0.68 of this square, centred."""
    p = os.path.join(GEN, f"face_{key}.png")
    S = size * 2; k = S / 1024; im = Image.new("RGBA", (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im); ink = INK; W = (255, 255, 255, 255)
    E = lambda x0, y0, x1, y1, **kw: d.ellipse([x0 * k, y0 * k, x1 * k, y1 * k], **kw)
    for sd in (-1, 1):
        ex, ey = 512 + sd * 140, 500
        if eyes == "dot": E(ex - 26, ey - 36, ex + 26, ey + 36, fill=ink)
        elif eyes == "lid":   # half-closed, unimpressed: a flat lid line over a half oval
            d.chord([(ex - 34) * k, (ey - 30) * k, (ex + 34) * k, (ey + 34) * k], 0, 180, fill=ink); d.line([(ex - 40) * k, ey * k, (ex + 40) * k, ey * k], fill=ink, width=int(14 * k))
        elif eyes == "wide": E(ex - 46, ey - 54, ex + 46, ey + 54, fill=W, outline=ink, width=int(12 * k)); E(ex - 18, ey - 18, ex + 18, ey + 18, fill=ink)
        elif eyes == "happy": d.arc([(ex - 40) * k, (ey - 20) * k, (ex + 40) * k, (ey + 40) * k], 200, 340, fill=ink, width=int(16 * k))
        if brow is not None:
            # brow > 0: angry (inner end low), < 0: worried (inner end high)
            yi, yo = ey - 92 + brow * 3, ey - 92 - brow * 1.5
            d.line([(ex - sd * 30) * k, yi * k, (ex + sd * 62) * k, yo * k], fill=ink, width=int(30 * k))
        if specs: E(ex - 62, ey - 56, ex + 62, ey + 56, outline=ink, width=int(10 * k))
        if blush: E(ex + sd * 20 - 40, ey + 70, ex + sd * 20 + 40, ey + 100, fill=(255, 150, 160, 120))
    if specs: d.line([474 * k, 494 * k, 550 * k, 494 * k], fill=ink, width=int(10 * k))
    mx, my = 512, 650
    if mouth == "flat": d.line([(mx - 38) * k, my * k, (mx + 38) * k, (my - 4) * k], fill=ink, width=int(16 * k))
    elif mouth == "frown": d.arc([(mx - 48) * k, my * k, (mx + 48) * k, (my + 60) * k], 200, 340, fill=ink, width=int(16 * k))
    elif mouth == "smile": d.arc([(mx - 50) * k, (my - 50) * k, (mx + 50) * k, (my + 20) * k], 20, 160, fill=ink, width=int(16 * k))
    elif mouth == "open": d.chord([(mx - 60) * k, (my - 40) * k, (mx + 60) * k, (my + 60) * k], 0, 180, fill=INK, outline=ink); d.chord([(mx - 34) * k, (my + 10) * k, (mx + 34) * k, (my + 54) * k], 0, 180, fill=(230, 110, 130, 255))
    elif mouth == "shout": E(mx - 46, my - 30, mx + 46, my + 60, fill=INK); E(mx - 28, my + 20, mx + 28, my + 54, fill=(230, 110, 130, 255))
    elif mouth == "O": E(mx - 26, my - 20, mx + 26, my + 40, fill=INK)
    im.resize((size, size), Image.LANCZOS).save(p); return p

def outfit_png(key, base, kind="suit", tie="#6a1a22", size=1024):
    """the front of the torso, projected the same way as the face: (u, v) = (x, z) of the pill's own coordinates"""
    p = os.path.join(GEN, f"outfit_{key}.png"); S = size * 2; k = S / 1024
    bc = tuple(int(base.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4)) + (255,)
    im = Image.new("RGBA", (S, S), bc); d = ImageDraw.Draw(im); ink = INK; W = (246, 244, 238, 255)
    L = lambda pts, w: d.line([(x * k, y * k) for x, y in pts], fill=ink, width=int(w * k))
    if kind == "suit":
        d.polygon([(380 * k, 90 * k), (644 * k, 90 * k), (512 * k, 600 * k)], fill=W)
        tc = tuple(int(tie.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4)) + (255,)
        d.polygon([(482 * k, 160 * k), (542 * k, 160 * k), (558 * k, 470 * k), (512 * k, 560 * k), (466 * k, 470 * k)], fill=tc, outline=ink)
        d.polygon([(470 * k, 100 * k), (554 * k, 100 * k), (542 * k, 165 * k), (482 * k, 165 * k)], fill=tc, outline=ink)
        lap = tuple(min(255, c + 28) for c in bc[:3]) + (255,)
        d.polygon([(380 * k, 90 * k), (300 * k, 300 * k), (400 * k, 330 * k), (512 * k, 600 * k)], fill=lap, outline=ink)
        d.polygon([(644 * k, 90 * k), (724 * k, 300 * k), (624 * k, 330 * k), (512 * k, 600 * k)], fill=lap, outline=ink)
        for y in (680, 800): d.ellipse([(545 - 15) * k, (y - 15) * k, (545 + 15) * k, (y + 15) * k], fill=ink)
        d.rectangle([640 * k, 420 * k, 740 * k, 432 * k], fill=ink); d.polygon([(652 * k, 420 * k), (672 * k, 380 * k), (696 * k, 420 * k)], fill=W)
    elif kind == "shirt":
        for y in (180, 380, 580): d.ellipse([(512 - 16) * k, (y - 16) * k, (512 + 16) * k, (y + 16) * k], fill=ink)
        d.rectangle([0, 820 * k, S, 870 * k], fill=(70, 46, 30, 255)); d.rectangle([480 * k, 812 * k, 544 * k, 878 * k], outline=(220, 180, 60, 255), width=int(10 * k))
    elif kind == "uniform":
        d.rectangle([0, 800 * k, S, 860 * k], fill=(30, 26, 30, 255)); L([(512, 0), (512, 800)], 6)
        for y in (200, 420, 640): d.ellipse([(560 - 14) * k, (y - 14) * k, (560 + 14) * k, (y + 14) * k], fill=(220, 180, 60, 255))
        d.polygon([(600 * k, 180 * k), (680 * k, 200 * k), (640 * k, 280 * k)], fill=(220, 180, 60, 255))
    im.resize((size, size), Image.LANCZOS).save(p); return p

def toon_mat(name, base_rgb, tex=None, mul=0.5, offz=0.5, front=-0.1, flat=0.55, mulz=None):
    """soft 2.5D look: a lit Principled mixed with a flat emission of the same colour (flat = how cartoon-flat it reads);
    an optional texture projected on the front from object coords (u = x*mul+0.5, v = z*mul+offz)"""
    m = bpy.data.materials.new(name); m.use_nodes = True; N = m.node_tree.nodes; Lk = m.node_tree.links
    out = N["Material Output"]; bs = N["Principled BSDF"]; bs.inputs["Roughness"].default_value = 0.6; bs.inputs["Specular IOR Level"].default_value = 0.25
    col = N.new("ShaderNodeRGB"); col.outputs[0].default_value = (*base_rgb, 1); cout = col.outputs[0]
    if tex:
        tc = N.new("ShaderNodeTexCoord"); sep = N.new("ShaderNodeSeparateXYZ"); Lk.new(tc.outputs["Object"], sep.inputs[0])
        def mad(inp, a, b):
            mm = N.new("ShaderNodeMath"); mm.operation = "MULTIPLY_ADD"; mm.inputs[1].default_value = a; mm.inputs[2].default_value = b; Lk.new(inp, mm.inputs[0]); return mm.outputs[0]
        cmb = N.new("ShaderNodeCombineXYZ"); Lk.new(mad(sep.outputs["X"], mul, 0.5), cmb.inputs["X"]); Lk.new(mad(sep.outputs["Z"], mulz or mul, offz), cmb.inputs["Y"])
        t = N.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(tex); t.extension = "CLIP"; t.interpolation = "Cubic"; Lk.new(cmb.outputs[0], t.inputs["Vector"])
        fr = N.new("ShaderNodeMath"); fr.operation = "LESS_THAN"; fr.inputs[1].default_value = front; Lk.new(sep.outputs["Y"], fr.inputs[0])
        a2 = N.new("ShaderNodeMath"); a2.operation = "MULTIPLY"; Lk.new(t.outputs["Alpha"], a2.inputs[0]); Lk.new(fr.outputs[0], a2.inputs[1])
        mx = N.new("ShaderNodeMix"); mx.data_type = "RGBA"; Lk.new(a2.outputs[0], mx.inputs["Factor"]); Lk.new(cout, mx.inputs[6]); Lk.new(t.outputs["Color"], mx.inputs[7]); cout = mx.outputs[2]
    Lk.new(cout, bs.inputs["Base Color"])
    em = N.new("ShaderNodeEmission"); em.inputs["Strength"].default_value = 0.35; Lk.new(cout, em.inputs["Color"])
    ms = N.new("ShaderNodeMixShader"); ms.inputs["Fac"].default_value = flat; Lk.new(bs.outputs[0], ms.inputs[1]); Lk.new(em.outputs[0], ms.inputs[2]); Lk.new(ms.outputs[0], out.inputs["Surface"])
    return m

def pill(name, rx, ry, rz, h):
    """a capsule: sphere halves pushed apart by h (in unit-sphere units), then scaled"""
    import bmesh
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=1); o = bpy.context.object; o.name = name
    bm = bmesh.new(); bm.from_mesh(o.data)
    for v in bm.verts: v.co.z += h if v.co.z > 1e-4 else (-h if v.co.z < -1e-4 else 0)
    bm.to_mesh(o.data); bm.free(); o.scale = (rx, ry, rz); bpy.ops.object.shade_smooth(); return o

def tri(name, pts, mat):
    me = bpy.data.meshes.new(name); me.from_pydata(pts, [], [list(range(len(pts)))]); o = bpy.data.objects.new(name, me); me.materials.append(mat); return link(o)

def person(name, loc, outfit="#1e1e24", kind="suit", tie="#6a1a22", hair="#cfcfcf", hairstyle="sides", face=None, height=1.0, coll=None,
           arm_r=None, arm_l=None, leg_r=None, leg_l=None, yaw=0.0, wide=1.0):
    """a 2.5D stick-figure at loc (feet), facing -Y. Big round white head (flattened front to back), a pill torso with the
    outfit drawn on it, ink-thin stick arms and long stick legs, dot hands, small flat feet, a plum ink outline.
    arm_*/leg_* are point lists relative to the shoulder / hip in metres (unscaled). Returns the root empty."""
    s = height; root = bpy.data.objects.new(name, None); link(root, coll); root.location = loc; root.rotation_euler = (0, 0, yaw)
    def par(o): o.parent = root; return o
    inkc = tuple((c / 255) ** 2.2 for c in INK[:3]); limb = mat_color("limb", inkc, rough=0.7)
    hip_z, top_z = 0.8 * s, 1.3 * s; head_z, hr = 1.56 * s, 0.25 * s; bw = 0.16 * s * wide
    # torso pill
    hh = ((top_z - hip_z) / 2 - bw) / bw
    t = par(pill(name + "_torso", bw, bw * 0.62, bw, hh)); t.location = (0, 0, (hip_z + top_z) / 2)
    ot = outfit_png(name, outfit, kind, tie); t.data.materials.append(toon_mat(name + "_outfit", hexrgb(outfit), ot, mul=0.5, mulz=0.5 / (1 + hh), offz=0.5, front=-0.2, flat=0.45))
    # head: a big flattened ball
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=1); h = par(bpy.context.object); h.name = name + "_head"; h.location = (0, 0, head_z)
    h.scale = (hr, hr * 0.7, hr * 1.04); bpy.ops.object.shade_smooth()
    h.data.materials.append(toon_mat(name + "_skin", (0.93, 0.92, 0.95), face, mul=0.34, offz=0.5, front=-0.2, flat=0.5))
    if hairstyle:
        import bmesh
        bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=1); c = par(bpy.context.object); c.name = name + "_hair"; c.location = (0, 0.01, head_z)
        c.scale = (hr * 1.04, hr * 0.74, hr * 1.08); bpy.ops.object.shade_smooth()
        bm = bmesh.new(); bm.from_mesh(c.data)
        wav = lambda v: 0.07 * math.sin(v.co.x * 14) + 0.04 * math.sin(v.co.x * 31 + 1)
        if hairstyle == "sides":   # grey tufts over the ears and round the back, bald on top
            kill = [v for v in bm.verts if v.co.z > 0.38 + wav(v) or v.co.z < -0.3 + wav(v) or (v.co.y < 0.1 and abs(v.co.x) < 0.82)]
        elif hairstyle == "slick":  # combed back: covers the crown down to a wavy hairline high on the forehead
            kill = [v for v in bm.verts if (v.co.y < -0.1 and v.co.z < 0.62 + wav(v)) or (v.co.y >= -0.1 and v.co.z < 0.05 + wav(v))]
        else:                       # cap with a fringe
            kill = [v for v in bm.verts if (v.co.y < -0.1 and v.co.z < 0.45 + wav(v) * 1.5) or (v.co.y >= -0.1 and v.co.z < -0.05)]
        for v in kill: bm.verts.remove(v)
        bm.to_mesh(c.data); bm.free(); c.data.materials.append(toon_mat(name + "_hairm", hexrgb(hair), flat=0.35))
        md = c.modifiers.new("thick", "SOLIDIFY"); md.thickness = 0.03; md.offset = 1.0
    outline(h, 0.02); outline(t, 0.018)
    # stick limbs: legs from the hip to the floor, arms from the top of the torso sides
    r = 0.012 * s
    for sd in (-1, 1):
        lp = (leg_r if sd > 0 else leg_l) or [(sd * 0.06, 0, 0), (sd * 0.07, 0, -0.4), (sd * 0.08, 0, -0.78)]
        pts = [(sd * 0.0 + p[0] * s, p[1] * s, hip_z + 0.04 * s + p[2] * s) for p in lp]; par(tube(f"{name}_leg{sd}", pts, r, limb))
        f = pts[-1]; bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=1, location=(f[0] + sd * 0.02 * s, f[1] - 0.03 * s, f[2] + 0.01 * s))
        ft = par(bpy.context.object); ft.scale = (0.05 * s, 0.035 * s, 0.014 * s); ft.data.materials.append(limb)
        ap = (arm_r if sd > 0 else arm_l) or [(0, 0, 0), (sd * 0.05, -0.01, -0.22), (sd * 0.06, -0.03, -0.42)]
        sx = sd * (bw - 0.01 * s); pts = [(sx + p[0] * s, p[1] * s, top_z - 0.1 * s + p[2] * s) for p in ap]; par(tube(f"{name}_arm{sd}", pts, r, limb))
        e = pts[-1]; bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=0.024 * s, location=e); par(bpy.context.object).data.materials.append(limb)
    return root
