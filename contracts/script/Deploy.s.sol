// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.25 <0.9.0;

import { BaseScript } from "./Base.s.sol";

import { SmartVault } from "src/SmartVault.sol";

contract DeploySmartVault is BaseScript {
    function run() public broadcast returns (SmartVault) {
        bytes32 vaultSchema = vm.envOr({ name: "VAULT_SCHEMA", defaultValue: bytes32(0) });
        bytes32 contributeSchema = vm.envOr({ name: "CONTRIBUTE_SCHEMA", defaultValue: bytes32(0) });
        bytes32 claimSchema = vm.envOr({ name: "CLAIM_SCHEMA", defaultValue: bytes32(0) });

        require(vaultSchema != bytes32(0), "VAULT_SCHEMA is not set");
        require(contributeSchema != bytes32(0), "CONTRIBUTE_SCHEMA is not set");
        require(claimSchema != bytes32(0), "CLAIM_SCHEMA is not set");

        SmartVault smartVault = new SmartVault(vaultSchema, contributeSchema, claimSchema);
        return smartVault;
    }
}
