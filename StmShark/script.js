// Main Application for JSON-based data system
document.addEventListener('DOMContentLoaded', function() {
    // Global state
    let currentData = null;
    let growthChart = null;
    let monthlyChart = null;
    let currentPeriod = '30'; // Default period
    
    // DOM Elements
    const refreshBtn = document.getElementById('refreshBtn');
    const statusRefresh = document.getElementById('statusRefresh');
    const periodButtons = document.querySelectorAll('.period-btn');
    const faqItems = document.querySelectorAll('.faq-item');
    const dataStatus = document.getElementById('dataStatus');
    const statusText = document.getElementById('statusText');
    
    // Initialize
    initCharts();
    loadAllData();
    setupEventListeners();
    updateTimestamp();
    
    // Initialize charts
    function initCharts() {
        // Growth Chart
        const growthCtx = document.getElementById('growthChart').getContext('2d');
        growthChart = new Chart(growthCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Total Value',
                    data: [],
                    borderColor: '#22d3ee',
                    backgroundColor: 'rgba(34, 211, 238, 0.08)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointBackgroundColor: '#22d3ee'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#94a3b8',
                        bodyColor: '#f1f5f9',
                        borderColor: '#334155',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return `$${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { 
                            color: '#94a3b8', 
                            callback: value => '$' + value.toLocaleString() 
                        }
                    },
                    x: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#94a3b8' }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'nearest'
                }
            }
        });
        
        // Monthly Chart
        const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
        monthlyChart = new Chart(monthlyCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Return %',
                    data: [],
                    backgroundColor: function(context) {
                        const value = context.raw;
                        return value >= 0 
                            ? 'rgba(34, 197, 94, 0.7)' 
                            : 'rgba(239, 68, 68, 0.7)';
                    },
                    borderColor: function(context) {
                        const value = context.raw;
                        return value >= 0 
                            ? 'rgb(34, 197, 94)' 
                            : 'rgb(239, 68, 68)';
                    },
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#94a3b8',
                        bodyColor: '#f1f5f9',
                        borderColor: '#334155',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { 
                            color: '#94a3b8',
                            callback: value => value + '%'
                        }
                    },
                    x: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    }
    
    // Load all data from JSON files
    async function loadAllData() {
        setStatus('loading', 'Loading data...');
        
        try {
            // Load dashboard data
            const dashboardResponse = await fetch('data/dashboard.json');
            if (!dashboardResponse.ok) throw new Error('Dashboard data not found');
            
            const dashboardData = await dashboardResponse.json();
            
            // Load growth data
            const growthResponse = await fetch('data/growth.json');
            if (!growthResponse.ok) throw new Error('Growth data not found');
            
            const growthData = await growthResponse.json();
            
            // Load monthly data
            const monthlyResponse = await fetch('data/monthly.json');
            if (!monthlyResponse.ok) throw new Error('Monthly data not found');
            
            const monthlyData = await monthlyResponse.json();
            
            // Update the UI
            currentData = dashboardData;
            updateDashboard(dashboardData);
            updateGrowthChart(growthData, currentPeriod);
            updateMonthlyChart(monthlyData);
            updateTimestamp();
            
            setStatus('success', 'Data loaded successfully');
            
        } catch (error) {
            console.error('Error loading data:', error);
            setStatus('error', 'Failed to load data');
            
            // Show sample data if JSON files don't exist yet
            if (error.message.includes('not found')) {
                showSampleData();
            }
        }
    }
    
    // Update dashboard with data
    function updateDashboard(data) {
        // Animate counters
        animateCounter('avgMonthlyReturn', data.avgMonthlyReturn, 1);
        animateCounter('totalManaged', data.totalManaged, 0);
        document.getElementById('accountsInProfit').textContent = data.accountsInProfit;
        document.getElementById('totalAccounts').textContent = data.totalAccounts;
        
        // Update metrics
        animateCounter('winRate', data.winRate, 1);
        animateCounter('riskScore', data.riskScore, 1);
        animateCounter('consistencyScore', data.consistencyScore, 1);
        
        // Update progress bars
        animateProgressBar('winRateBar', data.winRate);
        animateProgressBar('riskBar', data.riskScore);
        animateProgressBar('consistencyBar', data.consistencyScore);
        
        // Store for later use
        currentData = data;
    }
    
    // Update growth chart with filtered data
    function updateGrowthChart(data, period) {
        let filteredData = data;
        
        // Filter by period
        if (period !== 'all') {
            const days = parseInt(period);
            filteredData = data.slice(-days);
        }
        
        // Update chart
        growthChart.data.labels = filteredData.map(item => {
            const date = new Date(item.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        
        growthChart.data.datasets[0].data = filteredData.map(item => item.value);
        growthChart.update('none');
    }
    
    // Update monthly chart
    function updateMonthlyChart(data) {
        monthlyChart.data.labels = data.map(item => item.month);
        monthlyChart.data.datasets[0].data = data.map(item => item.return);
        monthlyChart.update('none');
    }
    
    // Update timestamp
    function updateTimestamp() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
        
        const dateString = now.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        document.getElementById('lastUpdated').textContent = `Updated: ${dateString}`;
        document.getElementById('updateTime').textContent = timeString;
    }
    
    // Show sample data (for testing)
    function showSampleData() {
        console.log('Showing sample data - replace with real JSON files');
        
        const sampleDashboard = {
            avgMonthlyReturn: 5.8,
            totalManaged: 152430,
            accountsInProfit: 12,
            totalAccounts: 13,
            winRate: 84.5,
            riskScore: 92.0,
            consistencyScore: 94.7
        };
        
        updateDashboard(sampleDashboard);
        
        // Generate sample growth data
        const sampleGrowth = [];
        let value = 10000;
        const today = new Date();
        
        for (let i = 180; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            const change = (Math.random() - 0.45) * 0.015;
            value *= (1 + change);
            
            sampleGrowth.push({
                date: date.toISOString().split('T')[0],
                value: Math.round(value)
            });
        }
        
        updateGrowthChart(sampleGrowth, currentPeriod);
        
        // Generate sample monthly data
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const sampleMonthly = months.map(month => ({
            month,
            return: parseFloat((4 + Math.random() * 4 - 0.5).toFixed(1))
        }));
        
        updateMonthlyChart(sampleMonthly);
        setStatus('warning', 'Using sample data');
    }
    
    // Helper functions
    function animateCounter(elementId, target, decimals = 0) {
        const element = document.getElementById(elementId);
        const current = parseFloat(element.textContent) || 0;
        const diff = target - current;
        const duration = 1000;
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out function
            const ease = 1 - Math.pow(1 - progress, 3);
            const value = current + diff * ease;
            
            if (decimals === 0) {
                element.textContent = Math.round(value);
            } else {
                element.textContent = value.toFixed(decimals);
            }
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    }
    
    function animateProgressBar(elementId, target) {
        const element = document.getElementById(elementId);
        const current = parseFloat(element.style.width) || 0;
        const duration = 800;
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            const width = current + (target - current) * ease;
            
            element.style.width = width + '%';
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    }
    
    function setStatus(status, message) {
        const colors = {
            loading: 'bg-yellow-500',
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-orange-500'
        };
        
        // Update indicator color
        dataStatus.className = 'w-3 h-3 rounded-full mr-2';
        dataStatus.classList.add(colors[status] || colors.loading);
        
        // Update text
        statusText.textContent = message;
    }
    
    // Event listeners
    function setupEventListeners() {
        // Refresh button
        refreshBtn.addEventListener('click', function() {
            this.classList.add('animate-spin');
            loadAllData().finally(() => {
                setTimeout(() => {
                    this.classList.remove('animate-spin');
                }, 500);
            });
        });
        
        // Status refresh button
        statusRefresh.addEventListener('click', loadAllData);
        
        // Period buttons
        periodButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                periodButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentPeriod = this.dataset.period;
                
                // Reload growth data for selected period
                fetch('data/growth.json')
                    .then(response => response.json())
                    .then(data => updateGrowthChart(data, currentPeriod))
                    .catch(error => console.error('Error loading growth data:', error));
            });
        });
        
        // FAQ items
        faqItems.forEach(item => {
            const header = item.querySelector('.cursor-pointer');
            header.addEventListener('click', function() {
                const answer = item.querySelector('p');
                const icon = item.querySelector('.fa-chevron-down');
                
                answer.classList.toggle('hidden');
                item.classList.toggle('active');
                
                // Smooth animation
                if (!answer.classList.contains('hidden')) {
                    answer.style.opacity = '0';
                    answer.style.transform = 'translateY(-10px)';
                    
                    setTimeout(() => {
                        answer.style.transition = 'opacity 0.3s, transform 0.3s';
                        answer.style.opacity = '1';
                        answer.style.transform = 'translateY(0)';
                    }, 10);
                }
            });
        });
        
        // Auto-refresh every hour (optional)
        setInterval(() => {
            const now = new Date();
            if (now.getMinutes() === 0) { // Refresh on the hour
                loadAllData();
            }
        }, 60000); // Check every minute
        
        // Update timestamp every minute
        setInterval(updateTimestamp, 60000);
    }
});
