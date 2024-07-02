// SPDX-License-Identifier: MIT
pragma solidity >=0.8.25 <0.9.0;

import { EMPTY_UID, NO_EXPIRATION_TIME } from "@eas/contracts/Common.sol";
import { IEAS, ISchemaRegistry } from "@eas/contracts/IEAS.sol";
import { Attestation, AttestationRequest, AttestationRequestData } from "@eas/contracts/IEAS.sol";

import { ClaimData, ClaimType, Operator, Type } from "./Common.sol";
import { ISmartVault, Rules } from "./interfaces/ISmartVault.sol";
import { Parser } from "./libraries/Parser.sol";
import { Predeploys } from "./libraries/Predeploys.sol";

contract SmartVault is ISmartVault {
    using Parser for string;

    IEAS private constant _eas = IEAS(Predeploys.EAS);
    ISchemaRegistry private constant _schemaRegistry = ISchemaRegistry(Predeploys.SCHEMA_REGISTRY);

    mapping(bytes32 vaultId => Rules rules) private _rules;
    mapping(bytes32 vaultId => uint256 raised) public vaultRaised;
    mapping(bytes32 vaultId => uint256 balance) public vaultBalance;
    mapping(bytes32 claimId => bool) private _claimed;

    bytes32 public immutable vaultSchema;
    bytes32 public immutable contributeSchema;
    bytes32 public immutable claimSchema;

    constructor(bytes32 _vaultSchema, bytes32 _contributeSchema, bytes32 _claimSchema) {
        vaultSchema = _vaultSchema;
        contributeSchema = _contributeSchema;
        claimSchema = _claimSchema;
    }

    /// @notice ISmartVault
    function createVault(
        string memory name,
        string memory description,
        uint256 contributeStart,
        uint256 contributeEnd,
        bytes32 validationSchema,
        address[] memory attesters,
        Operator[] memory operators,
        bytes[] memory thresholds,
        ClaimData memory claimData
    )
        external
        returns (bytes32)
    {
        if (bytes(name).length == 0) {
            revert NameEmpty();
        }

        if (contributeStart >= contributeEnd || contributeEnd < block.timestamp) {
            revert ContributeTimeInvalid();
        }

        string memory schema = _schemaRegistry.getSchema(validationSchema).schema;
        Type[] memory types = schema.extractTypes();

        // validate rules
        if (types.length != operators.length || types.length != thresholds.length) {
            revert RulesLengthMismatch();
        }

        for (uint256 i = 0; i < types.length; i++) {
            if (types[i] == Type.UNSUPPORTED) {
                require(operators[i] == Operator.NONE, "SmartVault: can not compare unsupported type");
            } else if (
                types[i] == Type.ADDRESS || types[i] == Type.BOOL || types[i] == Type.BYTES || types[i] == Type.STRING
            ) {
                require(
                    operators[i] == Operator.EQ || operators[i] == Operator.NEQ || operators[i] == Operator.NONE,
                    "SmartVault: invalid operation"
                );
            }
        }

        if (
            (claimData.claimType == ClaimType.FIXED && claimData.fixedAmount == 0)
                || (claimData.claimType == ClaimType.PERCENTAGE && claimData.percentage == 0)
        ) {
            revert ClaimDataInvalid();
        }

        AttestationRequestData memory data = AttestationRequestData({
            recipient: msg.sender,
            expirationTime: NO_EXPIRATION_TIME,
            revocable: false,
            refUID: EMPTY_UID,
            data: abi.encode(
                name,
                description,
                contributeStart,
                contributeEnd,
                validationSchema,
                attesters,
                operators,
                thresholds,
                claimData.claimType,
                claimData.fixedAmount,
                claimData.percentage,
                claimData.customData
            ),
            value: 0
        });
        bytes32 vaultId = _eas.attest(AttestationRequest({ schema: vaultSchema, data: data }));

        _rules[vaultId] = Rules(attesters, types, operators, thresholds, claimData);

        emit CreateVault(vaultId);

        return vaultId;
    }

    /// @notice ISmartVault
    function contribute(bytes32 vaultId) external payable {
        if (msg.value == 0) {
            revert ZeroContribution();
        }

        Attestation memory attestation = _eas.getAttestation(vaultId);
        if (attestation.uid != vaultId) {
            revert VaultNotFound();
        }

        (uint256 contributeStart, uint256 contributeEnd) = _getContributeTimeFromAttestation(attestation.data);
        if (block.timestamp < contributeStart) {
            revert ContributeNotStarted();
        }
        if (block.timestamp > contributeEnd) {
            revert ContributeEnded();
        }

        address contributor = msg.sender;
        uint256 amount = msg.value;

        vaultRaised[vaultId] += amount;
        vaultBalance[vaultId] = vaultRaised[vaultId];

        // attest contribution
        AttestationRequestData memory data = AttestationRequestData({
            recipient: contributor,
            expirationTime: NO_EXPIRATION_TIME,
            revocable: false,
            refUID: vaultId,
            data: abi.encode(vaultId, contributor, amount, block.timestamp),
            value: 0
        });
        bytes32 contributionId = _eas.attest(AttestationRequest(contributeSchema, data));

        emit Contribute(vaultId, contributor, contributionId, amount);
    }

    /// @notice ISmartVault
    function claim(bytes32 vaultId, bytes32 attestionUID) external {
        Attestation memory vaultAttestation = _eas.getAttestation(vaultId);
        if (vaultAttestation.uid != vaultId) {
            revert VaultNotFound();
        }

        (, uint256 contributeEnd) = _getContributeTimeFromAttestation(vaultAttestation.data);
        if (block.timestamp < contributeEnd) {
            revert ClaimNotStarted();
        }

        Attestation memory validationAttestation = _eas.getAttestation(attestionUID);
        if (validationAttestation.uid != attestionUID) {
            revert AttestationNotFound();
        }
        if (validationAttestation.revocationTime != 0 && validationAttestation.revocationTime < block.timestamp) {
            revert AttestationRevoked();
        }

        bytes32 claimId = _getClaimId(vaultId, attestionUID);
        if (_claimed[attestionUID]) {
            revert Claimed();
        }

        Rules memory rules = _rules[vaultId];

        _validateRules(rules, validationAttestation.attester, validationAttestation.data);

        ClaimData memory claimData = rules.claimData;
        uint256 claimAmount;
        if (claimData.claimType == ClaimType.FIXED) {
            claimAmount = claimData.fixedAmount;
        } else if (claimData.claimType == ClaimType.PERCENTAGE) {
            claimAmount = (vaultRaised[vaultId] * claimData.percentage) / (10 ** 18);
        } else if (claimData.claimType == ClaimType.CUSTOM) {
            revert("Not support yet");
        }

        uint256 _vaultBalance = vaultBalance[vaultId];
        if (_vaultBalance == 0) {
            revert Finished();
        }

        if (claimAmount > _vaultBalance) {
            claimAmount = _vaultBalance;
        }
        vaultBalance[vaultId] = _vaultBalance - claimAmount;
        _claimed[claimId] = true;

        // attest claim
        AttestationRequestData memory data = AttestationRequestData({
            recipient: validationAttestation.recipient,
            expirationTime: NO_EXPIRATION_TIME,
            revocable: false,
            refUID: vaultId,
            data: abi.encode(vaultId, validationAttestation.recipient, claimAmount, block.timestamp),
            value: 0
        });
        bytes32 contributionId = _eas.attest(AttestationRequest(contributeSchema, data));

        (bool success,) = validationAttestation.recipient.call{ value: claimAmount }("");
        require(success, "SmartVault: claim failed");

        emit Claim(vaultId, attestionUID, contributionId, claimAmount);
    }

    /// @notice ISmartVault
    function getRules(bytes32 vaultId) external view returns (Type[] memory, Operator[] memory, bytes[] memory) {
        Rules memory rules = _rules[vaultId];
        return (rules.types, rules.operators, rules.thresholds);
    }

    /// @notice ISmartVault
    function isClaimed(bytes32 vaultId, bytes32 attestionUID) external view returns (bool) {
        bytes32 claimId = _getClaimId(vaultId, attestionUID);
        return _claimed[claimId];
    }

    function _checkBytes32(Operator operator, bytes32 value, bytes32 threshold) private pure {
        if (operator == Operator.EQ) {
            require(value == threshold, "SmartVault: invalid bytes32");
        } else if (operator == Operator.NEQ) {
            require(value != threshold, "SmartVault: invalid bytes32");
        } else if (operator == Operator.LT) {
            require(value < threshold, "SmartVault: invalid bytes32");
        } else if (operator == Operator.LTE) {
            require(value <= threshold, "SmartVault: invalid bytes32");
        } else if (operator == Operator.GT) {
            require(value > threshold, "SmartVault: invalid bytes32");
        } else if (operator == Operator.GTE) {
            require(value >= threshold, "SmartVault: invalid bytes32");
        } else if (operator != Operator.NONE) {
            revert("SmartVault: invalid operation");
        }
    }

    function _checkUint256(Operator operator, uint256 value, uint256 threshold) private pure {
        if (operator == Operator.EQ) {
            require(value == threshold, "SmartVault: invalid int256");
        } else if (operator == Operator.NEQ) {
            require(value != threshold, "SmartVault: invalid int256");
        } else if (operator == Operator.GT) {
            require(value > threshold, "SmartVault: invalid int256");
        } else if (operator == Operator.GTE) {
            require(value >= threshold, "SmartVault: invalid int256");
        } else if (operator == Operator.LT) {
            require(value < threshold, "SmartVault: invalid int256");
        } else if (operator == Operator.LTE) {
            require(value <= threshold, "SmartVault: invalid int256");
        } else if (operator != Operator.NONE) {
            revert("SmartVault: invalid operation");
        }
    }

    function _checkInt256(Operator operator, int256 value, int256 threshold) private pure {
        if (operator == Operator.EQ) {
            require(value == threshold, "SmartVault: invalid int256");
        } else if (operator == Operator.NEQ) {
            require(value != threshold, "SmartVault: invalid int256");
        } else if (operator == Operator.GT) {
            require(value > threshold, "SmartVault: invalid int256");
        } else if (operator == Operator.GTE) {
            require(value >= threshold, "SmartVault: invalid int256");
        } else if (operator == Operator.LT) {
            require(value < threshold, "SmartVault: invalid int256");
        } else if (operator == Operator.LTE) {
            require(value <= threshold, "SmartVault: invalid int256");
        } else if (operator != Operator.NONE) {
            revert("SmartVault: invalid operation");
        }
    }

    function _checkAddress(Operator operator, address value, address threshold) private pure {
        if (operator == Operator.EQ) {
            require(value == threshold, "SmartVault: invalid address");
        } else if (operator == Operator.NEQ) {
            require(value != threshold, "SmartVault: invalid address");
        } else if (operator != Operator.NONE) {
            revert("SmartVault: invalid operation");
        }
    }

    function _checkBool(Operator operator, bool value, bool threshold) private pure {
        if (operator == Operator.EQ) {
            require(value == threshold, "SmartVault: invalid bool");
        } else if (operator == Operator.NEQ) {
            require(value != threshold, "SmartVault: invalid bool");
        } else if (operator != Operator.NONE) {
            revert("SmartVault: invalid operation");
        }
    }

    function _checkBytes(Operator operator, bytes memory value, bytes memory threshold) private pure {
        if (operator == Operator.EQ) {
            require(
                keccak256(abi.encodePacked(value)) == keccak256(abi.encodePacked(threshold)),
                "SmartVault: invalid bytes"
            );
        } else if (operator == Operator.NEQ) {
            require(
                keccak256(abi.encodePacked(value)) != keccak256(abi.encodePacked(threshold)),
                "SmartVault: invalid bytes"
            );
        } else if (operator != Operator.NONE) {
            revert("SmartVault: invalid operation");
        }
    }

    function _getContributeTimeFromAttestation(bytes memory data)
        private
        pure
        returns (uint256 contributeStart, uint256 contributeEnd)
    {
        assembly {
            // skip length, name, description
            contributeStart := mload(add(data, 0x60))
            contributeEnd := mload(add(data, 0x80))
        }
    }

    function _getClaimId(bytes32 vaultId, bytes32 attestionUID) private pure returns (bytes32) {
        return keccak256(abi.encode(vaultId, attestionUID));
    }

    function _validateRules(Rules memory rules, address attester, bytes memory validationData) private pure {
        if (rules.attesters.length != 0) {
            bool existed = false;
            for (uint256 i = 0; i < rules.attesters.length; i++) {
                if (rules.attesters[i] == attester) {
                    existed = true;
                    break;
                }
            }
            require(existed, "SmartVault: attester not allowed");
        }

        bytes32 pointer;
        assembly {
            validationData := add(validationData, 0x20)
            pointer := validationData
        }
        for (uint256 i = 0; i < rules.types.length; i++) {
            if (rules.types[i] == Type.BYTES1) {
                bytes1 value;
                assembly {
                    value := mload(validationData)
                    validationData := add(validationData, 0x20)
                }
                if (rules.operators[i] == Operator.NONE) continue;

                bytes1 threshold = abi.decode(rules.thresholds[i], (bytes1));
                _checkBytes32(rules.operators[i], value, threshold);
            } else if (rules.types[i] == Type.BYTES2) {
                bytes2 value;
                assembly {
                    value := mload(validationData)
                    validationData := add(validationData, 0x20)
                }
                if (rules.operators[i] == Operator.NONE) continue;

                bytes2 threshold = abi.decode(rules.thresholds[i], (bytes2));
                _checkBytes32(rules.operators[i], value, threshold);
            } else if (rules.types[i] == Type.BYTES3) {
                bytes3 value;
                assembly {
                    value := mload(validationData)
                    validationData := add(validationData, 0x20)
                }
                if (rules.operators[i] == Operator.NONE) continue;

                bytes3 threshold = abi.decode(rules.thresholds[i], (bytes3));
                _checkBytes32(rules.operators[i], value, threshold);
            } else if (rules.types[i] == Type.BYTES4) {
                bytes4 value;
                assembly {
                    value := mload(validationData)
                    validationData := add(validationData, 0x20)
                }
                if (rules.operators[i] == Operator.NONE) continue;

                bytes4 threshold = abi.decode(rules.thresholds[i], (bytes4));
                _checkBytes32(rules.operators[i], value, threshold);
            } else if (rules.types[i] == Type.BYTES8) {
                bytes8 value;
                assembly {
                    value := mload(validationData)
                    validationData := add(validationData, 0x20)
                }
                if (rules.operators[i] == Operator.NONE) continue;

                bytes8 threshold = abi.decode(rules.thresholds[i], (bytes8));
                _checkBytes32(rules.operators[i], value, threshold);
            } else if (rules.types[i] == Type.BYTES16) {
                bytes16 value;
                assembly {
                    value := mload(validationData)
                    validationData := add(validationData, 0x20)
                }
                if (rules.operators[i] == Operator.NONE) continue;

                bytes16 threshold = abi.decode(rules.thresholds[i], (bytes16));
                _checkBytes32(rules.operators[i], value, threshold);
            } else if (rules.types[i] == Type.BYTES32) {
                bytes32 value;
                assembly {
                    value := mload(validationData)
                    validationData := add(validationData, 0x20)
                }
                if (rules.operators[i] == Operator.NONE) continue;

                bytes32 threshold = abi.decode(rules.thresholds[i], (bytes32));
                _checkBytes32(rules.operators[i], value, threshold);
            } else if (rules.types[i] == Type.UINT8) {
                uint8 value;
                assembly {
                    value := mload(validationData)
                    validationData := add(validationData, 0x20)
                }
                if (rules.operators[i] == Operator.NONE) continue;

                uint8 threshold = abi.decode(rules.thresholds[i], (uint8));
                _checkUint256(rules.operators[i], value, threshold);
            } else if (rules.types[i] == Type.UINT16) {
                uint16 value;
                assembly {
                    value := mload(validationData)
                    validationData := add(validationData, 0x20)
                }
                if (rules.operators[i] == Operator.NONE) continue;

                uint16 threshold = abi.decode(rules.thresholds[i], (uint16));
                _checkUint256(rules.operators[i], value, threshold);
            } else if (rules.types[i] == Type.UINT24) {
                uint24 value;
                assembly {
                    value := mload(validationData)
                    validationData := add(validationData, 0x20)
                }
                if (rules.operators[i] == Operator.NONE) continue;

                uint24 threshold = abi.decode(rules.thresholds[i], (uint24));
                _checkUint256(rules.operators[i], value, threshold);
            } else if (rules.types[i] == Type.UINT32) {
                uint32 value;
                assembly {
                    value := mload(validationData)
                    validationData := add(validationData, 0x20)
                }
                if (rules.operators[i] == Operator.NONE) continue;

                uint32 threshold = abi.decode(rules.thresholds[i], (uint32));
                _checkUint256(rules.operators[i], value, threshold);
            } else if (rules.types[i] == Type.UINT64) {
                uint64 value;
                assembly {
                    value := mload(validationData)
                    validationData := add(validationData, 0x20)
                }
                if (rules.operators[i] == Operator.NONE) continue;

                uint64 threshold = abi.decode(rules.thresholds[i], (uint64));
                _checkUint256(rules.operators[i], value, threshold);
            } else if (rules.types[i] == Type.UINT128) {
                uint128 value;
                assembly {
                    value := mload(validationData)
                    validationData := add(validationData, 0x20)
                }
                if (rules.operators[i] == Operator.NONE) continue;

                uint128 threshold = abi.decode(rules.thresholds[i], (uint128));
                _checkUint256(rules.operators[i], value, threshold);
            } else if (rules.types[i] == Type.UINT256) {
                uint256 value;
                assembly {
                    value := mload(validationData)
                    validationData := add(validationData, 0x20)
                }
                if (rules.operators[i] == Operator.NONE) continue;

                uint256 threshold = abi.decode(rules.thresholds[i], (uint256));
                _checkUint256(rules.operators[i], value, threshold);
            } else if (rules.types[i] == Type.INT8) {
                int8 value;
                assembly {
                    value := mload(validationData)
                    validationData := add(validationData, 0x20)
                }
                if (rules.operators[i] == Operator.NONE) continue;

                int8 threshold = abi.decode(rules.thresholds[i], (int8));
                _checkInt256(rules.operators[i], value, threshold);
            } else if (rules.types[i] == Type.INT16) {
                int16 value;
                assembly {
                    value := mload(validationData)
                    validationData := add(validationData, 0x20)
                }
                if (rules.operators[i] == Operator.NONE) continue;

                int16 threshold = abi.decode(rules.thresholds[i], (int16));
                _checkInt256(rules.operators[i], value, threshold);
            } else if (rules.types[i] == Type.INT24) {
                int24 value;
                assembly {
                    value := mload(validationData)
                    validationData := add(validationData, 0x20)
                }
                if (rules.operators[i] == Operator.NONE) continue;

                int24 threshold = abi.decode(rules.thresholds[i], (int24));
                _checkInt256(rules.operators[i], value, threshold);
            } else if (rules.types[i] == Type.INT32) {
                int32 value;
                assembly {
                    value := mload(validationData)
                    validationData := add(validationData, 0x20)
                }
                if (rules.operators[i] == Operator.NONE) continue;

                int32 threshold = abi.decode(rules.thresholds[i], (int32));
                _checkInt256(rules.operators[i], value, threshold);
            } else if (rules.types[i] == Type.INT64) {
                int64 value;
                assembly {
                    value := mload(validationData)
                    validationData := add(validationData, 0x20)
                }
                if (rules.operators[i] == Operator.NONE) continue;

                int64 threshold = abi.decode(rules.thresholds[i], (int64));
                _checkInt256(rules.operators[i], value, threshold);
            } else if (rules.types[i] == Type.INT128) {
                int128 value;
                assembly {
                    value := mload(validationData)
                    validationData := add(validationData, 0x20)
                }
                if (rules.operators[i] == Operator.NONE) continue;

                int128 threshold = abi.decode(rules.thresholds[i], (int128));
                _checkInt256(rules.operators[i], value, threshold);
            } else if (rules.types[i] == Type.INT256) {
                int256 value;
                assembly {
                    value := mload(validationData)
                    validationData := add(validationData, 0x20)
                }
                if (rules.operators[i] == Operator.NONE) continue;

                int256 threshold = abi.decode(rules.thresholds[i], (int256));
                _checkInt256(rules.operators[i], value, threshold);
            } else if (rules.types[i] == Type.ADDRESS) {
                address value;
                assembly {
                    value := mload(validationData)
                    validationData := add(validationData, 0x20)
                }
                if (rules.operators[i] == Operator.NONE) continue;

                address threshold = abi.decode(rules.thresholds[i], (address));
                _checkAddress(rules.operators[i], value, threshold);
            } else if (rules.types[i] == Type.BOOL) {
                bool value;
                assembly {
                    value := mload(validationData)
                    validationData := add(validationData, 0x20)
                }
                if (rules.operators[i] == Operator.NONE) continue;

                bool threshold = abi.decode(rules.thresholds[i], (bool));
                _checkBool(rules.operators[i], value, threshold);
            } else if (rules.types[i] == Type.BYTES || rules.types[i] == Type.STRING) {
                bytes memory value;
                assembly {
                    let offset := mload(validationData)
                    value := add(offset, pointer)
                    validationData := add(validationData, 0x20)
                }
                if (rules.operators[i] == Operator.NONE) continue;

                bytes memory threshold = abi.decode(rules.thresholds[i], (bytes));
                _checkBytes(rules.operators[i], value, threshold);
            } else {
                require(rules.operators[i] == Operator.NONE, "SmartVault: can not compare unsupported type");
            }
        }
    }
}
