# DS2438Z Node-RED node (Raspberry Pi compatible)

This Node-RED node is working only with DS2438Z sensors connected to a Raspberry Pi.

## Requirements

On the Linux system where your Node-RED is running and where your sensors are connected to, make sure you have loaded all the kernel modules needed for working with 1-Wire devices, what the DS2438Z sensor is.
I've use it with a Raspberry Pi 3 with a "1 Wire Pi Plus" Board.
A DS2482S make a bridge between the i2c and the one-wire bus.

```
modprobe ds2482
echo ds2482 0x18 > /sys/bus/i2c/devices/i2c-1/new_device
modprobe w1_ds2438
```

## Installation

Run the following command in the root directory of your Node-RED install

```
npm install node-red-contrib-ds2438z --save
```

## Features

* you can select a 1-wire device/sensor from a dropdown list in the configuration dialog of the node
* configurable time interval of the sensor sampling
* you can configure name of the node, that could be for example the place where is the node placed, if no name set, ID of the device is used as a label
