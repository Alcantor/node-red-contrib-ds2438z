# DS2438Z Node-RED node (Raspberry Pi compatible)

This Node-RED node is only tested with DS2438Z sensors.

I've use it with a Raspberry Pi 3 with a "1 Wire Pi Plus" Board.
A DS2482S makes a bridge between the i2c and the one-wire bus.
Then the DS2438Z measures the temperature, humidity and light of my rooms.

* Raspberry Pi 3: https://www.raspberrypi.org/
* 1 Wire Pi Plus: https://www.abelectronics.co.uk/p/60/1-wire-pi-plus
* Room-Sensor: https://taaralabs.eu/1-wire-temperature-humidity-light-sensor/

## Requirements

On the Linux system where your Node-RED is running and where your sensors are
connected to, make sure you have loaded all the kernel modules needed for
working with 1-Wire devices, what the DS2438Z sensor is.
Devices should appears under /sys/bus/w1/devices/.

The kernel driver for the chip (w1_ds2438.ko) needs to be patched if "iad" is
not readable. See driver folder in the repository.

```
cd driver
make -C /usr/src/linux-headers-$(uname -r)/ M=$(pwd) modules
make -C /usr/src/linux-headers-$(uname -r)/ M=$(pwd) modules_install

modprobe ds2482
echo ds2482 0x18 > /sys/bus/i2c/devices/i2c-1/new_device
modprobe w1_ds2438
chmod a+rw /sys/bus/w1/devices/[CHIP_ID]/iad
```

## Installation

Run the following command in the root directory of your Node-RED install

```
npm install node-red-contrib-ds2438z --save
```

## Features

* Dropdown list in the configuration dialog of the node with all detected devices
* Configurable time interval of the sensor sampling
* Output message with temp, vdd, vad, iad, humidity, relative humidity and light values.
