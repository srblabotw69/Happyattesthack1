import styled from "styled-components";
import { useLocation, useNavigate } from "react-router";
import { activeChainConfig } from "../utils/utils";
import invariant from "tiny-invariant";
 
const Container = styled.div`
  display: flex;
`;
 
const SideNavigation = styled.div`
height: 100%;
  min-width: 100px;
  max-width: 200px;
  position: relative;
  z-index: 1;
  top: 1;
  left: 0;
  overflow-x: hidden;
  padding-top: 20px;
  padding: 10px 10px; 
  resize: horizontal;
  `;
 
const MenuItemSidebar = styled.div<MenuItemProps>`
  background-color: ${({ active }) => (active ? "#F1F4F9" : "#FFF")};
  border-radius: 20px;
  padding: 12px 20px;
  font-family: "Montserrat", serif;
  font-style: normal;
  font-weight: ${({ active }) => (active ? "700" : "500")};
  font-size: 16px;
  line-height: 10px;
  cursor: pointer;
  color: #333342;
  :hover {
    background-color: ${({ active }) => (active ? "#F1F4F9" : "#f1f4f966")};
  }
`;

type MenuItemProps = {
    active: boolean;
};

type MenuItemType = {
    title: string;
    path: string;
    onClick: () => void;
};

export function Sidebar() {
    const navigate = useNavigate(); 
    const location = useLocation();

    let menuItems: MenuItemType[] = [

        // sc:  
        {
            title: "Home",
            onClick: () => navigate("/happyattest"),
            path: "/",
        },
        {
            title: "Onchain",
            onClick: () => navigate("/happyattest/onchain"),
            path: "/onchain",
        },  
        {
            title: "Offchain",
            onClick: () => navigate("/happyattest/offchain"),
            path: "/offchain",
        },
        {
            title: "Schema",
            onClick: () => navigate("/happyattest/schema"),
            path: "/schema",
        },
        {
            title: "Timestamp",
            onClick: () => navigate("/happyattest/timestamp"),
            path: "/timestamp",
        },
        {
            title: "Upload",
            onClick: () => navigate("/happyattest/upload"),
            path: "/upload",
        }, 
    ];

    let menuItems2: MenuItemType[] = [

        {
            title: "Notary",
            onClick: () => navigate("/happyattest/notary"),
            path: "/notary",
        },      
        {
            title: "Event Ticket",
            onClick: () => navigate("/happyattest/eventticket"),
            path: "/eventticket",
        },     
        {
            title: "Proof of Funds",
            onClick: () => navigate("/happyattest/proofoffunds"),
            path: "/proofoffunds",
        },           {
            title: "Authorization",
            onClick: () => navigate("/happyattest/authorization"),
            path: "/authorization",
        },    
    ];
 
    invariant(activeChainConfig, "activeChainConfig is not set");

    return (
        <>

            <Container>

                <SideNavigation>

           
                    {menuItems.map((menuItem, i) => (
                        <MenuItemSidebar
                            key={i}
                            onClick={menuItem.onClick}
                            active={menuItem.path === location.pathname}
                        >
                            {menuItem.title}
                        </MenuItemSidebar>
                    ))}

                    <hr></hr>

         
                    {menuItems2.map((menuItem, i) => (
                        <MenuItemSidebar
                            key={i}
                            onClick={menuItem.onClick}
                            active={menuItem.path === location.pathname}
                        >
                            {menuItem.title}
                        </MenuItemSidebar>
                    ))}

                </SideNavigation>
            </Container>

        </>
    );
}
