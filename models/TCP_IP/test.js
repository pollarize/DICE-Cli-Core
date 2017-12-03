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

var tcp = require('./TcpWorker.js');
var tcp = require('./TcpWorker.js');

var client = new tcp();
var client2 = new tcp();
var server = new tcp();

server.create("server", "127.0.0.1", "1993");
client.create("client", "127.0.0.1", "1993");
client2.create("client", "127.0.0.1", "1993");

console.log(client.getCommands());
//client.getTime();
//console.log(client.read());

function periodic() {
//    client.GET("Time");
//    data = client.read();
//    if (data !== undefined) {
//    console.log("Client1",data);
//    }

//    client2.GET("Time");
//    data = client2.read();
//    if (data !== undefined) {
//    console.log("Client2",data);
//    }
    client.SET("SET Data", "2d8dQNYt1W2z5QQtUASqQ8TeqXN", 'Hello from Client1!');
    client.SET("SET Data", "3d8dQNYt1W2z5QQtUASqQ8TeqXN", 'Hello from Client2!');
}

function periodic1s() {

//    data = server.readRaw();
//    if (data !== undefined) {
//        console.log(data);
//    }

    data = server.readByAddress('3d8dQNYt1W2z5QQtUASqQ8TeqXN');
    if (data !== undefined) {
        console.log(data);
    }

    data = server.readByAddress('2d8dQNYt1W2z5QQtUASqQ8TeqXN');
    if (data !== undefined) {
        console.log(data);
    }
}

setInterval(periodic, 2000);
setInterval(periodic1s, 1000);