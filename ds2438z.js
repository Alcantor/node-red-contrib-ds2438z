module.exports = function(RED) {
	const W1_DEVICES = '/sys/bus/w1/devices/';
	const W1_DEVICES_LIST = 'w1_bus_master1/w1_master_slaves';
	const W1_CHARSET = 'ascii';

	var fs = require('fs');

	function DS2438ZNode(config) {
		RED.nodes.createNode(this, config);		
		var node = this;
		node.chipId   = config.chipId;
		node.chipIad  = config.chipIad;
		node.rsens    = config.rsens;
		node.interval = config.interval * 1000;
		node.msg = {
			payload : "No values",
			temp: 0, /* in °C */
			vdd : 0, /* in V */
			vad : 0, /* in V */
			iad : 0, /* in mA */
			shum: 0, /* in % (Standard humidity at 25°C) */
			rhum: 0, /* in % (Relative humidity) */
			lux : 0  /* in lx */
		}

		/* Enable or disable the current measurement */
		try {
			fs.writeFileSync(W1_DEVICES + node.chipId + '/iad', node.chipIad, W1_CHARSET);
		}catch(err){}

		/* Read page0 at each interval second */
		node.update_timer = setInterval(function() {
			node.msg.payload = "Temp.: ";
			try{
				data = fs.readFileSync(W1_DEVICES + node.chipId + '/temperature', W1_CHARSET);
				node.msg.temp = parseInt(data) / 256.0;
				node.msg.payload += node.msg.temp.toFixed(2)+"°C ";
			}catch(err){
				node.msg.payload += "ERROR ";
			}

			node.msg.payload += "VDD: ";
			try{
				data = fs.readFileSync(W1_DEVICES + node.chipId + '/vdd', W1_CHARSET);
				node.msg.vdd  = parseInt(data) / 100.0;
				node.msg.payload += node.msg.vdd.toFixed(2)+"V ";
			}catch (err){
				node.msg.payload += "ERROR ";
			}

			node.msg.payload += "VAD: ";
			try{
				data = fs.readFileSync(W1_DEVICES + node.chipId + '/vad', W1_CHARSET);
				node.msg.vad  = parseInt(data) / 100.0;
				node.msg.payload += node.msg.vad.toFixed(2)+"V ";
			}catch (err){
				node.msg.payload += "ERROR ";
			}

			/* Don't work with old w1_ds2438 driver (iad write only) */
			node.msg.payload += "IAD: ";
			try{
				data = fs.readFileSync(W1_DEVICES + node.chipId + '/iad', W1_CHARSET);
				node.msg.iad  = parseInt(data) / (4.096 * node.rsens);
				node.msg.payload += node.msg.iad.toFixed(6)+"mA ";
			}catch (err){
				node.msg.payload += "ERROR ";
			}

			/* Compute humidity (Humidity sensor HIH-5030 on VAD Input of the DS2438Z) */
			node.msg.shum = ((node.msg.vad / node.msg.vdd) - 0.1515) / 0.00636;
			node.msg.rhum = node.msg.shum / (1.0546 - ( 0.00216 * node.msg.temp))
			node.msg.payload += "Rel. Humidity: "+node.msg.rhum.toFixed(2)+"% ";

			/* Compute light (Light sensor BPW 34 S on IAD Input of the DS2438Z) */
			node.msg.lux = node.msg.iad * 12000.0;
			node.msg.payload += "Light: "+node.msg.lux.toFixed(2)+"lx";

			node.send(node.msg);
			
		}, node.interval);

		/* Close the timer on exit */
		this.on("close", function() {
			clearInterval(node.update_timer);
		});
	}

	RED.nodes.registerType("ds2438z", DS2438ZNode);

	/* Create a list with the one-wire slaves */
	RED.httpAdmin.get('/sensors/w1-slaves/', function(req, res) {
		fs.readFile(W1_DEVICES+W1_DEVICES_LIST, W1_CHARSET, function (err, data) {
			if (! err) {
				var parts = data.split("\n");
				parts.pop();
				res.send(JSON.stringify(parts));
			}
		});
	});
}
