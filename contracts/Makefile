.PHONY: test deploy cmd
PRIVATE_KEY=${DEV_PRIVATE_KEY}

test:
ifdef fork-url
	forge test --match-path test/${sm}.t.sol --fork-url $(fork-url) -vv
else
	forge test --match-path test/${sm}.t.sol -vv
endif

deploy:
	forge script script/Deploy.s.sol:DeploySmartVault --broadcast --fork-url http://localhost:8545
cmd:
	bun run script/cmd.ts

	



