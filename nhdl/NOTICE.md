# Nguồn gốc
Repository gốc là fork GHDL, giữ nguyên COPYING.md và attribution upstream.
Phần nhdl/ được bổ sung cho Long Ngo, 2026, GPL-3.0-or-later.
Encoding N=10, O=00, P=01, X=11 và hướng API tham khảo ternary.vhd v1.4,
Copyright (C) 2018,2025 TERNARY RESEARCH CORPORATION, GPL-3.0-or-later:
https://gitlab.com/ternary/ternary/-/blob/master/vhdl/ternary.vhd
Không phân phối nguyên tệp tham chiếu trong bộ NHDL. Bộ số học và testbench
được hiện thực cho hợp đồng NHDL ghi trong docs/SPEC.md.
Tên CVNSS4.0 ghi nhận công trình của Kiều Trường Lâm và Trần Tư Bình;
không hàm ý chứng nhận/bảo trợ. Các tích hợp model còn là thiết kế.

## Ngoại lệ vendor bổ sung trong 0.2
`site/vendor/bilascript/`: lexer.js, parser.js, vocabulary.js, source-map.js từ
BilaScript v4, commit 8e27ec064c5d070e687e722eb1e3bdfdf4a85a62; MIT, Long Ngo.
Bản LICENSE nguyên văn được giữ cùng thư mục.
`site/vendor/cvnss-converter.js`: tệp 5.0.0-audit-safe do người dùng cung cấp,
giữ nguyên header và byte; không có tuyên bố license trong tệp. Không áp dụng
lại giấy phép NHDL cho thành phần này. Hash và tên gốc trong docs/PROVENANCE.json.
