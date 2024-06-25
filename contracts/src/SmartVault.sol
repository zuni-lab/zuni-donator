// SPDX-License-Identifier: MIT
pragma solidity >=0.8.25 <0.9.0;

import { EMPTY_UID, NO_EXPIRATION_TIME } from "@eas/contracts/Common.sol";
import { IEAS, ISchemaRegistry } from "@eas/contracts/IEAS.sol";
import { Attestation, AttestationRequest, AttestationRequestData } from "@eas/contracts/IEAS.sol";

import { Operator, Type } from "./Common.sol";

import { ISmartVault } from "./interfaces/ISmartVault.sol";
import { Parser } from "./libraries/Parser.sol";
import { Predeploys } from "./libraries/Predeploys.sol";

struct Rules {
    Type[] types;
    Operator[] operators;
    bytes[] thresholds;
}

contract SmartVault is ISmartVault {
    using Parser for string;

    IEAS private constant _eas = IEAS(Predeploys.EAS);
    ISchemaRegistry private constant _schemaRegistry = ISchemaRegistry(Predeploys.SCHEMA_REGISTRY);

    mapping(bytes32 vaultUid => Rules rules) private rules;
    mapping(bytes32 vaultUid => uint256 balance) public vaultBalances;

    bytes32 public vaultSchema;

    constructor(bytes32 _vaultSchema) {
        vaultSchema = _vaultSchema;
    }

    function createVault(
        string memory name,
        string memory description,
        uint256 depositStart,
        uint256 depositEnd,
        bytes32 validationSchema,
        Operator[] memory ops,
        bytes[] memory thresholds
    )
        external
        returns (bytes32)
    {
        if (bytes(name).length == 0) {
            revert NameEmpty();
        }

        if (depositStart < block.timestamp) {
            revert DepositStartInvalid();
        }

        if (depositStart >= depositEnd) {
            revert DepositEndInvalid();
        }

        bytes memory input = abi.encode(name, description, depositStart, depositEnd, validationSchema);

        AttestationRequestData memory data = AttestationRequestData({
            recipient: msg.sender,
            expirationTime: NO_EXPIRATION_TIME,
            revocable: false,
            refUID: EMPTY_UID,
            data: input,
            value: 0
        });

        bytes32 vaultId = _eas.attest(AttestationRequest({ schema: vaultSchema, data: data }));

        // parse data type from schema
        string memory schema = _schemaRegistry.getSchema(validationSchema).schema;
        Type[] memory types = schema.extractTypes();

        if (types.length != ops.length || types.length != thresholds.length) {
            revert RulesLengthMismatch();
        }

        rules[vaultId] = Rules({ types: types, operators: ops, thresholds: thresholds });

        emit CreateVault(vaultId);

        return vaultId;
    }

    function deposit(bytes32 vaultId) external payable {
        Attestation memory attestation = _eas.getAttestation(vaultId);

        (uint256 depositStart, uint256 depositEnd) = _getDepositTimeFromAttestationData(attestation.data);
        if (block.timestamp < depositStart) {
            revert DepositNotStarted();
        }
        if (block.timestamp > depositEnd) {
            revert DepositEnded();
        }

        vaultBalances[vaultId] += msg.value;
    }

    function getRules(bytes32 vaultId) external view returns (Type[] memory, Operator[] memory, bytes[] memory) {
        return (rules[vaultId].types, rules[vaultId].operators, rules[vaultId].thresholds);
    }

    function claim(bytes32 vaultId, bytes32 attestionUID) external {
        Attestation memory attestation = _eas.getAttestation(attestionUID);
        require(attestation.recipient == msg.sender, "SmartVault: not recipient");
        require(attestation.schema == vaultSchema, "SmartVault: invalid schema");
        require(attestation.attester == address(this), "SmartVault: invalid attester");

        (, uint256 depositEnd) = _getDepositTimeFromAttestationData(attestation.data);
        require(block.timestamp > depositEnd, "SmartVault: deposit not ended");

        //     bytes memory attestationDataEncoded = attestation.data;
        //     Rules memory rule = rules[vaultId];
        //     require(rule.types.length > 0, "SmartVault: vault not found");
        //     bytes32 pointer;
        //     assembly {
        //         attestationDataEncoded := add(attestationDataEncoded, 0x20) // skip length
        //         pointer := attestationDataEncoded // save start pointer of data
        //     }
        //     for (uint256 i = 0; i < rule.types.length; i++) {
        //         if (rule.types[i] == Type.UINT) {
        //             uint256 value;
        //             assembly {
        //                 value := mload(attestationDataEncoded) // load value
        //                 attestationDataEncoded := add(attestationDataEncoded, 0x20) // skip value
        //             }
        //             uint256 threshold = abi.decode(rule.thresholds[i], (uint256));
        //             _checkUint(rule.operations[i], value, threshold);
        //         } else if (rule.types[i] == Type.INT) {
        //             int256 value;
        //             assembly {
        //                 value := mload(attestationDataEncoded) // load value
        //                 attestationDataEncoded := add(attestationDataEncoded, 0x20) // skip value
        //             }
        //             int256 threshold = abi.decode(rule.thresholds[i], (int256));
        //             _checkInt(rule.operations[i], value, threshold);
        //         } else if (rule.types[i] == Type.STRING) {
        //             // TODO: decode value from attestation.data
        //             string memory value;
        //             string memory threshold = string(rule.thresholds[i]);
        //             assembly {
        //                 let offset := mload(attestationDataEncoded) // load offset of string
        //                 c := add(offset, pointer) // calculate pointer to string from start of data pointer
        //                 attestationDataEncoded := add(attestationDataEncoded, 0x20) // skip value
        //             }
        //             _checkString(rule.operations[i], value, threshold);
        //         } else if (rule.types[i] == Type.BYTES) {
        //             bytes memory value;
        //             bytes memory threshold = rule.thresholds[i];
        //             assembly {
        //                 let offset := mload(attestationDataEncoded) // load offset of bytes (string and bytes have
        // the
        // same
        //                 // encoding)
        //                 c := add(offset, pointer) // calculate pointer to string from start of data pointer
        //                 attestationDataEncoded := add(attestationDataEncoded, 0x20) // skip value
        //             }
        //             _checkBytes(rule.operations[i], value, threshold);
        //         } else if (rule.types[i] == Type.ADDRESS) {
        //             bytes memory value;
        //             bytes memory threshold = rule.thresholds[i];
        //             assembly {
        //                 value := mload(attestationDataEncoded) // load value
        //                 attestationDataEncoded := add(attestationDataEncoded, 0x20) // skip value
        //             }
        //         } else if (rule.types[i] == Type.BOOL) {
        //             bool value;
        //             assembly {
        //                 value := mload(attestationDataEncoded) // load value
        //                 attestationDataEncoded := add(attestationDataEncoded, 0x20) // skip value
        //             }
        //             bytes memory threshold = rule.thresholds[i];
        //         }
        //     }
    }

    // function _checkString(Operator operator, string memory value, string memory threshold) private pure {
    //     if (operator == Operator.EQ) {
    //         require(
    //             keccak256(abi.encodePacked(value)) == keccak256(abi.encodePacked(threshold)),
    //             "SmartVault: invalid string"
    //         );
    //     } else if (operator == Operator.NEQ) {
    //         require(
    //             keccak256(abi.encodePacked(value)) != keccak256(abi.encodePacked(threshold)),
    //             "SmartVault: invalid string"
    //         );
    //     } else if (operator != Operator.NONE) {
    //         revert("SmartVault: invalid operation");
    //     }
    // }

    // function _checkBytes(Operator operator, bytes memory value, bytes memory threshold) private pure {
    //     if (operator == Operator.EQ) {
    //         require(
    //             keccak256(abi.encodePacked(value)) == keccak256(abi.encodePacked(threshold)),
    //             "SmartVault: invalid string"
    //         );
    //     } else if (operator == Operator.NEQ) {
    //         require(
    //             keccak256(abi.encodePacked(value)) != keccak256(abi.encodePacked(threshold)),
    //             "SmartVault: invalid string"
    //         );
    //     } else if (operator != Operator.NONE) {
    //         revert("SmartVault: invalid operation");
    //     }
    // }

    // function _checkBytes(Operator operator, bytes memory value, bytes memory threshold) private pure {
    //     if (operator == Operator.EQ) {
    //         require(
    //             keccak256(abi.encodePacked(value)) == keccak256(abi.encodePacked(threshold)),
    //             "SmartVault: invalid string"
    //         );
    //     } else if (operator == Operator.NEQ) {
    //         require(
    //             keccak256(abi.encodePacked(value)) != keccak256(abi.encodePacked(threshold)),
    //             "SmartVault: invalid string"
    //         );
    //     } else if (operator != Operator.NONE) {
    //         revert("SmartVault: invalid operation");
    //     }
    // }

    // function _checkBytes(Operator operator, bytes memory value, bytes memory threshold) private pure {
    //     if (operator == Operator.EQ) {
    //         require(
    //             keccak256(abi.encodePacked(value)) == keccak256(abi.encodePacked(threshold)),
    //             "SmartVault: invalid string"
    //         );
    //     } else if (operator == Operator.NEQ) {
    //         require(
    //             keccak256(abi.encodePacked(value)) != keccak256(abi.encodePacked(threshold)),
    //             "SmartVault: invalid string"
    //         );
    //     } else if (operator != Operator.NONE) {
    //         revert("SmartVault: invalid operation");
    //     }
    // }

    // function _checkBytes(Operator operator, bytes memory value, bytes memory threshold) private pure {
    //     if (operator == Operator.EQ) {
    //         require(
    //             keccak256(abi.encodePacked(value)) == keccak256(abi.encodePacked(threshold)),
    //             "SmartVault: invalid string"
    //         );
    //     } else if (operator == Operator.NEQ) {
    //         require(
    //             keccak256(abi.encodePacked(value)) != keccak256(abi.encodePacked(threshold)),
    //             "SmartVault: invalid string"
    //         );
    //     } else if (operator != Operator.NONE) {
    //         revert("SmartVault: invalid operation");
    //     }
    // }

    function _getDepositTimeFromAttestationData(bytes memory data)
        private
        pure
        returns (uint256 depositStart, uint256 depositEnd)
    {
        assembly {
            // skip length, name, description
            depositStart := mload(add(data, 0x60))
            depositEnd := mload(add(data, 0x80))
        }
    }
}
