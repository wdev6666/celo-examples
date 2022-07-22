import { Contract } from "ethers";
import { isAddress, parseEther } from "ethers/lib/utils";
import Link from "next/link";
import { useState } from "react";
import { useSigner } from "wagmi";
import ERC721ABI from "../abis/ERC721.json";
import MarketplaceABI from "../abis/NFTMarketplace.json";
import Navbar from "../components/Navbar";
import styles from "../styles/Create.module.css";
import { MARKETPLACE_ADDRESS } from "../constants";

export default function Create() {
  const [nftAddress, setNftAddress] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [showListingLink, setShowListingLink] = useState(false);

  // Get signer from wagmi
  const { data: signer } = useSigner();

  const requestApproval = async () => {
    // Get signer's address
    const address = await signer.getAddress();

    // Initialize a contract instance for the NFT contract
    const ERC721Contract = new Contract(nftAddress, ERC721ABI, signer);

    // Make sure user is owner of the NFT in question
    const tokenOwner = await ERC721Contract.ownerOf(tokenId);
    if (tokenOwner.toLowerCase() !== address.toLowerCase()) {
      throw new Error(`You do not own this NFT`);
    }

    // Check if user already gave approval to the marketplace
    const isApproved = await ERC721Contract.isApprovedForAll(
      address,
      MARKETPLACE_ADDRESS
    );

    // If not approved
    if (!isApproved) {
      console.log("Requesting approval over NFTs...");

      // Send approval transaction to NFT contract
      const approvalTxn = await ERC721Contract.setApprovalForAll(
        MARKETPLACE_ADDRESS,
        true
      );
      await approvalTxn.wait();
    }
  };

  const createListing = async () => {
    // Initialize an instance of the marketplace contract
    const MarketplaceContract = new Contract(
      MARKETPLACE_ADDRESS,
      MarketplaceABI,
      signer
    );

    // Send the create listing transaction
    const createListingTxn = await MarketplaceContract.createListing(
      nftAddress,
      tokenId,
      parseEther(price)
    );

    await createListingTxn.wait();
  };

  const handleCreateListing = async () => {
    setLoading(true);
    try {
      // Make sure the contract address is a valid address
      const isValidAddress = isAddress(nftAddress);
      if (!isValidAddress) {
        throw new Error(`Invalid contract address`);
      }

      // Request approval over NFTs if required, then create listing
      await requestApproval();
      await createListing();

      setShowListingLink(true);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <input
          type="text"
          placeholder="NFT Address 0x..."
          value={nftAddress}
          onChange={(e) => setNftAddress(e.target.value)}
        />
        <input
          type="text"
          placeholder="Token ID"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
        />
        <input
          type="text"
          placeholder="Price (in CELO)"
          value={price}
          onChange={(e) => {
            if (e.target.value === "") {
              setPrice("0");
            } else {
              setPrice(e.target.value);
            }
          }}
        />
        {/* Button to create the listing */}
        <button onClick={handleCreateListing} disabled={loading}>
          {loading ? "Loading..." : "Create"}
        </button>

        {/* Button to take user to the NFT details page after listing is created */}
        {showListingLink && (
          <Link href={`/${nftAddress}/${tokenId}`}>
            <a>
              <button>View Listing</button>
            </a>
          </Link>
        )}
      </div>
    </>
  );
}
