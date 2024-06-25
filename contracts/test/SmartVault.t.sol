// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { Test } from "forge-std/Test.sol";

import { EAS, IEAS } from "@eas/contracts/EAS.sol";
import { ISchemaRegistry, SchemaRegistry } from "@eas/contracts/SchemaRegistry.sol";
import { ISchemaResolver } from "@eas/contracts/resolver/ISchemaResolver.sol";

import { Operator } from "src/Common.sol";
import { SmartVault } from "src/SmartVault.sol";
import { Predeploys } from "src/libraries/Predeploys.sol";

contract SmartVaultTest is Test {
    SmartVault private smartVault;
    bytes32 private vaultSchema;

    ISchemaRegistry private schemaRegistry = ISchemaRegistry(Predeploys.SCHEMA_REGISTRY);
    IEAS private eas = IEAS(Predeploys.EAS);

    function setUp() public {
        vm.etch(Predeploys.SCHEMA_REGISTRY, address(new SchemaRegistry()).code);
        vm.etch(Predeploys.EAS, address(new EAS(schemaRegistry)).code);

        string memory schema =
            "string name,string description,uint256 depositStart,uint256 depositEnd,bytes32 validationSchema";

        vaultSchema = schemaRegistry.register(schema, ISchemaResolver(address(0)), false);
        smartVault = new SmartVault(vaultSchema);
    }

    function testCreateVault() public {
        bytes32 validationSchema =
            schemaRegistry.register("uint256 age,string school,bool isGraduated", ISchemaResolver(address(0)), false);

        Operator[] memory ops = new Operator[](3);
        ops[0] = Operator.GT;
        ops[1] = Operator.EQ;
        ops[2] = Operator.EQ;

        bytes[] memory thresholds = new bytes[](3);
        thresholds[0] = abi.encodePacked(uint256(18));
        thresholds[1] = abi.encodePacked("MIT");
        thresholds[2] = abi.encodePacked(true);

        smartVault.createVault(
            "My Vault",
            "This is a test vault",
            block.timestamp + 1000,
            block.timestamp + 2000,
            validationSchema,
            ops,
            thresholds
        );
    }
}
