const { ethers } = require("hardhat");

const main = async () => { 
    const CeloNFTFactory = await ethers.getContractFactory("CeloNFT");
    const celoNFTContract = await CeloNFTFactory.deploy();
    await celoNFTContract.deployed();
    const NFTMarketplaceFactory = await ethers.getContractFactory("NFTMarketplace");
    const nftMarketplaceContract = await NFTMarketplaceFactory.deploy();
    await nftMarketplaceContract.deployed();
    console.log("Celo NFT deployed to: ", celoNFTContract.address);
    console.log("NFT Marketplace deployed: ", nftMarketplaceContract.address);
};

main().then(() => process.exit(0)).catch((error) => { 
    console.error(error);
    process.exit(1);
});

//Celo NFT deployed to:  0x2cBe53169A577Ab37233d40b066De5A7197A97D8
//NFT Marketplace deployed:  0x94b7CCDe323c1bfdE9d7E0595E1ec0B31876979B