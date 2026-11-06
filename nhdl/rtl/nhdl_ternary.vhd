-- NHDL 0.1: balanced ternary on VHDL-2008. GPL-3.0-or-later.
package nhdl_ternary is
  subtype FakeTrit is bit_vector(1 downto 0);
  subtype FakeTriad is bit_vector(5 downto 0);
  constant N : FakeTrit := "10";
  constant O : FakeTrit := "00";
  constant P : FakeTrit := "01";
  constant X : FakeTrit := "11";
  type trit_vector is array(natural range <>) of FakeTrit;
  type add_result is record
    s : FakeTrit;
    carry : FakeTrit;
  end record;
  function valid(t : FakeTrit) return boolean;
  function to_integer(t : FakeTrit) return integer;
  function to_trit(v : integer) return FakeTrit;
  function tostr(t : FakeTrit) return string;
  function buf(t : FakeTrit) return FakeTrit;
  function sti(t : FakeTrit) return FakeTrit;
  function inc(t : FakeTrit) return FakeTrit;
  function dec(t : FakeTrit) return FakeTrit;
  function tmin(a,b : FakeTrit) return FakeTrit;
  function tmax(a,b : FakeTrit) return FakeTrit;
  function tcmp(a,b : FakeTrit) return FakeTrit;
  function mux(sel,neg,zero,pos : FakeTrit) return FakeTrit;
  function full_add(a,b,ci : FakeTrit) return add_result;
  function half_add(a,b : FakeTrit) return add_result;
  function "+"(a,b : FakeTrit) return FakeTrit;
  function "-"(a,b : FakeTrit) return FakeTrit;
  function "*"(a,b : FakeTrit) return FakeTrit;
  -- Base27 numeric transport: ID 0..26 <-> balanced integer ID-13.
  function id_to_triad(id : natural) return FakeTriad;
  function triad_to_id(t : FakeTriad) return natural;
end package;
package body nhdl_ternary is
  function valid(t : FakeTrit) return boolean is
  begin return t /= X; end;
  function to_integer(t : FakeTrit) return integer is
  begin
    case t is
      when N => return -1; when O => return 0; when P => return 1;
      when others => assert false report "X has no numeric value" severity failure; return 0;
    end case;
  end;
  function to_trit(v : integer) return FakeTrit is
  begin
    case v is when -1 => return N; when 0 => return O; when 1 => return P; when others => return X; end case;
  end;
  function tostr(t : FakeTrit) return string is
  begin
    case t is when N => return "N"; when O => return "O"; when P => return "P"; when others => return "X"; end case;
  end;
  function buf(t : FakeTrit) return FakeTrit is begin return t; end;
  function sti(t : FakeTrit) return FakeTrit is
  begin case t is when N => return P; when P => return N; when O => return O; when others => return X; end case; end;
  function inc(t : FakeTrit) return FakeTrit is
  begin case t is when N => return O; when O => return P; when P => return N; when others => return X; end case; end;
  function dec(t : FakeTrit) return FakeTrit is begin return sti(inc(sti(t))); end;
  function tmin(a,b : FakeTrit) return FakeTrit is
  begin if not valid(a) or not valid(b) then return X; end if;
    if to_integer(a) < to_integer(b) then return a; else return b; end if; end;
  function tmax(a,b : FakeTrit) return FakeTrit is
  begin if not valid(a) or not valid(b) then return X; end if;
    if to_integer(a) > to_integer(b) then return a; else return b; end if; end;
  function tcmp(a,b : FakeTrit) return FakeTrit is
  begin if not valid(a) or not valid(b) then return X; end if;
    if a=b then return O; elsif to_integer(a)<to_integer(b) then return N; else return P; end if; end;
  function mux(sel,neg,zero,pos : FakeTrit) return FakeTrit is
  begin case sel is when N => return neg; when O => return zero; when P => return pos; when others => return X; end case; end;
  function full_add(a,b,ci : FakeTrit) return add_result is
    variable v : integer range -3 to 3;
    variable r : add_result;
  begin
    if not valid(a) or not valid(b) or not valid(ci) then return (X,X); end if;
    v := to_integer(a)+to_integer(b)+to_integer(ci);
    if v>1 then r := (to_trit(v-3),P);
    elsif v< -1 then r := (to_trit(v+3),N);
    else r := (to_trit(v),O); end if;
    return r;
  end;
  function half_add(a,b : FakeTrit) return add_result is begin return full_add(a,b,O); end;
  function "+"(a,b : FakeTrit) return FakeTrit is variable r:add_result;
  begin r:=half_add(a,b); return r.s; end;
  function "-"(a,b : FakeTrit) return FakeTrit is begin return a+sti(b); end;
  function "*"(a,b : FakeTrit) return FakeTrit is
  begin if not valid(a) or not valid(b) then return X; end if; return to_trit(to_integer(a)*to_integer(b)); end;
  function id_to_triad(id : natural) return FakeTriad is
    variable v,d : integer; variable r : FakeTriad;
  begin
    assert id<=26 report "Base27 ID out of range" severity failure;
    v:=integer(id)-13;
    for i in 0 to 2 loop
      d:=((v+1) mod 3)-1; r(2*i+1 downto 2*i):=to_trit(d); v:=(v-d)/3;
    end loop;
    return r;
  end;
  function triad_to_id(t : FakeTriad) return natural is variable v:integer:=0;
  begin
    for i in 0 to 2 loop v:=v+to_integer(t(2*i+1 downto 2*i))*3**i; end loop;
    return natural(v+13);
  end;
end package body;
