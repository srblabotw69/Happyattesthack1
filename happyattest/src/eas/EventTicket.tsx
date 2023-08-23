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

function EventTicket() {
  const { address, status } = useAccount();
  const modal = useModal();

  const { data: signer } = useSigner();
  const [attesting, setAttesting] = useState(false);
 
  const [eventId, setEventId] = useState("");
  const [ticketType, setTicketType] = useState("");
  const [ticketNum, setTicketNum] = useState("");
  const [addressWallet, setAddress] = useState("");
  const [revoking, setRevoking] = useState(false);
  const [uidVal, setUID] = useState("");

  const [ensResolvedAddress, setEnsResolvedAddress] = useState("Dakh.eth");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();


  useEffect(() => {
    const eventIdParam = searchParams.get("eventId");
    if (eventIdParam) {
      setEventId(eventIdParam);
    }
    const ticketTypeParam = searchParams.get("ticketType");
    if (ticketTypeParam) {
      setTicketType(ticketTypeParam);
    }
    const ticketNumParam = searchParams.get("ticketNum");
    if (ticketNumParam) {
      setTicketNum(ticketNumParam);
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
          I <b>attest</b> that I have the following event ticket
        </Title>
        <br></br>
        eventId
        <InputContainer>
          <InputBlock
            autoCorrect={"off"}
            autoComplete={"off"}
            autoCapitalize={"off"}
            placeholder={"sgyIzOuh*mw3dL0E1hLKCG#cm[Am]I9"}
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
          />
          {ensResolvedAddress && <EnsLogo src={"/ens-logo.png"} />}
        </InputContainer>
        ticketType
        <InputContainer>
          <InputBlock
            autoCorrect={"off"}
            autoComplete={"off"}
            autoCapitalize={"off"}
            placeholder={"50"}
            value={ticketType}
            onChange={(e) => setTicketType(e.target.value)}
          />
          {ensResolvedAddress && <EnsLogo src={"/ens-logo.png"} />}
        </InputContainer>
        ticketNum
        <InputContainer>
          <InputBlock
            autoCorrect={"off"}
            autoComplete={"off"}
            autoCapitalize={"off"}
            placeholder={"1000"}
            value={ticketNum}
            onChange={(e) => setTicketNum(e.target.value)}
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

                const schemaEncoder = new SchemaEncoder("bytes32 eventId,uint8 ticketType,uint32 ticketNum");
 
                const encoded = schemaEncoder.encodeData([
                  { name: "eventId", type: "bytes32", value: eventId },
                  { name: "ticketType", type: "uint8", value: ticketType },
                  { name: "ticketNum", type: "uint32", value: ticketNum }, 
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
                  schema: CUSTOM_SCHEMAS.EVENT_TICKET,
                });
                console.log(tx);
                const uid = await tx.wait();

                const attestation = await getAttestation(uid);
                console.log(attestation)

                // Update ENS names
                await Promise.all([
                  axios.get(`${baseURL}/api/getENS/${addressWallet}`),
                  axios.get(`${baseURL}/api/getENS/${recipient}`),
                ]);

                navigate(`/happyattest/eventticket`);
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
                  schema: CUSTOM_SCHEMAS.EVENT_TICKET,
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

                navigate(`/happyattest/eventticket`);
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

export default EventTicket;
