# NHDL — Đặc tả frontend CVNSS4.0 và backend FPGA

**Đặc tả kiến trúc 0.3 · Hiện thực Studio/backend 0.2 · Core RTL 0.1**
Chủ dự án: Dai‑Long Ngo‑Hoàng (Long Ngo). Chiến lược A: tái sử dụng VHDL-2008 và công cụ FPGA.

## 1. Định nghĩa và ranh giới kiến trúc

**NHDL là ngôn ngữ mô tả phần cứng có frontend dựa trên CVNSS4.0, hướng tới triển khai mạch tam phân cân bằng trên FPGA. Mọi thành phần xử lý phía sau frontend đều thuộc backend NHDL.**

Frontend là lớp ngôn ngữ mà người thiết kế sử dụng: từ vựng CVNSS4.0, cú pháp mô tả mạch, kiểu dữ liệu, quy tắc ngữ nghĩa và thông báo liên hệ về mã nguồn. Backend tiếp nhận mô tả ấy, phân tích/kiểm tra, hạ xuống biểu diễn phần cứng, sinh RTL, kiểm chứng, tổng hợp và tạo sản phẩm cho FPGA.

Đây là **ranh giới kiến trúc sản phẩm NHDL**. Trong thuật ngữ nội bộ của công cụ biên dịch, lexer/parser có thể được gọi là compiler frontend; trong tài liệu này các công cụ thực thi đó nằm phía backend NHDL. BilaScript là công nghệ parser/backend được tái sử dụng, không phải một frontend sản phẩm thứ hai cạnh CVNSS4.0. VHDL là định dạng RTL của backend, không phải ngôn ngữ nguồn bắt buộc người dùng phải viết.

CVNSS4.0 cung cấp lớp biểu đạt; tự nó chưa quy định clock, reset, cổng hoặc mạch. **Ngữ nghĩa phần cứng được quy định bởi profile NHDL**, không suy ra từ việc rút gọn tiếng Việt. Quốc ngữ tự do hoặc văn bản CVNSS bất kỳ chưa phải thiết kế tổng hợp được.

| Ranh giới | Thành phần | Trách nhiệm |
|---|---|---|
| Frontend duy nhất | Ngôn ngữ nguồn NHDL dựa CVNSS4.0 | Người dùng viết và đọc mô tả phần cứng |
| Backend ngôn ngữ | Oracle/adapter, lexer/parser BilaScript, kiểm tra kiểu/ngữ nghĩa | Chuẩn hóa, kiểm toán ứng viên, tạo AST và báo lỗi |
| Backend biểu diễn | Base27/trit codec, AST, IR phần cứng | Biểu diễn dữ liệu và hạ mô tả; IR độc lập còn là mục tiêu |
| Backend RTL | Bộ sinh VHDL-2008 và nhdl_ternary | Hiện thực mạch theo ngữ nghĩa đã chốt |
| Backend kiểm chứng | GHDL, testbench, waveform, báo cáo hash | Kiểm tra hành vi và truy vết kết quả |
| Backend FPGA | Synthesis, mapping, place-and-route, timing, bitstream, nạp board | Triển khai cho thiết bị cụ thể; chưa tích hợp đầy đủ |
| Backend hỗ trợ tùy chọn | TinyLLM/TinyBila | Đề xuất mã/test, điều phối; không quyết định ngữ nghĩa ngôn ngữ |

## 2. Frontend CVNSS4.0: hợp đồng nguồn

Nguồn phải chứa mã theo grammar/profile NHDL. Bản hiện thực 0.2 dùng phần từ vựng CVNSS4.0 của BilaScript v4, cú pháp có cấu trúc và chú thích kiểu `trit`.

```javascript
---bila:strict---
haml_sob tong(a: trit, b: trit): trit {
  trov_ved a + b;
}
```

Đoạn trên **đã biên dịch được** bằng backend hiện có. `haml_sob` khai báo hàm; `trov_ved` trả biểu thức; tên người dùng như `tong` được giữ để chẩn đoán. `trit`, N/O/P/X và tên cổng là ký hiệu kỹ thuật của profile; không tự đổi sang bí danh CVNSS chưa được chốt. Chỉ thị `---bila:strict---` và đuôi `.bila` là định dạng tương thích hiện có; chưa có lexer riêng cho `.nhdl` hoặc chỉ thị `---nhdl---`.

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

## 5. Backend biên dịch và kiểm chứng hiện có

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

Đặc tả kiến trúc 0.3 đổi cách tổ chức khái niệm; không tự nâng phiên bản API backend 0.2 hoặc core 0.1. Các yêu cầu FPGA ở mục 6 chỉ được đánh dấu đạt sau khi có artifact và bằng chứng thực thi.

## 9. Tái lập và nguồn

```sh
make -C nhdl test
make -C nhdl synth
node --test nhdl/tests/web.test.cjs nhdl/tests/bridge.test.mjs
node nhdl/tools/nhdlc.mjs nhdl/examples/tong.bila --out nhdl/build/generated --verify
```

Nguồn: [TRITLAB](https://xulytiengviet.github.io/trit/cvnss.html), [BilaScript](https://github.com/xulytiengviet/bilascript), [TinyLLM Vietnamese](https://xulytiengviet.github.io/TinyLLM_Vietnamese/), [GHDL](https://ghdl.github.io/ghdl/), [ternary.vhd](https://gitlab.com/ternary/ternary/-/blob/master/vhdl/ternary.vhd).
Xem [BRIDGE.md](BRIDGE.md) cho hợp đồng triển khai backend, [PROVENANCE.json](PROVENANCE.json) cho hash/phiên bản và [VALIDATION.md](VALIDATION.md) cho kiểm thử. Giấy phép GHDL và vendor được giữ riêng theo NOTICE.md; không gán lại MIT/GPL cho converter người dùng cung cấp khi tệp không có giấy phép riêng.
