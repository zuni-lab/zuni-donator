// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.25 <0.9.0;

import { BaseScript } from "./Base.s.sol";

import { SmartVault } from "src/SmartVault.sol";

contract DeploySmartVault is BaseScript {
    function run() public broadcast returns (SmartVault) {
        bytes32 vaultSchema = vm.envOr({ name: "VAULT_SCHEMA", defaultValue: bytes32(0) });
        require(vaultSchema != bytes32(0), "VAULT_SCHEMA is required");

        SmartVault smartVault = new SmartVault(vaultSchema);
        return smartVault;
    }
}
