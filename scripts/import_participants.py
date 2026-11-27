"""Import participants from the "DS CODE BỐC THĂM TRÚNG THƯỞNG" workbook without editing it.

The first sheet has one block per prize list, each starting with a header row in column A
("GIẢI BA", "GIẢI NHẤT & NHÌ", "GIẢI ĐẶC BIỆT"), then rows: STT | Mã bốc thăm | NPP | NPP hiển thị | Tên.
"""
import json
import re
import sys
import unicodedata
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
MINIMUM = {"third": 15, "main": 2, "special": 1}


def clean(text):
    return " ".join(unicodedata.normalize("NFC", text or "").split())


def pool_of(label):
    label = label.upper()
    if "ĐẶC BIỆT" in label:
        return "special"
    if "NHẤT" in label or "NHÌ" in label:
        return "main"
    if label.split()[-1] == "BA":
        return "third"
    sys.exit(f"Không nhận ra giải: {label}")


def rows(workbook):
    with zipfile.ZipFile(workbook) as z:
        names = z.namelist()
        strings = ["".join(e.itertext()) for e in ET.fromstring(z.read("xl/sharedStrings.xml"))] if "xl/sharedStrings.xml" in names else []
        first = ET.fromstring(z.read("xl/workbook.xml")).find("m:sheets/m:sheet", NS).get(REL)
        target = next(r.get("Target") for r in ET.fromstring(z.read("xl/_rels/workbook.xml.rels")) if r.get("Id") == first)
        sheet = ET.fromstring(z.read("xl/" + target.lstrip("/").removeprefix("xl/")))
    for row in sheet.findall(".//m:sheetData/m:row", NS):
        values = {}
        for cell in row:
            value = cell.find("m:v", NS)
            text = value.text if value is not None else ""
            if cell.get("t") == "s":
                text = strings[int(text)]
            elif cell.get("t") == "inlineStr":
                text = "".join(cell.find("m:is", NS).itertext())
            values[re.sub(r"\d", "", cell.get("r"))] = clean(text)
        yield values


def main(workbook):
    people, pool = [], None
    for row in rows(workbook):
        label = row.get("A", "")
        if label.upper().startswith("GIẢI"):
            pool = pool_of(label)
        elif pool and label.isdigit() and row.get("B"):
            code = re.fullmatch(r"Y\s*(\d{1,2})", row["B"], re.IGNORECASE)
            if not code:
                sys.exit(f"Mã không hợp lệ: {row['B']}")
            people.append(dict(number=code.group(1).zfill(2), name=row.get("E", ""),
                               distributor=row.get("D") or row.get("C", ""), pool=pool, isEligible=True))
    numbers = [p["number"] for p in people]
    duplicates = sorted({n for n in numbers if numbers.count(n) > 1})
    if duplicates:
        sys.exit(f"Mã bị trùng: {', '.join(duplicates)}")
    counts = {name: sum(p["pool"] == name for p in people) for name in MINIMUM}
    if any(counts[name] < minimum for name, minimum in MINIMUM.items()):
        sys.exit(f"Không đủ người cho số giải: {counts}")
    unnamed = [p["number"] for p in people if not p["name"]]
    if unnamed:
        sys.exit(f"Thiếu tên: {', '.join(unnamed)}")
    target = Path(__file__).resolve().parents[1] / "src/data/participants.json"
    target.write_text(json.dumps(people, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Imported {len(people)} people: giải ba {counts['third']}, nhất & nhì {counts['main']}, đặc biệt {counts['special']}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Usage: python scripts/import_participants.py /path/to/data.xlsx")
    main(sys.argv[1])
