library ieee; use ieee.std_logic_1164.all;
use work.nhdl_ternary.all;
entity tb_counter is end;
architecture test of tb_counter is
signal clk, reset, enable : std_logic := '0';
signal q : FakeTrit;
signal leds : std_logic_vector(2 downto 0);
begin
clk <= not clk after 5 ns;
dut: entity work.generated port map(clk,reset,enable,q);
board: entity work.nhdl_basys3 generic map(TICK_CYCLES=>2) port map(clk,reset,enable,leds);
process
 variable held : std_logic_vector(2 downto 0);
 procedure cycle(r,e:std_logic; expected:FakeTrit) is
 begin
  wait until falling_edge(clk); reset<=r; enable<=e;
  wait for 1 ns;
  wait until rising_edge(clk); wait for 1 ns;
  assert q=expected report "Independent state oracle mismatch" severity failure;
 end;
begin
 cycle('1','1',O); cycle('0','1',P); cycle('0','0',P);
 cycle('0','1',N); cycle('0','1',O); cycle('0','1',P);
 cycle('1','1',O); cycle('0','0',O);
 -- Let synchronized board inputs settle, then inspect full slow sequence.
 reset<='1'; enable<='0'; wait for 50 ns; held:=leds;
 assert leds="100" report "Board reset" severity failure;
 wait until falling_edge(clk); reset<='0'; enable<='1';
 wait for 26 ns; assert leds="100" report "Board divider early" severity failure;
 wait for 10 ns; assert leds="001" report "Board P" severity failure;
 wait for 20 ns; assert leds="010" report "Board N" severity failure;
 wait for 20 ns; assert leds="100" report "Board O" severity failure;
 enable<='0'; wait for 50 ns; held:=leds;
 for i in 1 to 4 loop
  wait until rising_edge(clk); wait for 1 ns;
  assert leds=held and leds/="000" report "Board hold mismatch" severity failure;
 end loop;
 report "PASS independent counter and board wrapper";
 std.env.stop; wait;
end process;
end;
