// Global Navbar JavaScript
(function() {
    'use strict';
    
    // Initialize navbar when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        initializeNavbar();
    });
    
    function initializeNavbar() {
        // Set active state based on current page
        setActiveNavItem();
        
        // Add click handlers for smooth navigation
        addNavigationHandlers();
    }
    
    function setActiveNavItem() {
        const currentPage = getCurrentPageName();
        const navLinks = document.querySelectorAll('.navbar a');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            
            const href = link.getAttribute('href');
            if (href && isCurrentPage(href, currentPage)) {
                link.classList.add('active');
            }
        });
    }
    
    function getCurrentPageName() {
        const path = window.location.pathname;
        const fileName = path.split('/').pop() || 'index.html';
        return fileName;
    }
    
    function isCurrentPage(href, currentPage) {
        // Remove any query parameters from href
        const cleanHref = href.split('?')[0];
        
        // Handle different ways of referencing the same page
        if (cleanHref === currentPage) return true;
        if (cleanHref === './' + currentPage) return true;
        if (cleanHref === '/' + currentPage) return true;
        
        // Special case for index/home page
        if ((cleanHref === 'index.html' || cleanHref === '/' || cleanHref === './') && 
            (currentPage === 'index.html' || currentPage === '')) {
            return true;
        }
        
        return false;
    }
    
    function addNavigationHandlers() {
        const navLinks = document.querySelectorAll('.navbar a');
        
        navLinks.forEach(link => {
            // Remove any existing event listeners first
            link.removeEventListener('click', handleNavClick);
            
            // Add our navigation handler
            link.addEventListener('click', handleNavClick, true);
        });
    }
    
    function handleNavClick(e) {
        const href = this.getAttribute('href');
        
        if (href && href !== '#' && !href.startsWith('javascript:')) {
            // Add visual feedback
            this.style.opacity = '0.7';
            
            // Use a small delay to allow visual feedback, then navigate
            setTimeout(() => {
                window.location.href = href;
            }, 50);
            
            // Prevent default to ensure our handler takes control
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }
    
    // Utility function to create navbar HTML (if needed programmatically)
    function createNavbarHTML(activePage = '') {
        return `
            <div class="navbar">
                <a href="index.html" ${activePage === 'index' ? 'class="active"' : ''}>
                    <span class="icon">🏠</span> Home
                </a>
                <a href="add-employee.html" ${activePage === 'add-employee' ? 'class="active"' : ''}>
                    <span class="icon">👤</span> Add Employee
                </a>
                <a href="view-employees.html" ${activePage === 'view-employees' ? 'class="active"' : ''}>
                    <span class="icon">👥</span> View Employees
                </a>
                <a href="attendance-records.html" ${activePage === 'attendance-records' ? 'class="active"' : ''}>
                    <span class="icon">📊</span> Records
                </a>
                <a href="fingerprint-verify.html" ${activePage === 'fingerprint-verify' ? 'class="active"' : ''}>
                    <span class="icon">✋</span> Verify
                </a>
            </div>
        `;
    }
    
    // Make createNavbarHTML available globally if needed
    window.createNavbarHTML = createNavbarHTML;
    
})();
