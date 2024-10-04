import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { Bridge } from "../../typechain/Bridge";

import * as BridgeJSON from "../../artifacts/contracts/Bridge.sol/Bridge.json";
import { deployContract } from "ethereum-waffle";

const { loadFixture } = hre.waffle;

describe("Unit tests", () => {
  let admin: SignerWithAddress;
  let minter: SignerWithAddress;
  let validator1: SignerWithAddress;
  let validator2: SignerWithAddress;
  let validator3: SignerWithAddress;
  let bridge: Bridge;
  let validator4: SignerWithAddress;
  const MIN_AMOUNT = ethers.utils.parseEther("0.0001");
  const MAX_AMOUNT = ethers.utils.parseEther("1000000");
  before(async () => {
    const signers: SignerWithAddress[] = await hre.ethers.getSigners();
    admin = signers[0];
    minter = signers[1];
    validator1 = signers[2];
    validator2 = signers[3];
    validator3 = signers[4];
    validator4 = signers[5];
  });

  describe("Greeter", () => {
    const fixture = async () => {
      const Bridge = await hre.ethers.getContractFactory("Bridge");
      const bridgeSc = (await deployContract(admin as any, BridgeJSON, [])) as unknown as Bridge;
      await bridgeSc.initialize(
        minter.address,
        MIN_AMOUNT,
        MAX_AMOUNT,
        [validator1.address, validator2.address, validator3.address],
        2
      );
      return bridgeSc;
    };

    beforeEach(async () => {
      bridge = await loadFixture(fixture);
      console.log("🚀 ~ beforeEach ~ bridge:", bridge.address)
    });

    it("cannot init again", async () => {
      await expect(
        bridge.connect(admin).initialize(
          minter.address,
          MIN_AMOUNT,
          MAX_AMOUNT,
          [validator1.address, validator2.address, validator3.address],
          2
        )
      ).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Initializable: contract is already initialized'");
      
    });
    it("can set threshold from admin wallet", async () => {
      const newThreshold = 3;
      await bridge.connect(admin).changeThreshold(newThreshold);
      expect(await bridge.threshold()).to.equal(newThreshold);
    });

    it("cannot set threshold from minter wallet", async () => {
      const newThreshold = 3;
      await expect(
        bridge.connect(minter).changeThreshold(newThreshold)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("can set min and max amount", async () => {
      const newMin = ethers.utils.parseEther("0.00001");
      const newMinMax = ethers.utils.parseEther("10000000");
      await bridge.connect(admin).setMinMaxAmount(newMin, newMinMax);
      expect(await bridge.minAmount()).to.equal(newMin);
      expect(await bridge.maxAmount()).to.equal(newMinMax);
    });

    it("cannot set min and max amount from minter wallet", async () => {
      const newMin = ethers.utils.parseEther("0.00001");
      const newMax = ethers.utils.parseEther("10000000");
      await expect(
        bridge.connect(minter).setMinMaxAmount(newMin, newMax)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("can add validator from admin wallet", async () => {
      const newValidator = validator4.address;
      await bridge.connect(admin).addListValidator([newValidator]);
      expect(await bridge.validators(newValidator)).to.equal(true);
    });

    it("cannot add validator from minter wallet", async () => {
      const newValidator = validator4.address;
      await expect(
        bridge.connect(minter).addListValidator([newValidator])
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });


  });
});
