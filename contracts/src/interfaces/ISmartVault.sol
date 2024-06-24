// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { Operator } from "../Common.sol";

interface ISmartVault {
    error NameEmpty();

    error RulesLengthMismatch();

    error DepositStartInvalid();

    error DepositEndInvalid();

    error DepositNotStarted();

    error DepositEnded();

    event CreateVault(bytes32 indexed vaultId);

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
        returns (bytes32);

    function deposit(bytes32 vaultId) external payable;

    function claim(bytes32 vaultId, bytes32 attestionUID) external;
}
