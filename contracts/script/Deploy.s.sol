// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.25 <0.9.0;

import { IEAS } from "@eas/contracts/IEAS.sol";

import { AttestationRequest, AttestationRequestData } from "@eas/contracts/IEAS.sol";
import { ISchemaRegistry } from "@eas/contracts/ISchemaRegistry.sol";

import { BaseScript } from "./Base.s.sol";

import { SmartVault } from "src/SmartVault.sol";
import { VaultResolver } from "src/VaultResolver.sol";
import { Predeploys } from "src/libraries/Predeploys.sol";

contract DeploySmartVault is BaseScript {
    bytes32 private constant NAME_SCHEMA = 0x44d562ac1d7cd77e232978687fea027ace48f719cf1d58c7888e509663bb87fc;
    ISchemaRegistry private schemaRegistry = ISchemaRegistry(Predeploys.SCHEMA_REGISTRY);
    IEAS private eas = IEAS(Predeploys.EAS);

    function run() public broadcast returns (SmartVault) {
        VaultResolver vaultResolver = new VaultResolver();

        // solhint-disable max-line-length
        bytes32 vaultSchema = schemaRegistry.register(
            "string name,string description,uint256 contributeStart,uint256 contributeEnd,bytes32 validationSchema,address[] attesters,uint8[] operators,bytes[] thresholds,uint8 claimType,uint256 fixedAmount,uint256 percentage,bytes customData",
            vaultResolver,
            false
        );
        bytes32 contributeSchema = schemaRegistry.register(
            "bytes32 vaultId,address contributor,uint256 amount,uint256 timestamp", vaultResolver, false
        );
        bytes32 claimSchema = schemaRegistry.register(
            "bytes32 vaultId,address claimer,uint256 amount,uint256 timestamp", vaultResolver, false
        );

        SmartVault smartVault = new SmartVault(vaultSchema, contributeSchema, claimSchema);
        vaultResolver.setTargetAttester(address(smartVault));

        eas.attest(
            AttestationRequest(
                NAME_SCHEMA,
                AttestationRequestData({
                    recipient: address(smartVault),
                    expirationTime: 0,
                    revocable: false,
                    refUID: 0,
                    data: abi.encode(broadcaster, "Vault Informaton"),
                    value: 0
                })
            )
        );
        eas.attest(
            AttestationRequest(
                NAME_SCHEMA,
                AttestationRequestData({
                    recipient: address(smartVault),
                    expirationTime: 0,
                    revocable: false,
                    refUID: 0,
                    data: abi.encode(contributeSchema, "Vault Contribution"),
                    value: 0
                })
            )
        );
        eas.attest(
            AttestationRequest(
                NAME_SCHEMA,
                AttestationRequestData({
                    recipient: address(smartVault),
                    expirationTime: 0,
                    revocable: false,
                    refUID: 0,
                    data: abi.encode(claimSchema, "Vault Claim Receipt"),
                    value: 0
                })
            )
        );

        return smartVault;
    }
}
