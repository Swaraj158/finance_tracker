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