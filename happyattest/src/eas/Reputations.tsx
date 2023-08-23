import { useEffect, useState } from "react";
import GradientBar from "../components/GradientBar";
import { useAccount, useSigner } from "wagmi";
import { useModal } from "connectkit";
import {
  baseURL,
  CUSTOM_SCHEMAS,
  EASContractAddress,
  getAddressForENS,
  getAttestation,
} from "../utils/utils";
import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import invariant from "tiny-invariant";
import { ethers } from "ethers";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router";
import axios from "axios"; 
import { Sidebar } from "../components/Sidebar"
import { 
  Title,
  Container,
  MetButton,
  MetButtonRevoke,
  InputBlockRevoke,
  InputContainer,
  EnsLogo,
  InputBlock, 
  WhiteBox,
} from "../styles/web"

const eas = new EAS(EASContractAddress);

function Reputations() {
  const { status } = useAccount();
  const modal = useModal();
  const [address, setAddress] = useState("");
  const { data: signer } = useSigner();
  const [attesting, setAttesting] = useState(false);

  // sc:
  const [revoking, setRevoking] = useState(false);
  const [uidVal, setUID] = useState("");

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
          I <b>attest</b> that I met
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
              setAttesting(true);
              try {
                const schemaEncoder = new SchemaEncoder("bool metIRL");
                const encoded = schemaEncoder.encodeData([
                  { name: "roleId", type: "bytes32", value: "" },
                  { name: "role", type: "string", value: "" },
                  { name: "authorizations", type: "bytes32[]", value: true },
                ]);

                invariant(signer, "signer must be defined");
                eas.connect(signer);

                const recipient = ensResolvedAddress
                  ? ensResolvedAddress
                  : address;
                
                const tx = await eas.attest({
                  data: {
                    recipient: recipient,
                    data: encoded,
                    refUID: ethers.constants.HashZero,
                    revocable: true,
                    expirationTime: 0,
                  },
                  schema: CUSTOM_SCHEMAS.MET_IRL_SCHEMA,
                });

                const uid = await tx.wait();

                const attestation = await getAttestation(uid);
                console.log(attestation)

                // Update ENS names
                await Promise.all([
                  axios.get(`${baseURL}/api/getENS/${address}`),
                  axios.get(`${baseURL}/api/getENS/${recipient}`),
                ]);

                navigate(`/happyattest/connections`);
              } catch (e) { }

              setAttesting(false);
            }
          }}
        >
          {attesting
            ? "Attesting..."
            : status === "connected"
              ? "Make attestation"
              : "Connect wallet"}
        </MetButton>

        <br></br><br></br>
        
        <Title>
          I <b>revoke</b> that I met
        </Title>

        <InputContainer>
          <InputBlockRevoke
            autoCorrect={"off"}
            autoComplete={"off"}
            autoCapitalize={"off"}
            placeholder={"UID"}
            value={uidVal}
            onChange={(e) => setUID(e.target.value)}
          />
          {ensResolvedAddress && <EnsLogo src={"/ens-logo.png"} />}
        </InputContainer>
        <MetButtonRevoke
          onClick={async () => {

            if (status !== "connected") {
              modal.setOpen(true);
            } else {
              setRevoking(true);
              try {

                invariant(signer, "signer must be defined");
                eas.connect(signer);
     
                const tx = await eas.revoke({
                  schema: CUSTOM_SCHEMAS.MET_IRL_SCHEMA,
                  data: {
                    uid: uidVal,
                  },
            
                });

                const uid = await tx.wait();
                console.log(uid)

                // Update ENS names
                await Promise.all([
                  axios.get(`${baseURL}/api/getENS/${uidVal}`),
                  // axios.get(`${baseURL}/api/getENS/${recipient}`), 
                ]);

                navigate(`/happyattest/connections`);
              } catch (e) { }

              setRevoking(false);
            }
          }}
        >
          {revoking
            ? "Revoking..."
            : status === "connected"
              ? "Revoke attestation"
              : "Connect wallet & Revoke"}
        </MetButtonRevoke>

  
      </WhiteBox>
    </Container>
  );
}

export default Reputations;
