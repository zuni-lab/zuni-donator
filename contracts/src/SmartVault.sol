// SPDX-License-Identifier: MIT
pragma solidity >=0.8.25 <0.9.0;

import { IEAS, ISchemaRegistry, Attestation, AttestationRequest, AttestationRequestData } from "@eas/contracts/IEAS.sol";

import { Operation, Type } from "./Common.sol";
import { Parser } from "./Parser.sol";

struct Rules {
    Type[] types;
    Operation[] operations;
    bytes[] thresholds;
}

contract SmartVault {
  using Parser for bytes;

  IEAS private _eas;
  ISchemaRegistry private _schemaRegistry;
  uint256 public vaultSchema;
  mapping(bytes32 => Rules) private rules;

  function createVault(
    string memory name,
    string memory description,
    bytes32 attestionSchemaUID,
    Operation[] memory operations,
    bytes[] memory thresholds
  ) external {
    bytes memory vaultData = abi.encode(name, description);
    AttestationRequestData memory data = AttestationRequestData({
      recipient: msg.sender,
      expirationTime: 0,
      revocable: false,
      refUID: bytes32(0),
      data: vaultData,
      value: 0
    });
    bytes32 vaultId = _eas.attest(vaultSchema, AttestationRequest({ schema: vaultSchema, data: data }));

    // parse data type from attestion schema
    bytes memory schema = _schemaRegistry.getSchema(attestionSchemaUID).schema;
    // TODO: logic parse data
    Type[] memory types = schema.extractTypes();

    // add rules
    rules[vaultId] = Rules({ types: types, operations: operations, thresholds: thresholds });
  }

  //   function deposit(bytes32 vaultId) external {
  //     // TODO: check time ...
  //   }

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
}
