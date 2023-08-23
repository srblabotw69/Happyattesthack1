import invariant from "tiny-invariant";
import type {
  Attestation,
  AttestationResult,
  EASChainConfig,
  EnsNamesResult,
  MyAttestationResult,
  MyTimestampResult,   
  SchemaResult, 
} from "./types";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import { ethers } from "ethers";
import axios from "axios";
 
export const alchemyApiKey = process.env.REACT_APP_ALCHEMY_API_KEY;
 
export const CUSTOM_SCHEMAS = {
  MET_IRL_SCHEMA:
    "0xc59265615401143689cbfe73046a922c975c99d97e4c248070435b1104b2dea7",
  CONFIRM_SCHEMA:
    "0xb96446c85ce538c1641a967f23ea11bbb4a390ef745fc5a9905689dbd48bac86",
  AUTHORIZATION: "0x7713f5acbbc0382d43eeff9d349a41c686dd2fd67c9642775cf72477ab72006b",
  PROOF_OF_FUNDS: "0x85ffcbe250bde4a1908318f7df7a6f5f8b175442f2bc040a18b44ef56430ca40",
 
  EMPLOYMENT: "0xf546ed76a0fbff471a4738db7560dc4aea4c44a9a2748b5a428905b6c58712b7",  
  PRICE_PREDICT: "0x24d65fd9da1abb92d838b7f4f9ac939c88f8ba00282f64329d8a7496cf7bc1ae",  
  NOTARY: "0xf5e3c5dd9ed54b59bdacceb0def073061e680939f7cff07d9521dc3e87336111",  
  WEBSITE_URL: "0xf209dfc21472d0e774ddfa207a444edad4dec5f96a9a848620717010df0996a7",   

  EVENT_TICKET: "0x9e30695f05ad280a1caf4ec15621dde07cd22aa8cf834e58b84b816c2ccfb6ac",  
  VOTE: "0x424041413f6893c2f2e3e0e91ce9e26763840795b9c7fbb3866502e8d5c94677",   

};

dayjs.extend(duration);
dayjs.extend(relativeTime);

function getChainId() {
  return Number(process.env.REACT_APP_CHAIN_ID);
}

export const CHAINID = getChainId();
invariant(CHAINID, "No chain ID env found");

export const EAS_CHAIN_CONFIGS: EASChainConfig[] = [
  {
    chainId: 11155111,
    chainName: "sepolia",
    subdomain: "sepolia.",
    version: "0.26",
    contractAddress: "0xC2679fBD37d54388Ce493F1DB75320D236e1815e",
    schemaRegistryAddress: "0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0",
    resolverAddress: "0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0",
    etherscanURL: "https://sepolia.etherscan.io",
    contractStartBlock: 2958570,
    rpcProvider: `https://sepolia.infura.io/v3/`,
  },
];


export const activeChainConfig = EAS_CHAIN_CONFIGS.find(
  (config) => config.chainId === CHAINID
);

export const baseURL = `https://${activeChainConfig!.subdomain}easscan.org`;

invariant(activeChainConfig, "No chain config found for chain ID");
export const EASContractAddress = activeChainConfig.contractAddress;

export const EASVersion = activeChainConfig.version;

export const EASSchemaRegistryAddress = activeChainConfig.schemaRegistryAddress;
export const EASResolverAddress = activeChainConfig.resolverAddress;
export const Provider = activeChainConfig.rpcProvider;

export async function getProvider() {
  const provider = new ethers.providers.StaticJsonRpcProvider(
    `https://eth-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`,
    "mainnet"
  );
  return provider;
}

export const EAS_CONFIG = {
  address: EASContractAddress,
  version: EASVersion,
  chainId: CHAINID,
};

export const timeFormatString = "MM/DD/YYYY h:mm:ss a";
export async function getAddressForENS(name: string) {
  const provider = new ethers.providers.StaticJsonRpcProvider(
    `https://eth-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`,
    "mainnet"
  );
  return await provider.resolveName(name);
}
export async function getENSName(address: string) {
  const provider = new ethers.providers.StaticJsonRpcProvider(
    `https://eth-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`,
    "mainnet"
  );
  return await provider.lookupAddress(address);
}
export async function getAttestation(uid: string): Promise<Attestation | null> {
  const response = await axios.post<AttestationResult>(
    `${baseURL}/graphql`,
    {
      query:
        "query Query($where: AttestationWhereUniqueInput!) {\n  attestation(where: $where) {\n    id\n    attester\n    recipient\n    revocationTime\n    expirationTime\n    time\n    txid\n    data\n  }\n}",
      variables: {
        where: {
          id: uid,
        },
      },
    },
    {
      headers: {
        "content-type": "application/json",
      },
    }
  );
  return response.data.data.attestation;
}
export async function getAttestationsForAddress(address: string) {
  const response = await axios.post<MyAttestationResult>(
    `${baseURL}/graphql`,
    {
      query:
        "query Attestations($where: AttestationWhereInput, $orderBy: [AttestationOrderByWithRelationInput!]) {\n  attestations(where: $where, orderBy: $orderBy) {\n    attester\n    revocationTime\n    expirationTime\n    time\n    recipient\n    id\n    data\n  }\n}",

      variables: {
        where: {
          schemaId: {
            equals: CUSTOM_SCHEMAS.MET_IRL_SCHEMA,
          },
          OR: [
            {
              attester: {
                equals: address,
              },
            },
            {
              recipient: {
                equals: address,
              },
            },
          ],
        },
        orderBy: [
          {
            time: "desc",
          },
        ],
      },
    },
    {
      headers: {
        "content-type": "application/json",
      },
    }
  );
  return response.data.data.attestations;
}
export async function getConfirmationAttestationsForUIDs(refUids: string[]) {
  const response = await axios.post<MyAttestationResult>(
    `${baseURL}/graphql`,
    {
      query:
        "query Attestations($where: AttestationWhereInput, $orderBy: [AttestationOrderByWithRelationInput!]) {\n  attestations(where: $where, orderBy: $orderBy) {\n    attester\n    revocationTime\n    expirationTime\n    time\n    recipient\n    id\n    data\n  refUID\n  }\n}",

      variables: {
        where: {
          schemaId: {
            equals: CUSTOM_SCHEMAS.CONFIRM_SCHEMA,
          },
          refUID: {
            in: refUids,
          },
        },
        orderBy: [
          {
            time: "desc",
          },
        ],
      },
    },
    {
      headers: {
        "content-type": "application/json",
      },
    }
  );
  return response.data.data.attestations;
}
export async function getENSNames(addresses: string[]) {
  const response = await axios.post<EnsNamesResult>(
    `${baseURL}/graphql`,
    {
      query:
        "query Query($where: EnsNameWhereInput) {\n  ensNames(where: $where) {\n    id\n    name\n  }\n}",
      variables: {
        where: {
          id: {
            in: addresses,
            mode: "insensitive",
          },
        },
      },
    },
    {
      headers: {
        "content-type": "application/json",
      },
    }
  );
  return response.data.data.ensNames;
}

export async function getSchema(address: string) {
  const response = await axios.post<SchemaResult>(
    `${baseURL}/graphql`,
    {
      query:
        "query Schema { schema(where: $where) { attestations { id\n   ipfsHash\n  isOffchain\n    recipient\n     revocable\n     refUID\n  revocationTime\n   revoked\n  }  }",
      variables: {
        where: {
          id: "0x49d9700408d4ed2c132a3d6410ada3ed794e9d927accfdc02a9ceae75de7af97",
        },
      },

    },
    {
      headers: {
        "content-type": "application/json",
      },
    }
  );
  return response.data;
}
export async function getTimestampsGE(timestampValue: number) {
  const response = await axios.post<MyTimestampResult>(
    `${baseURL}/graphql`,
    {
      query:
        "query Query($where: TimestampWhereInput) {\n  timestamps(where: $where) {\n  from\n   id\n    timestamp\n  }\n}",
      variables: {
        where: {
          timestamp: {
            gte: timestampValue, // 1680179490,
          },
        },
      },
    }
  );
  return response.data.data.timestamps;
}

export async function getTimestampsEquals(timestampValue: number) {
  const response = await axios.post<MyTimestampResult>(
    `${baseURL}/graphql`,
    {
      query:
        "query Query($where: TimestampWhereInput) {\n  timestamps(where: $where) {\n  from\n   id\n    timestamp\n  }\n}",
      variables: {
        where: {
          timestamp: {
            equals: timestampValue,
          },
        },
      },
    }
  );
  return response.data.data.timestamps;
}