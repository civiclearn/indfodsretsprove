import os
import json
from bs4 import BeautifulSoup
from urllib.parse import urlparse

BASE_DIR = "."
OUTPUT_FILE = "articles.json"

articles = []

for root, dirs, files in os.walk(BASE_DIR):
    if "index.html" not in files:
        continue

    index_path = os.path.join(root, "index.html")
    slug = os.path.basename(root)
    url = f"/artikler/{slug}/"

    with open(index_path, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "html.parser")

    # Title
    h1 = soup.find("h1")
    if h1:
        title = h1.get_text(strip=True)
    else:
        og_title = soup.find("meta", property="og:title")
        title = og_title["content"] if og_title else soup.title.get_text(strip=True)

    # Description
    desc_tag = soup.find("meta", attrs={"name": "description"})
    desc = desc_tag["content"] if desc_tag else ""

    # Image
    og_img = soup.find("meta", property="og:image")
    if not og_img:
        continue  # skip articles without image (or raise)

    img_url = og_img["content"]
    img_path = urlparse(img_url).path  # strip domain

    articles.append({
        "url": url,
        "title": title,
        "image": img_path,
        "desc": desc
    })

# Sort alphabetically by URL for stability
articles.sort(key=lambda x: x["url"])

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(articles, f, ensure_ascii=False, indent=2)

print(f"Generated {len(articles)} articles → {OUTPUT_FILE}")
