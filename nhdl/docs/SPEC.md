# NHDL — BilaScript frontend (CVNSS4.0) → VHDL-2008

**Đặc tả luồng demo 0.4 · Hiện thực Studio/backend 0.2 · Core RTL 0.1**
Chủ dự án: Dai‑Long Ngo‑Hoàng (Long Ngo). Chiến lược A: tái sử dụng VHDL-2008 và công cụ FPGA.

## 1. Mục tiêu: demo nhanh trên luồng NHDL hiện có

**Sử dụng BilaScript làm frontend; CVNSS4.0 là nền tảng từ vựng/cú pháp của frontend đó. NHDL biên dịch tập con phần cứng BilaScript sang VHDL-2008, dùng thư viện `nhdl_ternary` để hiện thực phép toán trit.**

Luồng demo: **BilaScript (cú pháp CVNSS4.0) → phân tích/kiểm tra kiểu → sinh VHDL-2008 + nhdl_ternary → GHDL → công cụ FPGA.** Người dùng viết BilaScript thay cho VHDL; Studio trình bày hai khung song song: nguồn BilaScript bên trái, VHDL được sinh ra bên phải. Trên màn hình hẹp hai khung xếp dọc để dễ đọc.

CVNSS4.0 không được tách thành một compiler frontend độc lập với BilaScript. Frontend ngôn ngữ dùng lexer/parser và vocabulary BilaScript v4; backend NHDL kiểm tra profile RTL và hạ mã sang VHDL. `nhdlc.mjs` là CLI điều phối toàn luồng, gọi module biên dịch dùng chung với Studio. Trình duyệt không chạy file CLI Node.js, nhưng sử dụng cùng hàm `compile` trong `site/bridge/frontend.mjs`.

| Thành phần | Vai trò trong demo |
|---|---|
| CVNSS4.0 | Nền tảng từ vựng và cách biểu đạt của BilaScript |
| BilaScript frontend | Nguồn `.bila`, lexer/parser, AST và vị trí nguồn |
| NHDL compiler | Kiểm tra tập con kiểu trit; sinh RTL/source map/testbench |
| VHDL-2008 + nhdl_ternary | Đầu ra backend và thư viện số học/logic tam phân |
| GHDL | Phân tích, mô phỏng và kiểm tra tổng hợp trung gian |
| Toolchain FPGA | Mapping, place-and-route, timing và bitstream; chưa tích hợp target |
| Adapter văn bản/Base27 | Tiện ích bổ sung; không phải bước bắt buộc trước biên dịch |
| TinyLLM/TinyBila | Hỗ trợ đề xuất/điều phối tùy chọn; chưa nối inference |

Mục tiêu trước mắt là demo được bằng mã đang có, tái sử dụng parser và luồng biên dịch NHDL. Chỉ tập con phần cứng được hỗ trợ; không tuyên bố mọi chương trình BilaScript đều tổng hợp được.

## 2. Viết BilaScript, xem VHDL sinh ra

Mở Studio, chọn ví dụ hoặc sửa khung trái, bấm **Biên dịch → VHDL-2008**. Khung phải hiển thị kết quả thật từ compiler. Có thể chọn xem testbench/source map và tải artifact.

### Nguồn frontend: BilaScript dựa trên CVNSS4.0

```javascript
---bila:strict---
haml_sob tong(a: trit, b: trit): trit {
  trov_ved a + b;
}
```

`haml_sob` khai báo hàm, `trov_ved` trả biểu thức. `trit` và N/O/P/X là ký hiệu kỹ thuật được profile hỗ trợ. Giữ chỉ thị và phần mở rộng hiện có để tái sử dụng parser.

### Đầu ra backend: VHDL-2008 hợp lệ

```vhdl
use work.nhdl_ternary.all;
entity generated is
  port(p0, p1 : in FakeTrit; y : out FakeTrit);
end;
architecture rtl of generated is
begin
  y <= (p0 + p1);
end;
```

Đây là đầu ra của ví dụ trên, không phải đoạn VHDL dựng sẵn để giả lập compiler. Các tên cổng được đổi thành p0/p1 và truy vết về nguồn bằng mapping/source map. `+` gọi ngữ nghĩa một trit của `nhdl_ternary`: P+P=N theo modulo cân bằng 3, không phải tổng có carry.

**“Hiển thị cú pháp CVNSS4.0 dựa trên VHDL-2008” trong demo này nghĩa là hiển thị nguồn BilaScript mang từ vựng CVNSS4.0 cạnh VHDL backend tương ứng.** Nó không có nghĩa chỉ đổi màu/nhãn VHDL, hoặc dịch ngược tùy ý một tệp VHDL thành BilaScript.

### 2.1 Tập con được hỗ trợ

- Một hàm tổ hợp thường, từ 1 đến 3 tham số Identifier duy nhất.
- Kiểu `trit` tường minh cho mọi tham số và kết quả; một câu `trov_ved`.
- Hằng N/O/P/X, literal 0, 1, unary `-`; phép `+`, `-`, `*`.
- Cổng `buf`, `sti`, `inc`, `dec`, `tmin`, `tmax`, `tcmp`, `mux` với đúng số đối số.
- Nguồn tối đa 10.000 đơn vị UTF-16, biểu thức tối đa 128 nút AST.

Backend phải từ chối kiểu sai, tên chưa khai báo, sai số đối số và cấu trúc ngoài profile bằng diagnostic E_* có dòng/cột. Vòng lặp, I/O, async, object/array, nhiều hàm, trạng thái và khai báo clock/reset chưa được frontend hiện tại hỗ trợ. Mẫu VHDL thanh ghi trong backend không đồng nghĩa frontend đã sinh được mạch tuần tự.

### 2.2 Quản lý đa nghĩa

Từ khóa lập trình phải ánh xạ theo vocabulary có phiên bản, với định danh ngữ nghĩa xác định. Không giải mã ngược tùy ý từ khóa bằng canonical của bộ chuyển chữ. Không chạy converter trên toàn bộ mã rồi thay đổi identifier, chuỗi, đường dẫn hoặc toán tử.

Adapter văn bản là tiện ích backend chuẩn bị/kiểm toán biểu diễn: giữ `sourceText`, NFC, phiên bản oracle, tập ứng viên, vị trí UTF-16 và lựa chọn người dùng. Canonical không chứng minh nghĩa gốc. Ứng viên văn bản chưa được chọn có thể lưu trong hồ sơ; nếu một sự mơ hồ ảnh hưởng token hoặc ý nghĩa thiết kế thì phải giải quyết trước khi chấp nhận nguồn để tổng hợp. Cơ chế giải quyết tự động theo ngữ cảnh chưa có.

## 3. Kiểu trit và ngữ nghĩa phần cứng

| Giá trị nguồn | Giá trị toán học | Mã backend FakeTrit |
|---|---:|---|
| N | −1 | 10 |
| O | 0 | 00 |
| P | +1 | 01 |
| X | lỗi/không hợp lệ | 11 |

`FakeTrit` là subtype `bit_vector(1 downto 0)`. `FakeTriad` là 6 bit cho 3 trit; trit thấp ở bit 1..0. Giá trị n trit là Σ(tᵢ·3ⁱ), miền ±(3ⁿ−1)/2. Clock/reset là tín hiệu điều khiển nhị phân riêng, không dùng trit để suy diễn cạnh clock.

| Phép toán | Ngữ nghĩa bắt buộc |
|---|---|
| sti / buf | Đổi dấu / giữ nguyên |
| inc / dec | Chu kỳ N→O→P→N / chu kỳ ngược |
| + / − | Một trit modulo cân bằng 3; bỏ carry |
| * | Tích hai trit |
| tmin / tmax | Min/max theo thứ tự số học −1<0<+1 |
| tcmp | N nếu nhỏ hơn, O nếu bằng, P nếu lớn hơn |
| mux(sel,neg,zero,pos) | Chọn nhánh theo N/O/P; selector X trả X |
| full_add / half_add | Backend core trả s/carry, a+b+ci=s+3·carry; chưa hỗ trợ record return ở frontend |

Ví dụ P+P=N trong phép toán một trit; full_add(P,P,O) trả s=N, carry=P, biểu diễn số 2. Phép số học và min/max/cmp truyền X. Mux không bị ảnh hưởng bởi X ở nhánh không chọn. `=` của BIT_VECTOR vẫn so sánh encoding; không dùng thứ tự `<`/`>` của BIT_VECTOR cho thứ tự số học trit.

X=11 là **mẫu hai bit thật**, không phải don't-care cho tối ưu FPGA và không phải U/X/Z của std_logic. Backend không được tự bỏ các trường hợp X khỏi bảng chân lý. BIT_VECTOR mặc định bằng 0 có thể hiện O; vì vậy testbench cần khởi tạo rõ X và thiết kế tuần tự cần reset xác định. Một driver cho mỗi tín hiệu; chưa có resolution nhiều driver.

## 4. Backend biểu diễn: CVNSS, Base27 và framing

Oracle chốt `5.0.0-audit-safe`; hash và nguồn trong [PROVENANCE.json](PROVENANCE.json). Alphabet `tritlab-space-az/1.0.0` dùng chuỗi ` ABCDEFGHIJKLMNOPQRSTUVWXYZ`, SPACE=0, A=1…Z=26; đây là quy ước TRITLAB, không phải tiêu chuẩn chữ viết chính thức.

ID 0..26 ↔ giá trị cân bằng ID−13 ↔ ba trit cao→thấp. Cờ case lưu riêng; ký tự ngoài bảng được giữ bằng khung Unicode. Packet `nhdl-vietnamese/1.0.0` giữ bản gốc, bản NFC, CQN/CVN/CVSS, frames, words/candidates/canonical/selection. Transport khôi phục chuỗi CVSS; không bảo đảm suy ra nguyên văn CQN.

**Không bắt buộc mã nguồn phải đi qua Base27 để biên dịch.** Có hai đường xử lý riêng:
1. Mã nguồn CVNSS4.0 có cấu trúc → parser/kiểu → sinh RTL.
2. Văn bản/dữ liệu CVNSS4.0 → adapter → ID/triad hoặc Unicode framing.

JSON framing chưa là giao thức bus hay khối RTL Unicode; chưa có bộ nạp ROM từ packet. Ba trit có 27 giá trị; điều này không có nghĩa mọi token lập trình/model đều nằm trong 27 ký hiệu, hay FPGA tiết kiệm năng lượng chỉ nhờ đổi bảng mã.

## 5. Frontend BilaScript và backend NHDL hiện có

BilaScript v4 lexer/parser/vocabulary được vendored có commit và MIT LICENSE. Backend kiểm tra AST theo profile `nhdl-bila-rtl/0.2.0`, sinh entity `generated`, cổng p0..p2 và output y. Ánh xạ tên nguồn giữ trong kết quả; source map v3 lưu sourcesContent và vị trí khai báo/câu trả về. Chưa có tệp IR phần cứng độc lập; hiện backend hạ trực tiếp AST đã kiểm tra thành VHDL.

Đầu ra: `generated.vhd`, `tb_generated.vhd`, `generated.vhd.map`, `verification.json`; thêm `synthesized.vhd` nếu bước tổng hợp GHDL đạt. Testbench duyệt 4ⁿ đầu vào kể cả X và so sánh RTL với bộ đánh giá profile. Đây là kiểm tra backend, không chứng minh thiết kế đúng ý định tiếng Việt; yêu cầu chức năng vẫn cần test độc lập.

```sh
node nhdl/tools/nhdlc.mjs nhdl/examples/tong.bila --out nhdl/build/generated --verify
```

CLI chạy analyze → elaborate → simulate → GHDL synthesis; timeout 20 giây/bước, mô phỏng 100 ns, kiểm tra marker hoàn thành. Báo cáo có SHA-256 nguồn/VHDL/testbench và log công cụ. Lỗi hoặc thiếu GHDL trả FAIL, xóa output cũ để tránh dùng nhầm. Trình duyệt sinh mã nhưng luôn báo GHDL NOT_RUN. Kết quả GHDL synthesis **chỉ là kiểm tra bước tổng hợp trung gian**, chưa tạo bitstream hoặc chứng nhận timing FPGA.

## 6. Backend FPGA: hợp đồng triển khai đích

Phần này là **yêu cầu kỹ thuật cho bước FPGA tiếp theo**, chưa phải tính năng đã chạy trong CLI hiện tại.

### 6.1 Hồ sơ mục tiêu

Mỗi build FPGA phải khóa: board/revision, vendor, device/part/package/speed grade, phiên bản toolchain, top entity, clock và đơn vị thời gian, reset polarity/synchronousness, pin mapping, I/O standard, nguồn constraint, hash nguồn và seed triển khai nếu công cụ hỗ trợ. Không tự đoán chân hay điện áp từ tên bo mạch. Hồ sơ còn thiếu dữ liệu phải dừng trước tạo/nạp bitstream.

### 6.2 Mạch tổ hợp và tuần tự

Frontend hiện chỉ tạo mạch tổ hợp. Clock/reset/enable/độ trễ pipeline phải được khai báo tường minh trong profile tuần tự tương lai trước khi backend được phép sinh thanh ghi. Không diễn giải thứ tự dòng nguồn như thứ tự chạy CPU. VHDL signal/process/delta cycle là cơ chế backend mô hình hóa tính song song. `after`/`wait for` trong testbench không được coi là delay vật lý tổng hợp được.

Các miền clock phải có CDC/reset-domain review; bất đồng bộ cần đồng bộ hóa hoặc giao thức crossing phù hợp. Không tự chèn pipeline làm đổi latency giao diện khi chưa có hợp đồng. Backend phải phát hiện latch ngoài ý muốn, combinational loop, multiple driver và clock không có constraint.

### 6.3 Các bước đầu ra

| Bước backend FPGA | Đầu vào | Artifact và điều kiện nghiệm thu |
|---|---|---|
| RTL verification | VHDL + testbench + đặc tả hành vi | Không assertion lỗi; test độc lập cho chức năng |
| Synthesis/mapping | RTL + target + constraints | Netlist và LUT/FF/BRAM/DSP; xử lý mọi cảnh báo nghiêm trọng |
| Place-and-route | Netlist + placement/timing constraints | Thiết kế đã route, báo cáo tài nguyên và timing |
| Timing sign-off | Clock/IO constraints và routed design | Mọi đường yêu cầu được constraint; slack đạt yêu cầu; exception có lý do |
| Bitstream | Routed design đã đạt | Bitstream + manifest/hash; đúng part/board |
| Board validation | Bitstream + test I/O | Log nạp, test chức năng/reset, kết quả so với oracle |

Backend có thể dùng hệ công cụ phù hợp thiết bị (Vivado, Quartus hoặc chuỗi công cụ mở hỗ trợ target). Không mặc định hỗ trợ mọi FPGA. Điểm tích hợp hiện có mới đến GHDL; chưa có adapter vendor, file pin/clock constraint, place-and-route hay nạp board trong NHDL.

### 6.4 KPI đo được

Báo cáo LUT/FF/BRAM/DSP, chu kỳ latency, throughput tại clock đã đạt timing, timing slack/Fmax theo phương pháp công bố, tần suất lỗi và công suất đo trên board. So sánh tam phân với đối chứng nhị phân trên cùng chức năng, độ chính xác, workload, target và tool options. Energy/task chỉ tính với tác vụ đạt tiêu chí chất lượng; ghi thiết bị đo và cách loại công suất nền. Không quy đổi tiết kiệm bit thành tiết kiệm watt khi chưa đo.

## 7. Backend AI và điều phối

TinyLLM/TinyBila nằm trong backend hỗ trợ **tùy chọn**. Chúng có thể đề xuất mã frontend CVNSS4.0, testbench hoặc lịch chạy công cụ, nhưng không thay đổi grammar, quy tắc kiểu hay bỏ qua cổng kiểm chứng. Biên dịch phải hoạt động khi không có model. Mọi bản mã sinh cần qua cùng parser/kiểu, kiểm chứng RTL và các bước FPGA tương ứng.

Hiện có hồ sơ `nhdl-assistant-request/1.0.0`, profile và ràng buộc sinh mã; inference là NOT_CONNECTED. TinyBila chưa nối runtime. Không có checkpoint tiếng Việt, model trên FPGA hay benchmark AI mới được xác nhận trong kho này. Đề xuất của model không được tự thực thi shell hoặc tự nạp FPGA.

## 8. Mức trưởng thành và cổng nghiệm thu

| Cổng | Trạng thái thực tế |
|---|---|
| F0 — nguồn CVNSS4.0 có cấu trúc | Tập con tổ hợp trit hoạt động qua parser BilaScript |
| B1 — adapter/vocabulary/provenance | Có phiên bản, ứng viên và hash |
| B2 — AST/type → VHDL/source map | Đã hiện thực cho profile 0.2 |
| B3 — GHDL simulation/synthesis | Đã kiểm thử; báo cáo VALIDATION.md và CI |
| B4 — IR độc lập/profile tuần tự/vector | Chưa hiện thực đầy đủ |
| B5 — mapping/place-and-route/timing | Chưa tích hợp target FPGA |
| B6 — bitstream/nạp board/đo KPI | Chưa thực hiện |

Đặc tả luồng demo 0.4 đổi cách tổ chức khái niệm; không tự nâng phiên bản API backend 0.2 hoặc core 0.1. Các yêu cầu FPGA ở mục 6 chỉ được đánh dấu đạt sau khi có artifact và bằng chứng thực thi.

## 9. Tái lập và nguồn

```sh
make -C nhdl test
make -C nhdl synth
node --test nhdl/tests/web.test.cjs nhdl/tests/bridge.test.mjs
node nhdl/tools/nhdlc.mjs nhdl/examples/tong.bila --out nhdl/build/generated --verify
```

Nguồn: [TRITLAB](https://xulytiengviet.github.io/trit/cvnss.html), [BilaScript](https://github.com/xulytiengviet/bilascript), [TinyLLM Vietnamese](https://xulytiengviet.github.io/TinyLLM_Vietnamese/), [GHDL](https://ghdl.github.io/ghdl/), [ternary.vhd](https://gitlab.com/ternary/ternary/-/blob/master/vhdl/ternary.vhd).
Xem [BRIDGE.md](BRIDGE.md) cho hợp đồng triển khai backend, [PROVENANCE.json](PROVENANCE.json) cho hash/phiên bản và [VALIDATION.md](VALIDATION.md) cho kiểm thử. Giấy phép GHDL và vendor được giữ riêng theo NOTICE.md; không gán lại MIT/GPL cho converter người dùng cung cấp khi tệp không có giấy phép riêng.
