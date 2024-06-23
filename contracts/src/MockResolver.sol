// SPDX-License-Identifier: MIT
pragma solidity >=0.8.25 <0.9.0;

import { SchemaResolver } from "@eas/contracts/resolver/SchemaResolver.sol";
import { IEAS, Attestation } from "@eas/contracts/EAS.sol";

contract MockSchemaResolver is SchemaResolver {
    constructor(IEAS eas) SchemaResolver(eas) { }

    error OutOfBounds();

    function onAttest(Attestation calldata, uint256 /*value*/ ) internal pure override returns (bool) {
        return true;
    }

    function onRevoke(Attestation calldata, /*attestation*/ uint256 /*value*/ ) internal pure override returns (bool) {
        return true;
    }

    function toBytes32(bytes memory data, uint256 start) external pure returns (bytes32) {
        return _toBytes32(data, start);
    }

    function _toBytes32(bytes memory data, uint256 start) private pure returns (bytes32) {
        unchecked {
            if (data.length < start + 32) {
                revert OutOfBounds();
            }
        }

        bytes32 tempBytes32;

        // solhint-disable-next-line no-inline-assembly
        assembly {
            tempBytes32 := mload(add(add(data, 0x20), start))
        }

        return tempBytes32;
    }
}
