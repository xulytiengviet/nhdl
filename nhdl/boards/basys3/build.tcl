# Run from repository root: vivado -mode batch -source nhdl/boards/basys3/build.tcl
set root [file normalize [file join [file dirname [info script]] ../..]]
set out [file join $root build basys3]
file mkdir $out
create_project -in_memory -part xc7a35tcpg236-1
read_vhdl -vhdl2008 [file join $root rtl nhdl_ternary.vhd]
read_vhdl -vhdl2008 [file join $root build counter generated.vhd]
read_vhdl -vhdl2008 [file join $root boards basys3 top.vhd]
read_xdc [file join $root boards basys3 basys3.xdc]
synth_design -top nhdl_basys3 -part xc7a35tcpg236-1
opt_design
place_design
route_design
report_utilization -file [file join $out utilization.txt]
report_timing_summary -check_timing_verbose -file [file join $out timing.txt]
report_cdc -file [file join $out cdc.txt]
report_drc -file [file join $out drc.txt]
set paths [get_timing_paths -max_paths 1]
if {[llength $paths] == 0 || [get_property SLACK $paths] < 0} {error "Timing gate failed"}
write_checkpoint -force [file join $out routed.dcp]
write_bitstream -force [file join $out nhdl_basys3.bit]
puts "BUILD_COMPLETE: review timing/CDC/DRC; HARDWARE_NOT_RUN"
