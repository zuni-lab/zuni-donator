// SPDX-License-Identifier: MIT

pragma solidity 0.8.26;

import { Test } from "forge-std/src/Test.sol";
import { SmartVault } from "../src/SmartVault.sol";
import { IEAS, EAS, Attestation } from "@eas/contracts/EAS.sol";

import { SchemaRegistry } from "@eas/contracts/SchemaRegistry.sol";
import { SchemaResolver } from "@eas/contracts/resolver/SchemaResolver.sol";
import { ISchemaResolver } from "@eas/contracts/resolver/ISchemaResolver.sol";

import { console2 } from "forge-std/src/console2.sol";

import { Operator } from "../src/Common.sol";

/// @dev If this is your first time with Forge, read this tutorial in the Foundry Book:
/// https://book.getfoundry.sh/forge/writing-tests

contract MockSchemaResolver is SchemaResolver {
    constructor(IEAS eas) SchemaResolver(eas) { }

    error OutOfBounds();

    function onAttest(Attestation calldata attestation, uint256 /*value*/ ) internal pure override returns (bool) {
        //log the attestation.data as hex
        console2.log("attestation.data: ", string(attestation.data));
        return true;
    }

    function onRevoke(Attestation calldata, /*attestation*/ uint256 /*value*/ ) internal pure override returns (bool) {
        return true;
    }

    function toBytes32(bytes memory data, uint256 start) external pure returns (bytes32) {
        return _toBytes32(data, start);
    }

    function _toBytes32(bytes memory data, uint256 start) private pure returns (bytes32) {
        unchecked {
            if (data.length < start + 32) {
                revert OutOfBounds();
            }
        }

        bytes32 tempBytes32;

        // solhint-disable-next-line no-inline-assembly
        assembly {
            tempBytes32 := mload(add(add(data, 0x20), start))
        }

        return tempBytes32;
    }
}

contract SmartVaultTest is Test {
    SmartVault private smartVault;
    // IEAS private eas;
    // ISchemaRegistry private schemaRegistry;

    EAS private eas;
    SchemaRegistry private schemaRegistry;
    bytes32 private uid;

    error SchemaRegistryAddressZero();
    error EASAddressZero();
    error EASAddressNotEqual();
    error SchemaRegistryAddressNotEqual();

    function setUp() public {
        schemaRegistry = new SchemaRegistry();
        eas = new EAS(schemaRegistry);
        smartVault = new SmartVault(eas, schemaRegistry);

        if (address(schemaRegistry) == address(0)) {
            revert SchemaRegistryAddressZero();
        }

        if (address(eas) == address(0)) {
            revert EASAddressZero();
        }

        if (address(eas) != address(smartVault.getEAS())) {
            revert EASAddressNotEqual();
        }

        if (address(schemaRegistry) != address(smartVault.getSchemaRegistry())) {
            revert SchemaRegistryAddressNotEqual();
        }

        string memory schema = "string reaction,bytes icon,uint message";

        ISchemaResolver resolver = new MockSchemaResolver(eas);

        uid = schemaRegistry.register(schema, resolver, false);
    }

    function testCreateVault() public {
        // Create a vault

        Operator[] memory ops = new Operator[](3);
        ops[0] = Operator.EQ;
        ops[1] = Operator.GT;
        ops[2] = Operator.LT;

        bytes[] memory thresholds = new bytes[](3);

        thresholds[0] = "0x01";
        thresholds[1] = "0x02";
        thresholds[2] = "0x03";

        smartVault.createVault(
            "My Vault", "This is a test vault", block.timestamp + 1000, block.timestamp + 2000, uid, ops, thresholds
        );
    }
}
