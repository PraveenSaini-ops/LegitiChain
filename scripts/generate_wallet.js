import { Wallet } from "ethers";

const wallet = Wallet.createRandom();
console.log("==========================================");
console.log("GENERATE RANDOM TESTNET WALLET");
console.log("==========================================");
console.log("Public Address:", wallet.address);
console.log("Private Key:   ", wallet.privateKey);
console.log("==========================================");
