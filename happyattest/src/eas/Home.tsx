import GradientBar from "../components/GradientBar";
import { Sidebar } from "../components/Sidebar"
import { 
  Title,
  Container,
  WhiteBox,
} from "../styles/web"

function Home() {
  
  return (
    <Container>
      <Sidebar />
      <GradientBar />
      <WhiteBox>
        <Title>
          Welcome to Happy Attest!

          This is a one stop shop for creating Ethereum attestations via EAS (Ethereum Attestation Service).  
        </Title>
  
      </WhiteBox>
    </Container>
  );
}

export default Home;
 