// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.25 <0.9.0;

import { BaseScript } from "./Base.s.sol";

import { VaultResolver } from "src/VaultResolver.sol";

contract DeployVaultResolver is BaseScript {
    function run() public broadcast returns (VaultResolver) {
        VaultResolver vaultResolver = new VaultResolver();
        return vaultResolver;
    }
}
