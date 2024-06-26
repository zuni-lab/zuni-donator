// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { ClaimData, Operator, Type } from "../Common.sol";

struct Rules {
    Type[] types;
    Operator[] operators;
    bytes[] thresholds;
    ClaimData claimData;
}

interface ISmartVault {
    error NameEmpty();

    error RulesLengthMismatch();

    error ClaimDataInvalid();

    error DepositEndInvalid();

    error DepositNotStarted();

    error DepositEnded();

    error DepositNotEnded();

    error VaultNotFound();

    error AttestationNotFound();

    error ClaimedRaisedAmount();

    event CreateVault(bytes32 indexed vaultId);

    event Deposit(bytes32 indexed vaultId, address indexed sender, uint256 value);

    event Claim(bytes32 indexed vaultId, bytes32 indexed attestionUID, uint256 value);

    function createVault(
        string memory name,
        string memory description,
        uint256 depositStart,
        uint256 depositEnd,
        bytes32 validationSchema,
        Operator[] memory ops,
        bytes[] memory thresholds,
        ClaimData memory claimData
    )
        external
        returns (bytes32);

    function deposit(bytes32 vaultId) external payable;

    function claim(bytes32 vaultId, bytes32 attestionUID) external;
}
