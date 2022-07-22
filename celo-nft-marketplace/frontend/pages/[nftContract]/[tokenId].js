import { Contract } from "ethers";
import { formatEther, parseEther } from "ethers/lib/utils";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { createClient } from "urql";
import { useContract, useSigner } from "wagmi";
import ERC721ABI from "../../abis/ERC721.json";
import MarketplaceABI from "../../abis/NFTMarketplace.json";
import Navbar from "../../components/Navbar";
import { MARKETPLACE_ADDRESS, SUBGRAPH_URL } from "../../constants";
import styles from "../../styles/Details.module.css";

export default function NFTDetails() {
  // Extract NFT contract address and Token ID from URL
  const router = useRouter();
  const nftAddress = router.query.nftContract;
  const tokenId = router.query.tokenId;

  const [listing, setListing] = useState();
  const [name, setName] = useState("");
  const [imageURI, setImageURI] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const [newPrice, setNewPrice] = useState("");

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [buying, setBuying] = useState(false);

  const { data: signer } = useSigner();

  const MarketplaceContract = useContract({
    addressOrName: MARKETPLACE_ADDRESS,
    contractInterface: MarketplaceABI,
    signerOrProvider: signer,
  });

  const fetchListing = async () => {
    const listingQuery = `
            query ListingQuery {
                listingEntities(where: {
                    nftAddress: "${nftAddress}",
                    tokenId: "${tokenId}"
                }) {
                    id
                    nftAddress
                    tokenId
                    price
                    seller
                    buyer
                }
            }
        `;
    const urqlClient = createClient({ url: SUBGRAPH_URL });
    const response = await urqlClient.query(listingQuery).toPromise();
    const listingEntities = response.data.listingEntities;

    if (listingEntities.length === 0) {
      window.alert("Listing does not exist or has been canceled");
      return router.push("/");
    }

    const listing = listingEntities[0];
    const address = await signer.getAddress();

    setIsActive(listing.buyer === "0x00000000");
    setIsOwner(address.toLowerCase() === listing.seller.toLowerCase());
    setListing(listing);
  };

  const fetchNFTDetails = async () => {
    const ERC721Contract = new Contract(nftAddress, ERC721ABI, signer);
    let tokenURI = await ERC721Contract.tokenURI(tokenId);
    tokenURI = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");

    const metadata = await fetch(tokenURI);
    const metadataJSON = await metadata.json();

    let image = metadataJSON.imageUrl;
    image = image.replace("ipfs://", "https://ipfs.io/ipfs/");

    setName(metadataJSON.name);
    setImageURI(image);
  };

  const updateListing = async () => {
    setUpdating(true);
    const updateTxn = await MarketplaceContract.updateListing(
      nftAddress,
      tokenId,
      parseEther(newPrice)
    );
    await updateTxn.wait();
    await fetchListing();
    setUpdating(false);
  };

  const cancelListing = async () => {
    setCanceling(true);
    const cancelTxn = await MarketplaceContract.cancelListing(
      nftAddress,
      tokenId
    );
    await cancelTxn.wait();
    window.alert("Listing canceled");
    await router.push("/");
    await fetchListing();
    setCanceling(false);
  };

  const buyListing = async () => {
    setBuying(true);
    const buyTxn = await MarketplaceContract.purchaseListing(
      nftAddress,
      tokenId,
      {
        value: listing.price,
      }
    );
    await buyTxn.wait();
    await fetchListing();
    setBuying(false);
  };

  useEffect(() => {
    if (router.query.nftContract && router.query.tokenId && signer)
      Promise.all([fetchListing(), fetchNFTDetails()]).finally(() =>
        setLoading(false)
      );
  }, [router, signer]);

  return (
    <>
      <Navbar />
      <div>
        {loading ? (
          <span>Loading...</span>
        ) : (
          <div className={styles.container}>
            <div className={styles.details}>
              <img src={imageURI} />
              <span>
                <b>
                  {name} - #{tokenId}
                </b>
              </span>
              <span>Price: {formatEther(listing.price)} CELO</span>
              <span>
                <a
                  href={`https://alfajores.celoscan.io/address/${listing.seller}`}
                  target="_blank"
                >
                  Seller:{" "}
                  {isOwner ? "You" : listing.seller.substring(0, 6) + "..."}
                </a>
              </span>
              <span>
                Status: {listing.buyer === "0x00000000" ? "Active" : "Sold"}
              </span>
            </div>

            <div className={styles.options}>
              {!isActive && (
                <span>
                  Listing has been sold to{" "}
                  <a
                    href={`https://alfajores.celoscan.io/address/${listing.buyer}`}
                    target="_blank"
                  >
                    {listing.buyer}
                  </a>
                </span>
              )}

              {isOwner && isActive && (
                <>
                  <div className={styles.updateListing}>
                    <input
                      type="text"
                      placeholder="New Price (in CELO)"
                      value={newPrice}
                      onChange={(e) => {
                        if (e.target.value === "") {
                          setNewPrice("0");
                        } else {
                          setNewPrice(e.target.value);
                        }
                      }}
                    ></input>
                    <button disabled={updating} onClick={updateListing}>
                      Update Listing
                    </button>
                  </div>

                  <button
                    className={styles.btn}
                    disabled={canceling}
                    onClick={cancelListing}
                  >
                    Cancel Listing
                  </button>
                </>
              )}

              {!isOwner && isActive && (
                <button
                  className={styles.btn}
                  disabled={buying}
                  onClick={buyListing}
                >
                  Buy Listing
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
