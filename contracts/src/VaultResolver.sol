// SPDX-License-Identifier: MIT

pragma solidity ^0.8.25;

import { Attestation, IEAS } from "@eas/contracts/IEAS.sol";
import { SchemaResolver } from "@eas/contracts/resolver/SchemaResolver.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { Predeploys } from "./libraries/Predeploys.sol";

contract VaultResolver is SchemaResolver, Ownable {
    address public targetAttester;

    constructor() SchemaResolver(IEAS(Predeploys.EAS)) Ownable(msg.sender) { }

    function setTargetAttester(address _targetAttester) external onlyOwner {
        require(targetAttester == address(0), "Already set");
        targetAttester = _targetAttester;
    }

    function onAttest(Attestation calldata attestation, uint256 /*value*/ ) internal view override returns (bool) {
        return attestation.attester == targetAttester;
    }

    function onRevoke(Attestation calldata, /*attestation*/ uint256 /*value*/ ) internal pure override returns (bool) {
        return true;
    }
}
