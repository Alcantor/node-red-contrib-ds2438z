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
		node.interval = config.interval * 1000;
		node.msg = {
			payload : "No values",
			temp: 0,
			vdd : 0,
			vad : 0,
			iad : 0,
			shum: 0,
			rhum: 0
		}

		/* Enable or disable the current measure */
		fs.writeFile(W1_DEVICES + node.chipId + '/iad', node.chipIad, W1_CHARSET, function (err) {} );

		/* Read page0 at each interval second */
		setInterval(function() {
			data = fs.readFileSync(W1_DEVICES + node.chipId + '/temperature', W1_CHARSET);
			if(data) node.msg.temp = parseInt(data) / 256.0;

			data = fs.readFileSync(W1_DEVICES + node.chipId + '/vdd', W1_CHARSET);
			if(data) node.msg.vdd  = parseInt(data) * 0.01;

			data = fs.readFileSync(W1_DEVICES + node.chipId + '/vad', W1_CHARSET);
			if(data) node.msg.vad  = parseInt(data) * 0.01;

			/* Don't work with old w1_ds2438 driver (iad write only) */
			data = fs.readFileSync(W1_DEVICES + node.chipId + '/iad', W1_CHARSET);
			if(data) node.msg.iad  = parseInt(data) * 0.0002441;

			/* Compute humidity (Humidity sonsor HIH-5030 on VAD Input of the DS2438Z) */
			node.msg.shum = ((node.msg.vad / node.msg.vdd) - 0.16) / 0.0062;
			node.msg.rhum = node.msg.shum / (1.0546 - ( 0.00216 * node.msg.temp))

			node.msg.payload =
				"Temp.: " + node.msg.temp.toFixed(2)+"°C "+
				"Rel. Humidity: "+node.msg.rhum.toFixed(2)+"% "+
				"Light: "+node.msg.iad.toFixed(2)+"?"
			
                	node.send(node.msg);
			
		}, node.interval);

		this.on("close", function() {
			clearInterval(node.update_timer);
		});
	}

	RED.nodes.registerType("ds2438z", DS2438ZNode);

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
