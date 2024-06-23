// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.25 <0.9.0;

import { BaseScript } from "./Base.s.sol";
import { SmartVault } from "../src/SmartVault.sol";
import { EAS } from "@eas/contracts/EAS.sol";

import { SchemaRegistry } from "@eas/contracts/SchemaRegistry.sol";
import { MockSchemaResolver } from "../src/MockResolver.sol";

/// @dev See the Solidity Scripting tutorial: https://book.getfoundry.sh/tutorials/solidity-scripting
contract DeploySmartVault is BaseScript {
    function run()
        public
        broadcast
        returns (SchemaRegistry schemaRegistry, EAS eas, MockSchemaResolver resolver, SmartVault sm)
    {
        schemaRegistry = new SchemaRegistry();
        eas = new EAS(schemaRegistry);
        sm = new SmartVault(eas, schemaRegistry);
        resolver = new MockSchemaResolver(eas);
    }
}
