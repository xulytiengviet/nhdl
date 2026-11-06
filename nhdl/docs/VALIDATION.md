> Cập nhật 0.5: [SPEC.md](SPEC.md) là đặc tả hiện hành; đã thêm profile clocked và target Basys 3. Nội dung dưới đây ghi phạm vi nền tảng trước mở rộng này.

# Báo cáo kiểm chứng NHDL 0.1

Ngày 06-11-2026. Môi trường Linux, GHDL 4.1.0 mcode, VHDL-2008.

| Kiểm tra đã chạy | Kết quả |
|---|---|
| Phân tích và elaborate package, ALU, register, testbench | PASS |
| Full adder 64 tổ hợp, gồm X | PASS |
| Mux 256 tổ hợp, gồm nhánh không chọn chứa X | PASS |
| 27 ID Base27 round-trip và ba mốc NNN/OOO/PPP | PASS |
| Unary, min/max, cmp, half adder, cộng/trừ/nhân | PASS |
| Clock, reset đồng bộ, delay 2 ns, thanh ghi X | PASS, dừng 26 ns |
| GHDL --synth ALU và thanh ghi | PASS, xuất generic VHDL netlist |
| Node reference model | PASS 2 nhóm exhaustive/boundary |
| Trình duyệt desktop: render, chọn X, Base27 ID=26 | PASS |
| Clipboard trên HTTP preview | Bị browser chặn; thông báo fallback hiển thị đúng |

Không có đo LUT/FF/Fmax/power; không có place-and-route FPGA, ASIC, model
inference hay compiler BilaScript. Chưa kiểm tra trực quan trên thiết bị di động.
Synthesis frontend không tương đương chứng nhận khả năng tổng hợp trên mọi vendor.
Các artifact build được tạo lại bằng Make và được CI lưu riêng, không đưa vào git.

## Cập nhật tích hợp 0.2 — 06-11-2026
- Oracle đính kèm nguyên bản: 23/23 self-test đạt.
- Node: 11 nhóm kiểm thử đạt (core web + adapter/frontend).
- Adapter: 27 ID, Unicode/emoji/case/NFC, các mã va chạm, lựa chọn ứng viên,
  từ chối schema sai và frame không nhất quán.
- Backend: kiểm tra kiểu/tên/arity/profile; source map chứa nguồn và vị trí;
  8 biểu thức mẫu (cộng, trừ, mux, cmp, STI×, INC/DEC, min, max), mỗi mẫu 16
  tổ hợp gồm X, đều đạt GHDL analyze/elaborate/simulation/synthesis frontend.
- Giao diện desktop: oracle hiển thị, chọn nghĩa ses→sẽ, E_TYPE dòng/cột,
  xóa đầu ra cũ khi nguồn đổi, sinh lại VHDL/source map đều được kiểm tra.
- Chưa nối model inference; không có benchmark FPGA hoặc ngữ nghĩa tự nhiên.

## Demo frontend BilaScript — đặc tả 0.4
Bốn ví dụ chọn nhanh được biên dịch bằng compiler dùng chung và chạy qua
GHDL simulation/synthesis: cộng 16 vector, nhân 16, STI 4, mux 64 (đều gồm X),
tất cả PASS. Bộ kiểm thử Node 11 nhóm PASS. Kiểm tra HTML: ID duy nhất, script
tồn tại, demo đứng trước adapter. Chưa xác nhận trực quan bản bố cục mới do
trình xem thử hết thời gian chờ. Core/compiler không thay đổi ngữ nghĩa.
