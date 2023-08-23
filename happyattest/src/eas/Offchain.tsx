import { useEffect, useState } from "react";
import GradientBar from "../components/GradientBar";
import { useAccount, useSigner } from "wagmi";
import { useModal } from "connectkit";
import {
  baseURL,
  EASContractAddress,
  getAddressForENS,
} from "../utils/utils";
import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";

import invariant from "tiny-invariant";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router";
import axios from "axios";
import { Sidebar } from "../components/Sidebar"
import { 
  Title,
  Container,
  MetButton,
  MetButtonRevoke,
  StyledTextarea,
  InputContainer,
  EnsLogo,
  InputBlock,
  InputBlockRevoke,
  WhiteBox,
} from "../styles/web"

const eas = new EAS(EASContractAddress);

function Offchain() {

  const { status } = useAccount();
  const modal = useModal();
  const [address, setAddress] = useState("");

  const { data: signer } = useSigner();

  const [attesting, setAttesting] = useState(false);

  const [revoking, setRevoking] = useState(false);
  const [uidVal, setUID] = useState("");
  const [offchain, setOffchain] = useState("");

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
          I <b>attest</b> offchain
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
 
                invariant(signer, "signer must be defined");
                eas.connect(signer);

                const recipient = ensResolvedAddress
                  ? ensResolvedAddress
                  : address;

                const offchain = await eas.getOffchain();

                // Initialize SchemaEncoder with the schema string
                const schemaEncoder = new SchemaEncoder("uint256 eventId, uint8 voteIndex");
                const encodedData = schemaEncoder.encodeData([
                  { name: "eventId", value: 1, type: "uint256" },
                  { name: "voteIndex", value: 1, type: "uint8" },
                ]);

                const offchainAttestation = await offchain.signOffchainAttestation({
                  recipient: '0xFD50b031E778fAb33DfD2Fc3Ca66a1EeF0652165',
                  // Unix timestamp of when attestation expires. (0 for no expiration)
                  expirationTime: 0,
                  // Unix timestamp of current time
                  time: 1671219636,
                  revocable: true,
                  version: 1,
                  nonce: 0,
                  schema: "0xb16fa048b0d597f5a821747eba64efa4762ee5143e9a80600d0005386edfc995",
                  refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
                  data: encodedData,
                }, signer);

                console.log('offchainAttestation:\n', offchainAttestation)

                setOffchain(JSON.stringify(offchainAttestation))

                // Update ENS names
                await Promise.all([
                  axios.get(`${baseURL}/api/getENS/${address}`),
                  axios.get(`${baseURL}/api/getENS/${recipient}`),
                ]);

                navigate(`/happyattest/offchain`);
              } catch (e) { }

              setAttesting(false);
            }
          }}
        >
          {attesting
            ? "Attesting Offchain..."
            : status === "connected"
              ? "Make offchain attestation"
              : "Connect wallet"}
        </MetButton>

        <div>
          <InputContainer>
            <StyledTextarea
              value={offchain}
              onChange={() => setAddress("")}
            />
          </InputContainer>
        </div>

        <br></br><br></br>

        <Title>
          I <b>revoke</b> offchain
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

                const tx = await eas.revokeOffchain(
                  uidVal
                );

                const uid = await tx.wait();
                console.log(uid)

                // Update ENS names
                await Promise.all([
                  axios.get(`${baseURL}/api/getENS/${uidVal}`),
                  // axios.get(`${baseURL}/api/getENS/${recipient}`), 
                ]);

                navigate(`/happyattest/offchain`);
              } catch (e) { }

              setRevoking(false);
            }
          }}
        >
          {revoking
            ? "Revoking offchain..."
            : status === "connected"
              ? "Revoke offchain attestation"
              : "Connect wallet & Revoke"}
        </MetButtonRevoke>

      </WhiteBox>
    </Container>
  );
}

export default Offchain;
