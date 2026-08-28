import { expect } from "chai";
import { ethers } from "hardhat";
import { CertificateRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CertificateRegistry", function () {
  let registry: CertificateRegistry;
  let owner: SignerWithAddress;
  let issuer: SignerWithAddress;
  let stranger: SignerWithAddress;

  const CERT_ID   = "CERT-2025-0001";
  const CERT_HASH = ethers.keccak256(ethers.toUtf8Bytes("test-certificate-data"));
  const IPFS_CID  = "QmTestCID123abc";

  beforeEach(async function () {
    [owner, issuer, stranger] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("CertificateRegistry");
    registry = (await Factory.deploy()) as CertificateRegistry;
    await registry.waitForDeployment();
  });

  // ── Deployment ────────────────────────────────────────────────────────
  it("should deploy with owner as authorized issuer", async function () {
    expect(await registry.authorizedIssuers(owner.address)).to.equal(true);
  });

  // ── Access Control ────────────────────────────────────────────────────
  it("should allow owner to add an issuer", async function () {
    await registry.addIssuer(issuer.address);
    expect(await registry.authorizedIssuers(issuer.address)).to.equal(true);
  });

  it("should reject addIssuer call from non-owner", async function () {
    await expect(
      registry.connect(stranger).addIssuer(issuer.address)
    ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
  });

  // ── Issuance ──────────────────────────────────────────────────────────
  it("should issue a certificate successfully", async function () {
    const tx = await registry.issueCertificate(
      CERT_ID, "Test Holder", "DEGREE", CERT_HASH, IPFS_CID, 0
    );
    await expect(tx)
      .to.emit(registry, "CertificateIssued")
      .withArgs(CERT_ID, owner.address, await ethers.provider.getBlock("latest").then(b => b!.timestamp));

    const cert = await registry.getCertificate(CERT_ID);
    expect(cert.holderName).to.equal("Test Holder");
    expect(cert.certType).to.equal("DEGREE");
    expect(cert.certHash).to.equal(CERT_HASH);
    expect(cert.status).to.equal(0); // Status.ACTIVE
  });

  it("should reject duplicate certificate IDs", async function () {
    await registry.issueCertificate(CERT_ID, "Holder 1", "DEGREE", CERT_HASH, IPFS_CID, 0);
    await expect(
      registry.issueCertificate(CERT_ID, "Holder 2", "DEGREE", CERT_HASH, IPFS_CID, 0)
    ).to.be.revertedWith("Certificate ID already exists");
  });

  it("should reject issuance from unauthorized address", async function () {
    await expect(
      registry.connect(stranger).issueCertificate(
        CERT_ID, "Holder", "DEGREE", CERT_HASH, IPFS_CID, 0
      )
    ).to.be.revertedWith("Not an authorized issuer");
  });

  // ── Verification ──────────────────────────────────────────────────────
  it("should return correct certificate data on getCertificate", async function () {
    await registry.issueCertificate(CERT_ID, "Shri Ram", "DEGREE", CERT_HASH, IPFS_CID, 0);
    const cert = await registry.getCertificate(CERT_ID);
    expect(cert.holderName).to.equal("Shri Ram");
    expect(cert.ipfsCID).to.equal(IPFS_CID);
  });

  it("should revert getCertificate for non-existent cert", async function () {
    await expect(
      registry.getCertificate("CERT-NONEXISTENT")
    ).to.be.revertedWith("Certificate not found");
  });

  // ── Revocation ────────────────────────────────────────────────────────
  it("should revoke a certificate and record audit log", async function () {
    await registry.issueCertificate(CERT_ID, "Holder", "DEGREE", CERT_HASH, IPFS_CID, 0);
    const tx = await registry.revokeCertificate(CERT_ID, "Fraud detected");
    await expect(tx)
      .to.emit(registry, "CertificateRevoked")
      .withArgs(CERT_ID, owner.address, "Fraud detected");

    const cert = await registry.getCertificate(CERT_ID);
    expect(cert.status).to.equal(1); // Status.REVOKED
  });

  it("should reject double revocation", async function () {
    await registry.issueCertificate(CERT_ID, "Holder", "DEGREE", CERT_HASH, IPFS_CID, 0);
    await registry.revokeCertificate(CERT_ID, "First revocation");
    await expect(
      registry.revokeCertificate(CERT_ID, "Second revocation")
    ).to.be.revertedWith("Already revoked");
  });

  // ── Audit Trail ───────────────────────────────────────────────────────
  it("should return full audit history", async function () {
    await registry.issueCertificate(CERT_ID, "Holder", "DEGREE", CERT_HASH, IPFS_CID, 0);
    await registry.revokeCertificate(CERT_ID, "Test revocation");

    const history = await registry.getCertificateHistory(CERT_ID);
    expect(history).to.have.lengthOf(2);
    expect(history[0].action).to.equal("ISSUED");
    expect(history[1].action).to.equal("REVOKED");
    expect(history[1].reason).to.equal("Test revocation");
  });

  // ── Suspension / Reinstatement ────────────────────────────────────────
  it("should suspend and reinstate a certificate", async function () {
    await registry.issueCertificate(CERT_ID, "Holder", "DEGREE", CERT_HASH, IPFS_CID, 0);
    await registry.suspendCertificate(CERT_ID, "Under investigation");

    let cert = await registry.getCertificate(CERT_ID);
    expect(cert.status).to.equal(2); // Status.SUSPENDED

    await registry.reinstateCertificate(CERT_ID);
    cert = await registry.getCertificate(CERT_ID);
    expect(cert.status).to.equal(0); // Status.ACTIVE
  });
});
