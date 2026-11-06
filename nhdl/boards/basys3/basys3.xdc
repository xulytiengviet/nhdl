# Pin mapping: Digilent Basys-3-Master.xdc, rev B.
# https://github.com/Digilent/digilent-xdc/blob/master/Basys-3-Master.xdc
set_property -dict {PACKAGE_PIN W5 IOSTANDARD LVCMOS33} [get_ports clk]
create_clock -period 10.000 -name sys_clk [get_ports clk]
set_property -dict {PACKAGE_PIN U18 IOSTANDARD LVCMOS33} [get_ports btnC]
set_property -dict {PACKAGE_PIN V17 IOSTANDARD LVCMOS33} [get_ports sw0]
set_property -dict {PACKAGE_PIN U16 IOSTANDARD LVCMOS33} [get_ports {led[0]}]
set_property -dict {PACKAGE_PIN E19 IOSTANDARD LVCMOS33} [get_ports {led[1]}]
set_property -dict {PACKAGE_PIN U19 IOSTANDARD LVCMOS33} [get_ports {led[2]}]
# Asynchronous physical controls enter the first synchronizer stage only.
set_false_path -from [get_ports btnC] -to [get_pins -hier -regexp {.*reset_sync_reg\[0\]/D}]
set_false_path -from [get_ports sw0] -to [get_pins -hier -regexp {.*enable_sync_reg\[0\]/D}]
# Human-visible indicators have no external synchronous receiver.
set_false_path -to [get_ports {led[*]}]
set_property CONFIG_VOLTAGE 3.3 [current_design]
set_property CFGBVS VCCO [current_design]
