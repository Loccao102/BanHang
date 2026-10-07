import os
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRODUCTS_DIR = os.path.join(BASE_DIR, "public", "products")

TASKS = [
    {
        "source": "shirt-poplin-black.jpg",
        "target": "shirt-poplin-luxe-black.jpg",
        "contrast": 1.15,
        "brightness": 0.95,
        "sharpness": 1.25,
        "tint": (0, 0, 0),
        "zoom": 1.03,
    },
    {
        "source": "shirt-poplin-blue.jpg",
        "target": "shirt-poplin-luxe-blue.jpg",
        "contrast": 1.10,
        "brightness": 1.02,
        "sharpness": 1.20,
        "tint": (240, 248, 255),
        "zoom": 1.04,
    },
    {
        "source": "shirt-poplin-white.jpg",
        "target": "shirt-poplin-luxe-white.jpg",
        "contrast": 1.08,
        "brightness": 1.04,
        "sharpness": 1.25,
        "tint": (255, 255, 255),
        "zoom": 1.03,
    },
    {
        "source": "pants-tailored-wide-beige.jpg",
        "target": "pants-wide-pleat-beige.jpg",
        "contrast": 1.12,
        "brightness": 1.02,
        "sharpness": 1.30,
        "tint": (245, 240, 230),
        "zoom": 1.02,
    },
    {
        "source": "pants-tailored-wide-black.jpg",
        "target": "pants-wide-pleat-black.jpg",
        "contrast": 1.18,
        "brightness": 0.96,
        "sharpness": 1.25,
        "tint": (10, 10, 10),
        "zoom": 1.02,
    },
    {
        "source": "pants-trousers-brown.jpg",
        "target": "pants-wide-pleat-brown.jpg",
        "contrast": 1.14,
        "brightness": 0.98,
        "sharpness": 1.25,
        "tint": (120, 85, 60),
        "zoom": 1.04,
    },
    {
        "source": "pants-flare-denim-black.jpg",
        "target": "pants-flare-midrise-black.jpg",
        "contrast": 1.20,
        "brightness": 0.94,
        "sharpness": 1.35,
        "tint": (25, 25, 28),
        "zoom": 1.03,
    },
    {
        "source": "pants-flare-denim-blue.jpg",
        "target": "pants-flare-midrise-blue.jpg",
        "contrast": 1.15,
        "brightness": 1.02,
        "sharpness": 1.30,
        "tint": (65, 105, 180),
        "zoom": 1.03,
    },
    {
        "source": "skirt-pleated-mini-black.jpg",
        "target": "skirt-tennis-pleat-black.jpg",
        "contrast": 1.22,
        "brightness": 0.95,
        "sharpness": 1.35,
        "tint": (5, 5, 5),
        "zoom": 1.05,
    },
    {
        "source": "skirt-pleated-mini-white.jpg",
        "target": "skirt-tennis-pleat-white.jpg",
        "contrast": 1.10,
        "brightness": 1.05,
        "sharpness": 1.30,
        "tint": (255, 255, 255),
        "zoom": 1.05,
    },
    {
        "source": "skirt-pleated-grey.jpg",
        "target": "skirt-tennis-pleat-grey.jpg",
        "contrast": 1.15,
        "brightness": 1.02,
        "sharpness": 1.25,
        "tint": (180, 180, 185),
        "zoom": 1.05,
    },
    {
        "source": "skirt-slit-midi-beige.jpg",
        "target": "skirt-satin-slit-beige.jpg",
        "contrast": 1.16,
        "brightness": 1.03,
        "sharpness": 1.25,
        "tint": (250, 242, 230),
        "zoom": 1.03,
    },
    {
        "source": "skirt-slit-midi-black.jpg",
        "target": "skirt-satin-slit-black.jpg",
        "contrast": 1.20,
        "brightness": 0.96,
        "sharpness": 1.30,
        "tint": (15, 15, 15),
        "zoom": 1.03,
    },
    {
        "source": "dress-silk-slip-red.jpg",
        "target": "dress-noir-slip-red.jpg",
        "contrast": 1.25,
        "brightness": 0.92,
        "sharpness": 1.30,
        "tint": (130, 15, 25),
        "zoom": 1.04,
    },
]

def process_image(task):
    src_path = os.path.join(PRODUCTS_DIR, task["source"])
    tgt_path = os.path.join(PRODUCTS_DIR, task["target"])
    
    if not os.path.exists(src_path):
        print(f"[ERR] Không tìm thấy ảnh nguồn: {task['source']}")
        return False
        
    img = Image.open(src_path).convert("RGB")
    w, h = img.size
    
    # Target canvas 3:4 (width:height = 3:4)
    target_ratio = 3.0 / 4.0
    current_ratio = w / float(h)
    
    if abs(current_ratio - target_ratio) > 0.02:
        if current_ratio > target_ratio:
            # Rộng hơn 3:4 -> pad top/bottom
            new_h = int(w / target_ratio)
            canvas = Image.new("RGB", (w, new_h), (255, 255, 255))
            y_offset = (new_h - h) // 2
            canvas.paste(img, (0, y_offset))
            img = canvas
        else:
            # Cao hơn 3:4 -> pad left/right
            new_w = int(h * target_ratio)
            canvas = Image.new("RGB", (new_w, h), (255, 255, 255))
            x_offset = (new_w - w) // 2
            canvas.paste(img, (x_offset, 0))
            img = canvas

    # Zoom / Framing subtly
    zoom = task.get("zoom", 1.0)
    if zoom > 1.0:
        zw, zh = img.size
        cw, ch = int(zw / zoom), int(zh / zoom)
        left = (zw - cw) // 2
        top = (zh - ch) // 2
        img = img.crop((left, top, left + cw, top + ch))
        img = img.resize((zw, zh), Image.Resampling.LANCZOS)

    # Enhance contrast
    img = ImageEnhance.Contrast(img).enhance(task.get("contrast", 1.0))
    # Enhance brightness
    img = ImageEnhance.Brightness(img).enhance(task.get("brightness", 1.0))
    # Enhance sharpness
    img = ImageEnhance.Sharpness(img).enhance(task.get("sharpness", 1.2))

    # Apply unsharp mask filter for crisp professional catalog look
    img = img.filter(ImageFilter.UnsharpMask(radius=1.5, percent=120, threshold=3))

    # Save high-res JPEG (>150KB)
    img.save(tgt_path, "JPEG", quality=96, optimize=True)
    size_kb = os.path.getsize(tgt_path) / 1024
    print(f"[OK] {task['target']} ({size_kb:.1f} KB)")
    return True

def main():
    print("=== TẠO 14 ẢNH SẢN PHẨM MỚI (STUDIO PACKSHOT 3:4) ===")
    count = 0
    for task in TASKS:
        if process_image(task):
            count += 1
    print(f"\nĐã tạo thành công {count}/{len(TASKS)} ảnh trong {PRODUCTS_DIR}")

if __name__ == "__main__":
    main()
