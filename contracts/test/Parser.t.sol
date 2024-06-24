// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { Test } from "forge-std/src/Test.sol";

import { Parser } from "src/libraries/Parser.sol";
import { Type } from "src/Common.sol";

contract ParserTest is Test {
    using Parser for string;
    using Parser for bytes;

    function testParseTypes() public pure {
        string memory input = "uint256 age,address recipient,bool passed";
        Type[] memory output = input.extractTypes();
        assertEq(output.length, 3);
        assertEq(uint256(output[0]), uint256(Type.UINT256));
        assertEq(uint256(output[1]), uint256(Type.ADDRESS));
        assertEq(uint256(output[2]), uint256(Type.BOOL));
    }

    function testParseTypesFromBytes() public pure {
        string memory input = "uint256 age,address recipient,bool passed";
        bytes memory inputBytes = bytes(input);
        Type[] memory output = inputBytes.extractTypes();
        assertEq(output.length, 3);
        assertEq(uint256(output[0]), uint256(Type.UINT256));
        assertEq(uint256(output[1]), uint256(Type.ADDRESS));
        assertEq(uint256(output[2]), uint256(Type.BOOL));
    }

    function testParseTypesWithUnsupportedType() public {
        string memory input = "invalidType age";
        vm.expectRevert(abi.encodeWithSelector(Parser.UnsupportedType.selector));
        input.extractTypes();
    }

    function testParseTypesWithEmptyString() public {
        string memory input = "";
        vm.expectRevert(abi.encodeWithSelector(Parser.EmptyTypeList.selector));
        input.extractTypes();
    }
}
