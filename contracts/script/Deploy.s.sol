// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.25 <0.9.0;

import { BaseScript } from "./Base.s.sol";
import { SmartVault } from "../src/SmartVault.sol";
import { EAS } from "@eas/contracts/EAS.sol";

import { SchemaRegistry } from "@eas/contracts/SchemaRegistry.sol";
import { MockSchemaResolver } from "../src/MockResolver.sol";
import { console2 } from "forge-std/src/console2.sol";

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

        string memory registryEnv =
            string(abi.encodePacked("SCHEMA_REGISTRY_ADDRESS", "=", addressToString(address(schemaRegistry))));
        string memory easEnv = string(abi.encodePacked("EAS_ADDRESS", "=", addressToString(address(eas))));
        string memory resolverEnv =
            string(abi.encodePacked("RESOLVER_ADDRESS", "=", addressToString(address(resolver))));
        string memory smEnv = string(abi.encodePacked("SMART_VAULT_ADDRESS", "=", addressToString(address(sm))));

        console2.log(registryEnv);
        console2.log(easEnv);
        console2.log(resolverEnv);
        console2.log(smEnv);
    }

    function addressToString(address _address) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_address)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }
}
