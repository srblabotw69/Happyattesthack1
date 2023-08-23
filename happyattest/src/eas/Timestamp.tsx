import { useEffect, useState } from "react";
import GradientBar from "../components/GradientBar";
import { useAccount, useSigner } from "wagmi";
import { useModal } from "connectkit";
import { 
  // CUSTOM_SCHEMAS,
  EASContractAddress,
  getAddressForENS,
  getTimestampsEquals,
} from "../utils/utils";
import { EAS } from "@ethereum-attestation-service/eas-sdk";
import invariant from "tiny-invariant";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router";
 
import { Sidebar } from "../components/Sidebar"
import {
  Title,
  Container,
  MetButton,
  InputContainer,
  EnsLogo,
  InputBlock,
  StyledTextarea,
  WhiteBox,
} from "../styles/web"
import { ethers } from "ethers";
 
const eas = new EAS(EASContractAddress);

function Timestamp() {
 
  const { data: signer2 } = useSigner();

  const { status } = useAccount();
  const modal = useModal();
  const [address, setAddress] = useState("");
  
  const [uidVal, setUID] = useState("");
  const [timestamping, setTimestamp] = useState(false);
  const [timestampValue, setTimestampValue] = useState("");
  const [timestampsGEValue, setTimestampsGEValue] = useState("");
   
  const [creatingtimestamp, setCreatingtimestamp] = useState(false);

  const [ensResolvedAddress, setEnsResolvedAddress] = useState("Dakh.eth");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const addressParam = searchParams.get("address");
    if (addressParam) {
      setAddress(addressParam);
    }
    const uidParam = searchParams.get("uidVal");
    if (uidParam) {
      setUID(uidParam);
    }
  }, [searchParams]);

  useEffect(() => {
    async function checkENS() {
      if (address.includes(".eth")) {
        const tmpAddress = await getAddressForENS(address);
        if (tmpAddress) {
          setEnsResolvedAddress(tmpAddress);
        } else {
          setEnsResolvedAddress("");
        }
      } else {
        setEnsResolvedAddress("");
      }
    }

    checkENS();
  }, [address, uidVal]);
 
  return (
    <Container>
      <Sidebar />
      <GradientBar />
      <WhiteBox>
        <Title>
          Get Timestamp
        </Title>

        <InputContainer>
          <InputBlock
            autoCorrect={"off"}
            autoComplete={"off"}
            autoCapitalize={"off"}
            placeholder={"Address/ENS"}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          {ensResolvedAddress && <EnsLogo src={"/ens-logo.png"} />}
        </InputContainer>
        <MetButton
          onClick={async () => {

            if (status !== "connected") {
              modal.setOpen(true);
            } else {

              setCreatingtimestamp(true);
              try {
 
                invariant(signer2, "signer must be defined");
                eas.connect(signer2);

                const dataStr = ethers.utils.formatBytes32String('0x1234');
                const transaction =  await eas.timestamp(dataStr); 
                await transaction.wait();
 
                navigate(`/happyattest/timestamp`);
              } catch (e) { }

              setCreatingtimestamp(false);
            }
          }}
        >
          {creatingtimestamp
            ? "Creating Timestamp..."
            : status === "connected"
              ? "Creating timestamp"
              : "Connect wallet"}
        </MetButton>
        <br></br><br></br>
        <InputContainer>
          <InputBlock
            autoCorrect={"off"}
            autoComplete={"off"}
            autoCapitalize={"off"}
            placeholder={"1680193296"}
            value={timestampsGEValue}
            onChange={(e) => setTimestampsGEValue(e.target.value)}
          />
          {ensResolvedAddress && <EnsLogo src={"/ens-logo.png"} />}
        </InputContainer>
        <MetButton
          onClick={async () => {

            if (status !== "connected") {
              modal.setOpen(true);
            } else {

              setTimestamp(true);
              try {
      
                const timestamp = await getTimestampsEquals(Number(timestampsGEValue));
                console.log('timestamp', timestamp)
                setTimestampValue(JSON.stringify(timestamp));
 
                navigate(`/happyattest/timestamp`);
              } catch (e) { }

              setTimestamp(false);
            }
          }}
        >
          {timestamping
            ? "Getting Timestamp..."
            : status === "connected"
              ? "Get timestamp"
              : "Connect wallet"}
        </MetButton>

        <div>
          <InputContainer>
            <StyledTextarea
              value={timestampValue}
              onChange={() => setTimestampValue("")}
            />
          </InputContainer>
        </div>

      </WhiteBox>
    </Container>
  );
}

export default Timestamp;