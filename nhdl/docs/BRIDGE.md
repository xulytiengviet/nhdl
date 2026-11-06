# NHDL 0.2 — BilaScript frontend và VHDL backend

**Luồng demo:** [SPEC.md](SPEC.md) 0.4 chốt BilaScript là frontend dựa trên CVNSS4.0. Lexer/parser BilaScript tạo AST; compiler NHDL kiểm tra profile và sinh VHDL-2008 với nhdl_ternary. CLI nhdlc.mjs và Studio dùng chung module compile. Adapter văn bản/Base27 là tiện ích riêng, không bắt buộc cho biên dịch.

## Phần đã chạy được
- `site/bridge/adapter.mjs`: oracle đính kèm 5.0.0-audit-safe, alphabet có phiên bản,
  transport Unicode, lưu ứng viên và lựa chọn của người dùng.
- `site/bridge/frontend.mjs`: **parser thật của BilaScript v4** → kiểm tra profile
  RTL → VHDL-2008 + source map v3 + testbench vét cạn.
- `tools/nhdlc.mjs`: CLI chạy GHDL với timeout, báo cáo gắn hash.
- `site/studio.html`: giao diện chạy cục bộ, tải artifact và hồ sơ yêu cầu trợ lý.

## 1. Hợp đồng ngôn ngữ và transport
Schema `nhdl-vietnamese/1.0.0`; alphabet `tritlab-space-az/1.0.0` có đúng chuỗi
` ABCDEFGHIJKLMNOPQRSTUVWXYZ`. SPACE=0, A=1…Z=26; ID−13 là giá trị cân bằng.
Trit theo thứ tự cao→thấp, giá trị -1/0/+1. Bảng này đối chiếu trực tiếp
[TRITLAB CVNSS](https://xulytiengviet.github.io/trit/cvnss.html), không tự đặt lại
thứ tự của bảng hay gọi nó là tiêu chuẩn chính thức CVNSS4.0.

Packet lưu `sourceMode`, `sourceText` nguyên bản, `normalizedText` NFC,
`cqn/cvn/cvss`, `oracle.version`, bảng alphabet đầy đủ, `frames`, `words`.
Mỗi khung symbol có `{kind:'symbol', id, lower, trits}`; Unicode ngoài bảng dùng
`{kind:'unicode',codepoint}`. Đây là framing JSON của NHDL, **không phải giao thức
thuần trit hoặc bitstream tổng hợp được**. Chưa có serializer Unicode sang bus RTL.
Không biến dấu câu/emoji thành ký hiệu thứ 28. Uppercase chỉ áp dụng ASCII trong
bảng; case được giữ riêng. Lone surrogate bị từ chối. Giới hạn 20.000 UTF-16 units.

`decodeFrames(packet)` kiểm tra schema, alphabet version, bảng ký hiệu, ID, trit,
case và scalar Unicode; khôi phục đúng chuỗi **cvss**, không tự suy đoán CQN gốc.
Mỗi word lưu offset UTF-16 [start,end) trong chuỗi cvss, candidates nguyên danh sách
oracle, canonical, ambiguous, critical, status và selection. Người dùng chọn nghĩa
bằng `selectCandidate`; chỉ chấp nhận giá trị có trong candidates. Hồ sơ JSON lưu
đầy đủ lựa chọn, không sửa đè tập ứng viên. Chưa có xếp hạng ngữ cảnh/Viterbi.
Độ tin cậy của oracle khác với khả năng round-trip transport. Việc giữ sourceText
cho phép đọc lại nguyên bản nhưng không làm cho bản thân bộ chuyển chữ thành lossless.
Chữ trong URL có thể được oracle xử lý; adapter giữ nguyên đầu vào để đối chiếu,
không hứa ngữ nghĩa URL được bảo toàn trong trường cvss.

## 2. Profile BilaScript RTL
Backend `nhdl-bila-rtl/0.2.0` dùng lexer, parser, vocabulary và bộ tạo source map
v4 từ commit ghi trong PROVENANCE.json. Không sửa repo BilaScript, không chuyển
JavaScript runtime thành phần cứng và không tuyên bố hỗ trợ toàn bộ BilaScript.

```javascript
---bila:strict---
haml_sob tong(a: trit, b: trit): trit {
  trov_ved a + b;
}
```

Chỉ một hàm thường, 1–3 tham số Identifier duy nhất; kiểu `trit` tường minh cho
mọi cổng và kết quả; một ReturnStatement. Literal 0,1 và unary - tạo -1.
Hằng N/O/P/X; biểu thức +,-,*; sti/buf/inc/dec/tmin/tmax/tcmp/mux theo đúng arity.
Biểu thức tối đa 128 nút, nguồn tối đa 10.000 UTF-16 units. Không hỗ trợ vòng lặp,
I/O, closure, async, generator, object, array, assignment, nhiều hàm hoặc built-in JS.
Tên chưa khai báo, kiểu khác trit, sai arity và AST ngoài profile gây diagnostic
mã E_* tiếng Việt kèm dòng/cột. Tên entity cố định `generated`, cổng p0,p1,p2,
output y để tránh reserved word và va chạm tên VHDL không phân biệt hoa/thường.
`ports` giữ ánh xạ tên gốc. Không chạy eval/Function hoặc mã JS do người dùng nhập.

+/- là số học một trit modulo cân bằng 3; không phải phép toán number JavaScript.
Nếu cần carry, dùng core full_add riêng; profile này chưa hỗ trợ record return.
X lan truyền, mux chỉ phụ thuộc selector và nhánh chọn. Source map v3 ánh xạ ở
mức khai báo và câu trả về, không phải từng token. `sourcesContent` giữ mã gốc.

## 3. Cổng kiểm chứng và điều phối

```sh
node --test nhdl/tests/web.test.cjs nhdl/tests/bridge.test.mjs
node nhdl/tools/nhdlc.mjs nhdl/examples/tong.bila --out nhdl/build/generated --verify
```

Đầu ra: generated.vhd, tb_generated.vhd, generated.vhd.map, verification.json;
nếu synthesis đạt còn có synthesized.vhd. CLI biên dịch lại từ input.bila,
không tin trạng thái PASS trong JSON do bên ngoài gửi vào. GHDL được gọi bằng
spawnSync argument array, không shell; chạy trong thư mục tạm, 20 giây/bước,
log tối đa 2 MiB; mô phỏng giới hạn 100 ns và yêu cầu marker hoàn thành testbench.
Biến GHDL có thể trỏ tới binary cài đặt. Temp được dọn khi xong.

Duyệt 4^n đầu vào gồm X (4/16/64 vector). Expected tạo bởi bộ đánh giá số học
của backend, không gọi hàm VHDL của DUT. Đây là kiểm tra tính nhất quán backend,
**không chứng minh yêu cầu tự nhiên của người dùng đã đúng**. Cần test độc lập
cho ý định thiết kế, formal nếu cần, rồi FPGA benchmark. Report gắn SHA-256 của
nguồn/VHDL/testbench, version GHDL và log từng bước; không có chữ ký tin cậy.
CLI không có --verify trả NOT_RUN; lỗi GHDL hoặc timeout trả FAIL và exit code 1.

## 4. TinyLLM / TinyBila
`assistantRequest` tạo schema nhdl-assistant-request/1.0.0 với prompt, profile,
nguồn TinyLLM Vietnamese và ràng buộc sinh mã. `inference=NOT_CONNECTED` là trạng
thái thật: chưa có checkpoint, API, token, suy luận hoặc benchmark mới được nối.
Người dùng có thể gửi hồ sơ cho model riêng, dán mã đề xuất vào Studio, xử lý
lỗi static rồi chạy CLI kiểm chứng. TinyBila chưa được tích hợp runtime.
Không gửi nội dung lên dịch vụ ngoài; không gọi API do model đề xuất.

## 5. Ghi nhận và giới hạn
Converter giữ nguyên từng byte của tệp người dùng cung cấp và header. Tệp không
có khai báo giấy phép riêng; không gán lại MIT/GPL cho converter. Các thành phần
BilaScript vendored giữ MIT LICENSE. NHDL mới vẫn GPL-3.0-or-later, với các ngoại
lệ vendor nói trên. Xem NOTICE.md và PROVENANCE.json (hash và nguồn đã đối chiếu).

Studio giữ dữ liệu trong bộ nhớ phiên; tải JSON là thao tác lưu rõ ràng. Không có
backend lưu trữ, localStorage tự động, model đang chạy hay upload ngầm.

## Tương thích cấu hình Pages
Kho hiện có cả workflow NHDL và Pages từ master/root. Hai tệp index.html và
studio.html ở gốc chuyển tới nhdl/site/ khi dùng Pages theo nhánh; workflow
NHDL cũng đóng gói cùng cây nhdl/site và hai entrypoint ở gốc. Nhờ vậy cả hai chế độ
đều mở đúng giao diện, không hiển thị README thay trang. Nên chọn Source:
GitHub Actions trong Settings/Pages để chỉ còn một luồng phát hành.
