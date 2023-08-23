import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./eas/Home";
import { Root } from "./Root";
import Qr from "./Qr";
import Connections from "./Connections";
import Schema from "./eas/Schema";
import Timestamp from "./eas/Timestamp";
import Onchain from "./eas/Onchain";
import Offchain from "./eas/Offchain";
import Upload from "./eas/Upload";
import Notary from "./eas/Notary";
import Authorization from "./eas/Authorization";
import Reputations from "./eas/Reputations";
import EventTicket from "./eas/EventTicket";
import ProofOfFunds from "./eas/ProofOfFunds";

const router = createBrowserRouter([
  {
    path: "/happyattest/",
    element: <Root />,
    children: [
      {
        path: "/happyattest/",
        element: <Home />,
      },
      {
        path: "/happyattest/qr",
        element: <Qr />,
      },
      {
        path: "/happyattest/schema",
        element: <Schema />,
      }, 
      {
        path: "/happyattest/timestamp",
        element: <Timestamp />,
      },
      {
        path: "/happyattest/onchain",
        element: <Onchain />,
      },
      {
        path: "/happyattest/offchain",
        element: <Offchain />,
      },
      {
        path: "/happyattest/upload",
        element: <Upload />,
      },
      {
        path: "/happyattest/notary",
        element: <Notary />,
      },
      {
        path: "/happyattest/eventticket",
        element: <EventTicket />,
      },
      {
        path: "/happyattest/proofoffunds",
        element: <ProofOfFunds />,
      },
      {
        path: "/happyattest/authorization",
        element: <Authorization />,
      },
      {
        path: "/happyattest/reputations",
        element: <Reputations />,
      },
      {
        path: "/happyattest/connections",
        element: <Connections />,
      },
    ],
  },
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
