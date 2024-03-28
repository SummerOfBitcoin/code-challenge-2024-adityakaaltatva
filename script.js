const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Function to validate a transaction
function validateTransaction(transaction) {
    // Check if the transaction has required fields
    if (!transaction.sender || !transaction.recipient || !transaction.amount) {
        return false;
    }
    // Additional validation rules can be added here
    return true;
}

// Function to calculate Merkle root
function calculateMerkleRoot(transactions) {
    const hashes = transactions.map(tx => crypto.createHash('sha256').update(JSON.stringify(tx)).digest('hex'));
    while (hashes.length > 1) {
        if (hashes.length % 2 !== 0) {
            hashes.push(hashes[hashes.length - 1]); // Duplicate the last hash if odd number of hashes
        }
        const combinedHashes = [];
        for (let i = 0; i < hashes.length; i += 2) {
            combinedHashes.push(crypto.createHash('sha256').update(hashes[i] + hashes[i + 1]).digest('hex'));
        }
        hashes.splice(0, hashes.length, ...combinedHashes);
    }
    return hashes[0];
}

// Read transaction data from JSON files in mempool folder
const mempoolPath = path.join(__dirname, 'mempool');
const transactions = [];
const files = fs.readdirSync(mempoolPath);
files.forEach(file => {
    if (file.endsWith('.json')) {
        const fileData = fs.readFileSync(path.join(mempoolPath, file), 'utf8');
        const transactionsFromFile = JSON.parse(fileData);
        transactions.push(...transactionsFromFile);
    }
});

// Validate transactions and include valid ones in the block
const validTransactions = transactions.filter(validateTransaction);

// Coinbase transaction
const coinbaseTx = { sender: 'coinbase', recipient: 'miner', amount: 50 }; // Example coinbase transaction

// Create the block
const block = {
    header: {
        merkleRoot: calculateMerkleRoot([coinbaseTx, ...validTransactions]),
        nonce: 0,
        difficulty: '0000ffff00000000000000000000000000000000000000000000000000000000' // Difficulty target
    },
    coinbaseTx,
    transactions: validTransactions
};

// Serialize the block data
const blockHeader = JSON.stringify(block.header);
const coinbaseTxSerialized = JSON.stringify(coinbaseTx);
const txids = [crypto.createHash('sha256').update(coinbaseTxSerialized).digest('hex'), ...validTransactions.map(tx => crypto.createHash('sha256').update(JSON.stringify(tx)).digest('hex'))];

// Write the output to output.txt
const outputFilePath = path.join(__dirname, 'output.txt');
fs.writeFileSync(outputFilePath, `${blockHeader}\n${coinbaseTxSerialized}\n${txids.join('\n')}`);
console.log(`Block mined and output written to ${outputFilePath}`);
