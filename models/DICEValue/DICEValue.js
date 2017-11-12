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
const modDICECalculator = require('../DICECalculator/DICECalculator.js');

//Class access 
var _Method = DICEValue.prototype;

const cBtitsInHex = 4;
const cNmargin = 10;

function DICEValue() {
    this.unitValue = 1;
    this.unitMax = 1;
    this.DICEUnit = undefined;
}

_Method.calculateValue = function (k, z, N) {
    var Nmax = N + cNmargin;
    var b = _getTralingZeroesInDICE(this.DICEUnit);
    
    //Save values
    this.unitValue = (k * ((Math.pow(2, (b - z))) / (Math.pow(2, (N - z)))));
    this.unitMax = Math.pow(2, Nmax);
};

_Method.getDICEUnit = function () {
    return this.DICEUnit;
};

_Method.setDICEUnit = function (DICEUnit) {
    if (null !== DICEUnit) {
        this.DICEUnit = DICEUnit;
    } else {
        throw "Error it cannot be Undefined!";
    }
};

_Method.getZeroes = function () {
    return _getTralingZeroesInDICE(this.DICEUnit);
};
//Private
function _getTralingZeroesInDICE(DICEUnit) {
    var b = DICEUnit.validZeros;
    var DICECalc = new modDICECalculator();
    var sha3OfDICE = DICECalc.getSHA3OfUnit(DICEUnit);
    var cArrayValidHex =
            [
                DICECalc.getHexLookingTable(1),
                DICECalc.getHexLookingTable(2),
                DICECalc.getHexLookingTable(3)
            ];

    var countOfZeros = 0;
    var lastPosition = sha3OfDICE.length - 1;

    //Walkthouhgt the whole hex string
    for (var i = sha3OfDICE.length - 1; i >= 0; i--) {
        if ("0" === sha3OfDICE.charAt(i)) {
            countOfZeros++;
        } else {
            break;
        }
    }

    //Update last postion
    lastPosition -= countOfZeros;

    //One "0" has 4 real zeroes
    countOfZeros *= cBtitsInHex;

    //Get char at last position
    sha3OfDICE = sha3OfDICE.charAt(lastPosition);

    //Validate char at last position
    for (var i = (cArrayValidHex.length - 1); i >= 0; i--) {
        if (false !== cArrayValidHex[i].includes(sha3OfDICE)) {
            countOfZeros += (i + 1);
            break;
        }
    }

    b = countOfZeros;

    return b;
}

module.exports = DICEValue;