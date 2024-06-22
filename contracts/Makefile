.PHONY: test

test:
ifdef fork-url
	forge test --match-path test/${sm}.t.sol --fork-url $(fork-url) -vv
else
	forge test --match-path test/${sm}.t.sol -vv
endif

