const hre = require("hardhat");

async function main() {
  console.log("Deploying EvidenceRegistry smart contract to Polygon Amoy testnet...");

  const EvidenceRegistry = await hre.ethers.getContractFactory("EvidenceRegistry");
  const registry = await EvidenceRegistry.deploy();

  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  console.log(`\n==================================================`);
  console.log(`EvidenceRegistry contract deployed successfully!`);
  console.log(`Network: Polygon Amoy (Chain ID: 80002)`);
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Explorer Link: https://amoy.polygonscan.com/address/${contractAddress}`);
  console.log(`==================================================\n`);

  console.log("Please update NEXT_PUBLIC_CONTRACT_ADDRESS in your .env.local file with this address.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
