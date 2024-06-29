// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.25 <0.9.0;

import { IEAS } from "@eas/contracts/IEAS.sol";
import { console2 } from "forge-std/console2.sol";

import { AttestationRequest, AttestationRequestData } from "@eas/contracts/IEAS.sol";
import { ISchemaRegistry } from "@eas/contracts/ISchemaRegistry.sol";

import { BaseScript } from "./Base.s.sol";

import { ClaimData, ClaimType, Operator } from "src/Common.sol";
import { SmartVault } from "src/SmartVault.sol";
import { Predeploys } from "src/libraries/Predeploys.sol";

contract DeploySmartVault is BaseScript {
    bytes32 private constant NAME_SCHEMA = 0x44d562ac1d7cd77e232978687fea027ace48f719cf1d58c7888e509663bb87fc;
    ISchemaRegistry private schemaRegistry = ISchemaRegistry(Predeploys.SCHEMA_REGISTRY);
    IEAS private eas = IEAS(Predeploys.EAS);

    function run() public broadcast {
        SmartVault smartVault = SmartVault(0x29e81bd4f2fa297202Ed05DB5b012d43297c8025);
        console2.log(block.timestamp);

        // address[] memory attesters = new address[](1);
        // attesters[0] = broadcaster;

        // Operator[] memory operators = new Operator[](3);
        // operators[0] = Operator.NONE;
        // operators[1] = Operator.NEQ;
        // operators[2] = Operator.NEQ;

        // bytes[] memory thresholds = new bytes[](3);
        // thresholds[1] = abi.encode(11);
        // thresholds[2] = abi.encode(makeAddr("not equal"));

        // ClaimData memory claimData = ClaimData({
        //   claimType: ClaimType.PERCENTAGE,
        //   percentage: 0.01 ether, // 1%
        //   fixedAmount: 0,
        //   customData: ""
        // });

        // bytes32 vaultId = smartVault.createVault(
        //   "Travel with E-car",
        //   "Reward for protecting enviroment",
        //   0,
        //   block.timestamp + 12 hours,
        //   0x931d09fddf552508870ed3a1fab95e9ec12167bd67a29452fa73916359cb40d9,
        //   attesters,
        //   operators,
        //   thresholds,
        //   claimData
        // );

        smartVault.contribute{ value: 0.000001 ether }(
            0x4C724F51886AF42D2F6F40C45C22876587404883547015F127C9A1BD9C757028
        );
    }
}
