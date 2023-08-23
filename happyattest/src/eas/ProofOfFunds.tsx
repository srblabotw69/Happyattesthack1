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
  InputContainer,
  EnsLogo,
  InputBlock,
  InputBlockRevoke,
  WhiteBox,
} from "../styles/web"

const eas = new EAS(EASContractAddress);

function ProofOfFunds() {
  const { address, status } = useAccount();
  const modal = useModal();

  const { data: signer } = useSigner();
  const [attesting, setAttesting] = useState(false);

  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [hasFunds, setHasFunds] = useState("");
  const [evidenceHash, SetEvidenceHash] = useState("");
  const [addressWallet, setAddress] = useState("");
  const [revoking, setRevoking] = useState(false);
  const [uidVal, setUID] = useState("");

  const [ensResolvedAddress, setEnsResolvedAddress] = useState("Dakh.eth");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();


  useEffect(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      setDate(dateParam);
    }
    const amountParam = searchParams.get("amount");
    if (amountParam) {
      setAmount(amountParam);
    }
    const hasFundsParam = searchParams.get("hasFunds");
    if (hasFundsParam) {
      setHasFunds(hasFundsParam);
    }
    const evidenceHashParam = searchParams.get("evidenceHash");
    if (evidenceHashParam) {
      SetEvidenceHash(evidenceHashParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const addressParam = address;
    if (addressParam) {
      setAddress(addressParam);
    }
    const uidParam = searchParams.get("uidVal");
    if (uidParam) {
      setUID(uidParam);
    }
  }, [address, searchParams]);

  useEffect(() => {
    async function checkENS() {
      if (addressWallet.includes(".eth")) {
        const tmpAddress = await getAddressForENS(addressWallet); 
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

  }, [addressWallet, uidVal]);
 


  return (
    <Container>
      <Sidebar />
      <GradientBar />
      <WhiteBox>
        <Title>
          I <b>attest</b> that I have proof funds
        </Title>
        <br></br>
        Date
        <InputContainer>
          <InputBlock
            autoCorrect={"off"}
            autoComplete={"off"}
            autoCapitalize={"off"}
            placeholder={"10001010"}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          {ensResolvedAddress && <EnsLogo src={"/ens-logo.png"} />}
        </InputContainer>
        Amount
        <InputContainer>
          <InputBlock
            autoCorrect={"off"}
            autoComplete={"off"}
            autoCapitalize={"off"}
            placeholder={"10"}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {ensResolvedAddress && <EnsLogo src={"/ens-logo.png"} />}
        </InputContainer>
        Funds
        <InputContainer>
          <InputBlock
            autoCorrect={"off"}
            autoComplete={"off"}
            autoCapitalize={"off"}
            placeholder={"true"}
            value={hasFunds}
            onChange={(e) => setHasFunds(e.target.value)}
          />
          {ensResolvedAddress && <EnsLogo src={"/ens-logo.png"} />}
        </InputContainer>

        Evidence
        <InputContainer>

          <InputBlock
            autoCorrect={"off"}
            autoComplete={"off"}
            autoCapitalize={"off"}
            placeholder={"0x000"}
            value={evidenceHash}
            onChange={(e) => SetEvidenceHash(e.target.value)}
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
                
                const schemaEncoder = new SchemaEncoder("uint64 dateOfProof,uint256 amount,bool hasFunds,bytes32 evidenceHash");
                const encoded = schemaEncoder.encodeData([
                  { name: "dateOfProof", type: "uint64", value: 10001010 },
                  { name: "amount", type: "uint256", value: 0 },
                  { name: "hasFunds", type: "bool", value: true },
                  { name: "evidenceHash", type: "bytes32", value: '0x000' },
                ]);

                console.log('encoded', encoded);
 
                invariant(signer, "signer must be defined");
                eas.connect(signer);

                const recipient = ensResolvedAddress
                  ? ensResolvedAddress
                  : addressWallet;

                const tx = await eas.attest({
                  data: {
                    recipient: recipient,
                    data: encoded,
                    refUID: ethers.constants.HashZero,
                    revocable: true,
                    expirationTime: 0,
                  },
                  schema: CUSTOM_SCHEMAS.PROOF_OF_FUNDS,
                });
                console.log(tx);
                const uid = await tx.wait();

                const attestation = await getAttestation(uid);
                console.log(attestation)

                // Update ENS names
                await Promise.all([
                  axios.get(`${baseURL}/api/getENS/${addressWallet}`),
                  // axios.get(`${baseURL}/api/getENS/${recipient}`),
                ]);

                navigate(`/happyattest/proofoffunds`);
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
          I <b>revoke</b> that I have proof of funds
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
                  schema: CUSTOM_SCHEMAS.PROOF_OF_FUNDS,
                  data: {
                    // uid: "0x7bf8f56168d4f39360260782ffd10a0fc6a52de92e505f76cf2d9a90d99de69e",
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

export default ProofOfFunds;
