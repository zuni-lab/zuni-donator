// SPDX-License-Identifier: MIT
pragma solidity >=0.8.25 <0.9.0;

import { IEAS, ISchemaRegistry } from "@eas/contracts/IEAS.sol";
import { Attestation, AttestationRequest, AttestationRequestData } from "@eas/contracts/IEAS.sol";
import { NO_EXPIRATION_TIME, EMPTY_UID } from "@eas/contracts/Common.sol";

import {
    Operator,
    Type,
    InvalidEAS,
    InvalidSchemaRegistry,
    NameEmpty,
    DepositStartInvalid,
    DepositEndInvalid,
    InvalidOperators,
    InvalidThresholds
} from "./Common.sol";
import { Parser } from "./Parser.sol";

import { console2 } from "forge-std/src/console2.sol";

struct Rules {
    Type[] types;
    Operator[] operators;
    bytes[] thresholds;
}

contract SmartVault {
    using Parser for string;

    IEAS private immutable _EAS;
    ISchemaRegistry private immutable _SCHEMA_REGISTRY;

    mapping(bytes32 vaultUid => Rules rules) private rules;
    mapping(bytes32 vaultUid => string) private vaultSchemas;

    constructor(IEAS eas, ISchemaRegistry schemaRegistry) {
        if (address(eas) == address(0)) {
            revert InvalidEAS();
        }

        if (address(schemaRegistry) == address(0)) {
            revert InvalidSchemaRegistry();
        }

        _EAS = eas;
        _SCHEMA_REGISTRY = schemaRegistry;
    }

    //   uint256 public vaultSchema;

    // Modifier for validating vault creation parameters
    modifier validateVaultCreation(string memory name, uint256 depositStart, uint256 depositEnd) {
        if (bytes(name).length == 0) {
            revert NameEmpty();
        }

        if (depositStart <= block.timestamp) {
            revert DepositStartInvalid();
        }

        if (depositStart >= depositEnd) {
            revert DepositEndInvalid();
        }
        _; // Continue execution
    }

    function createVault(
        string memory name,
        string memory description,
        uint256 depositStart,
        uint256 depositEnd,
        bytes32 schemaUID,
        Operator[] memory ops,
        bytes[] memory thresholds
    )
        external
        validateVaultCreation(name, depositStart, depositEnd)
        returns (bytes32)
    {
        // // parse data type from schema
        string memory schema = _SCHEMA_REGISTRY.getSchema(schemaUID).schema;
        Type[] memory types = schema.extractTypes();

        if (types.length != ops.length) {
            revert InvalidOperators();
        }

        if (types.length != thresholds.length) {
            revert InvalidThresholds();
        }

        bytes memory input = abi.encode(name, description, depositStart, depositEnd);

        AttestationRequestData memory data = AttestationRequestData({
            recipient: msg.sender,
            expirationTime: NO_EXPIRATION_TIME,
            revocable: false,
            refUID: EMPTY_UID,
            data: input,
            value: 0
        });

        bytes32 vaultId = _EAS.attest(AttestationRequest({ schema: schemaUID, data: data }));
        rules[vaultId] = Rules({ types: types, operators: ops, thresholds: thresholds });
        vaultSchemas[vaultId] = schema;
        console2.log("Vault created with id:");
        console2.logBytes32(vaultId);
        console2.log("Schema:");
        console2.log(schema);
        return vaultId;
    }

    function deposit(bytes32 vaultId) external {
        // TODO: check time ...
        Attestation memory attestation = _EAS.getAttestation(vaultId);

        console2.log("Deposit attestation:");
        console2.logBytes32(attestation.schema);
    }

    //   function claim(bytes32 vaultId, bytes32 attestionUID) external {
    //     Attestation memory attestation = _eas.getAttestation(attestionUID);
    //     require(attestation.recipient == msg.sender, "SmartVault: not recipient");
    //     require(attestation.schema == vaultSchema, "SmartVault: invalid schema");
    //     require(attestation.attester == address(this), "SmartVault: invalid attester");
    //     // TODO: check time ...
    //     bytes memory attestationDataEncoded = attestation.data;
    //     Rules memory rule = rules[vaultId];
    //     require(rule.types.length > 0, "SmartVault: vault not found");
    //     bytes32 pointer;
    //     assembly {
    //       attestationDataEncoded := add(attestationDataEncoded, 0x20) // skip length
    //       pointer := attestationDataEncoded // save start pointer of data
    //     }
    //     for (uint256 i = 0; i < rule.types.length; i++) {
    //       if (rule.types[i] == Type.UINT) {
    //         // TODO: decode value from attestation.data
    //         uint256 value;
    //         assembly {
    //           value := mload(attestationDataEncoded) // load value
    //           attestationDataEncoded := add(attestationDataEncoded, 0x20) // skip value
    //         }
    //         uint256 threshold = abi.decode(rule.thresholds[i], (uint256));
    //         _checkUint(rule.operations[i], value, threshold);
    //       } else if (rule.types[i] == Type.INT) {
    //         int256 value;
    //         assembly {
    //           value := mload(attestationDataEncoded) // load value
    //           attestationDataEncoded := add(attestationDataEncoded, 0x20) // skip value
    //         }
    //         int256 threshold = abi.decode(rule.thresholds[i], (int256));
    //       } else if (rule.types[i] == Type.STRING) {
    //         // TODO: decode value from attestation.data
    //         string memory value;
    //         string memory threshold = string(rule.thresholds[i]);
    //         assembly {
    //           let offset := mload(attestationDataEncoded) // load offset of string
    //           c := add(offset, pointer) // calculate pointer to string from start of data pointer
    //           attestationDataEncoded := add(attestationDataEncoded, 0x20) // skip value
    //         }
    //         // TODO: check string
    //         _checkString(rule.operations[i], value, threshold);
    //       } else if (rule.types[i] == Type.BYTES) {
    //         // TODO: decode value from attestation.data
    //         bytes memory value;
    //         bytes memory threshold = rule.thresholds[i];
    //         assembly {
    //           let offset := mload(attestationDataEncoded) // load offset of bytes (string and bytes have the same
    //           // encoding)
    //           c := add(offset, pointer) // calculate pointer to string from start of data pointer
    //           attestationDataEncoded := add(attestationDataEncoded, 0x20) // skip value
    //         }
    //         _checkBytes(rule.operations[i], value, threshold);
    //       } else if (rule.types[i] == Type.ADDRESS) {
    //         bytes memory value;
    //         bytes memory threshold = rule.thresholds[i];
    //         assembly {
    //           value := mload(attestationDataEncoded) // load value
    //           attestationDataEncoded := add(attestationDataEncoded, 0x20) // skip value
    //         }
    //       } else if (rule.types[i] == Type.BOOL) {
    //         bool value;
    //         assembly {
    //           value := mload(attestationDataEncoded) // load value
    //           attestationDataEncoded := add(attestationDataEncoded, 0x20) // skip value
    //         }
    //         bytes memory threshold = rule.thresholds[i];
    //       }
    //     }
    //   }

    //   function _checkString(Operation operation, string memory value, string memory threshold) private {
    //     if (operation == Operation.EQ) {
    //       require(
    //         keccak256(abi.encodePacked(value)) == keccak256(abi.encodePacked(threshold)),
    //         "SmartVault: invalid string"
    //       );
    //     } else if (operation == Operation.NEQ) {
    //       require(
    //         keccak256(abi.encodePacked(value)) != keccak256(abi.encodePacked(threshold)),
    //         "SmartVault: invalid string"
    //       );
    //     } else if (operation != Operation.NONE) {
    //       revert("SmartVault: invalid operation");
    //     }
    //   }

    function getEAS() external view returns (IEAS) {
        return _EAS;
    }

    function getSchemaRegistry() external view returns (ISchemaRegistry) {
        return _SCHEMA_REGISTRY;
    }
}
