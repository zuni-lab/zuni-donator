// SPDX-License-Identifier: MIT
pragma solidity >=0.8.25 <0.9.0;

enum Operator {
    EQ,
    NEQ,
    GT,
    GTE,
    LT,
    LTE,
    NONE
}

enum Type {
    UINT256,
    INT256,
    BYTES32,
    BYTES,
    ADDRESS,
    BOOL,
    STRING
}
