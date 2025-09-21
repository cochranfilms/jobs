#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const CONTRACTS_DIR = './contracts';
const UPLOADED_CONTRACTS_FILE = './uploaded-contracts.json';

console.log('🗑️  Bulk Contract Deletion Tool');
console.log('===============================\n');

// Function to get all PDF files in contracts directory
function getContractPDFs() {
    try {
        const files = fs.readdirSync(CONTRACTS_DIR);
        return files.filter(file => file.endsWith('.pdf'));
    } catch (error) {
        console.error('❌ Error reading contracts directory:', error.message);
        return [];
    }
}

// Function to load uploaded contracts JSON
function loadUploadedContracts() {
    try {
        const data = fs.readFileSync(UPLOADED_CONTRACTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ Error loading uploaded-contracts.json:', error.message);
        return { uploadedContracts: [] };
    }
}

// Function to save uploaded contracts JSON
function saveUploadedContracts(data) {
    try {
        fs.writeFileSync(UPLOADED_CONTRACTS_FILE, JSON.stringify(data, null, 2));
        console.log('✅ uploaded-contracts.json updated successfully');
    } catch (error) {
        console.error('❌ Error saving uploaded-contracts.json:', error.message);
    }
}

// Function to extract contract ID from filename
function extractContractId(filename) {
    // Remove .pdf extension
    const nameWithoutExt = filename.replace('.pdf', '');
    
    // Handle different naming patterns
    if (nameWithoutExt.startsWith('CF-')) {
        return nameWithoutExt;
    } else {
        // For files like "Francisco-Flores.pdf", we'll need to match by name
        return nameWithoutExt;
    }
}

// Function to delete contract PDF
function deleteContractPDF(filename) {
    const filePath = path.join(CONTRACTS_DIR, filename);
    try {
        fs.unlinkSync(filePath);
        console.log(`✅ Deleted: ${filename}`);
        return true;
    } catch (error) {
        console.error(`❌ Error deleting ${filename}:`, error.message);
        return false;
    }
}

// Main function
async function main() {
    console.log('📁 Scanning contracts directory...');
    const pdfFiles = getContractPDFs();
    
    if (pdfFiles.length === 0) {
        console.log('📋 No PDF files found in contracts directory');
        return;
    }
    
    console.log(`📋 Found ${pdfFiles.length} contract PDF(s):`);
    pdfFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file}`);
    });
    
    console.log('\n📄 Loading uploaded-contracts.json...');
    const uploadedContractsData = loadUploadedContracts();
    const uploadedContracts = uploadedContractsData.uploadedContracts || [];
    
    console.log(`📋 Found ${uploadedContracts.length} contract(s) in JSON file`);
    
    // Create a map of contract IDs to contract data
    const contractMap = new Map();
    uploadedContracts.forEach(contract => {
        if (contract.contractId) {
            contractMap.set(contract.contractId, contract);
        }
        if (contract.freelancerName) {
            contractMap.set(contract.freelancerName, contract);
        }
    });
    
    console.log('\n🔍 Analyzing files for deletion...');
    
    const filesToDelete = [];
    const contractsToRemove = [];
    
    pdfFiles.forEach(filename => {
        const contractId = extractContractId(filename);
        const contract = contractMap.get(contractId);
        
        if (contract) {
            filesToDelete.push(filename);
            contractsToRemove.push(contract);
            console.log(`✅ Match found: ${filename} -> ${contract.freelancerName} (${contract.contractId})`);
        } else {
            console.log(`⚠️  No match found for: ${filename}`);
        }
    });
    
    if (filesToDelete.length === 0) {
        console.log('\n📋 No matching contracts found for deletion');
        return;
    }
    
    console.log(`\n🗑️  Ready to delete ${filesToDelete.length} contract(s):`);
    filesToDelete.forEach((filename, index) => {
        const contract = contractsToRemove[index];
        console.log(`  ${index + 1}. ${filename} (${contract.freelancerName})`);
    });
    
    // Ask for confirmation
    console.log('\n⚠️  This will:');
    console.log('  1. Delete the PDF files from the contracts directory');
    console.log('  2. Remove the contract entries from uploaded-contracts.json');
    console.log('  3. You will need to commit and push these changes');
    
    console.log('\n📝 To proceed, run:');
    console.log('   node bulk-delete-contracts.js --confirm');
    console.log('\n📝 To see what would be deleted without actually deleting:');
    console.log('   node bulk-delete-contracts.js --dry-run');
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--dry-run')) {
    console.log('🔍 DRY RUN MODE - No files will be deleted\n');
    main();
} else if (args.includes('--confirm')) {
    console.log('🗑️  CONFIRMED - Proceeding with deletion\n');
    
    // Run the analysis first
    const pdfFiles = getContractPDFs();
    const uploadedContractsData = loadUploadedContracts();
    const uploadedContracts = uploadedContractsData.uploadedContracts || [];
    
    // Create a map of contract IDs to contract data
    const contractMap = new Map();
    uploadedContracts.forEach(contract => {
        if (contract.contractId) {
            contractMap.set(contract.contractId, contract);
        }
        if (contract.freelancerName) {
            contractMap.set(contract.freelancerName, contract);
        }
    });
    
    const filesToDelete = [];
    const contractsToRemove = [];
    
    pdfFiles.forEach(filename => {
        const contractId = extractContractId(filename);
        const contract = contractMap.get(contractId);
        
        if (contract) {
            filesToDelete.push(filename);
            contractsToRemove.push(contract);
        }
    });
    
    if (filesToDelete.length === 0) {
        console.log('📋 No matching contracts found for deletion');
        return;
    }
    
    console.log(`🗑️  Deleting ${filesToDelete.length} contract(s)...\n`);
    
    // Delete PDF files
    let deletedFiles = 0;
    filesToDelete.forEach(filename => {
        if (deleteContractPDF(filename)) {
            deletedFiles++;
        }
    });
    
    // Remove from JSON file
    const updatedContracts = uploadedContracts.filter(contract => {
        return !contractsToRemove.some(removedContract => 
            removedContract.contractId === contract.contractId
        );
    });
    
    // Update the JSON file
    uploadedContractsData.uploadedContracts = updatedContracts;
    uploadedContractsData.totalContracts = updatedContracts.length;
    uploadedContractsData.lastUpdated = new Date().toISOString();
    
    saveUploadedContracts(uploadedContractsData);
    
    console.log(`\n✅ Deletion completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Files deleted: ${deletedFiles}/${filesToDelete.length}`);
    console.log(`   - Contracts removed from JSON: ${contractsToRemove.length}`);
    console.log(`   - Remaining contracts: ${updatedContracts.length}`);
    
    console.log('\n📝 Next steps:');
    console.log('  1. Review the changes');
    console.log('  2. git add .');
    console.log('  3. git commit -m "Bulk delete contracts"');
    console.log('  4. git push origin main');
    
} else {
    main();
} 