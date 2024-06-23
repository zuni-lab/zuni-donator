// SPDX-License-Identifier: MIT

pragma solidity 0.8.26;

import { Test } from "forge-std/src/Test.sol";
import { SmartVault } from "../src/SmartVault.sol";
import { EAS } from "@eas/contracts/EAS.sol";

import { SchemaRegistry } from "@eas/contracts/SchemaRegistry.sol";
import { ISchemaResolver } from "@eas/contracts/resolver/ISchemaResolver.sol";

import { Operator } from "../src/Common.sol";
import { MockSchemaResolver } from "../src/MockResolver.sol";

/// @dev If this is your first time with Forge, read this tutorial in the Foundry Book:
/// https://book.getfoundry.sh/forge/writing-tests

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
