// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.25 <0.9.0;

library Parser {
    // Using bytes1 instead of string for delimiter and blank space to save gas
    bytes1 private constant DELIMITER = ",";
    bytes1 private constant BLANK_SPACE = " ";

    error EmptyInput();

    function extractTypes(string memory self) public pure returns (string[] memory) {
        bytes memory inputBytes = bytes(self);
        if (inputBytes.length == 0) {
            revert EmptyInput();
        }

        uint256 count = _countDelimiters(inputBytes);

        string[] memory output = new string[](count);
        uint256 outputIndex = 0;
        uint256 start = 0;

        for (uint256 i = 0; i <= inputBytes.length; i++) {
            if (i == inputBytes.length || inputBytes[i] == DELIMITER) {
                if (i > 0) {
                    // Ensure non-empty segment
                    output[outputIndex++] = _extractSubstring(inputBytes, start, i - 2);
                }
                start = i + 1; // Move start to character after current delimiter
            }
        }
        return output;
    }

    function _countDelimiters(bytes memory inputBytes) private pure returns (uint256) {
        uint256 count = 1;
        for (uint256 i = 0; i < inputBytes.length; i++) {
            if (inputBytes[i] == DELIMITER) {
                count++;
            }
        }
        return count;
    }

    function _extractSubstring(
        bytes memory inputBytes,
        uint256 start,
        uint256 end
    )
        private
        pure
        returns (string memory)
    {
        bytes memory substring = new bytes(end - start);
        for (uint256 j = start; j < end; j++) {
            substring[j - start] = inputBytes[j];
        }
        return string(substring);
    }
}
