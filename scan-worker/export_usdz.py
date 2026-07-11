# Blender headless: GLB -> USDZ (iOS AR Quick Look).
# Usage: blender -b --factory-startup -P export_usdz.py -- input.glb output.usdz
import sys
import bpy

argv = sys.argv[sys.argv.index("--") + 1:]
src, dst = argv[0], argv[1]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
bpy.ops.wm.usd_export(filepath=dst, export_materials=True, export_textures=True)
