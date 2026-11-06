library ieee;
use ieee.std_logic_1164.all;
use work.nhdl_ternary.all;
entity nhdl_basys3 is
  generic(TICK_CYCLES : positive := 100000000);
  port(clk, btnC, sw0 : in std_logic; led : out std_logic_vector(2 downto 0));
end;
architecture rtl of nhdl_basys3 is
  signal reset_sync : std_logic_vector(1 downto 0) := "11";
  signal enable_sync : std_logic_vector(1 downto 0) := "00";
  attribute ASYNC_REG : string;
  attribute ASYNC_REG of reset_sync, enable_sync : signal is "TRUE";
  signal ticks : natural range 0 to TICK_CYCLES-1 := 0;
  signal step : std_logic;
  signal q : FakeTrit;
begin
  -- Single clock domain. A switch is a level enable, never a clock.
  process(clk) begin
    if rising_edge(clk) then
      reset_sync <= reset_sync(0) & btnC;
      enable_sync <= enable_sync(0) & sw0;
      if reset_sync(1)='1' or enable_sync(1)='0' or ticks=TICK_CYCLES-1 then
        ticks <= 0;
      else ticks <= ticks+1; end if;
    end if;
  end process;
  step <= '1' when ticks=TICK_CYCLES-1 and enable_sync(1)='1' else '0';
  counter: entity work.generated port map(clk, reset_sync(1), step, q);
  led(0) <= '1' when q=P else '0';
  led(1) <= '1' when q=N else '0';
  led(2) <= '1' when q=O else '0';
end;
