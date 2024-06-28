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

    bytes32 private constant DONT_CARE_BYTES32 = bytes32(0);

    function setUp() public {
        vm.etch(Predeploys.SCHEMA_REGISTRY, address(new SchemaRegistry()).code);
        vm.etch(Predeploys.EAS, address(new EAS(schemaRegistry)).code);

        vaultSchema = schemaRegistry.register(
            "string name,string description,uint256 contributeStart,uint256 contributeEnd,bytes32 validationSchema",
            ISchemaResolver(address(0)),
            false
        );
        bytes32 contributeSchema = schemaRegistry.register(
            "bytes32 vaultId,address contributor,uint256 amount,uint256 timestamp", ISchemaResolver(address(0)), false
        );
        bytes32 claimSchema = schemaRegistry.register(
            "bytes32 vaultId,address claimer,uint256 amount,uint256 timestamp", ISchemaResolver(address(0)), false
        );
        smartVault = new SmartVault(vaultSchema, contributeSchema, claimSchema);
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

        address[] memory attesters = new address[](0);

        vm.expectEmit(false, true, true, true, address(smartVault));
        emit ISmartVault.CreateVault(DONT_CARE_BYTES32);
        bytes32 vaultId = smartVault.createVault(
            "My Vault",
            "This is a test vault",
            block.timestamp,
            block.timestamp + 2000,
            validationSchema,
            attesters,
            ops,
            thresholds,
            claimData
        );

        (Type[] memory types, Operator[] memory operators, bytes[] memory storedThresholds) =
            smartVault.getRules(vaultId);

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

    function test_contribute() public {
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

        address[] memory attesters = new address[](0);

        bytes32 vaultId = smartVault.createVault(
            "My Vault",
            "This is a test vault",
            block.timestamp - 1,
            block.timestamp + 2000,
            validationSchema,
            attesters,
            ops,
            thresholds,
            claimData
        );

        address contributor1 = makeAddr("contributor1");
        address contributor2 = makeAddr("contributor2");

        deal(contributor1, 10 ether);
        deal(contributor2, 10 ether);

        vm.expectEmit(true, true, false, true, address(smartVault));
        emit ISmartVault.Contribute(vaultId, contributor1, DONT_CARE_BYTES32, 10 ether);
        vm.prank(contributor1);
        smartVault.contribute{ value: 10 ether }(vaultId);

        vm.expectEmit(true, true, false, true, address(smartVault));
        emit ISmartVault.Contribute(vaultId, contributor2, DONT_CARE_BYTES32, 10 ether);
        vm.prank(contributor2);
        smartVault.contribute{ value: 10 ether }(vaultId);

        assertEq(address(smartVault).balance, 20 ether);
        assertEq(smartVault.vaultRaised(vaultId), 20 ether);
        assertEq(smartVault.vaultBalance(vaultId), 20 ether);
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

        address[] memory attesters = new address[](0);

        bytes32 vaultId = smartVault.createVault(
            "My Vault",
            "This is a test vault",
            block.timestamp - 1,
            block.timestamp + 2000,
            validationSchema,
            attesters,
            ops,
            thresholds,
            claimData
        );

        address contributor1 = makeAddr("contribut1");
        address contributor2 = makeAddr("contribut2");

        deal(contributor1, 1000 ether);
        deal(contributor2, 1000 ether);

        vm.expectEmit(true, true, false, true, address(smartVault));
        emit ISmartVault.Contribute(vaultId, contributor1, DONT_CARE_BYTES32, 1000 ether);
        vm.prank(contributor1);
        smartVault.contribute{ value: 1000 ether }(vaultId);

        vm.expectEmit(true, true, false, true, address(smartVault));
        emit ISmartVault.Contribute(vaultId, contributor2, DONT_CARE_BYTES32, 1000 ether);
        vm.prank(contributor2);
        smartVault.contribute{ value: 1000 ether }(vaultId);

        skip(2001);

        // create attestation
        address claimer = makeAddr("claimer");
        AttestationRequestData memory data =
            AttestationRequestData(claimer, NO_EXPIRATION_TIME, false, bytes32(0), abi.encode(20, "MIT", true), 0);
        AttestationRequest memory request = AttestationRequest(validationSchema, data);
        bytes32 attestationUID = eas.attest(request);

        smartVault.claim(vaultId, attestationUID);
    }
}
