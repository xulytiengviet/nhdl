// Sources passed to the real shared compiler; no pre-generated VHDL.
export const examples=Object.freeze({
 sum:'---bila:strict---\nhaml_sob tong(a: trit, b: trit): trit {\n  trov_ved a + b;\n}',
 product:'---bila:strict---\nhaml_sob nhan(a: trit, b: trit): trit {\n  trov_ved a * b;\n}',
 invert:'---bila:strict---\nhaml_sob dao(a: trit): trit {\n  trov_ved sti(a);\n}',
 mux:'---bila:strict---\nhaml_sob chon(s: trit, a: trit, b: trit): trit {\n  trov_ved mux(s, a, O, b);\n}'
});
