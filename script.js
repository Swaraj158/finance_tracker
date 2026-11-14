// Finance Tracker App

// Maps stored category values to display labels. The stored value is kept
// stable so existing user data keeps matching the dropdown and filters;
// only the displayed text changes here.
const CATEGORY_LABELS = {
    food: 'Food Order',
    grocery: 'Grocery',
    shopping: 'Shopping',
    restaurant: 'Restaurant',
    travel: 'Travel',
    others: 'Others'
};

// Returns the display label for a stored category value. Unknown or empty
// values fall back gracefully so old/custom data still renders.
function categoryLabel(value) {
    if (!value) return 'Others';
    return CATEGORY_LABELS[value] || (value.charAt(0).toUpperCase() + value.slice(1));
}

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
        this.setupTheme();
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
        const paymentModeSelect = document.getElementById('payment-mode');

        // Show the payment-method details that match the selected mode.
        paymentModeSelect.addEventListener('change', (e) => {
            this.updatePaymentDetails(e.target.value);
        });

        // Reveal the "Other" free-text box only when "Other" is chosen (Card).
        document.querySelectorAll('input[name="cardOption"]').forEach(radio => {
            radio.addEventListener('change', () => this.toggleOtherText('card', radio.value === '__other__'));
        });

        // Reveal the "Other" free-text box only when "Other" is chosen (UPI).
        document.querySelectorAll('input[name="upiOption"]').forEach(radio => {
            radio.addEventListener('change', () => this.toggleOtherText('upi', radio.value === '__other__'));
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit(e);
        });
    }

    // Show the payment-method details UI for the chosen mode. Card and UPI
    // reveal predefined radio options; the "Other" payment mode keeps a
    // free-text box; Cash shows nothing. This only drives the input UI — the
    // stored paymentComment field is unchanged.
    updatePaymentDetails(paymentMode) {
        const group = document.getElementById('payment-comment-group');
        if (!group) return;

        ['card-options', 'upi-options', 'other-options'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        if (paymentMode === 'card') {
            group.style.display = 'block';
            const card = document.getElementById('card-options');
            if (card) card.style.display = 'grid';
        } else if (paymentMode === 'upi') {
            group.style.display = 'block';
            const upi = document.getElementById('upi-options');
            if (upi) upi.style.display = 'grid';
        } else if (paymentMode === 'other') {
            group.style.display = 'block';
            const other = document.getElementById('other-options');
            if (other) other.style.display = 'block';
        } else {
            group.style.display = 'none';
        }
    }

    // Show or hide the "Other" free-text input for the Card / UPI radio group.
    toggleOtherText(mode, isOther) {
        const textInput = document.getElementById(`${mode}-other-text`);
        if (!textInput) return;
        if (isOther) {
            textInput.style.display = 'block';
        } else {
            textInput.style.display = 'none';
            textInput.value = '';
        }
    }

    // Resolve the value to store in paymentComment for the active mode.
    getPaymentComment(paymentMode) {
        if (paymentMode === 'card' || paymentMode === 'upi') {
            const groupName = paymentMode === 'card' ? 'cardOption' : 'upiOption';
            const selected = document.querySelector(`input[name="${groupName}"]:checked`);
            if (!selected) return '';
            if (selected.value === '__other__') {
                const textEl = document.getElementById(`${paymentMode}-other-text`);
                return textEl ? textEl.value.trim() : '';
            }
            return selected.value;
        }
        if (paymentMode === 'other') {
            const textEl = document.getElementById('other-payment-text');
            return textEl ? textEl.value.trim() : '';
        }
        return ''; // cash or none selected
    }

    // Clear and hide the payment-method details UI (used after form reset).
    resetPaymentDetails() {
        this.updatePaymentDetails('');
        ['card', 'upi'].forEach(mode => {
            const el = document.getElementById(`${mode}-other-text`);
            if (el) {
                el.style.display = 'none';
                el.value = '';
            }
        });
    }

    // Apply the saved theme preference and wire up the toggle button. The
    // theme lives in its own localStorage key, so expense data is never
    // touched. The inline <head> script applies the theme before paint; this
    // keeps the button label in sync and handles toggling.
    setupTheme() {
        const toggle = document.getElementById('theme-toggle');
        if (!toggle) return;
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        toggle.textContent = current === 'dark' ? '☀️' : '🌙';
        toggle.setAttribute('aria-label', current === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        toggle.addEventListener('click', () => this.toggleTheme());
    }

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try {
            localStorage.setItem('financeTracker_theme', next);
        } catch (error) {
            // Ignore storage errors; the theme still applies for the session.
        }
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            toggle.textContent = next === 'dark' ? '☀️' : '🌙';
            toggle.setAttribute('aria-label', next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        }
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', next === 'dark' ? '#1b1e25' : '#e74c3c');
    }

    setTodayDate() {
        const dateInput = document.getElementById('date');
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    handleFormSubmit(e) {
        const formData = new FormData(e.target);
        const paymentMode = formData.get('paymentMode') || 'cash';
        const expense = {
            id: Date.now().toString(),
            amount: parseFloat(formData.get('amount')),
            paymentMode: paymentMode,
            paymentComment: this.getPaymentComment(paymentMode),
            category: formData.get('category') || 'others',
            date: formData.get('date') || new Date().toISOString().split('T')[0],
            remarks: formData.get('remarks') || '',
            timestamp: new Date().toISOString()
        };

        // Only validate amount (required field)
        if (!expense.amount || expense.amount <= 0) {
            this.showNotification('Please enter a valid amount', 'error');
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
        this.resetPaymentDetails();

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
            const paymentDisplay = expense.paymentComment && expense.paymentMode !== 'cash' ? 
                `${expense.paymentMode} (${expense.paymentComment})` : expense.paymentMode;
            const remarksHTML = expense.remarks ?
                `<div class="transaction-remarks">${expense.remarks}</div>` : '';

            return `
                <div class="transaction-item">
                    <div class="transaction-left">
                        <div class="transaction-category">${categoryLabel(expense.category)}</div>
                        <div class="transaction-details">
                            <span class="payment-mode-badge ${paymentClass}">${paymentDisplay}</span>
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
