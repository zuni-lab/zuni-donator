import { SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";
import { ethers, isAddress } from "ethers";
import * as readline from "readline";
import chalk from "chalk";

let privKey = process.env.DEV_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const MOCK_SCHEMA = "string reaction,bytes icon,uint message";

const main = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Function to handle clean exit
  const handleExit = () => {
    console.log("\nExiting...");
    rl.close();
    process.exit(0);
  };

  // Listen for the SIGINT signal (Ctrl+C)
  process.on("SIGINT", handleExit);

  while (true) {
    console.log("=== Command ===\n");
    console.log(chalk.blue("Available commands:"));
    console.log(chalk.yellow("1. Register schema"));
    console.log(chalk.green("2. Create vault"));
    console.log(chalk.red("3. Exit"));

    // Wait for user input
    const input = (await new Promise((resolve) => rl.question("Enter command: ", resolve))) as string;
    switch (input) {
      case "1":
        await registerSchema(rl);
        break;
      case "2":
        console.log("Create vault");
        break;
      case "3":
        handleExit();
        break;
      default:
        console.log(chalk.red("Invalid command"));
    }
  }
};

const registerSchema = async (rl) => {
  console.log(chalk.blue("Registering schema\n"));
  console.log(chalk.yellow("Please provide the following information to register a schema:"));

  rl.question("1. Schema registry address: ", (schemaRegistryAddress) => {
    console.log(chalk.green(schemaRegistryAddress));

    rl.question("2. Resolver address: ", async (resolverAddress) => {
      console.log(chalk.yellow(resolverAddress));

      try {
        // Check if addresses are valid
        if (!isAddress(schemaRegistryAddress)) {
          throw new Error("Invalid schema registry address");
        }
        if (!isAddress(resolverAddress)) {
          throw new Error("Invalid resolver address");
        }

        const provider = new ethers.JsonRpcProvider("http://localhost:8545");
        const signer = new ethers.Wallet(privKey, provider);

        // read registry contract address from args of the script
        const schemaRegistry = new SchemaRegistry(schemaRegistryAddress);
        schemaRegistry.connect(signer);

        const revocable = true;

        console.log("\nRegistering schema with the following parameters:");
        console.log(`Schema: ${MOCK_SCHEMA}`);
        console.log(`Resolver Address: ${resolverAddress}`);
        console.log(`Revocable: ${revocable}`);

        const tx = await schemaRegistry.register({
          schema: MOCK_SCHEMA,
          resolverAddress,
          revocable,
        });
        const res = await tx.wait();
        console.log("Transaction successful");
        console.log("schemaId:", res);
      } catch (error) {
        console.error("Error:", error.message || error);
      } finally {
        rl.close();
      }
    });
  });
};

main();
