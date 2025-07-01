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
        document.getElementById('backFromViewBtn').addEventListener('click', () => this.showReportsView());
        
        // Modal actions
        document.getElementById('viewReportBtn').addEventListener('click', () => this.viewReport());
        document.getElementById('editReportBtn').addEventListener('click', () => this.editReportFromModal());
        document.getElementById('editFromViewBtn').addEventListener('click', () => this.editCurrentReport());
        document.getElementById('cancelModalBtn').addEventListener('click', () => this.hideModal());
        
        // Modal background click to close
        document.getElementById('actionModal').addEventListener('click', (e) => {
            if (e.target.id === 'actionModal') {
                this.hideModal();
            }
        });
        
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
        
        // Handle spray chart upload
        this.bindSprayChartEvents();
        
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

    bindSprayChartEvents() {
        const fileInput = document.getElementById('sprayChartUpload');
        const uploadBtn = document.getElementById('uploadSprayChart');
        const deleteBtn = document.getElementById('deleteSprayChart');
        
        if (!fileInput || !uploadBtn || !deleteBtn) return;
        
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                uploadBtn.style.display = 'inline-block';
            } else {
                uploadBtn.style.display = 'none';
            }
        });
        
        uploadBtn.addEventListener('click', () => this.uploadSprayChart());
        deleteBtn.addEventListener('click', () => this.deleteSprayChart());
    }

    // Utility to find the spray chart section
    getSprayChartSection() {
        const sprayChartSections = document.querySelectorAll('.form-section');
        let sprayChartSection = null;
        sprayChartSections.forEach(section => {
            const h3 = section.querySelector('h3');
            if (h3 && h3.textContent.trim() === 'Spray Chart') {
                sprayChartSection = section;
            }
        });
        return sprayChartSection;
    }

    async uploadSprayChart() {
        if (!this.currentReportId) {
            this.showError('Please save the report first before uploading images');
            return;
        }
        const fileInput = document.getElementById('sprayChartUpload');
        const file = fileInput.files[0];
        if (!file) {
            this.showError('Please select an image file');
            return;
        }
        const formData = new FormData();
        formData.append('sprayChart', file);
        try {
            document.getElementById('uploadSprayChart').textContent = 'Uploading...';
            document.getElementById('uploadSprayChart').disabled = true;
            const response = await fetch(`/api/reports/${this.currentReportId}/spray-chart`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });
            if (!response.ok) {
                throw new Error('Upload failed');
            }
            const result = await response.json();
            this.showSuccess('Spray chart uploaded successfully!');
            // Re-render spray chart section
            const sprayChartSection = this.getSprayChartSection();
            if (sprayChartSection) {
                sprayChartSection.innerHTML = `<h3>Spray Chart</h3><div class="form-group">${this.renderSprayChartSection(result.imagePath.replace('/uploads/', ''), true)}</div>`;
            }
            this.bindSprayChartEvents();
        } catch (error) {
            this.showError('Failed to upload spray chart: ' + error.message);
        } finally {
            document.getElementById('uploadSprayChart').textContent = 'Upload Image';
            document.getElementById('uploadSprayChart').disabled = false;
        }
    }
    
    async deleteSprayChart() {
        if (!this.currentReportId) return;
        if (!confirm('Are you sure you want to delete the spray chart image?')) {
            return;
        }
        try {
            document.getElementById('deleteSprayChart').textContent = 'Deleting...';
            document.getElementById('deleteSprayChart').disabled = true;
            const response = await fetch(`/api/reports/${this.currentReportId}/spray-chart`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Delete failed');
            }
            this.showSuccess('Spray chart deleted successfully!');
            // Re-render spray chart section
            const sprayChartSection = this.getSprayChartSection();
            if (sprayChartSection) {
                sprayChartSection.innerHTML = `<h3>Spray Chart</h3><div class="form-group">${this.renderSprayChartSection(null, true)}</div>`;
            }
            this.bindSprayChartEvents();
        } catch (error) {
            this.showError('Failed to delete spray chart: ' + error.message);
        } finally {
            document.getElementById('deleteSprayChart').textContent = 'Delete Image';
            document.getElementById('deleteSprayChart').disabled = false;
        }
    }
    
    displaySprayChart(imagePath) {
        const preview = document.getElementById('sprayChartPreview');
        preview.innerHTML = `
            <div style="margin-top: 10px;">
                <img src="${imagePath}" alt="Spray Chart" style="max-width: 300px; max-height: 200px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
        `;
        document.getElementById('deleteSprayChart').style.display = 'inline-block';
    }
    
    clearSprayChart() {
        document.getElementById('sprayChartPreview').innerHTML = '';
        document.getElementById('deleteSprayChart').style.display = 'none';
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
            <div class="report-card" data-report-id="${report.id}">
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
        
        // Add click event listeners to report cards
        const reportCards = reportsContainer.querySelectorAll('.report-card');
        reportCards.forEach(card => {
            card.addEventListener('click', () => {
                const reportId = card.dataset.reportId;
                this.showActionModal(reportId);
            });
        });
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
        document.getElementById('viewOnlyView').classList.remove('active');
        this.loadReports();
    }

    showNewReportForm() {
        this.currentReportId = null;
        document.getElementById('formTitle').textContent = 'New Scouting Report';
        document.getElementById('deleteBtn').style.display = 'none';
        this.clearForm();
        this.showFormView();
    }

    showActionModal(reportId) {
        this.selectedReportId = reportId;
        const modal = document.getElementById('actionModal');
        modal.style.display = 'flex';
        // Add fade-in animation
        setTimeout(() => modal.classList.add('show'), 10);
    }
    
    hideModal() {
        const modal = document.getElementById('actionModal');
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            this.selectedReportId = null;
        }, 200);
    }
    
    async viewReport() {
        this.hideModal();
        await this.loadAndDisplayReport(this.selectedReportId, true);
    }
    
    async editReportFromModal() {
        this.hideModal();
        await this.loadAndDisplayReport(this.selectedReportId, false);
    }
    
    editCurrentReport() {
        this.showFormView();
    }

    showFormView() {
        document.getElementById('reportsView').classList.remove('active');
        document.getElementById('viewOnlyView').classList.remove('active');
        document.getElementById('formView').classList.add('active');
        
        // Focus on player name field
        setTimeout(() => {
            document.getElementById('player_name').focus();
        }, 100);
    }
    
    showViewOnlyView() {
        document.getElementById('reportsView').classList.remove('active');
        document.getElementById('formView').classList.remove('active');
        document.getElementById('viewOnlyView').classList.add('active');
    }

    async loadAndDisplayReport(reportId, viewOnly = false) {
        try {
            this.currentReportId = reportId;
            
            const response = await fetch(`/api/reports/${reportId}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    this.showAuthView();
                    return;
                }
                if (response.status === 403) {
                    this.showError('You do not have permission to access this report.');
                    return;
                }
                throw new Error('Failed to load report');
            }
            
            const report = await response.json();
            
            if (viewOnly) {
                this.displayReport(report);
                this.showViewOnlyView();
            } else {
                document.getElementById('formTitle').textContent = 'Edit Scouting Report';
                document.getElementById('deleteBtn').style.display = 'inline-block';
                this.populateForm(report);
                this.showFormView();
            }
        } catch (error) {
            this.showError('Failed to load report: ' + error.message);
            console.error('Error loading report:', error);
        }
    }
    
    displayReport(report) {
        document.getElementById('viewTitle').textContent = `Scouting Report - ${report.player_name || 'Unnamed Player'}`;
        const display = document.getElementById('reportDisplay');
        const format = (val) => val ? val : '<span style="color:#bbb">N/A</span>';
        const formatDate = (val) => val ? this.formatDate(val) : '<span style="color:#bbb">N/A</span>';
        const focusAreas = report.recommended_focus ? report.recommended_focus.split(',').map(f => f.trim()).filter(f => f).join(', ') : '<span style="color:#bbb">N/A</span>';
        display.innerHTML = `
            <div class="report-section">
                <h3>Scout Information</h3>
                <div class="report-grid">
                    <div><strong>Scout/Coach:</strong> ${format(report.scout_name)}</div>
                    <div><strong>Date:</strong> ${formatDate(report.scout_date)}</div>
                    <div><strong>Event:</strong> ${format(report.event)}</div>
                    <div><strong>League/Organization:</strong> ${format(report.league_organization)}</div>
                </div>
            </div>
            <div class="report-section">
                <h3>Player Information</h3>
                <div class="report-grid">
                    <div><strong>Name:</strong> ${format(report.player_name)}</div>
                    <div><strong>Primary Position:</strong> ${format(report.primary_position)}</div>
                    <div><strong>Jersey #:</strong> ${format(report.jersey_number)}</div>
                    <div><strong>Date of Birth:</strong> ${formatDate(report.date_of_birth)}</div>
                    <div><strong>Age:</strong> ${format(report.age)}</div>
                    <div><strong>Height:</strong> ${format(report.height)}</div>
                    <div><strong>Weight:</strong> ${format(report.weight)}</div>
                    <div><strong>Bats:</strong> ${format(report.bats)}</div>
                    <div><strong>Throws:</strong> ${format(report.throws)}</div>
                    <div><strong>Team:</strong> ${format(report.team)}</div>
                    <div><strong>Parent/Guardian:</strong> ${format(report.parent_guardian)}</div>
                    <div><strong>Contact:</strong> ${format(report.contact)}</div>
                </div>
            </div>
            <div class="report-section">
                <h3>Physical Development</h3>
                <div class="report-grid">
                    <div><strong>Build:</strong> ${format(report.build)}</div>
                    <div><strong>Coordination:</strong> ${format(report.coordination)}</div>
                    <div><strong>Athleticism:</strong> ${format(report.athleticism)}</div>
                    <div><strong>Motor Skills:</strong> ${format(report.motor_skills)}</div>
                    <div><strong>Growth Projection:</strong> ${format(report.growth_projection)}</div>
                </div>
            </div>
            <div class="report-section">
                <h3>Hitting Fundamentals</h3>
                <div class="report-grid">
                    <div><strong>Stance & Setup:</strong> ${format(report.stance_setup)}</div>
                    <div><strong>Swing Mechanics:</strong> ${format(report.swing_mechanics)}</div>
                    <div><strong>Contact Ability:</strong> ${format(report.contact_ability)}</div>
                    <div><strong>Power Potential:</strong> ${format(report.power_potential)}</div>
                    <div><strong>Plate Discipline:</strong> ${format(report.plate_discipline)}</div>
                    <div><strong>Bat Speed:</strong> ${format(report.bat_speed)}</div>
                    <div><strong>Approach:</strong> ${format(report.approach)}</div>
                    <div><strong>Bunting:</strong> ${format(report.bunting)}</div>
                </div>
            </div>
            <div class="report-section">
                <h3>Running & Base Running</h3>
                <div class="report-grid">
                    <div><strong>Speed:</strong> ${format(report.speed)}</div>
                    <div><strong>Base Running IQ:</strong> ${format(report.base_running_iq)}</div>
                    <div><strong>Stealing Ability:</strong> ${format(report.stealing_ability)}</div>
                    <div><strong>First Step:</strong> ${format(report.first_step)}</div>
                    <div><strong>Turns:</strong> ${format(report.turns)}</div>
                </div>
            </div>
            <div class="report-section">
                <h3>Fielding Skills</h3>
                <div class="report-grid">
                    <div><strong>Readiness:</strong> ${format(report.fielding_readiness)}</div>
                    <div><strong>Glove Work:</strong> ${format(report.glove_work)}</div>
                    <div><strong>Footwork:</strong> ${format(report.footwork)}</div>
                    <div><strong>Arm Strength:</strong> ${format(report.arm_strength)}</div>
                    <div><strong>Arm Accuracy:</strong> ${format(report.arm_accuracy)}</div>
                    <div><strong>Range:</strong> ${format(report.range_field)}</div>
                    <div><strong>Game Awareness:</strong> ${format(report.game_awareness)}</div>
                    <div><strong>Positions Played:</strong> ${format(report.positions_played)}</div>
                </div>
            </div>
            <div class="report-section">
                <h3>Pitching (If Applicable)</h3>
                <div class="report-grid">
                    <div><strong>Fastball MPH:</strong> ${format(report.fastball_mph)}</div>
                    <div><strong>Control:</strong> ${format(report.control_pitching)}</div>
                    <div><strong>Breaking Ball:</strong> ${format(report.breaking_ball)}</div>
                    <div><strong>Changeup:</strong> ${format(report.changeup)}</div>
                    <div><strong>Delivery:</strong> ${format(report.delivery)}</div>
                    <div><strong>Mound Presence:</strong> ${format(report.mound_presence)}</div>
                    <div><strong>Strikes:</strong> ${format(report.strikes)}</div>
                </div>
            </div>
            <div class="report-section">
                <h3>Baseball IQ & Intangibles</h3>
                <div class="report-grid">
                    <div><strong>Game Understanding:</strong> ${format(report.game_understanding)}</div>
                    <div><strong>Coachability:</strong> ${format(report.coachability)}</div>
                    <div><strong>Effort Level:</strong> ${format(report.effort_level)}</div>
                    <div><strong>Competitiveness:</strong> ${format(report.competitiveness)}</div>
                    <div><strong>Teamwork:</strong> ${format(report.teamwork)}</div>
                    <div><strong>Focus/Attention:</strong> ${format(report.focus_attention)}</div>
                    <div><strong>Leadership:</strong> ${format(report.leadership)}</div>
                </div>
            </div>
            <div class="report-section">
                <h3>Development Areas</h3>
                <div class="report-grid">
                    <div><strong>Biggest Strengths:</strong> <span>${format(report.biggest_strengths)}</span></div>
                    <div><strong>Primary Areas for Improvement:</strong> <span>${format(report.improvement_areas)}</span></div>
                    <div><strong>Recommended Focus Areas:</strong> <span>${focusAreas}</span></div>
                </div>
            </div>
            <div class="report-section">
                <h3>Projection & Recommendations</h3>
                <div class="report-grid">
                    <div><strong>Current Level:</strong> ${format(report.current_level)}</div>
                    <div><strong>Development Potential:</strong> ${format(report.development_potential)}</div>
                    <div><strong>Playing Time Recommendation:</strong> ${format(report.playing_time_recommendation)}</div>
                    <div><strong>Recommended Next Steps:</strong> <span>${format(report.recommended_next_steps)}</span></div>
                    <div><strong>Position Projection:</strong> <span>${format(report.position_projection)}</span></div>
                    <div><strong>Additional Training Needed:</strong> <span>${format(report.additional_training)}</span></div>
                </div>
            </div>
            <div class="report-section">
                <h3>Coach/Parent Feedback</h3>
                <div class="report-grid">
                    <div><strong>What to Work on at Home/Practice:</strong> <span>${format(report.work_at_home)}</span></div>
                    <div><strong>Positive Reinforcement Areas:</strong> <span>${format(report.positive_reinforcement)}</span></div>
                </div>
            </div>
            <div class="report-section">
                <h3>Spray Chart</h3>
                ${this.renderSprayChartSection(report.spray_chart_image, false)}
            </div>
            <div class="report-section">
                <h3>Notes & Observations</h3>
                <div class="report-grid">
                    <div><strong>Notes & Observations:</strong> <span>${format(report.notes_observations)}</span></div>
                    <div><strong>Next Evaluation Date:</strong> ${formatDate(report.next_evaluation_date)}</div>
                    <div><strong>Follow-up Items:</strong> ${format(report.followup_items)}</div>
                </div>
            </div>
        `;
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
        
        // Render spray chart section
        const sprayChartSection = this.getSprayChartSection();
        if (sprayChartSection) {
            sprayChartSection.innerHTML = `<h3>Spray Chart</h3><div class="form-group">${this.renderSprayChartSection(report.spray_chart_image, true)}</div>`;
        }
        
        // Bind events for upload/delete
        this.bindSprayChartEvents();
        
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
        
        // Clear spray chart
        this.clearSprayChart();
        document.getElementById('sprayChartUpload').value = '';
        document.getElementById('uploadSprayChart').style.display = 'none';
        
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

    // --- Spray Chart Component Refactor ---
    renderSprayChartSection(imagePath, editable = false) {
        // imagePath: string or null
        // editable: boolean, if true show upload/delete controls
        let html = '';
        if (imagePath) {
            html += `<div style="margin-top: 10px;">
                <img src="/uploads/${imagePath}" alt="Spray Chart" style="max-width: 400px; max-height: 300px; border: 1px solid #ddd; border-radius: 4px;">
            </div>`;
        } else {
            html += '<span style="color:#bbb">No spray chart uploaded</span>';
        }
        if (editable) {
            html += `
                <div style="margin-top: 10px;">
                    <input type="file" id="sprayChartUpload" accept="image/*" style="margin-bottom: 10px;">
                    <button type="button" id="uploadSprayChart" class="btn btn-secondary" style="display: none;">Upload Image</button>
                    <button type="button" id="deleteSprayChart" class="btn btn-danger" style="display: ${imagePath ? 'inline-block' : 'none'};">Delete Image</button>
                </div>
                <div id="sprayChartPreview"></div>
            `;
        }
        return html;
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