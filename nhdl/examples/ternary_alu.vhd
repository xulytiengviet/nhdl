use work.nhdl_ternary.all;
entity ternary_alu is
  port(a,b,ci : in FakeTrit; s,co,lo,hi,product : out FakeTrit);
end;
architecture rtl of ternary_alu is
begin
  process(all)
    variable r:add_result;
  begin
    r:=full_add(a,b,ci); s<=r.s; co<=r.carry;
    lo<=tmin(a,b); hi<=tmax(a,b); product<=a*b;
  end process;
end;
