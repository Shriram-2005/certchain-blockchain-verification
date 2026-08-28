// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title CertificateRegistry
/// @notice Issues, verifies, and revokes government certificates on-chain
contract CertificateRegistry is Ownable {

    // ─── Enums ────────────────────────────────────────────────────────────
    enum Status { ACTIVE, REVOKED, SUSPENDED }

    // ─── Structs ──────────────────────────────────────────────────────────
    struct Certificate {
        string  certId;
        string  holderName;
        string  certType;       // e.g. "DEGREE", "PROFESSIONAL_LICENSE"
        bytes32 certHash;       // SHA-256 of cert content
        string  ipfsCID;        // IPFS / Supabase Storage reference
        address issuerAddress;
        uint256 issuedAt;
        uint256 expiresAt;      // 0 = never expires
        Status  status;
    }

    struct AuditLog {
        uint256 timestamp;
        string  action;         // "ISSUED", "REVOKED", "SUSPENDED", "REINSTATED"
        string  reason;
        address actor;
    }

    // ─── State ────────────────────────────────────────────────────────────
    mapping(address => bool)      public authorizedIssuers;
    mapping(string  => Certificate)  private certificates;
    mapping(string  => AuditLog[])   private auditLogs;
    string[]                         private allCertIds;

    // ─── Events ───────────────────────────────────────────────────────────
    event IssuerAdded(address indexed issuer);
    event IssuerRemoved(address indexed issuer);
    event CertificateIssued(string indexed certId, address indexed issuer, uint256 timestamp);
    event CertificateRevoked(string indexed certId, address indexed actor, string reason);
    event CertificateSuspended(string indexed certId, address indexed actor, string reason);
    event CertificateReinstated(string indexed certId, address indexed actor);

    // ─── Modifiers ────────────────────────────────────────────────────────
    modifier onlyIssuer() {
        require(authorizedIssuers[msg.sender], "Not an authorized issuer");
        _;
    }

    modifier certExists(string memory certId) {
        require(bytes(certificates[certId].certId).length != 0, "Certificate not found");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────
    constructor() Ownable(msg.sender) {
        authorizedIssuers[msg.sender] = true;
        emit IssuerAdded(msg.sender);
    }

    // ─── Admin Functions ──────────────────────────────────────────────────

    /// @notice Add a new authorized issuer
    function addIssuer(address issuer) external onlyOwner {
        require(!authorizedIssuers[issuer], "Already an issuer");
        authorizedIssuers[issuer] = true;
        emit IssuerAdded(issuer);
    }

    /// @notice Remove an authorized issuer
    function removeIssuer(address issuer) external onlyOwner {
        require(issuer != owner(), "Cannot remove owner");
        authorizedIssuers[issuer] = false;
        emit IssuerRemoved(issuer);
    }

    // ─── Core Functions ───────────────────────────────────────────────────

    /// @notice Issue a new certificate and anchor it on-chain
    function issueCertificate(
        string  memory certId,
        string  memory holderName,
        string  memory certType,
        bytes32        certHash,
        string  memory ipfsCID,
        uint256        expiresAt
    ) external onlyIssuer {
        require(bytes(certId).length > 0,          "certId cannot be empty");
        require(bytes(holderName).length > 0,      "holderName cannot be empty");
        require(bytes(certificates[certId].certId).length == 0, "Certificate ID already exists");

        certificates[certId] = Certificate({
            certId:        certId,
            holderName:    holderName,
            certType:      certType,
            certHash:      certHash,
            ipfsCID:       ipfsCID,
            issuerAddress: msg.sender,
            issuedAt:      block.timestamp,
            expiresAt:     expiresAt,
            status:        Status.ACTIVE
        });

        auditLogs[certId].push(AuditLog({
            timestamp: block.timestamp,
            action:    "ISSUED",
            reason:    "Initial issuance",
            actor:     msg.sender
        }));

        allCertIds.push(certId);
        emit CertificateIssued(certId, msg.sender, block.timestamp);
    }

    /// @notice Get certificate data (anyone can call)
    function getCertificate(string memory certId)
        external view certExists(certId)
        returns (Certificate memory)
    {
        return certificates[certId];
    }

    /// @notice Revoke a certificate permanently
    function revokeCertificate(string memory certId, string memory reason)
        external onlyIssuer certExists(certId)
    {
        require(certificates[certId].status != Status.REVOKED, "Already revoked");
        certificates[certId].status = Status.REVOKED;

        auditLogs[certId].push(AuditLog({
            timestamp: block.timestamp,
            action:    "REVOKED",
            reason:    reason,
            actor:     msg.sender
        }));
        emit CertificateRevoked(certId, msg.sender, reason);
    }

    /// @notice Suspend a certificate temporarily
    function suspendCertificate(string memory certId, string memory reason)
        external onlyIssuer certExists(certId)
    {
        require(certificates[certId].status == Status.ACTIVE, "Not active");
        certificates[certId].status = Status.SUSPENDED;

        auditLogs[certId].push(AuditLog({
            timestamp: block.timestamp,
            action:    "SUSPENDED",
            reason:    reason,
            actor:     msg.sender
        }));
        emit CertificateSuspended(certId, msg.sender, reason);
    }

    /// @notice Reinstate a suspended certificate
    function reinstateCertificate(string memory certId)
        external onlyIssuer certExists(certId)
    {
        require(certificates[certId].status == Status.SUSPENDED, "Not suspended");
        certificates[certId].status = Status.ACTIVE;

        auditLogs[certId].push(AuditLog({
            timestamp: block.timestamp,
            action:    "REINSTATED",
            reason:    "Reinstatement after suspension",
            actor:     msg.sender
        }));
        emit CertificateReinstated(certId, msg.sender);
    }

    /// @notice Get full audit trail for a certificate
    function getCertificateHistory(string memory certId)
        external view certExists(certId)
        returns (AuditLog[] memory)
    {
        return auditLogs[certId];
    }

    /// @notice Get total number of certificates issued
    function getTotalCertificates() external view returns (uint256) {
        return allCertIds.length;
    }
}
