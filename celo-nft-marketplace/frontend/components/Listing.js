import { useEffect, useState } from "react";
import { useAccount, useContract, useProvider } from "wagmi";
import ERC721ABI from "../abis/ERC721.json";
import styles from "../styles/Listing.module.css";
import { formatEther } from "ethers/lib/utils";

export default function Listing(props) {
  const [imageURI, setImageURI] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const provider = useProvider();
  const { address } = useAccount();
  const ERC721Contract = useContract({
    addressOrName: props.nftAddress,
    contractInterface: ERC721ABI,
    signerOrProvider: provider,
  });
  const isOwner = address.toLowerCase() === props.seller.toLowerCase();

  const fetNFTDetails = async () => {
    try {
      // Get token URI from contract
      let tokenURI = await ERC721Contract.tokenURI(0);

      // If it's an IPFS URI, replace it with an HTTP Gateway link
      tokenURI = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");

      // Resolve the Token URI
      const metadata = await fetch(tokenURI);
      const metadataJSON = await metadata.json();

      // Extract image URI from the metadata
      let image = metadataJSON.imageUrl;

      // If it's an IPFS URI, replace it with an HTTP Gateway link
      image = image.replace("ipfs://", "https://ipfs.io/ipfs/");

      // Update state variables
      setName(metadataJSON.name);
      setImageURI(image);
      setLoading(false);
    } catch (error) {}
  };

  useEffect(() => {
    fetNFTDetails();
  }, []);

  return (
    <div>
      {loading ? (
        <span>Loading...</span>
      ) : (
        <div className={styles.card}>
          <img src={imageURI} />
          <div className={styles.container}>
            <span>
              <b>
                {name} - #{props.tokenId}
              </b>
            </span>
            <span>Price: {formatEther(props.price)} CELO</span>
            <span>
              Seller: {isOwner ? "You" : props.seller.substring(0, 6) + "..."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
