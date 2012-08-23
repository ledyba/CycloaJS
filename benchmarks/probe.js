var cycloa;
if(!cycloa) cycloa = {};
if(!cycloa.probe) cycloa.probe = {};

function log(msg){
	console.log(msg);
	document.getElementById('console').innerHTML =
	document.getElementById('console').innerHTML + "<br>" + msg;
}

function clear(){
	document.getElementById('console').innerHTML = undefined;
}

cycloa.probe.measure = function(func){
	var start = new Date();
	func();
	var elapsed = (new Date())-start;
	return elapsed;
};
