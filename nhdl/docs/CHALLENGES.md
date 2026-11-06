# Danh mục 400 bài toán kỹ thuật NHDL

Chuyên mục: [400 bài toán](https://xulytiengviet.github.io/nhdl/nhdl/site/challenges.html). Dữ liệu chuẩn: [challenges.json](../site/challenges.json), schema `nhdl-challenges/1.0.0`.

## Phạm vi

“Sáng chế” trong chuyên mục được dùng theo nghĩa bài toán thách thức nghiên cứu. Danh mục không tuyên bố 400 phát minh độc lập hoặc quyền độc quyền. Một số chủ đề giao nhau nhưng được xem ở các tầng khác nhau.

Mỗi mục chỉ có mô tả sơ bộ bản chất và lý do nút thắt; không trình bày giải pháp chi tiết. Phân loại `core` chỉ các vấn đề thuộc luồng nền tảng, `extension` chỉ các vấn đề phát sinh khi chọn năng lực mở rộng. Không khẳng định mọi hướng AI, ứng dụng hoặc vật liệu là điều kiện bắt buộc để chạy lại demo NHDL.

## Trạng thái ban đầu

Theo yêu cầu danh mục: **400 chưa giải quyết, 0 đang giải quyết, 0 đã giải quyết**. `status=unresolved`, `phase=planned` nghĩa “sẽ giải quyết”, chưa cam kết thời hạn. Các kết quả GHDL hiện có trong SPEC vẫn giữ nguyên; chưa đủ bằng chứng đóng bài toán nghiên cứu ở phạm vi rộng.

Khi cập nhật tiến độ, sửa dữ liệu chuẩn cùng bằng chứng và phạm vi:

- `unresolved / planned`: chưa có hồ sơ nghiệm thu.
- `in_progress / active`: có công việc đang thực hiện, liên kết issue/PR hoặc báo cáo.
- `resolved / completed`: gắn phiên bản, điều kiện thử, bằng chứng và giới hạn kết luận.

Thống kê trang danh mục tính trực tiếp từ dữ liệu. Khi đổi trạng thái cần đồng bộ thẻ tóm tắt ở trang chủ. Không có nút cho khách truy cập tự đổi trạng thái công khai.

## Nguồn và biên tập

Tệp cung cấp `deepseek_html_20261106_c22c6c.html` ghi 400 nhưng có 352 bản ghi thật trong 14 nhóm A–N. Giữ mã gốc; bổ sung 48 bài toán thực nghiệm nhóm O để đủ 400. Hash tệp gốc lưu trong trường `source` của JSON.

Đã chuyển nội dung sang phạm vi kỹ thuật và bỏ các mục chiến lược bảo hộ/design-around. Sửa các khẳng định không phù hợp: STI là đảo dấu; ba trit chỉ chứa 27 giá trị; lượng tử hóa không mặc định lossless; mã X không mặc định don’t-care; mã nguồn BilaScript không giới hạn ở 27 ký hiệu; bitstream cấu hình khác dữ liệu trit nén. Mức `level` giữ để tham khảo phân loại ban đầu, không được dùng làm kết luận về tính bắt buộc hoặc quyền bảo hộ và không hiển thị như đánh giá đã kiểm chứng.

## Kiểm tra dữ liệu

`node --test nhdl/tests/challenges.test.mjs` kiểm tra đủ 400 ID duy nhất, 15 nhóm, trạng thái và các bộ lọc. Dữ liệu được hiển thị bằng DOM textContent, không thực thi HTML trong mô tả.
