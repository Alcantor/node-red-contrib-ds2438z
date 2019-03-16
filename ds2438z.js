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

		/* Enable or disable the current measurement */
		fs.writeFileSync(W1_DEVICES + node.chipId + '/iad', node.chipIad, function(err){
			if(err) node.status({fill:"red",shape:"ring",text:"Write IAD Error"});
		});

		/* Read page0 at each interval second */
		node.update_timer = setInterval(function() {
			fs.readFile(W1_DEVICES + node.chipId + '/temperature', W1_CHARSET, function(err,data){
				if(err){
					node.status({fill:"red",shape:"ring",text:"Read Temperature Error"});
					return;
				}
				var temp = parseInt(data) / 256.0;
				fs.readFile(W1_DEVICES + node.chipId + '/vdd', W1_CHARSET, function(err,data){
					if(err){
						node.status({fill:"red",shape:"ring",text:"Read VDD Error"});
						return;
					}
					var vdd  = parseInt(data) / 100.0;
					fs.readFile(W1_DEVICES + node.chipId + '/vad', W1_CHARSET, function(err,data){
						if(err){
							node.status({fill:"red",shape:"ring",text:"Read VAD Error"});
							return;
						}
						var vad  = parseInt(data) / 100.0;
						fs.readFile(W1_DEVICES + node.chipId + '/iad', W1_CHARSET, function(err,data){
							if(err){
								node.status({fill:"red",shape:"ring",text:"Read IAD Error"});
								return;
							}
							var iad  = parseInt(data) / (4.096 * node.rsens);
							/* Compute humidity (Humidity sensor HIH-5030 on VAD Input of the DS2438Z) */
							var shum = ((vad / vdd) - 0.1515) / 0.00636;
							var rhum = shum / (1.0546 - ( 0.00216 * temp))
							/* Compute light (Light sensor BPW 34 S on IAD Input of the DS2438Z) */
							var lux = iad * 12000.0;
							node.send([
								{'topic': "currentTemp", 'payload': temp}, /* in °C */
								{'topic': "vdd", 'payload': vdd}, /* in V */
								{'topic': "vad", 'payload': vad}, /* in V */
								{'topic': "iad", 'payload': iad}, /* in mA */
								{'topic': "stdHumidity", 'payload': shum}, /* in % (Standard humidity at 25°C) */
								{'topic': "relHumidity", 'payload': rhum}, /* in % (Relative humidity) */
								{'topic': "luminosity", 'payload': vad}, /* in lx */
							]);
							node.status({fill:"green",shape:"ring",text:"OK"});
						});
					});
				});
			});
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
