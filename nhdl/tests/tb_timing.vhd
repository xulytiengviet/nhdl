library ieee;
use ieee.std_logic_1164.all;
use work.nhdl_ternary.all;
entity tb_timing is end;
architecture test of tb_timing is
  signal clk:std_logic:='0'; signal reset:std_logic:='1';
  signal d,q,delayed:FakeTrit:=X;
begin
  clk<=not clk after 5 ns;
  dut:entity work.trit_register port map(clk,reset,d,q);
  delayed<=d after 2 ns;
  process
  begin
    d<=N; wait for 1 ns; assert delayed=X severity failure;
    wait for 2 ns; assert delayed=N severity failure;
    wait for 3 ns; assert q=O severity failure;
    reset<='0'; d<=P;
    wait for 10 ns; assert q=P severity failure;
    d<=X; wait for 10 ns; assert q=X severity failure;
    report "PASS: delay, clock, reset and X register";
    std.env.stop; wait;
  end process;
end;
