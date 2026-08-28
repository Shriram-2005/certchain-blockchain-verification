import { ethers } from "ethers";

// ── ABI ── (only the functions we actually call from the Next.js app)
const ABI = [
  "function issueCertificate(string certId, string holderName, string certType, bytes32 certHash, string ipfsCID, uint256 expiresAt) external",
  "function getCertificate(string certId) external view returns (tuple(string certId, string holderName, string certType, bytes32 certHash, string ipfsCID, address issuerAddress, uint256 issuedAt, uint256 expiresAt, uint8 status))",
  "function revokeCertificate(string certId, string reason) external",
  "function suspendCertificate(string certId, string reason) external",
  "function reinstateCertificate(string certId) external",
  "function getCertificateHistory(string certId) external view returns (tuple(uint256 timestamp, string action, string reason, address actor)[])",
  "function getTotalCertificates() external view returns (uint256)",
  "function authorizedIssuers(address) external view returns (bool)",
  "event CertificateIssued(string indexed certId, address indexed issuer, uint256 timestamp)",
  "event CertificateRevoked(string indexed certId, address indexed actor, string reason)",
];

const STATUS_MAP: Record<number, string> = {
  0: "ACTIVE",
  1: "REVOKED",
  2: "SUSPENDED",
};

// ── Helpers ───────────────────────────────────────────────────────────────

function getProvider() {
  return new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
}

function getSignerContract() {
  const provider = getProvider();
  const signer   = new ethers.Wallet(process.env.ISSUER_PRIVATE_KEY!, provider);
  return new ethers.Contract(process.env.CONTRACT_ADDRESS!, ABI, signer);
}

function getReadonlyContract() {
  const provider = getProvider();
  return new ethers.Contract(process.env.CONTRACT_ADDRESS!, ABI, provider);
}

// ── Hash helper ───────────────────────────────────────────────────────────

export function computeCertHash(certData: object): string {
  return ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(certData)));
}

// ── Write functions (require signer) ─────────────────────────────────────

export async function issueCertificateOnChain(params: {
  certId:     string;
  holderName: string;
  certType:   string;
  certHash:   string;
  ipfsCID:    string;
  expiresAt:  number; // Unix timestamp; 0 = never
}) {
  const contract = getSignerContract();
  const tx = await contract.issueCertificate(
    params.certId,
    params.holderName,
    params.certType,
    params.certHash,
    params.ipfsCID,
    params.expiresAt
  );
  const receipt = await tx.wait();
  return {
    txHash:      receipt.hash as string,
    blockNumber: receipt.blockNumber as number,
  };
}

export async function revokeCertificateOnChain(certId: string, reason: string) {
  const contract = getSignerContract();
  const tx = await contract.revokeCertificate(certId, reason);
  const receipt = await tx.wait();
  return { txHash: receipt.hash as string };
}

export async function suspendCertificateOnChain(certId: string, reason: string) {
  const contract = getSignerContract();
  const tx = await contract.suspendCertificate(certId, reason);
  const receipt = await tx.wait();
  return { txHash: receipt.hash as string };
}

// ── Read functions (no signer needed) ────────────────────────────────────

export async function getCertificateFromChain(certId: string) {
  const contract = getReadonlyContract();
  try {
    const cert = await contract.getCertificate(certId);
    return {
      certId:        cert.certId,
      holderName:    cert.holderName,
      certType:      cert.certType,
      certHash:      cert.certHash,
      ipfsCID:       cert.ipfsCID,
      issuerAddress: cert.issuerAddress,
      issuedAt:      Number(cert.issuedAt),
      expiresAt:     Number(cert.expiresAt),
      status:        STATUS_MAP[Number(cert.status)] ?? "UNKNOWN",
    };
  } catch {
    return null; // Certificate not found
  }
}

export async function getCertificateHistoryFromChain(certId: string) {
  const contract = getReadonlyContract();
  const logs = await contract.getCertificateHistory(certId);
  return logs.map((log: any) => ({
    timestamp: Number(log.timestamp),
    action:    log.action,
    reason:    log.reason,
    actor:     log.actor,
  }));
}
