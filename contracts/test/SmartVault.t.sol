// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { Test } from "forge-std/Test.sol";

import { NO_EXPIRATION_TIME } from "@eas/contracts/Common.sol";
import { EAS } from "@eas/contracts/EAS.sol";
import { AttestationRequest, AttestationRequestData, IEAS } from "@eas/contracts/IEAS.sol";
import { ISchemaRegistry, SchemaRegistry } from "@eas/contracts/SchemaRegistry.sol";
import { ISchemaResolver } from "@eas/contracts/resolver/ISchemaResolver.sol";

import { ClaimData, ClaimType, Operator, Type } from "src/Common.sol";
import { ISmartVault, SmartVault } from "src/SmartVault.sol";
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

    function test_createVault() public {
        bytes32 validationSchema =
            schemaRegistry.register("uint256 age,string school,bool isGraduated", ISchemaResolver(address(0)), false);

        Operator[] memory ops = new Operator[](3);
        ops[0] = Operator.GT;
        ops[1] = Operator.EQ;
        ops[2] = Operator.EQ;

        bytes[] memory thresholds = new bytes[](3);
        thresholds[0] = abi.encode(18);
        thresholds[1] = abi.encode("MIT");
        thresholds[2] = abi.encode(true);

        ClaimData memory claimData = ClaimData(ClaimType.FIXED, 100, 0, "");

        bytes32 expectedVaultId = 0x6e70011464185b154d48553eb8de026e994ac90879a12b778108c533bef4edd6;

        vm.expectEmit();
        emit ISmartVault.CreateVault(expectedVaultId);
        smartVault.createVault(
            "My Vault",
            "This is a test vault",
            block.timestamp,
            block.timestamp + 2000,
            validationSchema,
            ops,
            thresholds,
            claimData
        );

        (Type[] memory types, Operator[] memory operators, bytes[] memory storedThresholds) =
            smartVault.getRules(expectedVaultId);

        assertEq(types.length, 3);
        assertTrue(types[0] == Type.BYTES32);
        assertTrue(types[1] == Type.STRING);
        assertTrue(types[2] == Type.BOOL);

        assertEq(operators.length, 3);
        assertTrue(operators[0] == Operator.GT);
        assertTrue(operators[1] == Operator.EQ);
        assertTrue(operators[2] == Operator.EQ);

        assertEq(storedThresholds.length, 3);
        assertEq(abi.decode(storedThresholds[0], (uint256)), 18);
        assertEq(abi.decode(storedThresholds[1], (string)), "MIT");
        assertEq(abi.decode(storedThresholds[2], (bool)), true);
    }

    function test_deposit() public {
        bytes32 validationSchema =
            schemaRegistry.register("uint256 age,string school,bool isGraduated", ISchemaResolver(address(0)), false);

        Operator[] memory ops = new Operator[](3);
        ops[0] = Operator.GT;
        ops[1] = Operator.EQ;
        ops[2] = Operator.EQ;

        bytes[] memory thresholds = new bytes[](3);
        thresholds[0] = abi.encode(18);
        thresholds[1] = abi.encode("MIT");
        thresholds[2] = abi.encode(true);

        ClaimData memory claimData = ClaimData(ClaimType.FIXED, 100, 0, "");

        bytes32 expectedVaultId = 0x1bd2ff5cba5fad70d2651ce90588ab401cfa55889d338bfb785de41b10c06ea1;

        vm.expectEmit();
        emit ISmartVault.CreateVault(expectedVaultId);
        smartVault.createVault(
            "My Vault",
            "This is a test vault",
            block.timestamp - 1,
            block.timestamp + 2000,
            validationSchema,
            ops,
            thresholds,
            claimData
        );

        address depositor1 = makeAddr("deposit1");
        address depositor2 = makeAddr("deposit2");

        deal(depositor1, 10 ether);
        deal(depositor2, 10 ether);

        vm.expectEmit();
        emit ISmartVault.Deposit(expectedVaultId, depositor1, 10 ether);
        vm.prank(depositor1);
        smartVault.deposit{ value: 10 ether }(expectedVaultId);

        vm.expectEmit();
        emit ISmartVault.Deposit(expectedVaultId, depositor2, 10 ether);
        vm.prank(depositor2);
        smartVault.deposit{ value: 10 ether }(expectedVaultId);

        assertEq(address(smartVault).balance, 20 ether);
        assertEq(smartVault.vaultRaised(expectedVaultId), 20 ether);
        assertEq(smartVault.vaultBalance(expectedVaultId), 20 ether);
    }

    function test_claim() public {
        bytes32 validationSchema =
            schemaRegistry.register("uint256 age,string school,bool isGraduated", ISchemaResolver(address(0)), false);

        Operator[] memory ops = new Operator[](3);
        ops[0] = Operator.GT;
        ops[1] = Operator.EQ;
        ops[2] = Operator.EQ;

        bytes[] memory thresholds = new bytes[](3);
        thresholds[0] = abi.encode(18);
        thresholds[1] = abi.encode("MIT");
        thresholds[2] = abi.encode(true);

        ClaimData memory claimData = ClaimData(ClaimType.FIXED, 100, 0, "");

        bytes32 expectedVaultId = 0x1bd2ff5cba5fad70d2651ce90588ab401cfa55889d338bfb785de41b10c06ea1;

        vm.expectEmit();
        emit ISmartVault.CreateVault(expectedVaultId);
        smartVault.createVault(
            "My Vault",
            "This is a test vault",
            block.timestamp - 1,
            block.timestamp + 2000,
            validationSchema,
            ops,
            thresholds,
            claimData
        );

        address depositor1 = makeAddr("deposit1");
        address depositor2 = makeAddr("deposit2");

        deal(depositor1, 1000 ether);
        deal(depositor2, 1000 ether);

        vm.expectEmit();
        emit ISmartVault.Deposit(expectedVaultId, depositor1, 1000 ether);
        vm.prank(depositor1);
        smartVault.deposit{ value: 1000 ether }(expectedVaultId);

        vm.expectEmit();
        emit ISmartVault.Deposit(expectedVaultId, depositor2, 1000 ether);
        vm.prank(depositor2);
        smartVault.deposit{ value: 1000 ether }(expectedVaultId);

        skip(2001);

        // create attestation
        address claimer = makeAddr("claimer");
        AttestationRequestData memory data =
            AttestationRequestData(claimer, NO_EXPIRATION_TIME, false, bytes32(0), abi.encode(20, "MIT", true), 0);
        AttestationRequest memory request = AttestationRequest(validationSchema, data);
        bytes32 attestationUID = eas.attest(request);

        smartVault.claim(expectedVaultId, attestationUID);
    }
}
