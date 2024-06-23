import { EAS, SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";
import chalk from "chalk";
import { Contract, JsonRpcProvider, ethers, isAddress, Interface, parseEther } from "ethers";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";

type TEnv = {
  SCHEMA_REGISTRY_ADDRESS: string;
  EAS_ADDRESS: string;
  RESOLVER_ADDRESS: string;
  SMART_VAULT_ADDRESS: string;
  DEV_PRIVATE_KEY: string;
};

type TRunner = {
  schemaRegistry: SchemaRegistry;
  eas: EAS;
  smartVault: Contract;
};

let ProjectENV: TEnv | undefined = undefined;
let Runner: TRunner | undefined = undefined;
let Provider: JsonRpcProvider | undefined = undefined;
let Signer: ethers.Wallet | undefined = undefined;

const MOCK_SCHEMA = "string reaction,bytes icon,uint message";

const SMART_VAULT_ABI = [
  "function createVault(string name, string description, uint256 depositStart, uint256 depositEnd, bytes32 schemaUID, uint8[] ops, bytes[] thresholds) returns (bytes32)",
  "function deposit(bytes32 vaultId) payable",
];

const schemaIdLogPath = path.join(__dirname, "../log/schemaId.log");
const vaultIdLogPath = path.join(__dirname, "../log/vaultId.log");

const writeToLog = async (logPath: string, data: string) => {
  fs.writeFile(logPath, data, (err) => {
    if (err) {
      if (err.code === "ENOENT") {
        fs.mkdirSync(path.dirname(logPath), { recursive: true });
        fs.writeFile(logPath, data, (e) => {
          if (err) {
            console.error("Error writing to log", err);
          }
          console.log("Data written to log");
        });
      }
      console.error("Error writing to log", err);
    }
    console.log("Data written to log");
  });
};

const readFromLog = async (logPath: string) => {
  const log = fs.readFileSync(logPath, "utf8").split("\n")[0];
  if (!log) {
    throw new Error("Log is empty");
  }
  return log;
};

const loadEnv = () => {
  if (!process.env.DEV_PRIVATE_KEY || !process.env.DEV_PRIVATE_KEY) {
    throw new Error("DEV_PRIVATE_KEY is not set or invalid");
  }

  if (!process.env.SCHEMA_REGISTRY_ADDRESS || !isAddress(process.env.SCHEMA_REGISTRY_ADDRESS)) {
    throw new Error("SCHEMA_REGISTRY_ADDRESS is not set or invalid");
  }

  if (!process.env.EAS_ADDRESS || !isAddress(process.env.EAS_ADDRESS)) {
    throw new Error("EAS_ADDRESS is not set or invalid");
  }

  if (!process.env.RESOLVER_ADDRESS || !isAddress(process.env.RESOLVER_ADDRESS)) {
    throw new Error("RESOLVER_ADDRESS is not set or invalid");
  }

  if (!process.env.SMART_VAULT_ADDRESS || !isAddress(process.env.SMART_VAULT_ADDRESS)) {
    throw new Error("SMART_VAULT_ADDRESS is not set or invalid");
  }

  ProjectENV = {
    SCHEMA_REGISTRY_ADDRESS: process.env.SCHEMA_REGISTRY_ADDRESS,
    EAS_ADDRESS: process.env.EAS_ADDRESS,
    RESOLVER_ADDRESS: process.env.RESOLVER_ADDRESS,
    SMART_VAULT_ADDRESS: process.env.SMART_VAULT_ADDRESS,
    DEV_PRIVATE_KEY: process.env.DEV_PRIVATE_KEY,
  };
};

const setUp = async () => {
  if (!ProjectENV) {
    throw new Error("Project environment variables not set");
  }
  Provider = new ethers.JsonRpcProvider("http://localhost:8545");
  Signer = new ethers.Wallet(ProjectENV.DEV_PRIVATE_KEY, Provider);
  Runner = {
    schemaRegistry: new SchemaRegistry(ProjectENV.SCHEMA_REGISTRY_ADDRESS),
    eas: new EAS(ProjectENV.EAS_ADDRESS),
    smartVault: new Contract(ProjectENV.SMART_VAULT_ADDRESS, SMART_VAULT_ABI, Signer),
  };
};

const registerSchema = async () => {
  if (!Runner) {
    throw new Error("Runner not set");
  }

  if (!Signer) {
    throw new Error("Signer not set");
  }

  if (!ProjectENV) {
    throw new Error("Project environment variables not set");
  }

  console.log(chalk.blue("Registering schema\n"));
  try {
    Runner.schemaRegistry.connect(Signer);

    const revocable = true;

    console.log("\nRegistering schema with the following parameters:");
    console.log(`Schema: ${MOCK_SCHEMA}`);
    console.log(`Resolver Address: ${process.env.RESOLVER_ADDRESS}`);
    console.log(`Revocable: ${revocable}`);

    const tx = await Runner.schemaRegistry.register({
      schema: MOCK_SCHEMA,
      resolverAddress: ProjectENV.RESOLVER_ADDRESS,
      revocable,
    });
    const schemaId = await tx.wait();
    console.log("Transaction successful");
    console.log("schemaId:", schemaId);

    // write the schema id to the log

    await writeToLog(schemaIdLogPath, schemaId);
  } catch (error) {
    console.error("Error:", error.message || error);
  }
};

const createVault = async () => {
  if (!Runner) {
    throw new Error("Runner not set");
  }

  console.log(chalk.blue("Creating vault\n"));
  try {
    if (!Provider) {
      throw new Error("Provider not set");
    }

    if (!Runner) {
      throw new Error("Runner not set");
    }

    // read the first line of the log file to get the schema id
    const schemaId = readFromLog(schemaIdLogPath);

    const ops = [0, 1, 2];
    const thresholds = ["0x01", "0x02", "0x03"];

    const block = await Provider.getBlock("latest");
    if (!block) {
      throw new Error("Block not found");
    }

    console.log("\nCreating vault with the following parameters:");
    console.log(`Name: My Vault`);
    console.log(`Description: This is a test vault`);
    console.log(`Deposit Start: ${block.timestamp + 60}`);
    console.log(`Deposit End: ${block.timestamp + 2000}`);
    console.log(`Schema UID: ${schemaId}`);
    console.log(`Operators: ${ops}`);
    console.log(`Thresholds: ${thresholds}`);

    const tx = await Runner.smartVault.createVault(
      "My Vault",
      "This is a test vault",
      block.timestamp + 10,
      block.timestamp + 2000,
      schemaId,
      ops,
      thresholds,
    );
    const res = await tx.wait();
    console.log("Transaction successful");
    // decode the output to get the vault id
    const receipt = await Provider.getTransactionReceipt(res.hash);
    if (!receipt) {
      throw new Error("Transaction receipt not found");
    }

    const output = new Interface(SMART_VAULT_ABI).decodeFunctionResult("createVault", receipt.logs[0].data);
    console.log("Vault ID:", output[0]);

    // write the vault id to the log
    await writeToLog(vaultIdLogPath, output[0]);
  } catch (error) {
    console.error("Error:", error.message || error);
  }
};

const depositToVault = async () => {
  if (!Runner) {
    throw new Error("Runner not set");
  }

  console.log(chalk.blue("Depositing to vault\n"));
  try {
    if (!Provider) {
      throw new Error("Provider not set");
    }

    if (!Runner) {
      throw new Error("Runner not set");
    }

    // read the first line of the log file to get the vault id
    const vaultId = await readFromLog(vaultIdLogPath);

    console.log(`Vault ID: ${vaultId}`);
    // sleep for 10 seconds
    await new Promise((resolve) => {
      console.log("Waiting for 10 seconds...");
      setTimeout(resolve, 10000);
    });

    console.log("\nDepositing to vault with the following parameters:");
    const tx = await Runner.smartVault.deposit(vaultId, { value: parseEther("1") });
    const res = await tx.wait();
    console.log("Transaction successful");
  } catch (error) {
    console.error("Error:", error.message || error);
  }
};

(async () => {
  await loadEnv();
  await setUp();

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
    console.log(chalk.red("0. Exit"));
    console.log(chalk.yellow("1. Register schema"));
    console.log(chalk.green("2. Create vault"));
    console.log(chalk.cyan("3. Deposit to vault"));
    console.log(chalk.grey("7. Auto"));

    // Wait for user input
    const input = (await new Promise((resolve) => rl.question("Enter command: ", resolve))) as string;
    switch (input) {
      case "1":
        await registerSchema();
        break;
      case "2":
        await createVault();
        break;
      case "3":
        await depositToVault();
        break;
      case "7":
        await registerSchema();
        await createVault();
        await depositToVault();
        break;
      case "0":
        handleExit();
        break;
      default:
        console.log(chalk.red("Invalid command"));
    }
  }
})();

// function testCreateVault() public {
//   // Create a vault

//   Operator[] memory ops = new Operator[](3);
//   ops[0] = Operator.EQ;
//   ops[1] = Operator.GT;
//   ops[2] = Operator.LT;

//   bytes[] memory thresholds = new bytes[](3);

//   thresholds[0] = "0x01";
//   thresholds[1] = "0x02";
//   thresholds[2] = "0x03";

//   smartVault.createVault(
//       "My Vault", "This is a test vault", block.timestamp + 1000, block.timestamp + 2000, uid, ops, thresholds
//   );
// }
