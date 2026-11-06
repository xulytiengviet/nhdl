# Basys 3 — thử nghiệm Neutral HDL

**Trạng thái: GHDL PASS; Vivado NOT_RUN; hardware NOT_RUN.** Project là baseline nghiên cứu, chưa có bằng chứng board vật lý.

1. Từ thư mục gốc chạy `make -C nhdl state` với Node.js và GHDL trong PATH.
2. Chạy `vivado -mode batch -source nhdl/boards/basys3/build.tcl` (Vivado có Artix-7). Xem nhdl/build/basys3: utilization.txt, timing.txt, cdc.txt, drc.txt và bitstream. Script chặn setup slack âm; cần review hold, unconstrained paths, CDC, DRC trước nạp. ASYNC_REG dành cho Vivado; GHDL cảnh báo bỏ qua thuộc tính này là giới hạn tổng hợp trung gian.
3. Trong Hardware Manager, kết nối đúng Basys 3 xc7a35t qua USB-JTAG, chọn nhdl_basys3.bit và Program Device. Không ghi flash tự động.
4. SW0=0. Giữ BTNC 0,1 s: LD2 sáng (O). Thả nút: trạng thái giữ.
5. SW0=1: mỗi giây LD0 (P) → LD1 (N) → LD2 (O), lặp ít nhất 30 vòng. Tắt SW0: giữ sau độ trễ đồng bộ; bật lại: bắt đầu khoảng chờ 1 giây. Giữ BTNC khi đang chạy: reset luôn ưu tiên.
6. Ghi board revision/serial, commit, tool version, hash nguồn/bitstream, LUT/FF, setup/hold slack, report CDC/DRC, ảnh/video chuỗi LED. Chỉ đánh dấu HARDWARE_PASS sau khi toàn bộ bước đạt. Không suy ra công suất hoặc lợi thế ternary từ LED chạy đúng.

Nguồn chân: [Digilent Basys-3-Master.xdc](https://github.com/Digilent/digilent-xdc/blob/master/Basys-3-Master.xdc): W5 clock, U18 BTNC, V17 SW0, U16/E19/U19 LED0/1/2. Xác minh board revision trước nạp. XDC chỉ loại đường bất đồng bộ vào tầng đồng bộ đầu và LED không có bên nhận đồng bộ; không loại đường logic bên trong.

Đánh giá ≤2× LUT/FF cần baseline nhị phân modulo-3 tương đương, cùng wrapper và ràng buộc. Chưa có số đo; không dùng hệ số 2 bit/trit thay cho kết quả tổng hợp.
