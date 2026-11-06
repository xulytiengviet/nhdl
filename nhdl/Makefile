GHDL ?= ghdl
BUILD := build
.PHONY: test synth clean
test:
	mkdir -p $(BUILD)
	$(GHDL) -a --std=08 --workdir=$(BUILD) rtl/nhdl_ternary.vhd examples/ternary_alu.vhd examples/trit_register.vhd tests/tb_ternary.vhd tests/tb_timing.vhd
	$(GHDL) -e --std=08 --workdir=$(BUILD) tb_ternary
	$(GHDL) -r --std=08 --workdir=$(BUILD) tb_ternary --assert-level=error
	$(GHDL) -e --std=08 --workdir=$(BUILD) tb_timing
	$(GHDL) -r --std=08 --workdir=$(BUILD) tb_timing --assert-level=error --wave=$(BUILD)/timing.ghw
synth: test
	$(GHDL) --synth --std=08 --workdir=$(BUILD) ternary_alu > $(BUILD)/ternary_alu_netlist.vhd
	$(GHDL) --synth --std=08 --workdir=$(BUILD) trit_register > $(BUILD)/trit_register_netlist.vhd
clean:
	rm -rf $(BUILD)
