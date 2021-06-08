
// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.6.0;

library SafeCast {
    function toUint96(uint value) internal pure returns (uint96) {
        require(value < 2**96, "SafeCast: value doesn\'t fit in 96 bits");
        return uint96(value);
    }
}