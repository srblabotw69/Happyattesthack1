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

function Notary() {

  const { status } = useAccount();
  const modal = useModal();
  const [address, setAddress] = useState("");

  const { data: signer } = useSigner();

  const [attesting, setAttesting] = useState(false);

  // sc:
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


  ////////////////////////////////////////////////////

  // sc:
  const [uploading, setUploading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [filestatus, setFileStatus] = useState<
    "initial" | "uploading" | "success" | "fail">("initial");

  const [fileCID, setFileCID] = useState<"">("");

  const [fileCIDString, setFileCIDString] = useState("");


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFileStatus("initial");
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {

    console.log('handleUpload()...:\n');

    if (file) {
      console.log("Uploading file...");
      setFileStatus("uploading");

      const formData = new FormData();
      formData.append("file", file);

      try {
        const requestOptions = {
          method: 'PUT',
          body: formData
          // body: null
        }

        await fetch('http://localhost:3001/upload', requestOptions)
          .then((response) => {
            console.log(response);
            // console.log(response.json());   
            let valuePrommise = response.json();

            valuePrommise.then(
              (result) => {
                console.log(result);
                //  this.setState({
                //   data: result,     
                //   });
                console.log(result.cid['/']);

                setFileCID(result.cid['/']);
                setFileCIDString(result.cid['/']);
              },
              (error) => {
                console.log(error);
              }
            );

          })
          .then((data) => {
            console.log('data', data);  // string
          })
          .catch((err) => {
            console.log(err.message);
          });

        setFileStatus("success");

      } catch (error) {
        console.error(error);
        setFileStatus("fail");
      }
    }
  };

  // function SetStateAction(arg0: number): import("react").SetStateAction<""> {
  //   throw new Error("Function not implemented.");
  // }

  return (
    <Container>
      <Sidebar />
      <GradientBar />
      <WhiteBox>
 
        {/* <Container> */}
 

        <WhiteBox>
        <Title>
          Upload Document
        </Title>
          <div className="input-group">
   
            <InputContainer>
              <InputBlock
                autoCorrect={"off"}
                autoComplete={"off"}
                autoCapitalize={"off"}
                placeholder={"1"}
                id="file" type="file" onChange={handleFileChange}
              />
            </InputContainer>

          </div>
          {file && (
            <section>
              File details:
              <ul>
                <li>Name: {file.name}</li>
                <li>Type: {file.type}</li>
                <li>Size: {file.size} bytes</li>
              </ul>
            </section>
          )}

          {file && (

            <MetButton
              onClick={async () => {
                console.log(status)
                if (status !== "connected") {
                  modal.setOpen(true);
                } else {
                  setUploading(true);

                  try {
                    // const schemaEncoder = new SchemaEncoder("bool metIRL");
                    // const encoded = schemaEncoder.encodeData([
                    //   { name: "metIRL", type: "bool", value: true },
                    // ]);

                    invariant(signer, "signer must be defined");
                    eas.connect(signer);

                    // const recipient = ensResolvedAddress
                    //   ? ensResolvedAddress
                    //   : address;

                    // // Update ENS names
                    // await Promise.all([
                    //   axios.get(`${baseURL}/api/getENS/${address}`),
                    //   axios.get(`${baseURL}/api/getENS/${recipient}`),
                    // ]);

                    handleUpload()
                    // navigate(`/happyattest/upload`);

                  } catch (e) { }

                  setUploading(false);

                }
              }}
            >
              {uploading
                ? "Upload File"
                : status === "connected"
                  ? "Upload file"
                  : "Connect wallet"}
            </MetButton>
          )}
          File Status:
          <Result status={filestatus} />
          <br></br>
          File CID:
          <FileCID cid={fileCID} />
          {/* </> */}
        </WhiteBox>
        {/* </Container> */}
        {/* </> */}
        <br></br><br></br>
        <Title>
          I <b>attest</b> offchain
        </Title>

        <InputContainer>
          <InputBlock
            autoCorrect={"off"}
            autoComplete={"off"}
            autoCapitalize={"off"}
            placeholder={"fileCID"}
            value={fileCIDString}
            onChange={(e) => setFileCIDString(e.target.value)}
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
                const schemaEncoder = new SchemaEncoder("string cid");
                const encodedData = schemaEncoder.encodeData([
                  { name: "cid", type: "string", value: fileCIDString },
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

                navigate(`/notary`);
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

                // invariant(signer, "signer must be defined");
                // eas.connect(signer);

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

                navigate(`/happyattest/notary`);
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

const Result = ({ status }: { status: string }) => {
  if (status === "success") {
    return <p>✅ File uploaded successfully!</p>;
  } else if (status === "fail") {
    return <p>❌ File upload failed!</p>;
  } else if (status === "uploading") {
    return <p>⏳ Uploading selected file...</p>;
  } else {
    return null;
  }
};

const FileCID = ({ cid }: { cid: string }) => {
  if (cid !== "") {
    return <p>✅ {cid}</p>;
  } else {
    return null;
  }
};

export default Notary;