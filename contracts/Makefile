.PHONY: test deploy call
PRIVATE_KEY=${DEV_PRIVATE_KEY}

test:
ifdef fork-url
	forge test --match-path test/${sm}.t.sol --fork-url $(fork-url) -vv
else
	forge test --match-path test/${sm}.t.sol -vv
endif

deploy:
	forge script script/Deploy.s.sol:DeploySmartVault --broadcast --fork-url http://localhost:8545
call:
	@echo "DEV_PRIVATE_KEY=$(PRIVATE_KEY)"
	@echo "Method: $(method)"
ifeq ($(method), register-schema)
	
endif

	



