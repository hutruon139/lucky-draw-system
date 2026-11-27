# Lucky draw 2026

Giao diện theo thiết kế "Trọn niềm tin – Chung bước thịnh vượng", khổ 2816×1536 đúng bằng màn LED trung tâm (tự co giãn vừa màn hình khác, không bị cắt). Chạy với Node.js 20+:

```sh
npm ci
npm run dev
npm test
npm run build
```

## Quy tắc

- 15 giải ba → 1 giải nhì → 1 giải nhất → 1 giải đặc biệt; mỗi lượt một người.
- Giải ba: 48 người (Y25–Y72), quay ngẫu nhiên, không chia quota theo khu vực.
- Giải nhì và nhất: quay chung 9 người (Y10–Y15, Y17, Y18, Y20); người đã trúng giải nhì không quay tiếp giải nhất.
- Giải đặc biệt: 4 người (Y01, Y02, Y04, Y06).
- Một người chỉ trúng một lần. Chọn đều giữa những người còn hợp lệ bằng Web Crypto.

## Dữ liệu

61 người trong `src/data/participants.json`, lấy từ file "DS CODE BỐC THĂM TRÚNG THƯỞNG": mã `Y NN` (lưu 2 chữ số), tên kèm Ông/Bà (cột E), dòng NPP hiển thị (cột D) và danh sách quay (`third`, `main` = nhất & nhì, `special`). Đặt `"isEligible": false` để loại một người vắng mặt.

Nhập lại từ Excel (sẽ ghi đè danh sách JSON):

```sh
python3 scripts/import_participants.py /path/to/data.xlsx
```

## Màn hình

Mỗi giải có 4 màn hình: Stand by → Quay số → Công bố → Trao giải. Ảnh nằm trong `assets/screens/`; mã, tên và dòng NPP do app vẽ lên. Khi quay, số nhòe theo tốc độ rồi rõ dần khi dừng. Khi designer cập nhật ảnh, tải thư mục Drive "LUCKY DRAW" rồi chạy (cần `pip install pillow numpy`):

```sh
python3 scripts/prepare_screens.py "/path/to/LUCKY DRAW"
```

Script xóa chữ mẫu trên màn Quay số và Công bố theo vị trí trong thiết kế. Nếu bố cục thay đổi, cập nhật tọa độ trong script và trong `src/index.css`.

## Vận hành

| Màn hình | Thao tác |
|---|---|
| Stand by | Bấm **Bắt đầu**, hoặc phím Space / Enter / → / PageDown |
| Quay số | Bấm chuột bất kỳ đâu hoặc các phím trên để dừng |
| Công bố | Giải ba: bấm **Tiếp tục** để quay luôn lượt kế tiếp (sau người thứ 15 sang Trao giải). Giải khác: bấm chuột hoặc phím để sang Trao giải |
| Trao giải | Bấm chuột hoặc phím để sang Stand by của giải tiếp theo |

Remote trình chiếu thường gửi PageDown / → nên dùng được. Khi mở trang, màn hình đen tới khi tải xong toàn bộ ảnh nền và font; mọi ảnh nền được giữ sẵn nên khi đổi màn, ảnh nền và số/chữ hiện cùng lúc. Sau mỗi lần đổi màn hình, app bỏ qua thao tác trong 0,8 giây để tránh bấm đúp. Sau khi hai ô số dừng, giữ mã 1,5 giây rồi công bố. Animation dùng requestAnimationFrame, vị trí theo thời gian và transform; thay đổi kích thước không thay đổi mã đích.

Chỉ vận hành bằng một tab trình duyệt trên laptop (F11 để toàn màn hình) rồi mirror màn hình. Phiên được lưu tại localStorage `lucky_draw_2026_v2`; reload khi đang quay sẽ về Stand by với đúng người đã chọn, reload sau khi dừng sẽ khôi phục người trúng. Để chạy thử lại, đóng các tab khác rồi nhấn phím **R** (không kèm Ctrl/Alt/Cmd) ở bất kỳ màn hình nào và xác nhận: app xóa đúng key này và về Stand by giải ba đầu tiên. Thao tác không thể hoàn tác; bấm Cancel để giữ nguyên kết quả và không nhấn R khi đang chạy sự kiện. Nếu dữ liệu đã lưu không hợp lệ hoặc không lưu được, app hiện thông báo lỗi; nhấn R và xác nhận để xóa dữ liệu lỗi và bắt đầu lại. Nếu không xóa được localStorage, app báo lỗi và giữ nguyên dữ liệu cũ.

Chưa có âm thanh, nhập danh sách qua giao diện hay backend đồng bộ.
