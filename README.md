# Lucky draw 2026

Giữ giao diện sự kiện cũ. Chạy với Node.js 20+:

```sh
npm ci
npm run dev
npm test
npm run build
```

## Quy tắc đã thống nhất

- 15 giải ba → 1 giải nhì → 1 giải nhất → 1 giải đặc biệt; mỗi lượt một người.
- Giải ba: Nhóm 3 và Logistics/XNK/Hóa chất. Quota lần lượt Bắc 4, Trung 3, Đông Nam Bộ 2, Tây Nam Bộ 1, Logistics 2, XNK 2, Hóa chất 1.
- Giải nhì và nhất: toàn bộ 15 người Nhóm 2. Dùng chung giới hạn Trung 6, Đông Nam Bộ 2, Tây Nam Bộ 1. Miền Bắc vẫn được tham gia vì yêu cầu dùng cả pool 15 người; chưa có giới hạn riêng cho miền Bắc.
- Giải đặc biệt: 6 người Nhóm 1, gồm 2 miền Trung và 4 Đông Nam Bộ.
- Một người chỉ trúng một lần. Chọn đều giữa những người còn hợp lệ bằng Web Crypto.

## Dữ liệu và vận hành

72 người từ workbook được lưu trong `src/data/participants.json`, với mã tạm 001–072 theo thứ tự dòng nguồn. Công ty trùng nhau vẫn có thể có nhiều khách khác nhau. Không dùng STT trong Excel làm mã vì STT lặp giữa các phần.

Nhập lại từ Excel (sẽ ghi đè danh sách JSON):

```sh
python3 scripts/import_participants.py /path/to/data.xlsx
```

Chỉ vận hành bằng một tab trình duyệt trên laptop rồi mirror màn hình. Phiên được lưu tại localStorage `lucky_draw_2026_v1`; reload khi đang quay giữ nguyên lựa chọn, reload sau khi nhấn Dừng sẽ khôi phục người trúng. Không có phím R reset như bản cũ. Để chạy thử lại, đóng các tab khác và xóa đúng key này trong DevTools; không xóa khi đang chạy sự kiện. Dữ liệu localStorage năm trước không được sử dụng.

Sau khi ba ô thực sự dừng, giữ mã 1,5 giây rồi công bố. Màn hình chúc mừng giữ đến khi bấm Lượt tiếp theo. Sau giải đặc biệt nút này bị vô hiệu hóa. Animation dùng requestAnimationFrame, vị trí theo thời gian và transform; thay đổi kích thước không thay đổi mã đích.

Chưa có thiết kế mới, âm thanh, nhập danh sách qua giao diện, dashboard quota hay backend đồng bộ.
