import sys
import os
import argparse
import time

# Completely disable Pillow's decompression bomb limit for high-res images
from PIL import Image, ImageOps
Image.MAX_IMAGE_PIXELS = None


def get_model_key(requested_model: str) -> str:
    """Map user-selected model option to rembg model session key."""
    m = (requested_model or "").lower().strip()
    if m in ("isnet", "hair", "detail"):
        return "isnet-general-use"
    return "birefnet-general"


def safe_remove_background(img: Image.Image, session, max_inference_dim: int = 4096) -> Image.Image:
    """
    Safely process images of any size (even 8K, 12K, 100MP+) without OOM or memory crashes.
    Normalizes color modes (CMYK, 16-bit, Palette) and applies high-precision Lanczos/Bicubic scaling.
    """
    import rembg
    
    # 1. Normalize image mode
    # If image is CMYK, Grayscale, Palette, or 16-bit: convert to standard 8-bit RGB or RGBA
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGBA" if "A" in img.mode else "RGB")
        
    orig_w, orig_h = img.size
    long_side = max(orig_w, orig_h)
    
    # If image is extremely large (> 4096px), avoid full-composite memory explosion
    # by computing the neural mask at 4096px (which is 4x the model's 1024px native resolution),
    # then upsampling the alpha mask back to original resolution and applying it.
    if long_side > max_inference_dim:
        scale = max_inference_dim / float(long_side)
        proc_w = int(round(orig_w * scale))
        proc_h = int(round(orig_h * scale))
        print(f"[PROGRESS:50] Smart-scaling high-res ({orig_w}x{orig_h} -> {proc_w}x{proc_h}) for safe inference...", flush=True)
        
        proc_img = img.resize((proc_w, proc_h), Image.Resampling.LANCZOS)
        mask = rembg.remove(proc_img, session=session, only_mask=True, post_process_mask=True)
        
        print(f"[PROGRESS:80] Upscaling precision alpha mask back to original {orig_w}x{orig_h}...", flush=True)
        full_mask = mask.resize((orig_w, orig_h), Image.Resampling.BICUBIC)
        
        result = img.convert("RGBA")
        result.putalpha(full_mask)
        return result
    else:
        print("[PROGRESS:50] Generating precision alpha mask...", flush=True)
        return rembg.remove(img, session=session, post_process_mask=True)


def main():
    parser = argparse.ArgumentParser(description="Kaycee Image Background Remover")
    parser.add_argument("-i", "--input", required=True, help="Input image file path")
    parser.add_argument("-o", "--output", required=True, help="Output PNG file path")
    parser.add_argument("-m", "--model", default="birefnet", help="AI Model choice (birefnet, isnet, fast)")
    
    args = parser.parse_args()
    
    input_path = os.path.abspath(args.input)
    output_path = os.path.abspath(args.output)
    
    if not os.path.isfile(input_path):
        sys.stderr.write(f"Input file not found: {input_path}\n")
        sys.exit(1)
        
    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
    
    print("[PROGRESS:15] Initializing AI Engine...", flush=True)
    
    model_name = get_model_key(args.model)
    
    try:
        import rembg
    except Exception as e:
        sys.stderr.write(f"Failed to load AI libraries: {e}\n")
        sys.exit(1)
        
    print(f"[PROGRESS:30] Loading AI Model ({model_name})...", flush=True)
    
    session = None
    try:
        session = rembg.new_session(model_name)
    except Exception as e:
        # Fallback cascade: isnet -> birefnet-general-lite -> u2net
        print(f"[WARN] Failed to load {model_name}: {e}. Trying fallback...", flush=True)
        fallbacks = ["isnet-general-use", "birefnet-general-lite", "u2net"]
        for fb in fallbacks:
            if fb == model_name:
                continue
            try:
                session = rembg.new_session(fb)
                model_name = fb
                print(f"[INFO] Using fallback model: {fb}", flush=True)
                break
            except Exception:
                continue
                
    if session is None:
        sys.stderr.write(f"Failed to initialize any AI background removal model.\n")
        sys.exit(1)
        
    try:
        with Image.open(input_path) as raw_img:
            # Handle EXIF orientation properly
            img = ImageOps.exif_transpose(raw_img)
            
            # Perform safe, high-resolution background removal
            cutout = safe_remove_background(img, session=session)
            
            print("[PROGRESS:90] Saving transparent PNG...", flush=True)
            cutout.save(output_path, format="PNG")
            
        print(f"[PROGRESS:100] Background removed successfully!", flush=True)
        print(f"[SUCCESS] {output_path}", flush=True)
        sys.exit(0)
    except Exception as e:
        sys.stderr.write(f"Background removal error: {e}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
