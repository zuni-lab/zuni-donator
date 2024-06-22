// SPDX-License-Identifier: MIT
pragma solidity >=0.8.25 <0.9.0;

import { EmptyInput, UnsupportedType, Type } from "./Common.sol";

library Parser {
  bytes1 private constant COMMA = ",";
  bytes1 private constant BLANK_SPACE = " ";

  function extractTypes(string memory self) public pure returns (Type[] memory) {
    return extractTypes(bytes(self));
  }

  function extractTypes(bytes memory self) public pure returns (Type[] memory) {
    if (self.length == 0) {
      revert EmptyInput();
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
    if (keccak256(b) == keccak256("string")) {
      return Type.STRING;
    } else if (keccak256(b) == keccak256("bytes")) {
      return Type.BYTES;
    } else if (keccak256(b) == keccak256("uint")) {
      return Type.UINT;
    } else if (keccak256(b) == keccak256("int")) {
      return Type.INT;
    } else if (keccak256(b) == keccak256("address")) {
      return Type.ADDRESS;
    } else if (keccak256(b) == keccak256("bool")) {
      return Type.BOOL;
    }
    revert UnsupportedType();
  }
}
