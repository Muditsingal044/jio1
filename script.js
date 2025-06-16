// Banking System JavaScript

// Data Storage - Using localStorage for persistence
class BankStorage {
    static getAccounts() {
        const accounts = localStorage.getItem('bankAccounts');
        return accounts ? JSON.parse(accounts) : [];
    }

    static saveAccounts(accounts) {
        localStorage.setItem('bankAccounts', JSON.stringify(accounts));
    }

    static getTransactions() {
        const transactions = localStorage.getItem('bankTransactions');
        return transactions ? JSON.parse(transactions) : [];
    }

    static saveTransactions(transactions) {
        localStorage.setItem('bankTransactions', JSON.stringify(transactions));
    }

    static getNextAccountNumber() {
        const lastNumber = localStorage.getItem('lastAccountNumber');
        const nextNumber = lastNumber ? parseInt(lastNumber) + 1 : 1000;
        localStorage.setItem('lastAccountNumber', nextNumber.toString());
        return nextNumber;
    }
}

// Account Management
class AccountManager {
    static createAccount(holderName, accountType, initialDeposit) {
        const accounts = BankStorage.getAccounts();
        const accountNumber = BankStorage.getNextAccountNumber().toString();
        
        const newAccount = {
            accountNumber,
            holderName,
            accountType,
            balance: parseFloat(initialDeposit),
            dateCreated: new Date().toISOString(),
            status: 'Active'
        };
        
        accounts.push(newAccount);
        BankStorage.saveAccounts(accounts);
        
        // Record initial deposit transaction
        if (parseFloat(initialDeposit) > 0) {
            TransactionManager.addTransaction(accountNumber, 'Deposit', parseFloat(initialDeposit), parseFloat(initialDeposit));
        }
        
        return newAccount;
    }
    
    static getAccountByNumber(accountNumber) {
        const accounts = BankStorage.getAccounts();
        return accounts.find(account => account.accountNumber === accountNumber);
    }
    
    static getAllAccounts() {
        return BankStorage.getAccounts();
    }
    
    static updateAccount(accountNumber, updatedData) {
        const accounts = BankStorage.getAccounts();
        const index = accounts.findIndex(account => account.accountNumber === accountNumber);
        
        if (index !== -1) {
            accounts[index] = { ...accounts[index], ...updatedData };
            BankStorage.saveAccounts(accounts);
            return accounts[index];
        }
        
        return null;
    }
    
    static deposit(accountNumber, amount) {
        const account = this.getAccountByNumber(accountNumber);
        
        if (!account || account.status !== 'Active') {
            return { success: false, message: 'Account not found or inactive' };
        }
        
        const newBalance = account.balance + parseFloat(amount);
        this.updateAccount(accountNumber, { balance: newBalance });
        
        // Record transaction
        TransactionManager.addTransaction(accountNumber, 'Deposit', parseFloat(amount), newBalance);
        
        return { success: true, newBalance, message: `Successfully deposited $${amount}` };
    }
    
    static withdraw(accountNumber, amount) {
        const account = this.getAccountByNumber(accountNumber);
        
        if (!account || account.status !== 'Active') {
            return { success: false, message: 'Account not found or inactive' };
        }
        
        if (account.balance < parseFloat(amount)) {
            return { success: false, message: 'Insufficient funds' };
        }
        
        const newBalance = account.balance - parseFloat(amount);
        this.updateAccount(accountNumber, { balance: newBalance });
        
        // Record transaction
        TransactionManager.addTransaction(accountNumber, 'Withdrawal', parseFloat(amount), newBalance);
        
        return { success: true, newBalance, message: `Successfully withdrew $${amount}` };
    }
    
    static closeAccount(accountNumber) {
        const account = this.getAccountByNumber(accountNumber);
        
        if (!account || account.status !== 'Active') {
            return { success: false, message: 'Account not found or already closed' };
        }
        
        // If there's a balance, record a withdrawal transaction
        if (account.balance > 0) {
            TransactionManager.addTransaction(accountNumber, 'Withdrawal', account.balance, 0);
        }
        
        this.updateAccount(accountNumber, { status: 'Closed', balance: 0, dateClosed: new Date().toISOString() });
        
        return { success: true, message: 'Account closed successfully' };
    }
}

// Transaction Management
class TransactionManager {
    static addTransaction(accountNumber, type, amount, balanceAfter) {
        const transactions = BankStorage.getTransactions();
        
        const newTransaction = {
            id: Date.now().toString(),
            accountNumber,
            type,
            amount,
            balanceAfter,
            date: new Date().toISOString()
        };
        
        transactions.push(newTransaction);
        BankStorage.saveTransactions(transactions);
        
        return newTransaction;
    }
    
    static getTransactionsByAccount(accountNumber) {
        const transactions = BankStorage.getTransactions();
        return transactions.filter(transaction => transaction.accountNumber === accountNumber);
    }
}

// UI Controller
class UIController {
    static init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.refreshAccountsList();
    }
    
    static setupEventListeners() {
        // Dashboard navigation
        document.getElementById('view-accounts').addEventListener('click', () => {
            this.showSection('accounts-section');
            this.showSubsection('list-accounts-subsection');
            this.refreshAccountsList();
        });
        
        document.getElementById('open-account').addEventListener('click', () => {
            this.showSection('accounts-section');
            this.showSubsection('open-account-subsection');
        });
        
        document.getElementById('search-account').addEventListener('click', () => {
            this.showSection('accounts-section');
            this.showSubsection('search-account-subsection');
        });
        
        document.getElementById('manage-account').addEventListener('click', () => {
            this.showSection('accounts-section');
            this.showSubsection('search-account-subsection');
        });
        
        // Main navigation
        document.getElementById('home-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection('home-section');
            this.updateNavActive('home-link');
        });
        
        document.getElementById('accounts-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection('accounts-section');
            this.showSubsection('list-accounts-subsection');
            this.updateNavActive('accounts-link');
            this.refreshAccountsList();
        });
        
        document.getElementById('transactions-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection('transactions-section');
            this.updateNavActive('transactions-link');
        });
        
        // Form submissions
        document.getElementById('open-account-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleOpenAccount();
        });
        
        document.getElementById('search-account-btn').addEventListener('click', () => {
            this.handleSearchAccount();
        });
        
        document.getElementById('deposit-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleDeposit();
        });
        
        document.getElementById('withdraw-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleWithdraw();
        });
        
        // Account action buttons
        document.getElementById('deposit-btn').addEventListener('click', () => {
            const accountNumber = document.querySelector('#account-details [data-account-number]').getAttribute('data-account-number');
            this.showDepositForm(accountNumber);
        });
        
        document.getElementById('withdraw-btn').addEventListener('click', () => {
            const accountNumber = document.querySelector('#account-details [data-account-number]').getAttribute('data-account-number');
            this.showWithdrawForm(accountNumber);
        });
        
        document.getElementById('view-transactions-btn').addEventListener('click', () => {
            const accountNumber = document.querySelector('#account-details [data-account-number]').getAttribute('data-account-number');
            this.showTransactionHistory(accountNumber);
        });
        
        document.getElementById('close-account-btn').addEventListener('click', () => {
            const accountNumber = document.querySelector('#account-details [data-account-number]').getAttribute('data-account-number');
            this.showCloseAccountConfirmation(accountNumber);
        });
        
        // Close account confirmation
        document.getElementById('confirm-close-btn').addEventListener('click', () => {
            const accountNumber = document.getElementById('close-account-number').textContent;
            this.handleCloseAccount(accountNumber);
        });
        
        document.getElementById('cancel-close-btn').addEventListener('click', () => {
            this.showSection('accounts-section');
            this.showSubsection('account-details-subsection');
        });
        
        // Modal
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.closeModal();
        });
        
        document.getElementById('modal-ok-btn').addEventListener('click', () => {
            this.closeModal();
        });
    }
    
    static setupNavigation() {
        // Show home section by default
        this.showSection('home-section');
        this.updateNavActive('home-link');
    }
    
    static showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show the selected section
        document.getElementById(sectionId).classList.add('active');
    }
    
    static showSubsection(subsectionId) {
        // Hide all subsections
        document.querySelectorAll('.subsection').forEach(subsection => {
            subsection.classList.remove('active');
        });
        
        // Show the selected subsection
        document.getElementById(subsectionId).classList.add('active');
    }
    
    static updateNavActive(linkId) {
        // Remove active class from all nav links
        document.querySelectorAll('nav a').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to the selected link
        document.getElementById(linkId).classList.add('active');
    }
    
    static refreshAccountsList() {
        const accounts = AccountManager.getAllAccounts();
        const accountsList = document.getElementById('accounts-list');
        const noAccountsMessage = document.getElementById('no-accounts-message');
        
        // Clear the current list
        accountsList.innerHTML = '';
        
        if (accounts.length === 0) {
            accountsList.style.display = 'none';
            noAccountsMessage.style.display = 'block';
            return;
        }
        
        accountsList.style.display = 'table-row-group';
        noAccountsMessage.style.display = 'none';
        
        // Add each account to the list
        accounts.forEach(account => {
            if (account.status === 'Active') {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${account.accountNumber}</td>
                    <td>${account.holderName}</td>
                    <td>${account.accountType}</td>
                    <td>$${account.balance.toFixed(2)}</td>
                    <td>
                        <button class="btn view-account-btn" data-account="${account.accountNumber}">View</button>
                    </td>
                `;
                accountsList.appendChild(row);
            }
        });
        
        // Add event listeners to the view buttons
        document.querySelectorAll('.view-account-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const accountNumber = e.target.getAttribute('data-account');
                this.showAccountDetails(accountNumber);
            });
        });
    }
    
    static handleOpenAccount() {
        const holderName = document.getElementById('account-holder').value;
        const accountType = document.getElementById('account-type').value;
        const initialDeposit = document.getElementById('initial-deposit').value;
        
        if (!holderName || !accountType || !initialDeposit) {
            this.showModal('Please fill in all fields.');
            return;
        }
        
        const newAccount = AccountManager.createAccount(holderName, accountType, initialDeposit);
        
        // Reset the form
        document.getElementById('open-account-form').reset();
        
        // Show success message
        this.showModal(`Account created successfully! Account Number: ${newAccount.accountNumber}`);
        
        // Refresh the accounts list
        this.refreshAccountsList();
        
        // Show the accounts list
        this.showSubsection('list-accounts-subsection');
    }
    
    static handleSearchAccount() {
        const searchInput = document.getElementById('search-account-input').value;
        const searchResults = document.getElementById('search-results');
        
        if (!searchInput) {
            this.showModal('Please enter an account number.');
            return;
        }
        
        const account = AccountManager.getAccountByNumber(searchInput);
        
        if (!account || account.status !== 'Active') {
            searchResults.innerHTML = '<p class="error-message">No active account found with that number.</p>';
            return;
        }
        
        // Show account details
        this.showAccountDetails(account.accountNumber);
    }
    
    static showAccountDetails(accountNumber) {
        const account = AccountManager.getAccountByNumber(accountNumber);
        
        if (!account || account.status !== 'Active') {
            this.showModal('Account not found or inactive.');
            return;
        }
        
        const accountDetails = document.getElementById('account-details');
        accountDetails.innerHTML = `
            <div data-account-number="${account.accountNumber}">
                <p><strong>Account Number:</strong> ${account.accountNumber}</p>
                <p><strong>Account Holder:</strong> ${account.holderName}</p>
                <p><strong>Account Type:</strong> ${account.accountType}</p>
                <p><strong>Current Balance:</strong> $${account.balance.toFixed(2)}</p>
                <p><strong>Date Created:</strong> ${new Date(account.dateCreated).toLocaleDateString()}</p>
            </div>
        `;
        
        this.showSection('accounts-section');
        this.showSubsection('account-details-subsection');
    }
    
    static showDepositForm(accountNumber) {
        const account = AccountManager.getAccountByNumber(accountNumber);
        
        if (!account || account.status !== 'Active') {
            this.showModal('Account not found or inactive.');
            return;
        }
        
        document.getElementById('deposit-account').value = accountNumber;
        document.getElementById('deposit-amount').value = '';
        
        this.showSection('transactions-section');
        this.showSubsection('deposit-subsection');
    }
    
    static handleDeposit() {
        const accountNumber = document.getElementById('deposit-account').value;
        const amount = document.getElementById('deposit-amount').value;
        
        if (!amount || parseFloat(amount) <= 0) {
            this.showModal('Please enter a valid amount greater than zero.');
            return;
        }
        
        const result = AccountManager.deposit(accountNumber, amount);
        
        if (result.success) {
            this.showModal(`Deposit successful. New balance: $${result.newBalance.toFixed(2)}`);
            document.getElementById('deposit-form').reset();
            this.showAccountDetails(accountNumber);
        } else {
            this.showModal(result.message);
        }
    }
    
    static showWithdrawForm(accountNumber) {
        const account = AccountManager.getAccountByNumber(accountNumber);
        
        if (!account || account.status !== 'Active') {
            this.showModal('Account not found or inactive.');
            return;
        }
        
        document.getElementById('withdraw-account').value = accountNumber;
        document.getElementById('withdraw-amount').value = '';
        
        this.showSection('transactions-section');
        this.showSubsection('withdraw-subsection');
    }
    
    static handleWithdraw() {
        const accountNumber = document.getElementById('withdraw-account').value;
        const amount = document.getElementById('withdraw-amount').value;
        
        if (!amount || parseFloat(amount) <= 0) {
            this.showModal('Please enter a valid amount greater than zero.');
            return;
        }
        
        const result = AccountManager.withdraw(accountNumber, amount);
        
        if (result.success) {
            this.showModal(`Withdrawal successful. New balance: $${result.newBalance.toFixed(2)}`);
            document.getElementById('withdraw-form').reset();
            this.showAccountDetails(accountNumber);
        } else {
            this.showModal(result.message);
        }
    }
    
    static showTransactionHistory(accountNumber) {
        const account = AccountManager.getAccountByNumber(accountNumber);
        
        if (!account) {
            this.showModal('Account not found.');
            return;
        }
        
        const transactions = TransactionManager.getTransactionsByAccount(accountNumber);
        const transactionsList = document.getElementById('transactions-list');
        const noTransactionsMessage = document.getElementById('no-transactions-message');
        
        // Set account info
        document.getElementById('transaction-account-number').textContent = account.accountNumber;
        document.getElementById('transaction-account-holder').textContent = account.holderName;
        
        // Clear the current list
        transactionsList.innerHTML = '';
        
        if (transactions.length === 0) {
            transactionsList.style.display = 'none';
            noTransactionsMessage.style.display = 'block';
        } else {
            transactionsList.style.display = 'table-row-group';
            noTransactionsMessage.style.display = 'none';
            
            // Sort transactions by date (newest first)
            transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Add each transaction to the list
            transactions.forEach(transaction => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${new Date(transaction.date).toLocaleString()}</td>
                    <td>${transaction.type}</td>
                    <td>$${transaction.amount.toFixed(2)}</td>
                    <td>$${transaction.balanceAfter.toFixed(2)}</td>
                `;
                transactionsList.appendChild(row);
            });
        }
        
        this.showSection('transactions-section');
        this.showSubsection('view-transactions-subsection');
    }
    
    static showCloseAccountConfirmation(accountNumber) {
        const account = AccountManager.getAccountByNumber(accountNumber);
        
        if (!account || account.status !== 'Active') {
            this.showModal('Account not found or already closed.');
            return;
        }
        
        document.getElementById('close-account-number').textContent = account.accountNumber;
        document.getElementById('close-account-holder').textContent = account.holderName;
        document.getElementById('close-account-balance').textContent = `$${account.balance.toFixed(2)}`;
        
        this.showSection('transactions-section');
        this.showSubsection('close-account-subsection');
    }
    
    static handleCloseAccount(accountNumber) {
        const result = AccountManager.closeAccount(accountNumber);
        
        if (result.success) {
            this.showModal('Account closed successfully.');
            this.showSection('accounts-section');
            this.showSubsection('list-accounts-subsection');
            this.refreshAccountsList();
        } else {
            this.showModal(result.message);
        }
    }
    
    static showModal(message) {
        document.getElementById('modal-message').textContent = message;
        document.getElementById('modal').style.display = 'block';
    }
    
    static closeModal() {
        document.getElementById('modal').style.display = 'none';
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    UIController.init();
});