// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { ClaimData, Operator, Type } from "../Common.sol";

struct Rules {
    address[] attesters;
    Type[] types;
    Operator[] operators;
    bytes[] thresholds;
    ClaimData claimData;
}

interface ISmartVault {
    /// @notice Thrown when name of the vault is empty
    error NameEmpty();

    /// @notice Thrown when contribute time range is invalid
    error ContributeTimeInvalid();

    /// @notice Thrown when rules length mismatch
    error RulesLengthMismatch();

    /// @notice Thrown when claim data is invalid
    error ClaimDataInvalid();

    /// @notice Thrown when the contribute time is not started
    error ContributeNotStarted();

    /// @notice Thrown when the contribute time is ended
    error ContributeEnded();

    /// @notice Thrown when the claim time is not started
    error ClaimNotStarted();

    /// @notice Thrown when amount is zero
    error ZeroContribution();

    /// @notice Thrown when the vault is not found
    error VaultNotFound();

    /// @notice Thrown when the attestation is not found
    error AttestationNotFound();

    /// @notice Thrown when the attestation is revoked
    error AttestationRevoked();

    /// @notice Thrown when the attestation is already claimed
    error Claimed();

    /// @notice Thrown when all tokens are claimed from the vault
    error Finished();

    /// @dev Emitted when a new vault is created
    /// @param vaultId The vault id
    event CreateVault(bytes32 indexed vaultId);

    /// @dev Emitted when a contribute is made
    /// @param vaultId The vault id
    /// @param contributor The address of the contributor
    /// @param contributionAttestation The attestation received for the contribution
    /// @param amount The amount contributed
    event Contribute(
        bytes32 indexed vaultId, address indexed contributor, bytes32 indexed contributionAttestation, uint256 amount
    );

    /// @dev Emitted when a claim is made
    /// @param vaultId The vault id
    /// @param validatedAttestion The attestion UID used to validate the claim
    /// @param claimAttestation The attestion received for the claim success
    /// @param amount The amount claimed
    event Claim(
        bytes32 indexed vaultId, bytes32 indexed validatedAttestion, bytes32 indexed claimAttestation, uint256 amount
    );

    /// @notice Create a new vault
    function createVault(
        string memory name,
        string memory description,
        uint256 contributeStart,
        uint256 contributeEnd,
        bytes32 validationSchema,
        address[] memory attesters,
        Operator[] memory ops,
        bytes[] memory thresholds,
        ClaimData memory claimData
    )
        external
        returns (bytes32);

    /// @notice Contribute tokens to a vault
    function contribute(bytes32 vaultId) external payable;

    /// @notice Claim tokens from a vault
    function claim(bytes32 vaultId, bytes32 attestionUID) external;

    /// @notice Get the rules of a vault
    function getRules(bytes32 vaultId) external view returns (Type[] memory, Operator[] memory, bytes[] memory);

    /// @notice Check if attestion is used in a claim for a vault
    function isClaimed(bytes32 vaultId, bytes32 attestionUID) external view returns (bool);
}
