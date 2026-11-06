# Công bố đa ngôn ngữ — Team Bila · Long Ngo

Bản gốc tiếng Việt là nguồn chính thức của dự án NHDL, trit/ternary và frontend BilaScript dựa trên CVNSS4.0. Các ngôn ngữ bổ sung giúp cộng đồng quốc tế tiếp cận tài liệu công khai.

## Cách chuyển ngữ

Bộ chọn có cờ và tên bản ngữ trên trang chủ, Studio và 400 bài toán. Chọn ngôn ngữ mở bản đọc tương ứng qua Google Translate. Đây là dịch máy qua dịch vụ bên ngoài, không phải bộ 16 bản dịch được lưu trữ và thẩm định trong repository. Nếu dịch vụ bị chặn hoặc không khả dụng theo khu vực, dùng bản gốc và chức năng dịch trang của trình duyệt.

Ngôn ngữ: Anh, Nga, Trung giản thể, Khmer, Pháp, Đức, Ý, Tây Ban Nha, Bồ Đào Nha, Nhật, Hàn, Thái, Indonesia, Hindi, Ả Rập, Thụy Điển. Cờ chỉ là ký hiệu nhận diện; Hindi được chọn cho yêu cầu “Ấn Độ”, không đại diện cho mọi ngôn ngữ tại quốc gia này.

## Đồng bộ với nguồn

Chạy `python3 nhdl/tools/build_languages.py` sau khi sửa nguồn, trước commit. Workflow NHDL cũng chạy lệnh này trước kiểm tra và đóng gói Pages:

1. Đọc các trang tiếng Việt và challenges.json.
2. Dựng lại thanh ngôn ngữ và 3 bản đọc tĩnh trong site/read. Bản đọc danh mục chứa toàn bộ 400 mục, không phân trang bằng JavaScript.
3. Sinh i18n/build.json gồm phiên bản theo SHA-256, hash các nguồn, danh sách ngôn ngữ và phương thức dịch.
4. Khi người đọc chọn ngôn ngữ, Google Translate nhận URL bản đọc kèm mã phiên bản nguồn (?v=hash) mới. Nhà cung cấp có thể có cache; dự án không kiểm soát thời điểm làm mới hay chất lượng bản dịch.

Commit cả bản đọc sinh ra để GitHub Pages phục vụ từ nhánh hoặc workflow đều có nội dung tương ứng. Không sửa thủ công các bản đọc; dựng lại từ nguồn. Việc build này tạo nội dung nguồn cho dịch, **không chạy API dịch 16 ngôn ngữ trong CI**.

Mã nguồn, khối pre/code/textarea và tên ngôn ngữ có translate=no/notranslate. Đây là chỉ dẫn cho dịch vụ; người dùng phải đối chiếu mã với bản gốc. Bản đọc Studio không chạy compiler; dùng liên kết về bản gốc để tương tác. Không gửi nội dung riêng người dùng đang nhập trong Studio tới dịch vụ: liên kết chỉ chứa URL tài liệu công khai.

## Giới hạn công bố

Bản dịch không thay đổi bằng chứng kỹ thuật: GHDL demo đã đạt, Vivado/timing/board còn NOT_RUN, danh mục nghiên cứu hiện 400 chưa giải quyết. Không đánh đồng công bố dự án với công bố kết quả phần cứng đã hoàn tất. Thuật ngữ hoặc kết luận chuyên môn cần đối chiếu tiếng Việt và mã nguồn.
