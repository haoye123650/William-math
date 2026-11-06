#!/usr/bin/env python3
"""Extract Reading Explorer 3 student-book lessons into structured JSON + images.

Reads the split Unit A/B PDFs (not video) and writes:
  src/content/english/re3/catalog.json
  src/content/english/re3/unit-XX/{a|b}.json
  public/english/re3/unit-XX/{a|b}/*.jpg

Usage:
  RE3_PDF_DIR=/path/to/pdfs python3 scripts/extract_re3.py
"""

from __future__ import annotations

import html
import json
import os
import re
import sys
from pathlib import Path

import pymupdf
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PDF_DIR = Path(os.environ.get("RE3_PDF_DIR", "/tmp/re3/pdfs"))
CONTENT_DIR = ROOT / "src" / "content" / "english" / "re3"
PUBLIC_DIR = ROOT / "public" / "english" / "re3"
KEYS_PATH = Path(os.environ.get("RE3_KEYS", ROOT / "scripts" / "re3_keys.json"))

# Titles and skills follow RE3_English_上架规格.md. Video lessons are omitted.
UNITS = [
    {
        "unit": 1,
        "theme": "Sports and Fitness",
        "themeZh": "运动与体能",
        "bookPages": "7–22",
        "lessons": {
            "a": ("The World’s Game", "Analyzing Infographics (1)"),
            "b": ("What Makes an Olympic Champion?", "Scanning for Specific Information"),
        },
    },
    {
        "unit": 2,
        "theme": "Skin Deep",
        "themeZh": "美与皮肤",
        "bookPages": "23–38",
        "lessons": {
            "a": ("What Is Beauty?", "Analyzing a Writer’s Claims"),
            "b": ("Skin: The Body’s Canvas", "Summarizing the Main Idea of Paragraphs"),
        },
    },
    {
        "unit": 3,
        "theme": "Animals in Danger",
        "themeZh": "濒危动物",
        "bookPages": "39–56",
        "lessons": {
            "a": ("Racing to Rescue Koalas", "Determining the Meaning of Unfamiliar Words"),
            "b": ("Tracking the Snow Leopard", "Annotating a Reading Passage"),
        },
    },
    {
        "unit": 4,
        "theme": "Violent Earth",
        "themeZh": "剧烈大地",
        "bookPages": "57–72",
        "lessons": {
            "a": ("Sacred Summits", "Summarizing a Text"),
            "b": ("Is Prediction Possible?", "Analyzing Infographics (2)"),
        },
    },
    {
        "unit": 5,
        "theme": "Islands and Beaches",
        "themeZh": "岛屿与海滩",
        "bookPages": "73–88",
        "lessons": {
            "a": ("Land of Fire and Ice", "Summarizing Details on a Map"),
            "b": ("The Perfect Beach", "Identifying a Writer’s Point of View"),
        },
    },
    {
        "unit": 6,
        "theme": "Global Addictions",
        "themeZh": "全球成瘾",
        "bookPages": "89–104",
        "lessons": {
            "a": ("The World’s Favorite Drug", "Identifying Pros and Cons (1)"),
            "b": ("Addicted to Distraction", "Understanding Transitions"),
        },
    },
    {
        "unit": 7,
        "theme": "Energy Solutions",
        "themeZh": "能源方案",
        "bookPages": "105–120",
        "lessons": {
            "a": ("Powering the Planet", "Identifying Pros and Cons (2)"),
            "b": ("City of the Future?", "Identifying an Author’s Opinion"),
        },
    },
    {
        "unit": 8,
        "theme": "Epic Engineering",
        "themeZh": "宏伟工程",
        "bookPages": "121–136",
        "lessons": {
            "a": ("China’s Grand Canal", "Understanding Vocabulary: Compound Words"),
            "b": ("Highway of Dreams", "Inferring Information (1)"),
        },
    },
    {
        "unit": 9,
        "theme": "High-Tech Solutions",
        "themeZh": "高科技方案",
        "bookPages": "137–152",
        "lessons": {
            "a": ("The Power of Virtual Reality", "Applying Information from a Text"),
            "b": ("High-Flying Helpers", "Recognizing Text Coherence"),
        },
    },
    {
        "unit": 10,
        "theme": "All in the Mind",
        "themeZh": "心智之内",
        "bookPages": "153–168",
        "lessons": {
            "a": ("What’s on Your Mind?", "Identifying Text Organization"),
            "b": ("Inside Animal Minds", "Recognizing Lexical Cohesion (1)"),
        },
    },
    {
        "unit": 11,
        "theme": "Visual Pioneers",
        "themeZh": "视觉先驱",
        "bookPages": "169–186",
        "lessons": {
            "a": ("Van Gogh’s World", "Inferring Information (2)"),
            "b": ("Seeing the Light", "Recognizing Lexical Cohesion (2)"),
        },
    },
    {
        "unit": 12,
        "theme": "Far Out",
        "themeZh": "遥不可及",
        "bookPages": "187–202",
        "lessons": {
            "a": ("Defying Gravity", "Understanding Vocabulary: Phrasal Verbs"),
            "b": ("The Ultimate Trip", "Understanding Appositives"),
        },
    },
]

BANNERS = {
    "WARM UP": "warmup",
    "BEFORE YOU READ": "before-you-read",
    "READING COMPREHENSION": "reading-comprehension",
    "READING SKILL": "reading-skill",
    "VOCABULARY PRACTICE": "vocabulary",
}

PARA_RE = re.compile(
    r"paragraphs?\s+([A-Z](?:\s*(?:,|and|&|–|-|through)\s*[A-Z])*)",
    re.I,
)
TASK_RE = re.compile(r"^([A-Z])\.\s+(\S.*)$")
NUM_RE = re.compile(r"^(\d+)(?:\.\s+|\.\s*|\s+)(\S.*)$")
CHOICE_RE = re.compile(r"^([a-h])\.\s+(\S.*)$")
CHOICE_FIND = re.compile(r"(?:^|[^A-Za-z])([a-h])\.\s+([^•·]+)")
TF_RE = re.compile(r"^(T|F|NG|True|False)(\s+(T|F|NG|True|False))*$", re.I)
SLASH_RE = re.compile(r"([A-Za-z][A-Za-z’'\-]*)\s*/\s*([A-Za-z][A-Za-z’'\-]*)")


def clean(text: str) -> str:
    text = text.replace("\u00ad", "").replace("\u200b", "").replace("\x07", "")
    text = text.replace("\t", " ").replace("\u00a0", " ").replace("\u2003", " ")
    text = text.replace("\u2002", " ").replace("\u2009", " ")
    text = re.sub(r"[ ]{2,}", " ", text)
    return text.strip()


def rgb(color: int) -> tuple[int, int, int]:
    return ((color >> 16) & 255, (color >> 8) & 255, color & 255)


def is_red(color: int) -> bool:
    r, g, b = rgb(color)
    return r > 140 and r > g * 1.6 and r > b * 1.6


def is_blue_label(color: int) -> bool:
    r, g, b = rgb(color)
    return b > 80 and b > r and g < 160 and r < 80


def esc(text: str) -> str:
    return html.escape(text, quote=False)


def span_html(span: dict) -> str:
    raw = span["text"].replace("\u00ad", "")
    if not raw:
        return ""
    stripped = raw.strip()
    if span["size"] <= 8.6 and stripped.isdigit():
        return f"<sup>{esc(stripped)}</sup>"
    piece = esc(raw)
    font = span["font"]
    if "Black" in font or "Bold" in font and "Palatino" in font or is_red(span["color"]):
        if "Palatino" in font:
            piece = f"<strong>{piece}</strong>"
    if "Italic" in font or font.endswith("Ita") or "Ita" in font:
        piece = f"<em>{piece}</em>"
    return piece


def line_plain(spans: list[dict]) -> str:
    parts: list[str] = []
    prev_x1 = None
    for span in spans:
        text = re.sub(r" {3,}", " ____ ", span["text"])
        if prev_x1 is not None and span["bbox"][0] - prev_x1 > 16 and text.strip():
            parts.append(" ____ ")
        parts.append(text)
        prev_x1 = span["bbox"][2]
    return clean("".join(parts))


def line_html(spans: list[dict]) -> str:
    parts: list[str] = []
    prev_x1 = None
    for span in spans:
        if prev_x1 is not None and span["bbox"][0] - prev_x1 > 16 and span["text"].strip():
            parts.append(" ____ ")
        parts.append(span_html(span))
        prev_x1 = span["bbox"][2]
    glued = "".join(parts)
    glued = re.sub(r"[ ]{2,}", " ", glued).strip()
    return glued


def extract_page_lines(page: pymupdf.Page) -> list[dict]:
    lines: list[dict] = []
    data = page.get_text("dict")
    for block in data["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            spans = []
            for span in line["spans"]:
                if not span["text"]:
                    continue
                spans.append(
                    {
                        "text": span["text"],
                        "size": span["size"],
                        "font": span["font"],
                        "color": span["color"],
                        "bbox": span["bbox"],
                        "flags": span["flags"],
                    }
                )
            if not spans:
                continue
            spans.sort(key=lambda s: s["bbox"][0])
            x0, y0, x1, y1 = line["bbox"]
            text = line_plain(spans)
            if not text:
                continue
            font = spans[0]["font"]
            size = max(s["size"] for s in spans)
            lines.append(
                {
                    "text": text,
                    "html": line_html(spans),
                    "x": x0,
                    "y": y0,
                    "x1": x1,
                    "y1": y1,
                    "size": size,
                    "font": font,
                    "color": spans[0]["color"],
                    "spans": spans,
                    "page": page.number,
                }
            )
    lines.sort(key=lambda ln: (ln["y"], ln["x"]))
    return lines


def is_footer(ln: dict, height: float) -> bool:
    text = ln["text"]
    if re.fullmatch(r"(?:\d+\s+)?Unit\s+\d+[AB]?(?:\s+\d+)?", text):
        return True
    if ln["y"] > height - 34:
        return True
    if re.fullmatch(r"\d{1,3}", text) and ln["size"] <= 12 and (ln["y"] > height - 60 or ln["y"] < 28):
        return True
    return False


def banner_of(ln: dict) -> str | None:
    token = clean(ln["text"]).upper()
    if token in BANNERS and ln["size"] >= 11:
        return BANNERS[token]
    return None


def is_para_marker(ln: dict) -> str | None:
    if ln["text"] in list("ABCDEFGHIJKLMNOPQRSTUVWXYZ") and "Cn" in ln["font"] and 8 <= ln["size"] <= 11.5:
        if "Light" in ln["font"] or ln["size"] <= 10.2:
            return ln["text"]
    return None


def is_skill_label(ln: dict) -> bool:
    if ln["x"] > 140 or ln["size"] > 11 or "Cn" not in ln["font"]:
        return False
    text = ln["text"]
    if len(text) < 3 or len(text) > 28:
        return False
    letters = re.sub(r"[^A-Za-z]", "", text)
    return bool(letters) and letters.upper() == letters


def is_body(ln: dict) -> bool:
    """Passage copy is set in Palatino. A single highlighted word does not make an exercise line body copy."""
    if is_para_marker(ln) or ln["size"] < 10.4:
        return False
    if "Palatino" in ln["font"] and "Bold" in ln["font"] and ln["size"] >= 13:
        return False
    pal_chars = 0
    other_chars = 0
    for span in ln["spans"]:
        count = len(span["text"].strip())
        if count == 0 or span["size"] < 10:
            continue
        if "Palatino" in span["font"]:
            pal_chars += count
        else:
            other_chars += count
    if pal_chars == 0 or other_chars > pal_chars:
        return False
    return True


def is_footnote(ln: dict) -> bool:
    if ln["size"] > 9.3:
        return False
    return any("Palatino" in span["font"] for span in ln["spans"]) or bool(re.match(r"^\d+\s", ln["text"]))


def is_heading(ln: dict) -> bool:
    if is_footnote(ln) or is_para_marker(ln) or is_skill_label(ln) or banner_of(ln):
        return False
    if not (13 <= ln["size"] <= 22):
        return False
    if "Bold" not in ln["font"] and "Palatino" not in ln["font"] and "Geograph" not in ln["font"]:
        return False
    return 3 <= len(ln["text"]) <= 80


def cluster_rows(lines: list[dict], tol: float = 3.4) -> list[list[dict]]:
    rows: list[list[dict]] = []
    for ln in sorted(lines, key=lambda item: (item["y"], item["x"])):
        if rows and abs(ln["y"] - rows[-1][0]["y"]) <= tol:
            rows[-1].append(ln)
        else:
            rows.append([ln])
    for row in rows:
        row.sort(key=lambda item: item["x"])
    return rows


def page_number(lines: list[dict], height: float) -> str | None:
    for ln in lines:
        if ln["y"] < height - 42:
            continue
        match = re.search(r"(\d{1,3})\s*$", ln["text"])
        if match:
            return match.group(1)
        if re.fullmatch(r"\d{1,3}", ln["text"]):
            return ln["text"]
    return None


def save_jpeg(pix: pymupdf.Pixmap, dest: Path, max_edge: int = 1500, quality: int = 78) -> None:
    if pix.colorspace is None or pix.n not in (1, 3) or pix.alpha:
        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
    if pix.n not in (1, 3):
        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
    dest.parent.mkdir(parents=True, exist_ok=True)
    mode = "RGB" if pix.n == 3 else "L"
    image = Image.frombytes(mode, (pix.width, pix.height), pix.samples)
    image = image.convert("RGB")
    image.thumbnail((max_edge, max_edge))
    image.save(dest, "JPEG", quality=quality, optimize=True)


def image_bbox(page: pymupdf.Page, xref: int) -> pymupdf.Rect | None:
    rects = []
    for block in page.get_text("dict")["blocks"]:
        if block.get("type") != 1:
            continue
        if block.get("xref") == xref or True:
            rect = pymupdf.Rect(block["bbox"])
            if rect.width > 40 and rect.height > 40:
                rects.append(rect)
    # Prefer get_image_rects when available.
    try:
        found = page.get_image_rects(xref)
        if found:
            return max(found, key=lambda rect: rect.width * rect.height)
    except Exception:
        pass
    if not rects:
        return None
    return max(rects, key=lambda rect: rect.width * rect.height)


def caption_near(lines: list[dict], rect: pymupdf.Rect) -> str:
    """Bold textbook captions. Full-bleed placements ignore the image rectangle."""
    candidates = []
    for ln in lines:
        if is_footer(ln, 900) or is_body(ln) or banner_of(ln) or is_para_marker(ln) or is_skill_label(ln):
            continue
        if "?" in ln["text"] or re.match(r"^\d+\.", ln["text"]):
            continue
        if re.search(r"\b(true|false|passage|choose|answer|question)\b", ln["text"], re.I):
            continue
        if "Bold" not in ln["font"] or not (8.4 <= ln["size"] <= 11.2):
            continue
        if len(ln["text"]) < 8 or len(ln["text"]) > 110:
            continue
        candidates.append(ln)
    if not candidates:
        return ""
    full_bleed = rect.width > 480 or rect.height > 620
    if not full_bleed:
        near = [
            ln
            for ln in candidates
            if rect.y1 - 20 <= ln["y"] <= rect.y1 + 56 and ln["x"] < rect.x1 + 30 and ln["x1"] > rect.x0 - 40
        ]
        if near:
            candidates = near
    candidates.sort(key=lambda ln: (ln["y"], ln["x"]))
    groups: list[list[dict]] = []
    for ln in candidates:
        if groups and ln["y"] - groups[-1][-1]["y"] < 16 and abs(ln["x"] - groups[-1][-1]["x"]) < 40:
            groups[-1].append(ln)
        else:
            groups.append([ln])
    groups.sort(key=lambda group: len(clean(" ".join(ln["text"] for ln in group))), reverse=True)
    return clean(" ".join(ln["text"] for ln in groups[0][:5]))


def extract_assets(doc: pymupdf.Document, page_infos: list[dict], out_dir: Path, public_prefix: str) -> list[dict]:
    assets: list[dict] = []
    seen: set[int] = set()
    for info in page_infos:
        page: pymupdf.Page = info["page"]
        if info["figure"]:
            clip = pymupdf.Rect(12, 8, page.rect.width - 12, page.rect.height - 30)
            pix = page.get_pixmap(matrix=pymupdf.Matrix(1.85, 1.85), clip=clip, alpha=False)
            asset_id = f"figure-{info['index'] + 1}"
            filename = f"{asset_id}.jpg"
            save_jpeg(pix, out_dir / filename, max_edge=1600, quality=84)
            title = info.get("figure_title") or "Book figure"
            kind = "map" if re.search(r"\bmap\b", title, re.I) else "infographic"
            assets.append(
                {
                    "id": asset_id,
                    "kind": kind,
                    "src": f"{public_prefix}/{filename}",
                    "alt": title,
                    "caption": title if title != "Book figure" else "",
                    "bookPage": info.get("bookPage") or "",
                    "placement": "infographic",
                    "_page": info["index"],
                }
            )
        for image in page.get_images(full=True):
            xref = image[0]
            if xref in seen:
                continue
            width, height = image[2], image[3]
            if width < 140 or height < 120:
                continue
            if info["figure"] and width * height > page.rect.width * page.rect.height * 4:
                # Full-page plate already rendered as the figure.
                continue
            try:
                pix = pymupdf.Pixmap(doc, xref)
                if pix.colorspace is None or pix.n not in (1, 3) or pix.alpha:
                    pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
            except Exception:
                continue
            if pix.width < 140 or pix.height < 120:
                continue
            seen.add(xref)
            rect = image_bbox(page, xref) or pymupdf.Rect(0, 0, pix.width, pix.height)
            area_ratio = (rect.width * rect.height) / (page.rect.width * page.rect.height)
            if info["figure"] and area_ratio > 0.72:
                continue
            filename = f"photo-p{info['index'] + 1}-{xref}.jpg"
            try:
                save_jpeg(pix, out_dir / filename, max_edge=1500, quality=78)
            except Exception:
                continue
            caption = caption_near(info["lines"], rect)
            placement = info["placement"]
            assets.append(
                {
                    "id": f"photo-p{info['index'] + 1}",
                    "kind": "photo",
                    "src": f"{public_prefix}/{filename}",
                    "alt": caption or "Textbook photograph",
                    "caption": caption,
                    "bookPage": info.get("bookPage") or "",
                    "placement": placement,
                    "_page": info["index"],
                    "_rect": [round(rect.x0, 1), round(rect.y0, 1), round(rect.x1, 1), round(rect.y1, 1)],
                }
            )
    # Unique ids if two photos landed on the same page number key.
    counts: dict[str, int] = {}
    for asset in assets:
        base = asset["id"]
        counts[base] = counts.get(base, 0) + 1
        if counts[base] > 1:
            asset["id"] = f"{base}-{counts[base]}"
    return assets


def parse_paragraph_ids(text: str, known: list[str]) -> list[str]:
    if not known:
        return []
    match = PARA_RE.search(text)
    if match:
        chunk = match.group(1)
        if re.search(r"–|-|through", chunk):
            letters = re.findall(r"[A-Z]", chunk)
            if len(letters) >= 2 and letters[0] in known and letters[-1] in known:
                start, end = known.index(letters[0]), known.index(letters[-1])
                if start <= end:
                    return known[start : end + 1]
        found = re.findall(r"[A-Z]", chunk)
        return [letter for letter in found if letter in known]
    if re.search(r"last paragraph", text, re.I):
        return [known[-1]]
    if re.search(r"first paragraph", text, re.I):
        return [known[0]]
    return []


def build_passage(page_infos: list[dict]) -> dict:
    markers = []
    body = []
    headings = []
    footnotes = []
    exercise_banners = {"vocabulary", "reading-comprehension", "reading-skill", "before-you-read", "warmup"}
    for info in page_infos:
        page_markers = [ln for ln in info["lines"] if is_para_marker(ln)]
        if any(role in exercise_banners for role in info["banners"]) and not page_markers:
            continue
        for ln in info["lines"]:
            if is_footer(ln, info["page"].rect.height):
                continue
            marker = is_para_marker(ln)
            if marker and info["has_body"]:
                markers.append({**ln, "pid": marker})
                continue
            if is_body(ln):
                body.append(ln)
                continue
            if is_footnote(ln) and info["has_body"] and not info["figure"] and re.match(r"^\d+\s+[A-Z]", ln["text"]):
                footnotes.append(ln)
                continue
            if is_footnote(ln) and info["has_body"] and not info["figure"] and footnotes and not re.match(r"^\d+\s", ln["text"]):
                footnotes.append(ln)
                continue
            if is_heading(ln) and info["has_body"]:
                headings.append(ln)

    for ln in body:
        ln["pid"] = None
    for marker in markers:
        candidates = [
            ln
            for ln in body
            if ln["page"] == marker["page"]
            and ln["y"] >= marker["y"] - 6
            and abs(ln["x"] - marker["x"]) < 90
            and ln["x"] > marker["x"] - 4
        ]
        if not candidates:
            continue
        best = min(candidates, key=lambda ln: (ln["y"], abs(ln["x"] - marker["x"])))
        if best["y"] - marker["y"] < 18:
            best["pid"] = marker["pid"]

    columns: list[float] = []
    for ln in body:
        if not any(abs(ln["x"] - col) < 36 for col in columns):
            columns.append(ln["x"])
    columns.sort()

    def col_index(x: float) -> int:
        if not columns:
            return 0
        return min(range(len(columns)), key=lambda i: abs(columns[i] - x))

    sequence = sorted(body, key=lambda ln: (ln["page"], col_index(ln["x"]), ln["y"]))
    paragraphs: list[dict] = []
    current: dict | None = None
    heading_for: dict[str, str] = {}
    for heading in headings:
        later = [
            marker
            for marker in markers
            if marker["page"] == heading["page"] and marker["y"] >= heading["y"] - 8 and abs(marker["x"] - heading["x"]) < 160
        ]
        if later:
            target = min(later, key=lambda marker: marker["y"])
            heading_for.setdefault(target["pid"], heading["text"])

    def start(pid: str) -> dict:
        paragraph = {
            "id": pid,
            "html": "",
            "relatedItemIds": [],
            "parts": [],
        }
        if pid in heading_for:
            paragraph["heading"] = heading_for[pid]
        paragraphs.append(paragraph)
        return paragraph

    for ln in sequence:
        if ln["pid"]:
            current = start(ln["pid"])
            current["endPage"] = ln["page"]
        elif current is None:
            current = start("A")
            current["endPage"] = ln["page"]
        current["parts"].append(ln["html"])
        current["endPage"] = ln["page"]

    for paragraph in paragraphs:
        chunks = []
        for part in paragraph["parts"]:
            if chunks and chunks[-1].endswith("-") and not chunks[-1].endswith("—"):
                chunks[-1] = chunks[-1][:-1] + part.lstrip()
            else:
                chunks.append(part)
        paragraph["html"] = clean_html(" ".join(chunks))
        paragraph.pop("parts", None)

    # Drop an empty accidental paragraph.
    paragraphs = [paragraph for paragraph in paragraphs if re.sub(r"<[^>]+>", "", paragraph["html"]).strip()]

    glossary = []
    buffer = None
    for ln in footnotes:
        match = re.match(r"^(\d+)\s+(.*)", ln["text"])
        bold = clean(
            " ".join(
                span["text"]
                for span in ln["spans"]
                if "Palatino" in span["font"] and ("Black" in span["font"] or "Bold" in span["font"])
            )
        )
        if match:
            if buffer:
                glossary.append(buffer)
            buffer = {"n": match.group(1), "text": match.group(2), "term": bold}
        elif buffer:
            buffer["text"] = clean(buffer["text"] + " " + ln["text"])
            if bold:
                buffer["term"] = clean(f"{buffer.get('term', '')} {bold}")
    if buffer:
        glossary.append(buffer)

    glossary_out = []
    for entry in glossary:
        definition = clean(entry["text"])
        term = re.sub(r"^\d+\s*", "", clean(entry.get("term") or ""))
        if len(definition) < 24:
            continue
        if not term:
            term_match = re.match(r"([A-Za-z][A-Za-z’'\-]+)", definition)
            term = term_match.group(1) if term_match else f"Note {entry['n']}"
        anchor = None
        for paragraph in paragraphs:
            if f"<sup>{entry['n']}</sup>" in paragraph["html"]:
                anchor = paragraph["id"]
                break
        glossary_out.append(
            {
                "term": term,
                "def": definition,
                "anchorParagraphId": anchor or (paragraphs[0]["id"] if paragraphs else ""),
            }
        )

    return {"paragraphs": paragraphs, "glossary": glossary_out}


def clean_html(value: str) -> str:
    value = re.sub(r"\s+", " ", value).strip()
    value = value.replace(" ____ ", " ____ ")
    return value


def figure_title(lines: list[dict]) -> str:
    big = [ln for ln in lines if ln["size"] >= 16 and not is_footer(ln, 900)]
    big.sort(key=lambda ln: (ln["y"], ln["x"]))
    if not big:
        return ""
    # Join the title stack near the top.
    top = [ln for ln in big if ln["y"] < 220]
    chosen = top or big[:3]
    return clean(" ".join(ln["text"] for ln in chosen[:4]))


def choice_bits(frags: list[dict]) -> list[dict]:
    bits = []
    for frag in frags:
        text = frag["text"].replace("\x07", "")
        found = list(CHOICE_FIND.finditer(text))
        if not found:
            continue
        for match in found:
            bits.append({"id": match.group(1), "text": clean(match.group(2)), "x": frag["x"]})
    return bits


def main_column(frags: list[dict]) -> list[dict]:
    """Keep the left text column. Keep a right column only when it is choices or T/F."""
    frags = sorted(frags, key=lambda frag: frag["x"])
    if not frags:
        return []
    columns: list[list[dict]] = [[frags[0]]]
    for frag in frags[1:]:
        own_column = frag["x"] > 400 and columns[0][0]["x"] < 230
        if own_column or frag["x"] - columns[-1][-1]["x1"] > 55:
            columns.append([frag])
        else:
            columns[-1].append(frag)
    kept = list(columns[0])
    main_y = columns[0][0]["y"]
    for column in columns[1:]:
        short_tf = any(
            re.fullmatch(r"(?:T|F|NG)(?:\s+(?:T|F|NG))*", clean(frag["text"]), re.I) for frag in column
        )
        same_line = abs(column[0]["y"] - main_y) < 1.8
        tail = same_line and (column[0]["text"][:1].islower() or column[0]["text"][:1] in ".,;:")
        if choice_bits(column) or short_tf or tail:
            kept.extend(column)
    return kept


def parse_exercises(page_infos: list[dict], block_id: str):
    """Return items, critical-thinking items, and the skill explanation."""
    raw_lines: list[dict] = []
    height = 783
    for info in page_infos:
        height = info["page"].rect.height
        for ln in info["lines"]:
            if is_footer(ln, height) or is_footnote(ln) or is_para_marker(ln):
                continue
            # Long Palatino lines are passage copy that shares a page with an exercise.
            if is_body(ln) and len(ln["text"]) > 90:
                continue
            if banner_of(ln) or ln["size"] >= 28:
                continue
            raw_lines.append(ln)
    rows = cluster_rows(raw_lines)
    items: list[dict] = []
    discuss: list[dict] = []
    groups: list[dict] = []
    group: dict | None = None
    pending_skill = ""
    last_skill_y = -100.0
    explain: list[str] = []
    preface: list[str] = []
    mode_discuss = False
    discuss_parts: list[str] = []

    def open_group(letter: str, prompt: str, y: float, page: int, skill: str) -> dict:
        nonlocal group
        group = {
            "letter": letter,
            "prompt": clean(prompt),
            "y": y,
            "page": page,
            "skill": skill,
            "items": [],
            "choices": [],
            "matching": [],
            "passage": [],
            "bank": [],
        }
        groups.append(group)
        return group

    for row in rows:
        labels = [frag for frag in row if is_skill_label(frag)]
        content = [frag for frag in row if frag not in labels]
        label_text = clean(" ".join(frag["text"] for frag in labels))
        if label_text:
            if pending_skill and row[0]["y"] - last_skill_y < 18:
                pending_skill = clean(pending_skill + " " + label_text)
            else:
                pending_skill = label_text
            last_skill_y = row[0]["y"]
        if not content:
            continue
        if block_id == "warmup":
            content = [
                frag
                for frag in content
                if frag["x"] >= 280 or NUM_RE.match(frag["text"]) or "discuss" in frag["text"].lower()
            ]
        content = main_column(content)
        if not content:
            continue
        left = content[0]
        text = left["text"]
        if re.fullmatch(r"\d+\.?", text) and len(content) > 1:
            text = clean(text + " " + " ".join(frag["text"] for frag in content[1:]))
            left = {**left, "text": text, "x1": content[-1]["x1"]}
            content = [left]
        if re.match(r"^CRITICAL THINKING\b", text, re.I):
            mode_discuss = True
            rest = re.sub(r"^CRITICAL THINKING\s*[—–:-]*\s*", "", text, flags=re.I)
            discuss_parts = [rest] if rest else []
            discuss_parts.extend(frag["text"] for frag in content[1:])
            continue
        if mode_discuss:
            if TASK_RE.match(text) and left["size"] >= 10.5:
                mode_discuss = False
            else:
                discuss_parts.append(text)
                continue
        if left["size"] >= 13.5 and "." not in text and len(text) < 80 and group is None:
            continue
        task = TASK_RE.match(text)
        if task and left["x"] < 240 and left["size"] >= 10.4 and not CHOICE_RE.match(text):
            skill = pending_skill
            pending_skill = ""
            prompt = task.group(2)
            for extra in content[1:]:
                prompt = clean(prompt + " " + extra["text"])
            open_group(task.group(1), prompt, left["y"], left["page"], skill)
            continue
        if group and re.search(r"complete the information|choose the correct words", group["prompt"], re.I):
            if left["x"] < 180 and " / " not in text:
                continue
            group["passage"].append(text)
            continue
        # Side captions (bold, small) are not questions. Indented wraps of a question are.
        if (
            left["x"] > 430
            and "Bold" in left["font"]
            and left["size"] <= 10.6
            and not re.match(r"^\d+\.", text)
            and not choice_bits(content)
        ):
            continue
        numbered = NUM_RE.match(text)
        bits = choice_bits(content)
        tf_flags = []
        for frag in content:
            tf_flags.extend(re.findall(r"\b(T|F|NG)\b", frag["text"].upper()))
        # A row of only T/F tokens belongs to the question above it.
        if group and group["items"] and re.fullmatch(r"(?:T|F|NG)(?:\s+(?:T|F|NG))*", clean(text), re.I):
            group["items"][-1]["tf"].extend(re.findall(r"T|F|NG", text.upper()))
            continue
        if group is None and not numbered:
            if " / " in text:
                preface.append(left["html"])
            elif block_id == "reading-skill" and len(text) > 45:
                explain.append(text)
            elif len(text) > 2:
                preface.append(text)
            continue
        if numbered and group is None:
            open_group("W" if block_id == "warmup" else "", clean(" ".join(preface)) or "Read and answer.", left["y"], left["page"], pending_skill)
            preface = []
            pending_skill = ""
        assert group is not None
        if numbered and bits and re.search(r"\bmatch\b", group["prompt"], re.I):
            group["matching"].append(
                {
                    "n": numbered.group(1),
                    "pair": clean(numbered.group(2)),
                    "choice": bits[0],
                    "y": left["y"],
                    "page": left["page"],
                }
            )
            continue
        if numbered:
            skill = pending_skill or group["skill"]
            pending_skill = ""
            prompt = clean(numbered.group(2))
            prev_x1 = left["x1"]
            for extra in content[1:]:
                if CHOICE_RE.match(extra["text"]) or choice_bits([extra]) or TF_RE.match(clean(extra["text"])):
                    continue
                gap = " ____ " if extra["x"] - prev_x1 > 18 else " "
                prompt = clean(prompt + gap + extra["text"])
                prev_x1 = extra["x1"]
            group["items"].append(
                {
                    "n": numbered.group(1),
                    "prompt": prompt,
                    "y": left["y"],
                    "page": left["page"],
                    "skill": skill,
                    "choices": [],
                    "tf": [flag for flag in tf_flags if flag in {"T", "F", "NG"}],
                }
            )
            continue
        if bits and not numbered:
            target = group["items"][-1]["choices"] if group["items"] else group["choices"]
            target.extend(bits)
            continue
        bank_words = [word for word in text.split() if re.fullmatch(r"[A-Za-z][A-Za-z’'\-]{2,}", word)]
        if len(bank_words) >= 3 and len(bank_words) == len(text.split()) and not group["items"]:
            group["bank"] = bank_words
            continue
        if " / " in text or "____" in text:
            group["passage"].append(left["html"] if "<" in left["html"] else text)
            continue
        if group["items"]:
            item = group["items"][-1]
            if item["choices"] and left["x"] >= item["choices"][-1]["x"] - 12:
                item["choices"][-1]["text"] = clean(item["choices"][-1]["text"] + " " + text)
            else:
                item["prompt"] = clean(item["prompt"] + " " + text)
            continue
        if group["passage"]:
            group["passage"].append(text)
        else:
            group["prompt"] = clean((group["prompt"] + " " + text).strip())

    for group in groups:
        prompt_l = group["prompt"].lower()
        skill = group["skill"]
        if group["matching"]:
            for item in group["items"]:
                choice = item["choices"][0] if item["choices"] else None
                group["matching"].append(
                    {"n": item["n"], "pair": item["prompt"], "choice": choice, "y": item["y"], "page": item["page"]}
                )
            choices = []
            for row in group["matching"]:
                choice = row.get("choice")
                if choice and choice.get("id") and all(existing["id"] != choice["id"] for existing in choices):
                    choices.append({"id": choice["id"], "text": choice["text"]})
            items.append(
                {
                    "interaction": "matching",
                    "prompt": group["prompt"],
                    "group": group["letter"],
                    "groupLabel": skill,
                    "groupPrompt": group["prompt"],
                    "skill": skill,
                    "choices": choices,
                    "pairs": [{"id": row["n"], "text": row["pair"]} for row in group["matching"]],
                    "paragraphIds": [],
                    "y": group["y"],
                    "page": group["page"],
                }
            )
            continue
        if re.search(r"\bmatch\b", prompt_l) and group["choices"] and group["items"]:
            items.append(
                {
                    "interaction": "matching",
                    "prompt": group["prompt"],
                    "group": group["letter"],
                    "groupLabel": skill,
                    "groupPrompt": group["prompt"],
                    "skill": skill,
                    "choices": [{"id": c["id"], "text": c["text"]} for c in group["choices"]],
                    "pairs": [{"id": item["n"], "text": item["prompt"]} for item in group["items"]],
                    "paragraphIds": [],
                    "y": group["y"],
                    "page": group["page"],
                }
            )
            continue
        passage = clean(" ".join(group["passage"]))
        slash_pairs = SLASH_RE.findall(passage) if passage else []
        if slash_pairs and re.search(r"complete|choose the correct word", prompt_l):
            blanked = passage
            blanks = []
            for index, (left_opt, right_opt) in enumerate(SLASH_RE.findall(passage)):
                blanks.append({"options": [clean(left_opt), clean(right_opt)]})
                blanked = SLASH_RE.sub(f"[[{index}]]", blanked, count=1)
            items.append(
                {
                    "interaction": "completion",
                    "prompt": blanked,
                    "group": group["letter"],
                    "groupLabel": skill,
                    "groupPrompt": group["prompt"],
                    "skill": skill,
                    "blanks": blanks,
                    "paragraphIds": [],
                    "y": group["y"],
                    "page": group["page"],
                }
            )
            continue
        if not group["items"] and group["choices"]:
            items.append(
                {
                    "interaction": "multiple-choice",
                    "prompt": group["prompt"],
                    "group": group["letter"],
                    "groupLabel": skill,
                    "groupPrompt": group["prompt"],
                    "skill": skill,
                    "choices": [{"id": c["id"], "text": c["text"]} for c in group["choices"]],
                    "multi": bool(re.search(r"all that|check \(?✓?\)? all|more than one", prompt_l)),
                    "paragraphIds": [],
                    "y": group["y"],
                    "page": group["page"],
                }
            )
            continue
        if not group["items"] and group["prompt"] and not group["passage"]:
            items.append(
                {
                    "interaction": "short-text",
                    "prompt": group["prompt"],
                    "group": group["letter"],
                    "groupLabel": skill,
                    "groupPrompt": group["prompt"],
                    "skill": skill,
                    "paragraphIds": [],
                    "y": group["y"],
                    "page": group["page"],
                }
            )
            continue
        for item in group["items"]:
            record: dict = {
                "n": item["n"],
                "prompt": item["prompt"],
                "group": group["letter"],
                "groupLabel": item["skill"] or skill,
                "groupPrompt": group["prompt"],
                "skill": item["skill"] or skill,
                "paragraphIds": [],
                "y": item["y"],
                "page": item["page"],
            }
            if len(item["prompt"]) < 3:
                continue
            if item["tf"] and not item["choices"]:
                letters = []
                for flag in item["tf"]:
                    if flag not in letters:
                        letters.append(flag)
                record["interaction"] = "true-false"
                record["choices"] = [
                    {"id": flag, "text": {"T": "True", "F": "False", "NG": "Not Given"}.get(flag, flag)}
                    for flag in letters
                ]
            elif item["choices"]:
                record["interaction"] = "multiple-choice"
                record["choices"] = [{"id": c["id"], "text": c["text"]} for c in item["choices"]]
                if re.search(r"all that|more than one", prompt_l):
                    record["multi"] = True
            elif "____" in item["prompt"] and group["bank"]:
                record["interaction"] = "fill-blank"
                record["bank"] = group["bank"]
            elif "____" in item["prompt"]:
                record["interaction"] = "fill-blank"
            else:
                record["interaction"] = "short-text"
            if block_id == "warmup":
                record["interaction"] = "short-text"
                record.pop("choices", None)
            items.append(record)

    if discuss_parts:
        discuss.append(
            {
                "id": "critical-1",
                "interaction": "short-text",
                "prompt": clean(" ".join(part for part in discuss_parts if part)),
                "group": "CT",
                "groupLabel": "Critical Thinking",
                "groupPrompt": "Critical Thinking",
                "paragraphIds": [],
                "y": 0,
            }
        )
    return items, discuss, clean(" ".join(explain))


def assign_ids(items: list[dict], prefix: str) -> None:
    seen: dict[str, int] = {}
    for item in items:
        group = (item.get("group") or "x").lower()
        number = item.get("n") or ""
        base = f"{prefix}-{group}{number}" if number else f"{prefix}-{group}"
        seen[base] = seen.get(base, 0) + 1
        item["id"] = base if seen[base] == 1 else f"{base}-{seen[base]}"
        item.pop("n", None)


def attach_images(items: list[dict], assets: list[dict], block_pages: set[int]) -> list[str]:
    """Attach figure/photo assets onto items. Return asset ids that stay at block level."""
    used: set[str] = set()
    figures = [asset for asset in assets if asset["placement"] == "infographic" and asset["_page"] in block_pages]
    photos = [asset for asset in assets if asset["kind"] == "photo" and asset["_page"] in block_pages and asset["placement"] in {"exercise", "skill", "before-you-read", "reading"}]
    for item in items:
        blob = " ".join(
            [
                item.get("prompt") or "",
                item.get("groupPrompt") or "",
                item.get("skill") or "",
            ]
        )
        needs_figure = bool(re.search(r"infographic|map|chart|diagram|timeline|graph", blob, re.I))
        if needs_figure and figures:
            item["assetIds"] = [asset["id"] for asset in figures]
            item["imagePlacement"] = "above"
            used.update(item["assetIds"])
    nearest: dict[str, tuple[float, dict]] = {}
    for item in items:
        if item.get("y") is None:
            continue
        for asset in photos:
            rect = asset.get("_rect")
            if not rect or item.get("page") != asset["_page"]:
                continue
            if rect[2] - rect[0] > 420:
                continue
            side = rect[0] > 300 or rect[2] < 280
            if not side:
                continue
            distance = abs(((rect[1] + rect[3]) / 2) - item["y"])
            current = nearest.get(asset["id"])
            if current is None or distance < current[0]:
                nearest[asset["id"]] = (distance, item)
    for asset_id, (distance, item) in nearest.items():
        if distance > 240 or item.get("assetIds"):
            continue
        item["assetIds"] = [asset_id]
        item["imagePlacement"] = "beside"
        used.add(asset_id)
    block_level = []
    for asset in figures + photos:
        if asset["id"] not in used:
            block_level.append(asset["id"])
    return block_level


def link_paragraphs(items: list[dict], paragraph_ids: list[str]) -> None:
    for item in items:
        blob = " ".join([item.get("prompt") or "", item.get("groupPrompt") or ""])
        if item.get("pairs"):
            # Matching rows sometimes name a paragraph in the instruction only.
            item["paragraphIds"] = parse_paragraph_ids(blob, paragraph_ids)
        else:
            item["paragraphIds"] = parse_paragraph_ids(item.get("prompt") or "", paragraph_ids) or parse_paragraph_ids(
                item.get("groupPrompt") or "", paragraph_ids
            )
            # Don't paint every item in a group with the group's paragraph if the
            # item prompt itself doesn't cite one — only the group-level mention
            # when the item has no more specific text.
            if PARA_RE.search(item.get("prompt") or ""):
                item["paragraphIds"] = parse_paragraph_ids(item["prompt"], paragraph_ids)


def apply_keys(lesson_key: str, items: list[dict], keys: dict) -> None:
    lesson_keys = keys.get(lesson_key, {})
    for item in items:
        if item["id"] in lesson_keys:
            item["answer"] = lesson_keys[item["id"]]


def strip_private(item: dict) -> dict:
    return {key: value for key, value in item.items() if not key.startswith("_") and key not in {"y", "page", "parts"}}


def build_lesson(unit: dict, lesson_id: str, doc: pymupdf.Document, keys: dict) -> dict:
    title, skill = unit["lessons"][lesson_id]
    unit_no = unit["unit"]
    slug = f"unit-{unit_no:02d}"
    out_dir = PUBLIC_DIR / slug / lesson_id
    if out_dir.exists():
        for old in out_dir.glob("*.jpg"):
            old.unlink()
    out_dir.mkdir(parents=True, exist_ok=True)
    public_prefix = f"/english/re3/{slug}/{lesson_id}"

    page_infos = []
    for index, page in enumerate(doc):
        lines = extract_page_lines(page)
        height = page.rect.height
        banners = []
        for ln in lines:
            if is_footer(ln, height):
                continue
            found = banner_of(ln)
            if found:
                banners.append(found)
        palatino = sum(1 for ln in lines if is_body(ln))
        markers = sum(1 for ln in lines if is_para_marker(ln))
        drawings = len(page.get_drawings())
        figure = False
        if "reading-skill" not in banners and "reading-comprehension" not in banners and "vocabulary" not in banners:
            if drawings >= 150 and palatino < 8:
                figure = True
            elif not banners and palatino < 4 and drawings >= 55 and markers == 0:
                figure = True
        # A skill/comprehension page that is mostly a graphic still contributes a figure.
        if drawings >= 160 and palatino < 6:
            figure = True
        placement = "reading"
        if "warmup" in banners:
            placement = "warmup"
        elif "before-you-read" in banners and palatino < 8:
            placement = "before-you-read"
        elif "reading-comprehension" in banners:
            placement = "exercise"
        elif "reading-skill" in banners:
            placement = "skill"
        elif "vocabulary" in banners:
            placement = "exercise"
        elif figure:
            placement = "infographic"
        info = {
            "index": index,
            "page": page,
            "lines": lines,
            "banners": banners,
            "has_body": palatino >= 6 or markers >= 1,
            "figure": figure,
            "placement": placement,
            "bookPage": page_number(lines, height),
            "figure_title": figure_title(lines) if figure else "",
        }
        page_infos.append(info)

    assets = extract_assets(doc, page_infos, out_dir, public_prefix)
    passage = build_passage(page_infos)
    paragraph_ids = [paragraph["id"] for paragraph in passage["paragraphs"]]

    def pages_for(*roles: str, figure: bool = False) -> list[dict]:
        chosen = []
        for info in page_infos:
            if figure and info["figure"]:
                chosen.append(info)
                continue
            if any(role in info["banners"] for role in roles):
                chosen.append(info)
        return chosen

    warmup_pages = pages_for("warmup")
    before_pages = pages_for("before-you-read")
    comp_pages = pages_for("reading-comprehension")
    skill_pages = pages_for("reading-skill")
    vocab_pages = pages_for("vocabulary")
    figure_pages = [info for info in page_infos if info["figure"]]

    blocks = []
    all_items: list[dict] = []

    if warmup_pages:
        w_items, _, _ = parse_exercises(warmup_pages, "warmup")
        assign_ids(w_items, "warm")
        hero = [asset["id"] for asset in assets if asset["_page"] in {info["index"] for info in warmup_pages}]
        blocks.append(
            {
                "id": "warmup",
                "kind": "warmup",
                "title": "Warm Up",
                "assetIds": hero[:2],
                "items": w_items,
            }
        )
        all_items.extend(w_items)

    if before_pages:
        b_items, _, _ = parse_exercises(before_pages, "before-you-read")
        assign_ids(b_items, "before")
        page_set = {info["index"] for info in before_pages}
        block_assets = attach_images(b_items, assets, page_set)
        # Photos on the before-you-read spread belong to the section.
        for asset in assets:
            if asset["_page"] in page_set and asset["id"] not in block_assets and asset["kind"] == "photo":
                if asset["id"] not in {i for item in b_items for i in item.get("assetIds", [])}:
                    block_assets.append(asset["id"])
        blocks.append(
            {
                "id": "before-you-read",
                "kind": "exercise",
                "title": "Before You Read",
                "assetIds": block_assets,
                "items": b_items,
            }
        )
        all_items.extend(b_items)

    figures = []
    reading_pages = {info["index"] for info in page_infos if info["has_body"]}
    for asset in assets:
        if asset["kind"] != "photo" or asset["_page"] not in reading_pages or asset["placement"] != "reading":
            continue
        rect = asset.get("_rect") or [0, 0, 0, 0]
        on_page = [paragraph for paragraph in passage["paragraphs"] if paragraph.get("endPage") == asset["_page"]]
        anchor = (on_page or passage["paragraphs"] or [{"id": "A"}])[0]["id"]
        position = "before-" + anchor
        if rect[1] > 360 and on_page:
            position = "after-" + on_page[-1]["id"]
        figures.append({"assetId": asset["id"], "position": position})
    for paragraph in passage["paragraphs"]:
        paragraph.pop("endPage", None)

    blocks.append(
        {
            "id": "reading",
            "kind": "passage",
            "title": title,
            "paragraphs": passage["paragraphs"],
            "glossary": passage["glossary"],
            "figures": figures,
        }
    )

    for info in figure_pages:
        asset = next((asset for asset in assets if asset["placement"] == "infographic" and asset["_page"] == info["index"]), None)
        if not asset:
            continue
        intro_lines = [
            ln["text"]
            for ln in info["lines"]
            if ln["size"] >= 11 and len(ln["text"]) > 40 and not banner_of(ln) and not is_footer(ln, info["page"].rect.height)
        ]
        blocks.append(
            {
                "id": f"infographic-{info['index'] + 1}",
                "kind": "infographic",
                "title": info["figure_title"] or asset.get("caption") or "Infographic",
                "assetId": asset["id"],
                "html": clean(" ".join(intro_lines[:3])),
            }
        )

    if comp_pages:
        c_items, discuss, _ = parse_exercises(comp_pages, "reading-comprehension")
        assign_ids(c_items, "comp")
        page_set = {info["index"] for info in comp_pages}
        block_assets = attach_images(c_items, assets, page_set)
        blocks.append(
            {
                "id": "reading-comprehension",
                "kind": "exercise",
                "title": "Reading Comprehension",
                "assetIds": block_assets,
                "items": c_items,
            }
        )
        all_items.extend(c_items)
        if discuss:
            all_items.extend(discuss)

    skill_explain = ""
    skill_items: list[dict] = []
    skill_discuss: list[dict] = []
    if skill_pages:
        skill_items, skill_discuss, skill_explain = parse_exercises(skill_pages, "reading-skill")
        assign_ids(skill_items, "skill")
        page_set = {info["index"] for info in skill_pages} | {info["index"] for info in figure_pages}
        block_assets = attach_images(skill_items, assets, page_set)
        # Skill tasks about infographics/maps always keep the figure on the item.
        figure_ids = [asset["id"] for asset in assets if asset["placement"] == "infographic"]
        if figure_ids and re.search(r"infographic|map|chart", skill, re.I):
            for item in skill_items:
                ids = list(item.get("assetIds") or [])
                for figure_id in figure_ids:
                    if figure_id not in ids:
                        ids.append(figure_id)
                if ids:
                    item["assetIds"] = ids
                    item["imagePlacement"] = item.get("imagePlacement") or "above"
        blocks.append(
            {
                "id": "reading-skill",
                "kind": "skill",
                "title": skill,
                "html": skill_explain,
                "assetIds": block_assets,
                "items": skill_items,
            }
        )
        all_items.extend(skill_items)

    discuss_items = skill_discuss
    if discuss_items:
        blocks.append(
            {
                "id": "critical-thinking",
                "kind": "discuss",
                "title": "Critical Thinking",
                "items": discuss_items,
            }
        )
        all_items.extend(discuss_items)

    if vocab_pages:
        v_items, _, _ = parse_exercises(vocab_pages, "vocabulary")
        assign_ids(v_items, "vocab")
        page_set = {info["index"] for info in vocab_pages}
        block_assets = attach_images(v_items, assets, page_set)
        for asset in assets:
            if not (asset["_page"] in page_set and asset["kind"] == "photo"):
                continue
            host = next((item for item in v_items if item.get("interaction") == "completion"), None)
            if host is None and v_items:
                host = v_items[0]
            if host is None:
                if asset["id"] not in block_assets:
                    block_assets.append(asset["id"])
                continue
            for item in v_items:
                if item is host:
                    continue
                if asset["id"] in (item.get("assetIds") or []):
                    item["assetIds"] = [asset_id for asset_id in item["assetIds"] if asset_id != asset["id"]]
                    if not item["assetIds"]:
                        item.pop("assetIds", None)
                        item.pop("imagePlacement", None)
            host.setdefault("assetIds", [])
            if asset["id"] not in host["assetIds"]:
                host["assetIds"].append(asset["id"])
            host["imagePlacement"] = "beside"
        blocks.append(
            {
                "id": "vocabulary",
                "kind": "exercise",
                "title": "Vocabulary Practice",
                "assetIds": block_assets,
                "items": v_items,
            }
        )
        all_items.extend(v_items)

    link_paragraphs(all_items, paragraph_ids)
    related: dict[str, list[str]] = {pid: [] for pid in paragraph_ids}
    for item in all_items:
        for pid in item.get("paragraphIds") or []:
            if item["id"] not in related.get(pid, []):
                related.setdefault(pid, []).append(item["id"])
    for paragraph in passage["paragraphs"]:
        paragraph["relatedItemIds"] = related.get(paragraph["id"], [])

    lesson_key = f"{unit_no}-{lesson_id}"
    apply_keys(lesson_key, all_items, keys)

    book_pages = [info["bookPage"] for info in page_infos if info.get("bookPage")]
    book_span = ""
    nums = []
    for value in book_pages:
        if value and value.isdigit():
            nums.append(int(value))
    if nums:
        book_span = f"{min(nums)}–{max(nums)}" if min(nums) != max(nums) else str(min(nums))

    public_assets = []
    for asset in assets:
        public_assets.append(
            {
                "id": asset["id"],
                "kind": asset["kind"],
                "src": asset["src"],
                "alt": asset.get("alt") or "",
                "caption": asset.get("caption") or "",
                "bookPage": asset.get("bookPage") or "",
                "placement": asset["placement"],
            }
        )

    def clean_items(items: list[dict]) -> list[dict]:
        cleaned = []
        for item in items:
            out = strip_private(item)
            if not out.get("skill"):
                out.pop("skill", None)
            if not out.get("groupLabel"):
                out.pop("groupLabel", None)
            cleaned.append(out)
        return cleaned

    for block in blocks:
        if "items" in block:
            block["items"] = clean_items(block["items"])
        block.pop("_page", None)

    warnings = []
    if not passage["paragraphs"]:
        warnings.append("no paragraphs")
    if not public_assets:
        warnings.append("no assets")
    for item in all_items:
        if re.search(r"paragraph", item.get("prompt") or "", re.I) and not item.get("paragraphIds"):
            warnings.append(f"missing paragraphIds {item['id']}")
        if item.get("assetIds") and not item.get("imagePlacement"):
            warnings.append(f"image item missing placement {item['id']}")

    lesson = {
        "courseId": "re3",
        "unit": unit_no,
        "lessonId": lesson_id,
        "type": "reading",
        "title": title,
        "theme": unit["theme"],
        "themeZh": unit["themeZh"],
        "readingSkill": skill,
        "bookPages": book_span or unit["bookPages"],
        "sourcePdf": f"REX 3_unit {unit_no}{lesson_id.upper()}.pdf",
        "assets": public_assets,
        "blocks": blocks,
    }
    return lesson, warnings


def main() -> None:
    only = sys.argv[1] if len(sys.argv) > 1 else ""
    keys = {}
    if KEYS_PATH.exists():
        keys = json.loads(KEYS_PATH.read_text())
    CONTENT_DIR.mkdir(parents=True, exist_ok=True)
    catalog_units = []
    summary = []
    for unit in UNITS:
        lessons_meta = []
        for lesson_id in ("a", "b"):
            label = f"{unit['unit']}{lesson_id.upper()}"
            if only and only.upper() not in {label, str(unit["unit"])}:
                continue
            pdf_path = PDF_DIR / f"REX 3_unit {unit['unit']}{lesson_id.upper()}.pdf"
            if not pdf_path.exists():
                raise SystemExit(f"Missing {pdf_path}")
            doc = pymupdf.open(pdf_path)
            lesson, warnings = build_lesson(unit, lesson_id, doc, keys)
            dest = CONTENT_DIR / f"unit-{unit['unit']:02d}"
            dest.mkdir(parents=True, exist_ok=True)
            (dest / f"{lesson_id}.json").write_text(json.dumps(lesson, ensure_ascii=False, indent=2) + "\n")
            paragraphs = next(block["paragraphs"] for block in lesson["blocks"] if block["kind"] == "passage")
            items = [item for block in lesson["blocks"] if "items" in block for item in block["items"]]
            summary.append(
                f"U{label}: paras={len(paragraphs)} items={len(items)} assets={len(lesson['assets'])} blocks={len(lesson['blocks'])} warn={len(warnings)}"
            )
            if warnings:
                summary.append("   " + "; ".join(warnings[:8]))
            lessons_meta.append(
                {
                    "id": lesson_id,
                    "title": lesson["title"],
                    "skill": lesson["readingSkill"],
                    "bookPages": lesson["bookPages"],
                    "blockCount": len(lesson["blocks"]),
                    "itemCount": len(items),
                }
            )
            doc.close()
        if not only:
            catalog_units.append(
                {
                    "unit": unit["unit"],
                    "theme": unit["theme"],
                    "themeZh": unit["themeZh"],
                    "bookPages": unit["bookPages"],
                    "lessons": lessons_meta,
                }
            )
        elif lessons_meta and only.isdigit():
            catalog_units.append(
                {
                    "unit": unit["unit"],
                    "theme": unit["theme"],
                    "themeZh": unit["themeZh"],
                    "bookPages": unit["bookPages"],
                    "lessons": lessons_meta,
                }
            )
    if not only:
        catalog = {"courseId": "re3", "title": "Reading Explorer 3", "edition": "Third Edition", "units": catalog_units}
        (CONTENT_DIR / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")
    print("\n".join(summary))


if __name__ == "__main__":
    main()
