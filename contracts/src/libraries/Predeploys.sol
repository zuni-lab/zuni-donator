// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title Predeploys
/// @notice Contains constant addresses for contracts that are pre-deployed to the OP Stack L2 system.
library Predeploys {
    /// @notice Address of the SchemaRegistry predeploy.
    address internal constant SCHEMA_REGISTRY = 0x4200000000000000000000000000000000000020;

    /// @notice Address of the EAS predeploy.
    address internal constant EAS = 0x4200000000000000000000000000000000000021;
}
