var WebSocketServer = require('ws').Server
, wss = new WebSocketServer({port: 12345});

sendData = function (data) {
    wss.clients.forEach(function each(client) {
        client.send(data.toString());
    });
}
var serialport = require('serialport');
var port = "";
serialport.list(function (err, results) {
    results.forEach(
        function(result) {
            if (result.manufacturer == "Honeywell International Inc.") {
                port = result.comName;
            }
        }
    );
    if (!port) {
        console.log("Please plug in the barcode scanner. Then restart the program again.");
        return;
    }
    var serialPort = new serialport.SerialPort(port);
    serialPort.on('data', function(data) {
        console.log(data.toString());
        sendData(data.toString());
    });
});
