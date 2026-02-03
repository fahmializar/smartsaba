// Test if admin-dashboard.js has syntax errors
console.log('🧪 Testing admin-dashboard.js syntax...');

try {
    // Try to load the script
    const script = document.createElement('script');
    script.src = 'admin-dashboard.js';
    
    script.onload = function() {
        console.log('✅ admin-dashboard.js loaded successfully');
        
        // Test if showSection function exists
        if (typeof showSection === 'function') {
            console.log('✅ showSection function is available');
        } else {
            console.log('❌ showSection function not found');
        }
        
        // Test other key functions
        const functions = ['formatIndonesianDate', 'loadStats', 'loadReports'];
        functions.forEach(funcName => {
            if (typeof window[funcName] === 'function') {
                console.log(`✅ ${funcName} is available`);
            } else {
                console.log(`❌ ${funcName} not found`);
            }
        });
    };
    
    script.onerror = function(error) {
        console.error('❌ Error loading admin-dashboard.js:', error);
    };
    
    document.head.appendChild(script);
    
} catch (error) {
    console.error('❌ Syntax error in admin-dashboard.js:', error);
}