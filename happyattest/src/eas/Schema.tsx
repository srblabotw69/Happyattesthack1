import { useEffect, useState } from "react";
import GradientBar from "../components/GradientBar";
import { useAccount, useSigner } from "wagmi";
import { useModal } from "connectkit";
import {
  baseURL,
  // CUSTOM_SCHEMAS,
  EASContractAddress,
  getAddressForENS,
  EASSchemaRegistryAddress,
  EASResolverAddress,
} from "../utils/utils";
import { EAS, SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";
import invariant from "tiny-invariant";
 import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router";
import axios from "axios";
import { Sidebar } from "../components/Sidebar"
import {
  Title,
  Container,
  MetButton,
  StyledTextarea,
  InputContainer,
  EnsLogo,
  InputBlock,
  WhiteBox,
} from "../styles/web"

const eas = new EAS(EASContractAddress);
 

function Schema() {
 
  const signer2 = useSigner();

  const { status } = useAccount();
  const modal = useModal();
  const [address, setAddress] = useState("");
  const { data: signer } = useSigner();

  const [uidVal, setUID] = useState("");
  const [schemaing, setSchemaing] = useState(false);
  const [creatingSchema, setCreateSchema] = useState(false);
  const [schema, setSchema] = useState("");

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
          Get Schema
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
              setCreateSchema(true);

              try {
 
                invariant(signer2, "signer must be defined");
 
                const recipient = ensResolvedAddress
                  ? ensResolvedAddress
                  : address;

                console.log(EASSchemaRegistryAddress)

                const schemaRegistry = new SchemaRegistry(EASSchemaRegistryAddress);

                const schema = "uint256 eventId, uint8 voteIndex";
                const resolverAddress = EASResolverAddress      

                console.log(schemaRegistry, resolverAddress)
                const revocable = true;

                const transaction = await schemaRegistry.register({
                  schema,
                  resolverAddress,
                  revocable,
                });

                // Optional: Wait for transaction to be validated
                await transaction.wait();

                // Update ENS names
                await Promise.all([
                  axios.get(`${baseURL}/api/getENS/${address}`),
                  axios.get(`${baseURL}/api/getENS/${recipient}`),
                ]);

                navigate(`/happyattest/schema`);
              } catch (e) { }

              setCreateSchema(false);
            }
          }}
        >
          {creatingSchema
            ? "Creating Schema..."
            : status === "connected"
              ? "Create Schema"
              : "Connect wallet"}
        </MetButton>


        <br></br>

        <InputContainer>
          <InputBlock
            autoCorrect={"off"}
            autoComplete={"off"}
            autoCapitalize={"off"}
            placeholder={"schemaUID"}
            value={uidVal}
            onChange={(e) => {setUID(e.target.value); 
              setSchema(""); }}
          />
          {ensResolvedAddress && <EnsLogo src={"/ens-logo.png"} />}
        </InputContainer>
        <MetButton
          onClick={async () => {
            if (status !== "connected") {
              modal.setOpen(true);
            } else {
              setSchemaing(true);

              try {
 
                invariant(signer, "signer must be defined");
                eas.connect(signer);

                const recipient = ensResolvedAddress
                  ? ensResolvedAddress
                  : address;

                 const schemaRegistry = new SchemaRegistry(EASSchemaRegistryAddress);

                schemaRegistry.connect(signer);
 
                const schemaUID = uidVal;

                const schema = await schemaRegistry.getSchema({ uid: schemaUID });

                setSchema(JSON.stringify(schema))

                // Update ENS names
                await Promise.all([
                  axios.get(`${baseURL}/api/getENS/${address}`),
                  axios.get(`${baseURL}/api/getENS/${recipient}`),
                ]);

                navigate(`/happyattest/schema`);
              } catch (e) { }

              setSchemaing(false);
            }
          }}
        >
          {schemaing
            ? "Getting Schema..."
            : status === "connected"
              ? "Get Schema"
              : "Connect wallet"}
        </MetButton>

        <div>
          <InputContainer>
            <StyledTextarea
              value={schema}
              onChange={(e) => setSchema("")}
            />
          </InputContainer>
        </div>


      </WhiteBox>
    </Container>
  );
}

export default Schema;
