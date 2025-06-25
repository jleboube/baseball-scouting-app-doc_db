class ScoutingApp {
    constructor() {
        this.currentReportId = null;
        this.reports = [];
        this.currentUser = null;
        this.init();
    }

    init() {
        this.bindAuthEvents();
        this.checkAuthentication();
    }

    bindAuthEvents() {
        // Authentication form switches
        document.getElementById('showRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });
        
        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });
        
        // Form submissions
        document.getElementById('loginFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        document.getElementById('registerFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
        
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });
        
        // Load groups for registration
        this.loadGroups();
    }

    bindAppEvents() {
        // Navigation
        document.getElementById('newReportBtn').addEventListener('click', () => this.showNewReportForm());
        document.getElementById('backBtn').addEventListener('click', () => this.showReportsView());
        
        // Form actions
        document.getElementById('saveBtn').addEventListener('click', () => this.saveReport());
        document.getElementById('deleteBtn').addEventListener('click', () => this.deleteReport());
        
        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => this.filterReports(e.target.value));
        
        // Form validation
        document.getElementById('scoutingForm').addEventListener('input', () => this.validateForm());
        
        // Auto-calculate age when date of birth changes
        document.getElementById('date_of_birth').addEventListener('change', () => this.calculateAge());
        
        // Auto-save draft every 30 seconds
        setInterval(() => this.saveDraft(), 30000);
        
        // Handle checkbox groups for recommended focus
        this.handleCheckboxGroup();
        
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('scout_date').value = today;
    }

    async checkAuthentication() {
        try {
            const response = await fetch('/api/auth/me', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.showMainApp();
            } else {
                this.showAuthView();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.showAuthView();
        }
    }

    async loadGroups() {
        try {
            const response = await fetch('/api/groups');
            if (response.ok) {
                const groups = await response.json();
                const groupSelect = document.getElementById('registerGroup');
                groupSelect.innerHTML = '<option value="">Select your team...</option>';
                
                groups.forEach(group => {
                    const option = document.createElement('option');
                    option.value = group.id;
                    option.textContent = group.name;
                    groupSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Failed to load groups:', error);
        }
    }

    showAuthView() {
        document.getElementById('authView').classList.add('active');
        document.getElementById('mainApp').classList.remove('active');
    }

    showMainApp() {
        document.getElementById('authView').classList.remove('active');
        document.getElementById('mainApp').classList.add('active');
        
        // Update UI with user info
        this.updateUserInfo();
        
        // Bind main app events
        this.bindAppEvents();
        
        // Load reports and show main view
        this.loadReports();
        this.showReportsView();
    }

    updateUserInfo() {
        if (this.currentUser) {
            const userInfoText = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
            document.getElementById('userInfo').textContent = userInfoText;
            
            if (this.currentUser.groupName) {
                document.getElementById('teamName').textContent = this.currentUser.groupName;
            }
        }
    }

    showLoginForm() {
        document.getElementById('loginForm').classList.add('active');
        document.getElementById('registerForm').classList.remove('active');
    }

    showRegisterForm() {
        document.getElementById('registerForm').classList.add('active');
        document.getElementById('loginForm').classList.remove('active');
    }

    async handleLogin() {
        const form = document.getElementById('loginFormElement');
        const formData = new FormData(form);
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    email: formData.get('email'),
                    password: formData.get('password')
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.currentUser = data.user;
                this.showMainApp();
                this.showSuccess('Login successful!');
            } else {
                this.showError(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Login failed. Please try again.');
        }
    }

    async handleRegister() {
        const form = document.getElementById('registerFormElement');
        const formData = new FormData(form);
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    firstName: formData.get('firstName'),
                    lastName: formData.get('lastName'),
                    email: formData.get('email'),
                    password: formData.get('password'),
                    groupId: formData.get('groupId'),
                    registrationCode: formData.get('registrationCode')
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showSuccess('Registration successful! You can now login.');
                this.showLoginForm();
                form.reset();
            } else {
                this.showError(data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('Registration failed. Please try again.');
        }
    }

    async handleLogout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            
            this.currentUser = null;
            this.showAuthView();
            this.showLoginForm();
            
            // Clear any cached data
            this.reports = [];
            this.currentReportId = null;
            
        } catch (error) {
            console.error('Logout error:', error);
            this.showError('Logout failed');
        }
    }

    handleCheckboxGroup() {
        const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateRecommendedFocus();
            });
        });
    }

    updateRecommendedFocus() {
        const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked');
        const values = Array.from(checkboxes).map(cb => cb.value);
        const focusField = document.getElementById('recommended_focus');
        if (focusField) {
            focusField.value = values.join(', ');
        }
    }

    calculateAge() {
        const dobInput = document.getElementById('date_of_birth');
        const ageInput = document.getElementById('age');
        
        if (!dobInput.value) {
            ageInput.value = '';
            return;
        }
        
        const birthDate = new Date(dobInput.value);
        const today = new Date();
        
        // Calculate age
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        // Adjust if birthday hasn't occurred this year yet
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        // Only set age if it's reasonable (between 0 and 18 for youth baseball)
        if (age >= 0 && age <= 18) {
            ageInput.value = age;
            
            // Add a subtle visual feedback
            ageInput.style.backgroundColor = '#e8f5e8';
            setTimeout(() => {
                ageInput.style.backgroundColor = '';
            }, 1000);
        } else {
            ageInput.value = '';
        }
    }

    async loadReports() {
        try {
            this.showLoading('reportsList');
            const response = await fetch('/api/reports', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    this.showAuthView();
                    return;
                }
                throw new Error('Failed to load reports');
            }
            
            this.reports = await response.json();
            this.renderReports();
        } catch (error) {
            this.showError('Failed to load reports: ' + error.message);
            console.error('Error loading reports:', error);
        }
    }

    renderReports(filteredReports = null) {
        const reportsContainer = document.getElementById('reportsList');
        const reportsToShow = filteredReports || this.reports;
        
        if (reportsToShow.length === 0) {
            reportsContainer.innerHTML = `
                <div class="no-reports">
                    <h3>No scouting reports found</h3>
                    <p>Click "New Report" to create your first scouting report.</p>
                </div>
            `;
            return;
        }
        
        reportsContainer.innerHTML = reportsToShow.map(report => `
            <div class="report-card" onclick="app.editReport(${report.id})">
                <h3>${report.player_name || 'Unnamed Player'}</h3>
                <div class="report-meta">
                    ${this.formatDate(report.scout_date)} • ${report.team || 'No Team'}
                    ${report.first_name && report.last_name ? 
                        `<br>Scout: ${report.first_name} ${report.last_name}` : ''}
                </div>
                <div class="report-info">
                    <span class="position-badge">${report.primary_position || 'N/A'}</span>
                    <small>Created: ${this.formatDate(report.created_at)}</small>
                </div>
            </div>
        `).join('');
    }

    filterReports(searchTerm) {
        if (!searchTerm.trim()) {
            this.renderReports();
            return;
        }
        
        const filtered = this.reports.filter(report => 
            (report.player_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (report.team || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (report.primary_position || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        this.renderReports(filtered);
    }

    showReportsView() {
        document.getElementById('reportsView').classList.add('active');
        document.getElementById('formView').classList.remove('active');
        this.loadReports();
    }

    showNewReportForm() {
        this.currentReportId = null;
        document.getElementById('formTitle').textContent = 'New Scouting Report';
        document.getElementById('deleteBtn').style.display = 'none';
        this.clearForm();
        this.showFormView();
    }

    showFormView() {
        document.getElementById('reportsView').classList.remove('active');
        document.getElementById('formView').classList.add('active');
        
        // Focus on player name field
        setTimeout(() => {
            document.getElementById('player_name').focus();
        }, 100);
    }

    async editReport(reportId) {
        try {
            this.currentReportId = reportId;
            document.getElementById('formTitle').textContent = 'Edit Scouting Report';
            document.getElementById('deleteBtn').style.display = 'inline-block';
            
            const response = await fetch(`/api/reports/${reportId}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    this.showAuthView();
                    return;
                }
                if (response.status === 403) {
                    this.showError('You do not have permission to edit this report.');
                    return;
                }
                throw new Error('Failed to load report');
            }
            
            const report = await response.json();
            this.populateForm(report);
            this.showFormView();
        } catch (error) {
            this.showError('Failed to load report: ' + error.message);
            console.error('Error loading report:', error);
        }
    }

    populateForm(report) {
        // Populate all form fields
        Object.keys(report).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = report[key];
                } else {
                    element.value = report[key] || '';
                }
            }
        });
        
        // Handle recommended focus checkboxes
        if (report.recommended_focus) {
            const focusAreas = report.recommended_focus.split(', ');
            const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = focusAreas.includes(checkbox.value);
            });
            
            // Update the hidden field
            const focusField = document.getElementById('recommended_focus');
            if (focusField) {
                focusField.value = report.recommended_focus;
            }
        }
        
        // Format dates properly
        if (report.scout_date) {
            document.getElementById('scout_date').value = this.formatDateForInput(report.scout_date);
        }
        if (report.date_of_birth) {
            document.getElementById('date_of_birth').value = this.formatDateForInput(report.date_of_birth);
        }
        if (report.next_evaluation_date) {
            document.getElementById('next_evaluation_date').value = this.formatDateForInput(report.next_evaluation_date);
        }
    }

    clearForm() {
        document.getElementById('scoutingForm').reset();
        
        // Clear checkboxes
        const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Set default date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('scout_date').value = today;
        
        // Set scout name to current user if available
        if (this.currentUser) {
            document.getElementById('scout_name').value = 
                `${this.currentUser.firstName} ${this.currentUser.lastName}`;
        }
    }

    async saveReport() {
        if (!this.validateForm()) {
            this.showError('Please fill in all required fields');
            return;
        }
        
        try {
            const formData = this.getFormData();
            const url = this.currentReportId ? `/api/reports/${this.currentReportId}` : '/api/reports';
            const method = this.currentReportId ? 'PUT' : 'POST';
            
            document.getElementById('saveBtn').textContent = 'Saving...';
            document.getElementById('saveBtn').disabled = true;
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    this.showAuthView();
                    return;
                }
                throw new Error('Failed to save report');
            }
            
            const result = await response.json();
            
            this.showSuccess(this.currentReportId ? 'Report updated successfully!' : 'Report created successfully!');
            
            // If it's a new report, set the current ID
            if (!this.currentReportId && result.id) {
                this.currentReportId = result.id;
                document.getElementById('formTitle').textContent = 'Edit Scouting Report';
                document.getElementById('deleteBtn').style.display = 'inline-block';
            }
            
            // Clear any draft
            this.clearDraft();
            
        } catch (error) {
            this.showError('Failed to save report: ' + error.message);
            console.error('Error saving report:', error);
        } finally {
            document.getElementById('saveBtn').textContent = 'Save Report';
            document.getElementById('saveBtn').disabled = false;
        }
    }

    async deleteReport() {
        if (!this.currentReportId) return;
        
        if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
            return;
        }
        
        try {
            document.getElementById('deleteBtn').textContent = 'Deleting...';
            document.getElementById('deleteBtn').disabled = true;
            
            const response = await fetch(`/api/reports/${this.currentReportId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    this.showAuthView();
                    return;
                }
                throw new Error('Failed to delete report');
            }
            
            this.showSuccess('Report deleted successfully!');
            this.showReportsView();
            
        } catch (error) {
            this.showError('Failed to delete report: ' + error.message);
            console.error('Error deleting report:', error);
        } finally {
            document.getElementById('deleteBtn').textContent = 'Delete';
            document.getElementById('deleteBtn').disabled = false;
        }
    }

    getFormData() {
        const formData = {};
        const form = document.getElementById('scoutingForm');
        const formElements = form.querySelectorAll('input, select, textarea');
        
        formElements.forEach(element => {
            if (element.type === 'checkbox' && !element.name.startsWith('focus_')) {
                formData[element.name] = element.checked;
            } else if (element.type !== 'checkbox') {
                formData[element.name] = element.value || null;
            }
        });
        
        // Handle recommended focus areas
        this.updateRecommendedFocus();
        const focusField = document.getElementById('recommended_focus');
        if (focusField) {
            formData.recommended_focus = focusField.value;
        }
        
        return formData;
    }

    validateForm() {
        const playerName = document.getElementById('player_name').value.trim();
        return playerName.length > 0;
    }

    saveDraft() {
        if (!this.currentReportId) {
            const formData = this.getFormData();
            if (formData.player_name && formData.player_name.trim()) {
                localStorage.setItem('scoutingDraft', JSON.stringify(formData));
            }
        }
    }

    clearDraft() {
        localStorage.removeItem('scoutingDraft');
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatDateForInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }

    showLoading(containerId) {
        document.getElementById(containerId).innerHTML = `
            <div class="loading">
                <div>Loading...</div>
            </div>
        `;
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        // Remove any existing messages
        const existingMessages = document.querySelectorAll('.error, .success');
        existingMessages.forEach(msg => msg.remove());
        
        const messageDiv = document.createElement('div');
        messageDiv.className = type;
        messageDiv.textContent = message;
        
        // Find the active container
        const authView = document.getElementById('authView');
        const mainApp = document.getElementById('mainApp');
        const container = authView.classList.contains('active') ? 
            authView.querySelector('.auth-container') : 
            document.querySelector('.view.active') || mainApp;
        
        container.insertBefore(messageDiv, container.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
        
        // Scroll to top to show message
        container.scrollTop = 0;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ScoutingApp();
});

// Add some additional CSS for the no-reports message
const style = document.createElement('style');
style.textContent = `
    .no-reports {
        text-align: center;
        padding: 3rem;
        color: #7f8c8d;
    }
    
    .no-reports h3 {
        margin-bottom: 1rem;
        color: #2c3e50;
    }
    
    .no-reports p {
        font-size: 1.1rem;
    }
`;
document.head.appendChild(style);