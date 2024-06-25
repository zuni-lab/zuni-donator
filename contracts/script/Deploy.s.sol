// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.25 <0.9.0;

import { BaseScript } from "./Base.s.sol";

import { SmartVault } from "src/SmartVault.sol";

contract DeploySmartVault is BaseScript {
    function run() public broadcast returns (SmartVault) {
        bytes32 vaultSchema = 0x3a22bd7490f794015b5bfd49f562dc89b13a26a1b589fa2fb65c303bb2980a42;
        SmartVault smartVault = new SmartVault(vaultSchema);
        return smartVault;
    }
}
