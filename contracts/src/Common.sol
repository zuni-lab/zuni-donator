// SPDX-License-Identifier: MIT
pragma solidity >=0.8.25 <0.9.0;

enum Operation {
    EQ,
    NEQ,
    GT,
    GTE,
    LT,
    LTE,
    NONE
}

enum Type {
    STRING,
    BYTES,
    UINT,
    INT,
    ADDRESS,
    BOOL
}


error EmptyInput();
error UnsupportedType();
