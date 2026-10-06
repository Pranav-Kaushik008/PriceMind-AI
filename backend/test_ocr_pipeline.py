from PIL import Image, ImageDraw
import io
from app.services.vision_service import analyze_image_bytes

# Create image with real price tags
img = Image.new('RGB', (800, 600), color=(240, 240, 240))
draw = ImageDraw.Draw(img)

# Product 1 with USD price
draw.rectangle([50, 50, 350, 450], outline=(0, 0, 0), width=4)
draw.text((80, 80), 'Smart TV Display', fill=(0, 0, 0))
draw.rectangle([70, 360, 280, 420], fill=(255, 230, 0), outline=(0, 0, 0))
draw.text((90, 380), '$599.99', fill=(0, 0, 0))

# Product 2 with INR price
draw.rectangle([420, 50, 720, 450], outline=(0, 0, 0), width=4)
draw.text((450, 80), 'Retail Soundbar', fill=(0, 0, 0))
draw.rectangle([440, 360, 660, 420], fill=(255, 230, 0), outline=(0, 0, 0))
draw.text((460, 380), '599.99', fill=(0, 0, 0))

buf = io.BytesIO()
img.save(buf, format='PNG')

res = analyze_image_bytes(buf.getvalue(), 'test_shelf_tags.png')
print('=== REAL PIPELINE (YOLO + EASYOCR) TEST RESULTS ===')
print('Status:', res.status)
print('Detected Objects:', res.detected_objects_count)
print('Detected Text Blocks:', res.detected_text_count)
print('\nExtracted OCR Text & Prices:')
for ocr in res.detected_text_and_prices:
    tag = '[PRICE TAG]' if ocr.is_price_tag else '[TEXT]'
    price_info = f'-> Normalized: {ocr.currency_symbol or ""}{ocr.extracted_price}' if ocr.is_price_tag else ''
    print(f' {tag} "{ocr.raw_text}" (Conf: {ocr.confidence:.2%}) {price_info}')
