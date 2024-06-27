// SPDX-License-Identifier: MIT
pragma solidity >=0.8.25 <0.9.0;

import { Type } from "../Common.sol";

library Parser {
    bytes1 private constant COMMA = ",";
    bytes1 private constant BLANK_SPACE = " ";

    /// @notice Thrown when type list is empty
    error EmptyTypeList();

    /// @notice Thrown when type is not supported
    error UnsupportedType();

    function extractTypes(string memory self) public pure returns (Type[] memory) {
        return extractTypes(bytes(self));
    }

    function extractTypes(bytes memory self) public pure returns (Type[] memory) {
        if (self.length == 0) {
            revert EmptyTypeList();
        }

        uint256 count = _countDelimiters(self);

        Type[] memory output = new Type[](count);
        uint256 outputIndex = 0;
        uint256 start = 0;

        for (uint256 i = 0; i <= self.length; i++) {
            if (i == self.length || self[i] == COMMA) {
                uint256 end = i - 1;
                while (start < end && self[start] == BLANK_SPACE) {
                    start++;
                }
                while (end > start && self[end] != BLANK_SPACE) {
                    end--;
                }

                bytes memory substring = new bytes(end - start);
                for (uint256 j = start; j < end; j++) {
                    substring[j - start] = self[j];
                }
                output[outputIndex++] = _bytesToType(substring);
                start = i + 1;
            }
        }
        return output;
    }

    function _countDelimiters(bytes memory self) private pure returns (uint256) {
        uint256 count = 1;
        for (uint256 i = 0; i < self.length; i++) {
            if (self[i] == COMMA) {
                count++;
            }
        }
        return count;
    }

    function _bytesToType(bytes memory b) private pure returns (Type) {
        if (keccak256(b) == keccak256("int8")) {
            return Type.INT8;
        } else if (keccak256(b) == keccak256("int16")) {
            return Type.INT16;
        } else if (keccak256(b) == keccak256("int24")) {
            return Type.INT24;
        } else if (keccak256(b) == keccak256("int32")) {
            return Type.INT32;
        } else if (keccak256(b) == keccak256("int64")) {
            return Type.INT64;
        } else if (keccak256(b) == keccak256("int128")) {
            return Type.INT128;
        } else if (keccak256(b) == keccak256("int256") || keccak256(b) == keccak256("int")) {
            return Type.INT256;
        } else if (keccak256(b) == keccak256("bytes1") || keccak256(b) == keccak256("uint8")) {
            return Type.BYTES1;
        } else if (keccak256(b) == keccak256("bytes2") || keccak256(b) == keccak256("uint16")) {
            return Type.BYTES2;
        } else if (keccak256(b) == keccak256("bytes3") || keccak256(b) == keccak256("uint24")) {
            return Type.BYTES3;
        } else if (keccak256(b) == keccak256("bytes4") || keccak256(b) == keccak256("uint32")) {
            return Type.BYTES4;
        } else if (keccak256(b) == keccak256("bytes8") || keccak256(b) == keccak256("uint64")) {
            return Type.BYTES8;
        } else if (keccak256(b) == keccak256("bytes16") || keccak256(b) == keccak256("uint128")) {
            return Type.BYTES16;
        } else if (
            keccak256(b) == keccak256("bytes32") || keccak256(b) == keccak256("uint256")
                || keccak256(b) == keccak256("uint")
        ) {
            return Type.BYTES32;
        } else if (keccak256(b) == keccak256("address")) {
            return Type.ADDRESS;
        } else if (keccak256(b) == keccak256("bool")) {
            return Type.BOOL;
        } else if (keccak256(b) == keccak256("bytes")) {
            return Type.BYTES;
        } else if (keccak256(b) == keccak256("string")) {
            return Type.STRING;
        }

        revert UnsupportedType();
    }
}
