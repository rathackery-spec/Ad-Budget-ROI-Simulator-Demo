// DOM Elements mapping sliders and number inputs
const controls = {
    adSpend: { slider: document.getElementById('adSpend'), num: document.getElementById('adSpendNum') },
    cpc: { slider: document.getElementById('cpc'), num: document.getElementById('cpcNum') },
    convRate: { slider: document.getElementById('convRate'), num: document.getElementById('convRateNum') },
    aov: { slider: document.getElementById('aov'), num: document.getElementById('aovNum') },
    margin: { slider: document.getElementById('margin'), num: document.getElementById('marginNum') }
};

const results = {
    clicks: document.getElementById('resClicks'),
    conversions: document.getElementById('resConversions'),
    cpa: document.getElementById('resCpa'),
    revenue: document.getElementById('resRevenue'),
    roas: document.getElementById('resRoas'),
    netProfit: document.getElementById('resNetProfit')
};

const diffs = {
    clicks: document.getElementById('diffClicks'),
    conversions: document.getElementById('diffConversions'),
    cpa: document.getElementById('diffCpa'),
    revenue: document.getElementById('diffRevenue'),
    roas: document.getElementById('diffRoas'),
    netProfit: document.getElementById('diffNetProfit')
};

const insightsList = document.getElementById('insightsList');
let baselineData = null;

// Initialize Chart.js Multi-Bar Comparison Chart
let roiChart;
function initChart() {
    const ctx = document.getElementById('roiChart').getContext('2d');
    roiChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Ad Spend', 'Projected Revenue', 'Contribution Profit'],
            datasets: [
                {
                    label: 'Current Scenario',
                    data: [0, 0, 0],
                    backgroundColor: ['#94a3b8', '#38bdf8', '#34d399'],
                    borderWidth: 0,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    display: false,
                    labels: { color: '#cbd5e1' }
                }
            },
            scales: {
                y: {
                    grid: { color: '#334155' },
                    ticks: { color: '#cbd5e1' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#cbd5e1', font: { weight: '600' } }
                }
            }
        }
    });
}

// Robust Calculation Engine
function calculateMetrics(spend, cpc, convRatePercent, aov, marginPercent) {
    const convRate = convRatePercent / 100;
    const margin = marginPercent / 100;

    const clicks = cpc > 0 ? Math.floor(spend / cpc) : 0;
    const conversions = Math.floor(clicks * convRate);
    const revenue = conversions * aov;
    const cpa = conversions > 0 ? spend / conversions : 0;
    const roas = spend > 0 ? revenue / spend : 0; // Displayed as multiple (e.g., 3.2x)
    const grossProfitBeforeAd = revenue * margin;
    const netProfit = grossProfitBeforeAd - spend;
    const breakEvenRoas = margin > 0 ? 1 / margin : 0;

    return { spend, cpc, convRatePercent, aov, marginPercent, clicks, conversions, revenue, cpa, roas, netProfit, breakEvenRoas };
}

// Generate Automated Decision Insights
function generateInsights(current) {
    let items = [];

    // Break-even analysis
    if (current.marginPercent > 0) {
        if (current.roas >= current.breakEvenRoas) {
            items.push(`✅ <strong>Profitable Unit Economics:</strong> Your ROAS of ${(current.roas).toFixed(2)}× is above your break-even threshold of <strong>${current.breakEvenRoas.toFixed(2)}×</strong> based on your ${current.marginPercent}% gross margin.`);
        } else {
            items.push(`⚠️ <strong>Unprofitable Unit Economics:</strong> Your ROAS of ${(current.roas).toFixed(2)}× is below your break-even threshold of <strong>${current.breakEvenRoas.toFixed(2)}×</strong>. This campaign is losing money after ad spend and product costs.`);
        }
    }

    // Conversion rate realism check
    if (current.convRatePercent > 10) {
        items.push(`🔍 <span>High Conversion Rate Warning (${current.convRatePercent}%):</span> Rates above 10% are exceptionally high outside of retargeting or hyper-qualified niche traffic.`);
    }

    // CPA vs AOV check
    if (current.conversions > 0 && current.cpa >= current.aov) {
        items.push(`🚨 <span>High Acquisition Cost:</span> Your CPA ($${current.cpa.toFixed(2)}) exceeds your Average Order Value ($${current.aov.toFixed(2)}), meaning every order loses money on the front end.`);
    }

    if (items.length === 0) {
        items.push(`💡 Campaign parameters look balanced and within standard operating ranges.`);
    }

    insightsList.innerHTML = items.map(item => `<li>${item}</li>`).join('');
}

// Update UI and Comparisons
function updateSimulator() {
    const spend = parseFloat(controls.adSpend.num.value) || 0;
    const cpc = parseFloat(controls.cpc.num.value) || 0.01;
    const convRate = parseFloat(controls.convRate.num.value) || 0;
    const aov = parseFloat(controls.aov.num.value) || 0;
    const margin = parseFloat(controls.margin.num.value) || 0;

    const current = calculateMetrics(spend, cpc, convRate, aov, margin);

    // Output results to UI cards
    results.clicks.textContent = current.clicks.toLocaleString();
    results.conversions.textContent = current.conversions.toLocaleString();
    results.cpa.textContent = current.conversions > 0 ? `$${current.cpa.toFixed(2)}` : '$0.00';
    results.revenue.textContent = `$${current.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    results.roas.textContent = `${current.roas.toFixed(2)}×`;
    results.netProfit.textContent = `${current.netProfit >= 0 ? '$' : '-$'}${Math.abs(current.netProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    results.roas.style.color = current.roas >= current.breakEvenRoas ? 'var(--success)' : 'var(--accent)';
    results.netProfit.style.color = current.netProfit >= 0 ? 'var(--success)' : 'var(--danger)';

    // Handle Baseline Comparison Diffs
    if (baselineData) {
        renderDiff(diffs.clicks, current.clicks, baselineData.clicks, '', true);
        renderDiff(diffs.conversions, current.conversions, baselineData.conversions, '', true);
        renderDiff(diffs.cpa, current.cpa, baselineData.cpa, '$', false, true); // lower CPA is better
        renderDiff(diffs.revenue, current.revenue, baselineData.revenue, '$');
        renderDiff(diffs.roas, current.roas, baselineData.roas, '×');
        renderDiff(diffs.netProfit, current.netProfit, baselineData.netProfit, '$');
    } else {
        Object.values(diffs).forEach(d => d.textContent = '');
    }

    // Generate automated insights
    generateInsights(current);

    // Update Chart Datasets
    if (roiChart) {
        if (baselineData) {
            roiChart.data.datasets = [
                {
                    label: 'Baseline',
                    data: [baselineData.spend, baselineData.revenue, baselineData.netProfit],
                    backgroundColor: '#475569',
                    borderRadius: 4
                },
                {
                    label: 'Current',
                    data: [current.spend, current.revenue, current.netProfit],
                    backgroundColor: [
                        '#94a3b8', 
                        '#38bdf8', 
                        current.netProfit >= 0 ? '#34d399' : '#f87171'
                    ],
                    borderRadius: 4
                }
            ];
            roiChart.options.plugins.legend.display = true;
        } else {
            roiChart.data.datasets = [
                {
                    label: 'Current Scenario',
                    data: [current.spend, current.revenue, current.netProfit],
                    backgroundColor: [
                        '#94a3b8', 
                        '#38bdf8', 
                        current.netProfit >= 0 ? '#34d399' : '#f87171'
                    ],
                    borderRadius: 4
                }
            ];
            roiChart.options.plugins.legend.display = false;
        }
        roiChart.update();
    }
}

// Helper to format absolute and percentage diffs vs baseline
function renderDiff(element, currentVal, baseVal, prefix = '', isInteger = false, inverseGood = false) {
    const diffVal = currentVal - baseVal;
    const pctDiff = baseVal !== 0 ? (diffVal / baseVal) * 100 : 0;

    if (Math.abs(diffVal) < 0.01) {
        element.textContent = 'No change vs baseline';
        element.style.color = 'var(--text-muted)';
        return;
    }

    const sign = diffVal > 0 ? '+' : '';
    const formattedVal = isInteger ? Math.round(diffVal).toLocaleString() : diffVal.toFixed(2);
    const formattedPct = pctDiff.toFixed(1);

    element.textContent = `${sign}${prefix}${formattedVal} (${sign}${formattedPct}%) vs baseline`;

    const isPositiveGood = inverseGood ? diffVal < 0 : diffVal > 0;
    element.style.color = isPositiveGood ? 'var(--success)' : 'var(--danger)';
}

// Hook up event listeners for sliders and text boxes
Object.keys(controls).forEach(key => {
    const slider = controls[key].slider;
    const num = controls[key].num;

    slider.addEventListener('input', () => {
        num.value = slider.value;
        updateSimulator();
    });

    num.addEventListener('input', () => {
        slider.value = num.value;
        updateSimulator();
    });
});

// LocalStorage Scenario Saving & Loading Logic
const saveBtn = document.getElementById('saveScenarioBtn');
const scenarioNameInput = document.getElementById('scenarioName');
const loadSelect = document.getElementById('loadScenarioSelect');
const setBaselineBtn = document.getElementById('setBaselineBtn');
const baselineStatusBadge = document.getElementById('baselineStatus');

function refreshSavedScenariosDropdown() {
    loadSelect.innerHTML = '<option value="">-- Load Saved Scenario --</option>';
    const saved = JSON.parse(localStorage.getItem('adSimulatorScenarios') || '{}');
    Object.keys(saved).forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        loadSelect.appendChild(opt);
    });
}

saveBtn.addEventListener('click', () => {
    const name = scenarioNameInput.value.trim();
    if (!name) {
        alert('Please enter a scenario name.');
        return;
    }

    const currentValues = {};
    Object.keys(controls).forEach(k => {
        currentValues[k] = controls[k].num.value;
    });

    const saved = JSON.parse(localStorage.getItem('adSimulatorScenarios') || '{}');
    saved[name] = currentValues;
    localStorage.setItem('adSimulatorScenarios', JSON.stringify(saved));

    scenarioNameInput.value = '';
    refreshSavedScenariosDropdown();
    alert(`Scenario "${name}" saved successfully!`);
});

loadSelect.addEventListener('change', (e) => {
    const name = e.target.value;
    if (!name) return;

    const saved = JSON.parse(localStorage.getItem('adSimulatorScenarios') || '{}');
    const data = saved[name];
    if (data) {
        Object.keys(data).forEach(k => {
            if (controls[k]) {
                controls[k].slider.value = data[k];
                controls[k].num.value = data[k];
            }
        });
        updateSimulator();
    }
});

// Pin current parameters as comparison baseline
setBaselineBtn.addEventListener('click', () => {
    const spend = parseFloat(controls.adSpend.num.value) || 0;
    const cpc = parseFloat(controls.cpc.num.value) || 0.01;
    const convRate = parseFloat(controls.convRate.num.value) || 0;
    const aov = parseFloat(controls.aov.num.value) || 0;
    const margin = parseFloat(controls.margin.num.value) || 0;

    baselineData = calculateMetrics(spend, cpc, convRate, aov, margin);
    baselineStatusBadge.textContent = 'Baseline Pinned 📌';
    baselineStatusBadge.style.color = 'var(--success)';
    updateSimulator();
});

// Run on page load
window.addEventListener('DOMContentLoaded', () => {
    initChart();
    updateSimulator();
    refreshSavedScenariosDropdown();
});