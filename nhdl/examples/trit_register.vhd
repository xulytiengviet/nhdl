library ieee;
use ieee.std_logic_1164.all;
use work.nhdl_ternary.all;
entity trit_register is
  port(clk,reset : in std_logic; d:in FakeTrit; q:out FakeTrit);
end;
architecture rtl of trit_register is
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if reset='1' then q<=O; else q<=d; end if;
    end if;
  end process;
end;
