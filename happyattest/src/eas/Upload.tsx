import { useState } from "react";
import GradientBar from "../components/GradientBar";
import { useAccount, useSigner } from "wagmi";
import { useModal } from "connectkit";
import {
  EASContractAddress,
} from "../utils/utils";
import { EAS } from "@ethereum-attestation-service/eas-sdk";
import invariant from "tiny-invariant";
import { Sidebar } from "../components/Sidebar"
import {
  Title,
  Container,
  InputBlock,
  InputContainer,
  MetButton,
  WhiteBox,
} from "../styles/web"

const eas = new EAS(EASContractAddress);

function Upload() {
  const { status } = useAccount();
  const modal = useModal();
   const { data: signer } = useSigner();
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filestatus, setFileStatus] = useState<
    "initial" | "uploading" | "success" | "fail">("initial");

  const [fileCID, setFileCID] = useState<"">("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFileStatus("initial");
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (file) {
      console.log("Uploading file...");
      setFileStatus("uploading");

      const formData = new FormData();
      formData.append("file", file);
      try {
        const requestOptions = {
          method: 'PUT',
          body: formData
        }

        await fetch('http://localhost:3001/upload', requestOptions)
          .then((response) => {
            console.log(response);
            let valuePrommise = response.json();
            valuePrommise.then(
              (result) => {
                console.log(result.cid['/']);
                setFileCID(result.cid['/']);
              },
              (error) => {
                console.log(error);
              }
            );
          })
          .then((data) => {
            console.log('Upload()...Upload:\n');

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

  return (
    <Container>
      <Sidebar />
      <GradientBar />
      <WhiteBox>
        <WhiteBox>
          <Title>
            Upload File
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

                    invariant(signer, "signer must be defined");
                    eas.connect(signer);

                    handleUpload()

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

        </WhiteBox>
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

export default Upload;
