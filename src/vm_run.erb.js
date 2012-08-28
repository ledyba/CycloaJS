%# -*- encoding: utf-8 -*-
cycloa.VirtualMachine.prototype.run = function () {
	<%= CPU::RunInit() %>
	<%= Video::RunInit() %>
	<%= Audio::RunInit() %>
	var _run = true;
	var reservedClockDelta = this.reservedClockDelta;
	while(_run) {
		//console.log(this.tracer.decode());
		<%= render File.expand_path File.dirname(__FILE__)+"/src/vm_cpu_run.erb.js" %>
		<%= render File.expand_path File.dirname(__FILE__)+"/src/vm_video_run.erb.js" %>
		<%= render File.expand_path File.dirname(__FILE__)+"/src/vm_audio_run.erb.js" %>
	}
	this.reservedClockDelta = reservedClockDelta;
	return _run;
};
