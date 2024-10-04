import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment): Promise<void> {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log({ deployer });
  await deploy("Bridge", {
    from: deployer,
    log: true,
    proxy: {
      proxyContract: "OptimizedTransparentProxy",
      owner: deployer,
      execute: {
        methodName: "initialize",
        args: ["0xa314AEC0369ca4549b3D9f4292d09F670B952F3F", "0", "100000000000000000000", [deployer, "0xa180A8dc9A4966cbaDd333c175c186163d03BE78", "0x1BC543Cabb710E1292BdDdAB4059fFC7a52A1dF3"], 2], // change me when deploy production
      },
    },
  });
};

func.tags = ["bridge"];
export default func;
