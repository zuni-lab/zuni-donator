// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library Parser {
  // Using bytes1 instead of string for delimiter and blank space to save gas
  bytes1 private constant DELIMITER = ",";
  bytes1 private constant BLANK_SPACE = " ";

  function extractTypes(string memory self) public pure returns (string[] memory) {
    bytes memory inputBytes = bytes(self);
    require(inputBytes.length > 0, "Parser: empty input");

    uint256 count = 1;
    // Count the number of delimiters in the input to determine the array size
    for (uint256 i = 0; i < inputBytes.length; i++) {
      if (inputBytes[i] == DELIMITER) {
        count++;
      }
    }

    string[] memory output = new string[](count);
    uint256 outputIndex = 0;
    uint256 start = 0;

    for (uint256 i = 0; i <= inputBytes.length; i++) {
      if (i == inputBytes.length || inputBytes[i] == DELIMITER) {
        uint256 end = i - 1;
        while (inputBytes[start] == BLANK_SPACE && start < end) {
          start++;
        }
        while (inputBytes[end] != BLANK_SPACE && end > start) {
          end--;
        }

        bytes memory substring = new bytes(end - start);
        for (uint256 j = start; j < end; j++) {
          substring[j - start] = inputBytes[j];
        }
        output[outputIndex++] = string(substring);
        start = i + 1;
      }
    }
    return output;
  }
}
