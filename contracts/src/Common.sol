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
    INT8,
    INT16,
    INT24,
    INT32,
    INT64,
    INT128,
    INT256,
    BYTES1,
    BYTES2,
    BYTES3,
    BYTES4,
    BYTES8,
    BYTES16,
    BYTES32,
    BYTES,
    ADDRESS,
    BOOL,
    STRING
}

enum ClaimType {
    FIXED,
    PERCENTAGE,
    CUSTOM
}

struct ClaimData {
    ClaimType claimType;
    uint256 fixedAmount;
    uint256 percentage;
    bytes customData;
}
