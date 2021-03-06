/* javascript-obfuscator:disable */
/* 
 * Copyright (c) 2017, Mihail Maldzhanski
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright notice, this
 *   list of conditions and the following disclaimer.
 * * Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

//Required
const modNet = require('net');
const modCluster = require('cluster');


//Class access 
var _Method = TcpWorker.prototype;

//Local const
const cMaxListenrs = 100;
const cSchedulerWorkMs = 10;
const cEndOfBuffer = '#';
const cCommandSeparator = '@';
const cDataBufferSeparator = ':';
const cNumCPUs = require('os').cpus().length;

/* javascript-obfuscator:enable */

//Constructor
function TcpWorker() {
    this.worker = {
        id: undefined,
        instance: undefined,
        type: undefined
    };
    this.sharedBuffer = {
        'client': undefined,
        'server': undefined
    };
    this.commands = {};
    this.errorCallback = {};
    this.tcpBuffer = "";
}

//Private
function createClient(ip, port) {
    var client = new modNet.Socket();
    client.connect(port, ip, function () {});
    return client;
}

function createServer(ip, port) {
    var server = modNet.createServer();
    server.listen(port, ip);
    return server;
}

function generalCallbacks(tcpWorker, callback, view) {
    tcpWorker.on('close', function () {
        view.printCode("WARNING", "Warn0021");
    });

    tcpWorker.on('error', function () {
        try {
            callback();
        } catch (e) {
            //this.close();
            view.printCode("ERROR", "Err0002");
        }
    });
}

function sliceDataByAddr(data, curInstance) {
    var text = data.toString();
    var positionOfEndString = text.indexOf(cEndOfBuffer);
    var splitedText = text.slice(0, positionOfEndString);
    var data = {};
    var buf = {};
    try {
        buf = JSON.parse(splitedText);
        if (curInstance.worker.type === 'server') {
            data[buf.addr] = {
                command: buf.command,
                data: buf.data
            };
        } else {
            data = buf;
        }
    } catch (e) {
        console.log("Data is not JSON Format");
    }
    var restOfData = text.slice(positionOfEndString, (text.length - 1));
    curInstance.setBuffer(restOfData);
    return data;
}

function dataCallbacks(tcpWorker, buffer, commands, view, onClientCloseCallback, curInstance) {
    if (tcpWorker.type === 'client') {
        tcpWorker.instance.on('data', function (data) {
            try {
                if (curInstance.tcpServerBuffering(data)) {
                    view.printCode("DEV_INFO", "DevInf0113", data.toString());
                    buffer[tcpWorker.type] = sliceDataByAddr(curInstance.getTcpBuffer(), curInstance);
                }
            } catch (e) {
                console.log("Data is not JSON Format");
            }
        });
    } else {
        tcpWorker.instance.on('connection', (c) => {
            c.on('data', (data) => {
                if (curInstance.tcpServerBuffering(data)) {
                    //Remove Nagle algorithm
                    c.setNoDelay(true);
                    //Get only ready messages
                    buffer[tcpWorker.type] = sliceDataByAddr(curInstance.getTcpBuffer(), curInstance);
                    var buf = {};
                    try {
                        for (var addr in buffer[tcpWorker.type]) {
                            //Get command
                            command = buffer[tcpWorker.type][addr].command;

                            //Get only data
                            data = buffer[tcpWorker.type][addr].data;
                            c.pause();
                            //Prepare return data by executing of command
                            commands[command].exec(data, addr, (data) => {
                                //Async invoking
                                //Store data by address
                                buf[addr] = {
                                    data: data
                                };
                                view.printCode("DEV_INFO", "DevInf0113", JSON.stringify(buffer[tcpWorker.type]));
                                c.write(JSON.stringify(buf) + cEndOfBuffer);
                            });
                            c.resume();
                            //Invoke on close
                            c.on('close', function () {
                                onClientCloseCallback(addr);
                            });
                        }
                    } catch (e) {
                        buf[addr] = {
                            data: view.getTextByCode("ERROR", "Err0003")
                        };
                        c.write(JSON.stringify(buf) + cEndOfBuffer);
                        view.printCode("ERROR", "Err0003", e);
                    }
                }
            });

            c.on('error', function () {
                view.printCode("WARNING", "Warn0022");
            });
        });
    }
}
//Public
_Method.create = function (serverOrClient, ip, port, commandsOrCallback, view, onClientCloseCallback, cpuCount) {
    if ("server" === serverOrClient) {
        if (modCluster.isMaster) {
            console.log(`Master ${process.pid} is running`);
            require('events').EventEmitter.prototype._maxListeners = cMaxListenrs;
            var cpuCountL = cNumCPUs;

            if (cpuCount > 0 && cpuCount <= cNumCPUs) {
                cpuCountL = cpuCount;
            }

            // Fork workers.
            for (let i = 0; i < cpuCountL; i++) {
                modCluster.fork();
            }

            modCluster.on('exit', (worker, code, signal) => {
                console.log(`worker ${worker.process.pid} died`);
                
                //Restart operator worker
                modCluster.fork();
            });

        } else {
            this.worker.type = 'server';
            this.worker.instance = createServer(ip, port);
            require('events').EventEmitter.prototype._maxListeners = cMaxListenrs;

            //Save commands for server 
            this.commands = commandsOrCallback;

            console.log(`Worker ${process.pid} started`);

            //set general callbacks
            generalCallbacks(this.worker.instance, this.errorCallback, view);

            //data managment callbacks
            dataCallbacks(this.worker, this.sharedBuffer, this.commands, view, onClientCloseCallback, this);

        }
    } else if ("client" === serverOrClient) {
        this.worker.type = 'client';
        this.worker.instance = createClient(ip, port);

        //Error callback for client
        this.errorCallback = commandsOrCallback;

        //set general callbacks
        generalCallbacks(this.worker.instance, this.errorCallback, view);

        //data managment callbacks
        dataCallbacks(this.worker, this.sharedBuffer, this.commands, view, onClientCloseCallback, this);

        //Remove Nagle algorithm
        this.worker.instance.setNoDelay(true);

    } else {
        throw "Invalid return request! Try \'server\' !";
    }

    //Set unique ID
    this.worker.id = Math.round((Math.random() * 10000));
};


//This function can be called only in Client context
_Method.Request = function (command, clientAddr, dataBuffer) {
    if (this.worker.type === 'client') {
        var data = {};
        data = ({
            addr: clientAddr,
            command: command,
            data: dataBuffer
        });
        this.worker.instance.write(JSON.stringify(data) + cEndOfBuffer);
    }
};

_Method.getCommands = function () {
    return this.commands;
};

_Method.readRaw = function () {
    if (this.worker.type === 'client') {
        var buffer;
        buffer = this.sharedBuffer[this.worker.type];
        this.sharedBuffer[this.worker.type] = undefined;
        return buffer;
    }
};

_Method.readByAddress = function (clientAddress) {
    var buffer;
    try {
        buffer = this.sharedBuffer[this.worker.type][clientAddress].data;
        this.sharedBuffer[this.worker.type][clientAddress].data = undefined;
    } catch (e) {
        //Nothing at the moment
    }
    return buffer;
};

_Method.cleanByAddress = function (clientAddress) {
    this.sharedBuffer[this.worker.type][clientAddress].data = undefined;
};

_Method.close = function () {
    this.worker.instance.destroy();
};

_Method.tcpServerBuffering = function (data) {
    var isFullMessge = false;
    if (data.indexOf(cEndOfBuffer) !== -1) {
        this.tcpBuffer += data;
        isFullMessge = true;
    } else {
        this.tcpBuffer += data;
    }
    return isFullMessge;
};

_Method.getTcpBuffer = function () {
    var tcpBuffer = this.tcpBuffer;
    return tcpBuffer;
};

_Method.clearBuffer = function () {
    this.tcpBuffer = "";
};

_Method.setBuffer = function (data) {
    this.tcpBuffer = data;
};
module.exports = TcpWorker;