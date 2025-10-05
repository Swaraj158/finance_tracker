// Finance Tracker App
class FinanceTracker {
    constructor() {
        this.expenses = this.loadExpenses();
        this.initializeApp();
    }

    initializeApp() {
        this.setupNavigation();
        this.setupForm();
        this.setTodayDate();
        this.setupTransactionFilters();
        this.renderTransactions();
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        const pages = document.querySelectorAll('.page');

        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetPage = button.dataset.page;

                // Update active nav button
                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Show target page
                pages.forEach(page => page.classList.remove('active'));
                document.getElementById(`${targetPage}-page`).classList.add('active');

                // Refresh transactions when switching to list page
                if (targetPage === 'list') {
                    this.renderTransactions();
                }
            });
        });
    }

    setupForm() {
        const form = document.getElementById('expense-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit(e);
        });
    }

    setTodayDate() {
        const dateInput = document.getElementById('date');
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    handleFormSubmit(e) {
        const formData = new FormData(e.target);
        const expense = {
            id: Date.now().toString(),
            amount: parseFloat(formData.get('amount')),
            paymentMode: formData.get('paymentMode'),
            category: formData.get('category'),
            date: formData.get('date'),
            remarks: formData.get('remarks') || '',
            timestamp: new Date().toISOString()
        };

        // Validate required fields
        if (!expense.amount || !expense.paymentMode || !expense.category || !expense.date) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        // Add expense to storage
        this.expenses.push(expense);
        this.saveExpenses();

        // Show success message
        this.showNotification('Expense added successfully!', 'success');

        // Reset form
        e.target.reset();
        this.setTodayDate();

        console.log('Expense added:', expense);
        console.log('Total expenses:', this.expenses.length);
    }

    loadExpenses() {
        try {
            const stored = localStorage.getItem('financeTracker_expenses');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading expenses:', error);
            return [];
        }
    }

    saveExpenses() {
        try {
            localStorage.setItem('financeTracker_expenses', JSON.stringify(this.expenses));
        } catch (error) {
            console.error('Error saving expenses:', error);
            this.showNotification('Error saving data', 'error');
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Method to get all expenses (for future use)
    getAllExpenses() {
        return this.expenses;
    }

    // Method to get expenses by date range (for future use)
    getExpensesByDateRange(startDate, endDate) {
        return this.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate);
        });
    }

    // Method to get total spending (for future use)
    getTotalSpending(expenses = this.expenses) {
        return expenses.reduce((total, expense) => total + expense.amount, 0);
    }

    setupTransactionFilters() {
        const filterPayment = document.getElementById('filter-payment');
        const filterCategory = document.getElementById('filter-category');
        const filterDateFrom = document.getElementById('filter-date-from');
        const filterDateTo = document.getElementById('filter-date-to');
        const clearFiltersBtn = document.getElementById('clear-filters');

        // Add event listeners for filters
        [filterPayment, filterCategory, filterDateFrom, filterDateTo].forEach(filter => {
            filter.addEventListener('change', () => this.renderTransactions());
        });

        clearFiltersBtn.addEventListener('click', () => {
            filterPayment.value = '';
            filterCategory.value = '';
            filterDateFrom.value = '';
            filterDateTo.value = '';
            this.renderTransactions();
        });
    }

    renderTransactions() {
        const filteredExpenses = this.getFilteredExpenses();
        this.updateSummary(filteredExpenses);
        this.displayTransactions(filteredExpenses);
    }

    getFilteredExpenses() {
        const filterPayment = document.getElementById('filter-payment')?.value || '';
        const filterCategory = document.getElementById('filter-category')?.value || '';
        const filterDateFrom = document.getElementById('filter-date-from')?.value || '';
        const filterDateTo = document.getElementById('filter-date-to')?.value || '';

        return this.expenses.filter(expense => {
            // Payment mode filter
            if (filterPayment && expense.paymentMode !== filterPayment) return false;

            // Category filter
            if (filterCategory && expense.category !== filterCategory) return false;

            // Date range filter
            const expenseDate = new Date(expense.date);
            if (filterDateFrom && expenseDate < new Date(filterDateFrom)) return false;
            if (filterDateTo && expenseDate > new Date(filterDateTo)) return false;

            return true;
        }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date, newest first
    }

    updateSummary(expenses) {
        const totalSpentEl = document.getElementById('total-spent');
        const monthSpentEl = document.getElementById('month-spent');

        if (!totalSpentEl || !monthSpentEl) return;

        // Calculate totals
        const totalSpent = this.getTotalSpending(expenses);

        // Calculate this month's spending
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
        });
        const monthSpent = this.getTotalSpending(monthExpenses);

        // Update display
        totalSpentEl.textContent = `₹${totalSpent.toFixed(2)}`;
        monthSpentEl.textContent = `₹${monthSpent.toFixed(2)}`;
    }

    displayTransactions(expenses) {
        const transactionsList = document.getElementById('transactions-list');
        const noTransactions = document.getElementById('no-transactions');

        if (!transactionsList) return;

        if (expenses.length === 0) {
            transactionsList.innerHTML = `
                <div class="no-transactions">
                    <p>No transactions found</p>
                    <button class="nav-btn" onclick="showAddPage()">Add Your First Expense</button>
                </div>
            `;
            return;
        }

        const transactionsHTML = expenses.map(expense => {
            const date = new Date(expense.date).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });

            const paymentClass = `payment-${expense.paymentMode}`;
            const remarksHTML = expense.remarks ?
                `<div class="transaction-remarks">${expense.remarks}</div>` : '';

            return `
                <div class="transaction-item">
                    <div class="transaction-left">
                        <div class="transaction-category">${expense.category}</div>
                        <div class="transaction-details">
                            <span class="payment-mode-badge ${paymentClass}">${expense.paymentMode}</span>
                        </div>
                        <div class="transaction-date">${date}</div>
                        ${remarksHTML}
                    </div>
                    <div class="transaction-right">
                        <div class="transaction-amount">₹${expense.amount.toFixed(2)}</div>
                    </div>
                </div>
            `;
        }).join('');

        transactionsList.innerHTML = transactionsHTML;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.financeTracker = new FinanceTracker();
});

// Add some helper functions for future development
window.getStoredExpenses = () => {
    return window.financeTracker ? window.financeTracker.getAllExpenses() : [];
};

window.clearAllData = () => {
    if (confirm('Are you sure you want to clear all expense data? This cannot be undone.')) {
        localStorage.removeItem('financeTracker_expenses');
        location.reload();
    }
};

// Helper function for navigation
window.showAddPage = () => {
    const navButtons = document.querySelectorAll('.nav-btn');
    const pages = document.querySelectorAll('.page');

    // Update active nav button
    navButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-page="add"]').classList.add('active');

    // Show add page
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById('add-page').classList.add('active');
};
