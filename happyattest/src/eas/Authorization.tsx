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

function Authorization() {
  const { status } = useAccount();
  const modal = useModal();
  const [address, setAddress] = useState("");
  const { data: signer } = useSigner();
  const [attesting, setAttesting] = useState(false);

  const [revoking, setRevoking] = useState(false);
  const [uidVal, setUID] = useState("");
 
  const [roleId, setRoleId] = useState("");
  const [role, setRole] = useState("");
  const [authorizations, setAuthorizations] = useState("");
 
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
          I <b>attest</b> that I have sufficient funds
        </Title>
        <br></br>
        Role Id
        <InputContainer>
          <InputBlock
            autoCorrect={"off"}
            autoComplete={"off"}
            autoCapitalize={"off"}
            placeholder={"Id"}
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
          />
          {ensResolvedAddress && <EnsLogo src={"/ens-logo.png"} />}
        </InputContainer>

        Role
        <InputContainer>
          <InputBlock
            autoCorrect={"off"}
            autoComplete={"off"}
            autoCapitalize={"off"}
            placeholder={"Role"}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          {ensResolvedAddress && <EnsLogo src={"/ens-logo.png"} />}
        </InputContainer>

        Authorizations
        <InputContainer>
          <InputBlock
            autoCorrect={"off"}
            autoComplete={"off"}
            autoCapitalize={"off"}
            placeholder={"Yes/No"}
            value={authorizations}
            onChange={(e) => setAuthorizations(e.target.value)}
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
                const schemaEncoder = new SchemaEncoder("bool authorization");
                const encoded = schemaEncoder.encodeData([
                  { name: "roleId", type: "bytes32", value: 0x0 },
                  { name: "role", type: "string", value: "" },
                  { name: "authorizations", type: "bytes32[]", value: 0x0 },
                ]);
 
                console.log('encoded', encoded)

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
                  schema: CUSTOM_SCHEMAS.AUTHORIZATION,
                });

                const uid = await tx.wait();

                const attestation = await getAttestation(uid);
                console.log(attestation)

                // Update ENS names
                await Promise.all([
                  axios.get(`${baseURL}/api/getENS/${address}`),
                  axios.get(`${baseURL}/api/getENS/${recipient}`),
                ]);

                navigate(`/happyattest/authorization`);
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
          I <b>revoke</b> that I have sufficient funds
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
                  schema: CUSTOM_SCHEMAS.AUTHORIZATION,
                  data: {
                    uid: uidVal,
                  },
                });

                const uid = await tx.wait();
                console.log(uid)

                // Update ENS names
                await Promise.all([
                  axios.get(`${baseURL}/api/getENS/${uidVal}`),
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

export default Authorization;