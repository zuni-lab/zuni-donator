// SPDX-License-Identifier: MIT
pragma solidity >=0.8.25 <0.9.0;

import { Test } from "forge-std/src/Test.sol";
import { Parser } from "../src/Parser.sol";
import { Type } from "../src/Common.sol";
import { console2 } from "forge-std/src/console2.sol";

/// @dev If this is your first time with Forge, read this tutorial in the Foundry Book:
/// https://book.getfoundry.sh/forge/writing-tests

contract ParserTest is Test {
  // Parser internal p;
  using Parser for string;
  using Parser for bytes;

  /// @dev Basic test. Run it with `forge test -vvv` to see the console log.
  function testParseTypes() public pure {
    string memory input = "uint abcddd,address baaaa,bool ckkk";
    Type[] memory output = input.extractTypes();
    assertEq(output.length, 3);
    assertEq(uint256(output[0]), uint256(Type.UINT));
    assertEq(uint256(output[1]), uint256(Type.ADDRESS));
    assertEq(uint256(output[2]), uint256(Type.BOOL));
  }

  function testParseTypesFromBytes() public pure {
    string memory input = "uint abcddd,address baaaa,bool ckkk";
    bytes memory inputBytes = bytes(input);
    Type[] memory output = inputBytes.extractTypes();
    assertEq(output.length, 3);
    assertEq(uint256(output[0]), uint256(Type.UINT));
    assertEq(uint256(output[1]), uint256(Type.ADDRESS));
    assertEq(uint256(output[2]), uint256(Type.BOOL));
  }

  function testParseTypesWithUnsupportedType() public {
    string memory input = "uint256 abcddd,address baaaa";
    bytes memory encodedError = abi.encodeWithSignature("UnsupportedType()");
    vm.expectRevert(encodedError);
    input.extractTypes();
  }

  function testParseTypesWithEmptyString() public {
    string memory input = "";
    bytes memory encodedError = abi.encodeWithSignature("EmptyInput()");
    vm.expectRevert(encodedError);
    input.extractTypes();
  }
}
