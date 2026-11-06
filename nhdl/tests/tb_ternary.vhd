use work.nhdl_ternary.all;
entity tb_ternary is end;
architecture test of tb_ternary is
begin
  process
    constant ts:trit_vector(0 to 3):=(N,O,P,X);
    variable r:add_result; variable expected:integer;
  begin
    for i in 0 to 3 loop
      assert sti(sti(ts(i)))=ts(i) severity failure;
      assert dec(inc(ts(i)))=ts(i) severity failure;
      assert buf(ts(i))=ts(i) severity failure;
      if i<3 then
        assert to_integer(sti(ts(i)))=1-i severity failure;
        assert to_integer(inc(ts(i)))=((i+1) mod 3)-1 severity failure;
      end if;
      for j in 0 to 3 loop
        r:=half_add(ts(i),ts(j));
        assert ts(i)+ts(j)=r.s severity failure;
        if i=3 or j=3 then
          assert ts(i)-ts(j)=X severity failure;
          assert tmin(ts(i),ts(j))=X and tmax(ts(i),ts(j))=X and tcmp(ts(i),ts(j))=X and ts(i)*ts(j)=X severity failure;
        else
          if i<j then expected:=i-1; else expected:=j-1; end if;
          assert to_integer(tmin(ts(i),ts(j)))=expected severity failure;
          if i>j then expected:=i-1; else expected:=j-1; end if;
          assert to_integer(tmax(ts(i),ts(j)))=expected severity failure;
          assert to_integer(ts(i)*ts(j))=(i-1)*(j-1) severity failure;
          assert to_integer(r.s)+3*to_integer(r.carry)=i+j-2 severity failure;
          assert to_integer(ts(i)-ts(j))=(((i-j+1) mod 3)-1) severity failure;
          if i<j then expected:=-1; elsif i=j then expected:=0; else expected:=1; end if;
          assert to_integer(tcmp(ts(i),ts(j)))=expected severity failure;
        end if;
        for k in 0 to 3 loop
          r:=full_add(ts(i),ts(j),ts(k));
          if i=3 or j=3 or k=3 then
            assert r.s=X and r.carry=X severity failure;
          else
            assert to_integer(r.s)+3*to_integer(r.carry)=i+j+k-3 severity failure;
          end if;
          for l in 0 to 3 loop
            case i is
              when 0 => assert mux(ts(i),ts(j),ts(k),ts(l))=ts(j) severity failure;
              when 1 => assert mux(ts(i),ts(j),ts(k),ts(l))=ts(k) severity failure;
              when 2 => assert mux(ts(i),ts(j),ts(k),ts(l))=ts(l) severity failure;
              when others => assert mux(ts(i),ts(j),ts(k),ts(l))=X severity failure;
            end case;
          end loop;
        end loop;
      end loop;
    end loop;
    for id in 0 to 26 loop assert triad_to_id(id_to_triad(id))=id severity failure; end loop;
    assert id_to_triad(0)=N&N&N and id_to_triad(13)=O&O&O and id_to_triad(26)=P&P&P severity failure;
    report "PASS: 64 full-add inputs, 256 mux inputs, 27 Base27 IDs, gates";
    std.env.stop; wait;
  end process;
end;
