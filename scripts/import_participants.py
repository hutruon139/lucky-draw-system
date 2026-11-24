"""Import people from the supplied workbook without editing it."""
import json, sys, zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
NS={"m":"http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REGIONS={"Miền Bắc":"north","Miền Trung":"central","Đông Nam Bộ":"southeast","Tây Nam Bộ":"southwest"}
with zipfile.ZipFile(sys.argv[1]) as z:
 strings=["".join(e.itertext()) for e in ET.fromstring(z.read("xl/sharedStrings.xml"))]
 def rows(sheet):
  for row in ET.fromstring(z.read(f"xl/worksheets/sheet{sheet}.xml")).findall(".//m:sheetData/m:row",NS):
   values={}
   for cell in row:
    v=cell.find("m:v",NS); value=v.text if v is not None else ""
    if cell.get("t")=="s": value=strings[int(value)]
    values["".join(filter(str.isalpha,cell.get("r")))]=value.strip()
   yield values
 people=[]; group=region=None
 for row in rows(3):
  label=row.get("A","")
  if label.startswith("Nhóm "): group=int(label.split()[1])
  elif label in REGIONS: region=REGIONS[label]
  elif group and row.get("D"): people.append(dict(name=row["D"],company=row["B"],group=group,region=region))
 for sheet,region in [(4,"logistics"),(5,"xnk"),(6,"chemicals")]:
  for row in rows(sheet):
   if row.get("A","").isdigit() and row.get("C"):
    people.append(dict(name=row["C"],company=row["B"],group=3,region=region))
for i,p in enumerate(people,1): p.update(number=f"{i:03d}",isEligible=True)
assert len(people)==72
target=Path(__file__).resolve().parents[1]/"src/data/participants.json"
target.write_text(json.dumps(people,ensure_ascii=False,indent=2)+"\n")
print(f"Imported {len(people)} people; mock tickets 001–072")
