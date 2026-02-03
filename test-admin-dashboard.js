// Test script to check admin dashboard functionality
console.log('🧪 Testing admin dashboard...');

// Test if the main functions exist
const functions = [
    'formatIndonesianDate',
    'formatAnalyticsDate', 
    'showSection',
    'loadStats',
    'loadReports',
    'loadAnalytics',
    'refreshAllData'
];

functions.forEach(funcName => {
    if (typeof window[funcName] === 'function') {
        console.log(`✅ ${funcName} exists`);
    } else {
        console.log(`❌ ${funcName} missing or not a function`);
    }
});

// Test date formatting functions
try {
    const testDate = '2026-02-03';
    console.log('📅 Testing formatIndonesianDate:', formatIndonesianDate(testDate));
    console.log('📅 Testing formatAnalyticsDate:', formatAnalyticsDate(testDate));
} catch (error) {
    console.error('❌ Date formatting error:', error);
}

// Test API base
console.log('🌐 API_BASE:', API_BASE);

// Test DOM elements
const elements = [
    'adminName',
    'totalReports', 
    'activeClasses',
    'reportsList',
    'attendanceChart'
];

elements.forEach(elementId => {
    const element = document.getElementById(elementId);
    if (element) {
        console.log(`✅ Element ${elementId} found`);
    } else {
        console.log(`❌ Element ${elementId} missing`);
    }
});

console.log('🧪 Admin dashboard test complete');