// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EvidenceRegistry
 * @dev LegitiChain Digital Evidence Integrity Registry on Polygon Amoy Testnet.
 * Keeps evidence contents completely off-chain. Only anchors cryptographic hashes,
 * submitter addresses, and immutable block timestamps on-chain.
 */
contract EvidenceRegistry {
    struct EvidenceRecord {
        string evidenceId;
        bytes32 evidenceHash;
        address submitter;
        uint256 timestamp;
    }

    // Mapping from Evidence ID to Evidence Record
    mapping(string => EvidenceRecord) private records;

    // Event emitted when evidence is anchored on-chain
    event EvidenceAnchored(
        string indexed evidenceId,
        bytes32 evidenceHash,
        address indexed submitter,
        uint256 timestamp
    );

    /**
     * @dev Anchors a new evidence record on-chain.
     * @param evidenceId The unique identifier of the evidence (e.g. EVI-2026-9041).
     * @param evidenceHash The SHA-256 or Keccak-256 hash of the evidence payload.
     */
    function anchorEvidence(string memory evidenceId, bytes32 evidenceHash) external {
        require(bytes(evidenceId).length > 0, "Evidence ID cannot be empty");
        require(evidenceHash != bytes32(0), "Evidence hash cannot be empty");
        require(records[evidenceId].timestamp == 0, "Evidence ID already anchored");

        records[evidenceId] = EvidenceRecord({
            evidenceId: evidenceId,
            evidenceHash: evidenceHash,
            submitter: msg.sender,
            timestamp: block.timestamp
        });

        emit EvidenceAnchored(evidenceId, evidenceHash, msg.sender, block.timestamp);
    }

    /**
     * @dev Retrieves an anchored evidence record by ID.
     * @param evidenceId The unique identifier of the evidence.
     */
    function getRecord(string memory evidenceId)
        external
        view
        returns (
            string memory id,
            bytes32 evidenceHash,
            address submitter,
            uint256 timestamp
        )
    {
        EvidenceRecord memory record = records[evidenceId];
        require(record.timestamp > 0, "Evidence record not found");
        return (record.evidenceId, record.evidenceHash, record.submitter, record.timestamp);
    }

    /**
     * @dev Helper view function to check if an evidence ID has been anchored.
     */
    function isAnchored(string memory evidenceId) external view returns (bool) {
        return records[evidenceId].timestamp > 0;
    }
}
