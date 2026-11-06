# NHDL 0.1 — Đặc tả kỹ thuật

Ngày: 06-11-2026 · Chủ dự án: Dai‑Long Ngo‑Hoàng (Long Ngo).
Trạng thái: nguyên mẫu tham chiếu, chiến lược A.

## 1. Phạm vi và cú pháp
NHDL là profile/thư viện mô tả phần cứng tam phân cân bằng trên VHDL-2008.
Tệp `.vhd` dùng `use work.nhdl_ternary.all;` là VHDL hợp lệ.
Không thay parser GHDL, không giới thiệu từ khóa tiếng Việt vào VHDL.
Tên tín hiệu ASCII và chú thích tiếng Việt hỗ trợ giảng dạy.
Kho này vốn là fork `ghdl/ghdl`; NHDL nằm riêng trong `nhdl/`.

## 2. Biểu diễn
| Ký hiệu | Số | BIT_VECTOR(1 downto 0) |
|---|---:|---|
| N | -1 | 10 |
| O | 0 | 00 |
| P | +1 | 01 |
| X | không hợp lệ | 11 |

`FakeTrit` là subtype, không phải kiểu độc lập. `FakeTriad` chứa 3 trit trong 6 bit;
trit thấp nhất nằm ở bit 1..0. Giá trị n trit: Σ(tᵢ·3ⁱ), miền
[−(3ⁿ−1)/2, +(3ⁿ−1)/2]. 3 trit có 27 giá trị −13..13.
Thông tin lý tưởng là log₂3 ≈ 1,585 bit/trit; mã 2-bit không phải nén tối ưu.
`X` là sentinel bằng bit thật, không phải `std_logic` X/U/Z.
BIT_VECTOR mặc định là 0: tín hiệu chưa gán có thể hiện O, không tự hiện X.
Khởi tạo rõ X khi kiểm thử; không dựa vào khởi tạo đó để thay reset trên FPGA.
Profile chỉ dùng một driver mỗi tín hiệu; không định nghĩa resolution đa driver.

## 3. API chuẩn của phiên bản 0.1
| API | Quy tắc |
|---|---|
| valid, to_trit, to_integer, tostr | Kiểm tra, chuyển số −1..1, in N/O/P/X |
| buf, sti | Giữ nguyên; đổi dấu |
| inc, dec | Chu kỳ N→O→P→N và chu kỳ ngược |
| tmin, tmax | Min/max theo −1<0<+1; X lan truyền |
| tcmp | N nếu a<b, O nếu bằng, P nếu a>b; X nếu đầu vào lỗi |
| mux(sel,neg,zero,pos) | Chọn theo N/O/P; sel=X trả X; nhánh không chọn không ảnh hưởng |
| full_add, half_add | Trả record s/carry; a+b+ci = s+3·carry |
| +, - | Kết quả một trit theo modulo cân bằng 3, bỏ carry |
| * | Tích hai trit; X lan truyền |
| id_to_triad, triad_to_id | ID 0..26 ↔ giá trị ID−13 ↔ 6-bit |

Ví dụ P+P=N nhưng half_add(P,P)=(s=N,carry=P), biểu diễn 2.
`to_trit` ngoài −1..1 trả X. `to_integer(X)`, ID>26 và giải mã triad
có X phải gây assertion failure; giá trị trả dự phòng không hợp lệ để sử dụng.
Chạy với `--assert-level=error`. Toán tử `=` vẫn so sánh encoding (X=X đúng).
Không dùng `<`/`>` của BIT_VECTOR để so sánh trit: dùng `tcmp`.
Không ghi đè các toán tử logic bit AND/OR để tránh nhầm lẫn.
Không tuyên bố tương thích đầy đủ 15 cổng unary/15 cổng dyadic TVHDL;
chưa có bảng chân lý được kiểm chứng cho toàn bộ bộ cổng ấy trong bản này.

## 4. Thời gian, song song và tổng hợp
Entity/architecture, process, delta cycle, signal assignment và event scheduling
kế thừa VHDL. Clock dùng std_logic và rising_edge; reset mẫu là đồng bộ mức cao.
`after` và `wait for` chỉ phục vụ mô phỏng, không là cam kết tổng hợp delay vật lý.
Ví dụ ALU tổ hợp và thanh ghi có thể đưa qua GHDL --synth để kiểm tra frontend;
đó chưa phải báo cáo LUT/FF/Fmax hoặc place-and-route.
Việc ánh xạ xuống FPGA nhị phân phụ thuộc tool/device; không suy ra tiết kiệm điện
hay chắc chắn tốn hơn từ riêng mã 2-bit. ASIC ternary cần cell library và PDK phù hợp.

## 5. Base27, CVNSS4.0 và lớp tiếng Việt
Core xử lý ID số; không gán bừa thứ tự 27 ký hiệu thành chuẩn CVNSS4.0.
Adapter cần alphabet có version, đúng 27 ký hiệu duy nhất, bảng ánh xạ đảo,
normalization, framing, escape Unicode ngoài bảng và test round-trip.
Đường dự kiến: Quốc ngữ → converter CVNSS4.0 được chốt phiên bản → token ID →
triad → datapath. Chiều giải mã cần giữ văn bản gốc hoặc metadata ứng viên:
CVNSS4.0 có ánh xạ nhiều-một, canonical không chứng minh khôi phục nguyên văn.
Chỉ ID↔triad là song ánh đã hiện thực. 27 ký hiệu không đồng nghĩa toàn bộ vocab
TinyLLM chỉ có 27 token; còn EOS, padding, escape, cấu trúc và chiến lược tokenizer.
Nguồn tri thức: https://github.com/xulytiengviet/CVNSS40_Tutor

## 6. BilaScript, TinyLLM, TinyBila
| Lớp | Vai trò đề xuất | Trạng thái |
|---|---|---|
| BilaScript | Frontend xuất VHDL/IR, giữ source map và chẩn đoán tiếng Việt | Chưa có compiler trong bản này |
| TinyLLM | Gợi ý mã/testbench; model phải vượt test trước khi chấp nhận | Chưa nối inference |
| TinyBila | Runtime điều phối model và mô phỏng | Chưa xác định giao thức thực thi |
| NHDL | Kiểu trit, số học, mux, ví dụ RTL | Có mã và testbench |
| GHDL | Phân tích, elaborate, mô phỏng; frontend synthesis | Công cụ thực thi |

Hợp đồng adapter đề xuất: schema_version, alphabet_version, source_text,
tokens[], diagnostics[], source_map; không tự động thực thi mã sinh ra.
Tam phân trọng số {-1,0,+1} của model và điện tử ternary vật lý là hai tầng khác nhau.
Không có benchmark TinyLLM/TinyBila/FPGA được công bố như kết quả đo của bản này.

## 7. Kiểm chứng và lộ trình
Chạy `make -C nhdl test` rồi `make -C nhdl synth` từ gốc repo.
Testbench duyệt 64 đầu vào full adder (27 hợp lệ, 37 có X), 256 tổ hợp mux,
27 ID round-trip, cổng số học, reset/clock/delay. Waveform tại build/timing.ghw.
Bước kế tiếp: vector arithmetic có carry/overflow; adapter alphabet được phê duyệt;
so sánh oracle phần mềm; formal equivalence; FPGA LUT/FF/Fmax/power trên cùng
board, cùng workload và quality gate. Chỉ công bố energy/task sau phép đo thực.

## 8. Nguồn và giấy phép
- [GHDL](https://github.com/ghdl/ghdl): mã nền giữ giấy phép gốc và tác giả gốc.
- [Synthesis GHDL](https://ghdl.github.io/ghdl/using/Synthesis.html): frontend thực nghiệm.
- [ternary.vhd](https://gitlab.com/ternary/ternary/-/blob/master/vhdl/ternary.vhd):
  v1.4, TERNARY RESEARCH CORPORATION, GPL-3.0-or-later; đã kiểm tra header/API.
  Đây là tham chiếu encoding/API; không tuyên bố toàn bộ TVHDL đồng nhất với file này.
- [GHDL Yosys](https://github.com/ghdl/ghdl-yosys-plugin): hướng synthesis tiếp theo.
- [UVVM](https://github.com/UVVM/UVVM): tham khảo verification nâng cao.

Các kho ternlang-hdl, takahe và ip-cores được đề xuất trong brief chưa được dùng
làm dependency hoặc chứng cứ benchmark. Không đổi giấy phép cả kho thành MIT.
Phần NHDL mới dùng GPL-3.0-or-later, xem LICENSE và NOTICE.md.
