/*
 */

var request = require('request');

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("thing-plugin", "AirQualityMonitor", myMonitor);
};


function myMonitor(log, config) {
    this.log = log;
    this.debug = config["debug"] || false;
    this.debug && this.log('myMonitor: reading config');

    // url info
    this.url = config["url"];
    this.url1 = config["url1"];
    this.url2 = config["url2"];
    this.http_method = config["http_method"] || "GET";
    this.name = config["name"];
    this.type = config["type"];
    this.manufacturer = config["manufacturer"] || "Sample Manufacturer";
    this.model = config["model"] || "Sample Model";
    this.serial = config["serial"] || "Sample Serial";

    this.airQualityService;
}

myMonitor.prototype = {
    httpRequest: function (url, method, callback) {
                this.debug && this.log('httpRequest: '+method+' '+url);
        request({
            uri: url,
            method: method,
            rejectUnauthorized: false
        },
        function (error, response, body) {
            callback(error, response, body)
        })
    },

    getSensorParticulateDensityValue: function (callback) {
                this.httpRequest(this.url1,this.http_method,function(error, response, body) {
                        if (error) {
                                this.log('HTTP get failed: %s', error.message);
                                callback(error);
                        } else {
                                this.debug && this.log('HTTP success. Got result ['+body+'].');
                                var value = parseFloat(JSON.parse(body).field1);
                                this.airQualityService.setCharacteristic(
                                        Characteristic.PM2_5Density,
                                        value
                                );
                               callback(null, value);
                        }
               this.httpRequest(this.url2,this.http_method,function(error, response, body) {
                        if (error) {
                                this.log('HTTP get failed: %s', error.message);
                                callback(error);
                        } else {
                                this.debug && this.log('HTTP success. Got result ['+body+'].');
                                var value = parseFloat(JSON.parse(body).field1);
                                this.airQualityService.setCharacteristic(
                                        Characteristic.PM10Density,
                                        value
                                );
                               callback(null, value);
                        }
                this.airQualityService.setCharacteristic(Characteristic.AirQuality, 1);
                }.bind(this));
    },

    identify: function (callback) {
        this.log("Identify requested!");
        callback(); // success
    },

    getServices: function () {
                this.debug && this.log("getServices");
                var services = [],
                informationService = new Service.AccessoryInformation();

                informationService
                  .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
                  .setCharacteristic(Characteristic.Model, this.model)
                  .setCharacteristic(Characteristic.SerialNumber, this.serial);
                services.push(informationService);
                
                switch (this.type) {
                        case "AirParticulateDensity":
                                this.airQualityService = new Service.AirQualitySensor(this.name);
                                this.airQualityService
                                    .getCharacteristic(Characteristic.AirQuality)
                                    .on('get', this.getSensorParticulateDensityValue.bind(this));
                                services.push(this.airQualityService);
                                break;
                        default:
                                this.log('Error: unknown type: '+this.type+'. skipping...');
                }
                return services;
    }
};
        
