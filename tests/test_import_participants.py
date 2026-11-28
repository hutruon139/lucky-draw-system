import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from import_participants import participant_from_row


class ParticipantImportTest(unittest.TestCase):
    def test_confirmed_southwest_override_survives_reimport(self):
        for number, company in [(34, "Hữu Thành"), (35, "Tân Thành")]:
            row = {"B": f"Y {number}", "D": f"NPP {company} - Khu vực Miền Bắc", "E": "Khách hàng"}
            person = participant_from_row(row, "third")
            self.assertEqual(person["region"], "southwest")
            self.assertEqual(person["distributor"], f"NPP {company} - Khu vực Tây Nam Bộ")
            self.assertTrue(row["D"].endswith("Miền Bắc"))  # Source row is never mutated.

    def test_business_blocks_and_regular_region_labels(self):
        for number, region in [(52, "logistics"), (61, "logistics"), (62, "xnk"),
                               (67, "xnk"), (68, "chemicals"), (72, "chemicals")]:
            person = participant_from_row({"B": f"Y{number}", "D": "Tên công ty", "E": "Khách hàng"}, "third")
            self.assertEqual(person["region"], region)
        person = participant_from_row({"B": "Y 01", "D": "NPP - Khu vực Miền Trung", "E": "Khách hàng"}, "special")
        self.assertEqual(person["region"], "central")
        self.assertEqual(person["number"], "01")

    def test_unknown_region_is_reported(self):
        with self.assertRaisesRegex(ValueError, "Không xác định"):
            participant_from_row({"B": "Y25", "D": "NPP thiếu vùng", "E": "Khách hàng"}, "third")


if __name__ == "__main__":
    unittest.main()
