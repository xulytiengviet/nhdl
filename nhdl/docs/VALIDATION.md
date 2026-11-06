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
