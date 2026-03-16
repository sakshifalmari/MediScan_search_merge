// MediInfo Application - Main Logic

// ============= APP STATE =============
const appState = {
    currentUser: null,
    currentPage: 'home',
    searchHistory: [],
    medicineHistory: []
};

// ============= INITIALIZATION =============
// ============= INITIALIZATION =============
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    loadUserData();
    setupRouting();
    setupEventListeners();
    updateAuthUI();
    
    // CHANGE: Remove navigateTo('home') and call handleRouteChange instead
    // This ensures that if you are on #/login, it stays there.
    handleRouteChange(); 
}

// ============= ROUTING =============
function setupRouting() {
    window.addEventListener('hashchange', handleRouteChange);
}

function handleRouteChange() {
    // Get the page name, removing the #/ 
    let hash = window.location.hash.slice(2) || 'home'; 
    // If the hash is just "/" or empty, default to home
    if (hash === '/' || hash === '') hash = 'home';
    
    navigateTo(hash);
}

function navigateTo(page) {
    // 1. Protected Pages Check
    const protectedPages = ['dashboard', 'scanner', 'prescription', 'search', 'history'];
    if (protectedPages.includes(page) && !appState.currentUser) {
        alert('Please login first');
        window.location.hash = '/login';
        return;
    }
    
    // 2. Hide ALL pages first
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none'; // Extra safety
    });
    
    // 3. Show requested page
    const pageEl = document.getElementById(page + 'Page');
    if (pageEl) {
        pageEl.classList.add('active');
        pageEl.style.display = 'block'; // Ensure it's visible
        appState.currentPage = page;
    } else {
        // Fallback to home if page doesn't exist
        document.getElementById('homePage').classList.add('active');
        document.getElementById('homePage').style.display = 'block';
    }
    
    // 4. Run page-specific code
    initializePageContent(page);
}
function initializePageContent(page, params) {
    switch(page) {
        case 'scanner':
            setupQRScanner();
            break;
        case 'prescription':
            setupPrescriptionUpload();
            break;
        case 'search':
            setupSearch();
            break;
        case 'history':
            displayHistory();
            break;
    }
}

// ============= EVENT LISTENERS SETUP =============
function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Modal close
    const modal = document.getElementById('medicineModal');
    const closeModal = document.querySelector('.close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    if (modal) {
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

// ============= AUTHENTICATION =============
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Validation
    if (!email || !password) {
        alert('Please fill all fields');
        return;
    }
    
    // Get stored user
    const storedUser = localStorage.getItem(`user_${email}`);
    
    if (storedUser) {
        const user = JSON.parse(storedUser);
        // In real app, password would be hashed
        if (user.password === password) {
            appState.currentUser = {
                email: user.email,
                name: user.name
            };
            saveUserData();
            updateAuthUI();
            window.location.hash = '/dashboard';
            alert(`Welcome back, ${user.name}!`);
        } else {
            alert('Invalid password');
        }
    } else {
        alert('User not found. Please sign up first.');
    }
}

function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirm = document.getElementById('signupConfirm').value;
    
    // Validation
    if (!name || !email || !password || !confirm) {
        alert('Please fill all fields');
        return;
    }
    
    if (password !== confirm) {
        alert('Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }
    
    // Check if user already exists
    if (localStorage.getItem(`user_${email}`)) {
        alert('User already exists. Please login.');
        return;
    }
    
    // Create user
    const newUser = { name, email, password };
    localStorage.setItem(`user_${email}`, JSON.stringify(newUser));
    
    // Auto login
    appState.currentUser = {
        email: newUser.email,
        name: newUser.name
    };
    saveUserData();
    updateAuthUI();
    window.location.hash = '/dashboard';
    alert(`Welcome to MediInfo, ${name}!`);
}

function handleLogout() {
    appState.currentUser = null;
    appState.searchHistory = [];
    saveUserData();
    updateAuthUI();
    window.location.hash = '/';
    alert('Logged out successfully');
}

function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const dashboardLink = document.getElementById('dashboardLink');
    const userNameDisplay = document.getElementById('userNameDisplay');
    
    if (appState.currentUser) {
        authButtons.style.display = 'none';
        userMenu.style.display = 'flex';
        dashboardLink.style.display = 'inline-block';
        if (userNameDisplay) {
            userNameDisplay.textContent = appState.currentUser.name;
        }
    } else {
        authButtons.style.display = 'flex';
        userMenu.style.display = 'none';
        dashboardLink.style.display = 'none';
    }
}

// ============= QR CODE SCANNER =============
let videoStream = null;

function setupQRScanner() {
    const startBtn = document.getElementById('startScanBtn');
    const stopBtn = document.getElementById('stopScanBtn');
    const video = document.getElementById('qrVideo');
    
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            startQRScanner(video, startBtn, stopBtn);
        });
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            stopQRScanner(video, startBtn, stopBtn);
        });
    }
}

function startQRScanner(video, startBtn, stopBtn) {
    // Request camera access
    navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
    }).then(stream => {
        videoStream = stream;
        video.srcObject = stream;
        video.play();
        
        startBtn.style.display = 'none';
        stopBtn.style.display = 'block';
        
        // Start QR code scanning
        scanQRCode(video);
    }).catch(err => {
        alert('Unable to access camera: ' + err.message);
    });
}

function stopQRScanner(video, startBtn, stopBtn) {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
    }
    video.srcObject = null;
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';
}

function scanQRCode(video) {
    const canvas = document.getElementById('qrCanvas');
    const canvasContext = canvas.getContext('2d');
    
    function scan() {
        if (!videoStream) return;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height);
        
        if (code) {
            // QR code detected
            const medicine = getMedicineByQR(code.data);
            if (medicine) {
                displayMedicineDetails(medicine);
                stopQRScanner(video, 
                    document.getElementById('startScanBtn'),
                    document.getElementById('stopScanBtn')
                );
                addToSearchHistory(medicine);
            } else {
                // Try parsing as medicine name
                const searchResults = searchMedicines(code.data);
                if (searchResults.length > 0) {
                    displayMedicineDetails(searchResults[0]);
                    stopQRScanner(video,
                        document.getElementById('startScanBtn'),
                        document.getElementById('stopScanBtn')
                    );
                    addToSearchHistory(searchResults[0]);
                }
            }
        }
        
        requestAnimationFrame(scan);
    }
    
    scan();
}

// ============= PRESCRIPTION UPLOAD =============
function setupPrescriptionUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const prescriptionInput = document.getElementById('prescriptionInput');
    
    if (uploadArea && prescriptionInput) {
        uploadArea.addEventListener('click', () => {
            prescriptionInput.click();
        });
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                processImage(files[0]);
            }
        });
        
        prescriptionInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                processImage(e.target.files[0]);
            }
        });
    }
}

async function processImage(file) {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
        const uploadProgress = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');
        const uploadArea = document.getElementById('uploadArea');
        
        uploadArea.style.display = 'none';
        uploadProgress.style.display = 'block';
        
        try {
            // Simulate progress
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 30;
                if (progress > 90) progress = 90;
                progressFill.style.width = progress + '%';
            }, 300);
            
            // OCR processing
            const result = await Tesseract.recognize(e.target.result, 'eng');
            clearInterval(progressInterval);
            progressFill.style.width = '100%';
            
            // Extract medicine names from OCR text
            const text = result.data.text.toUpperCase();
            const extractedMedicines = extractMedicinesFromText(text);
            
            uploadProgress.style.display = 'none';
            displayExtractedMedicines(extractedMedicines);
            
        } catch (err) {
            console.error('OCR Error:', err);
            alert('Error processing image: ' + err.message);
            uploadProgress.style.display = 'none';
            uploadArea.style.display = 'block';
        }
    };
    
    reader.readAsDataURL(file);
}

function extractMedicinesFromText(text) {
    const extracted = [];
    const medicineNames = medicinesDatabase.map(m => m.name.toUpperCase());
    
    medicineNames.forEach(name => {
        if (text.includes(name)) {
            const medicine = medicinesDatabase.find(m => m.name.toUpperCase() === name);
            if (medicine && !extracted.find(m => m.id === medicine.id)) {
                extracted.push(medicine);
            }
        }
    });
    
    return extracted;
}

function displayExtractedMedicines(medicines) {
    const container = document.getElementById('extractedMedicines');
    const medicinesList = document.getElementById('medicinesList');
    
    if (medicines.length === 0) {
        medicinesList.innerHTML = '<p>No medicines found in the prescription. Try uploading a clearer image.</p>';
    } else {
        medicinesList.innerHTML = medicines.map(medicine => `
            <div class="medicine-item" onclick="showMedicineModal(${medicine.id})">
                <div class="medicine-name">${medicine.name}</div>
                <div class="medicine-brand">${medicine.brand}</div>
            </div>
        `).join('');
    }
    
    container.style.display = 'block';
}

// ============= SEARCH FUNCTIONALITY =============
function setupSearch() {
    const searchInput = document.getElementById('medicineSearch');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            if (query.length > 0) {
                const results = searchMedicines(query);
                displaySearchResults(results);
            } else {
                document.getElementById('searchResults').innerHTML = '';
            }
        });
        
        searchInput.focus();
    }
}

function displaySearchResults(medicines) {
    const resultsContainer = document.getElementById('searchResults');

    if (medicines.length === 0) {
        resultsContainer.innerHTML = '<p>No medicines found.</p>';
        return;
    }

    resultsContainer.innerHTML = medicines.map(medicine => `
        <div class="medicine-item">
            <div class="medicine-name">${medicine.name}</div>
            <div class="medicine-brand">${medicine.manufacturer}</div>
            <p><b>Uses:</b> ${medicine.uses}</p>
            <p><b>Side Effects:</b> ${medicine.sideEffects}</p>
        </div>
    `).join('');
}

// ============= MEDICINE DETAILS MODAL =============
function showMedicineModal(medicineId) {
    const medicine = getMedicineById(medicineId);
    if (!medicine) return;
    
    addToSearchHistory(medicine);
    displayMedicineDetails(medicine);
}

function displayMedicineDetails(medicine) {
    const modal = document.getElementById('medicineModal');
    const contentDiv = document.getElementById('medicineDetailsContent');
    
    const dosageOptions = medicine.dosage.map(d => 
        `<span class="badge badge-dosage">${d}</span>`
    ).join('');
    
    const warningBadges = medicine.warnings.map(w => 
        `<span class="badge badge-warning">${w}</span>`
    ).join('');
    
    const interactionBadges = medicine.interactions.map(i => 
        `<span class="badge badge-interaction">${i}</span>`
    ).join('');
    
    contentDiv.innerHTML = `
        <div class="medicine-detail-title">${medicine.name}</div>
        
        <div class="medicine-detail-section">
            <h4>Brand Names</h4>
            <p>${medicine.brand}</p>
        </div>
        
        <div class="medicine-detail-section">
            <h4>Generic Name</h4>
            <p>${medicine.genericName}</p>
        </div>
        
        <div class="medicine-detail-section">
            <h4>Available Dosages</h4>
            <div>${dosageOptions}</div>
        </div>
        
        <div class="medicine-detail-section">
            <h4>Form</h4>
            <p>${medicine.form}</p>
        </div>
        
        <div class="medicine-detail-section">
            <h4>Indication</h4>
            <p>${medicine.indication}</p>
        </div>
        
        <div class="medicine-detail-section">
            <h4>Directions</h4>
            <p>${medicine.directions}</p>
        </div>
        
        <div class="medicine-detail-section">
            <h4>Side Effects</h4>
            <ul>
                ${medicine.sideEffects.map(effect => `<li>${effect}</li>`).join('')}
            </ul>
        </div>
        
        <div class="medicine-detail-section">
            <h4>Warnings</h4>
            <div>${warningBadges}</div>
        </div>
        
        <div class="medicine-detail-section">
            <h4>Possible Interactions</h4>
            <div>${interactionBadges}</div>
        </div>
        
        <div class="medicine-detail-section">
            <h4>Storage Conditions</h4>
            <p>${medicine.storageConditions}</p>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// ============= HISTORY MANAGEMENT =============
function addToSearchHistory(medicine) {
    const historyItem = {
        id: medicine.id,
        name: medicine.name,
        timestamp: new Date().toLocaleString()
    };
    
    // Remove if already exists
    appState.searchHistory = appState.searchHistory.filter(item => item.id !== medicine.id);
    
    // Add to front
    appState.searchHistory.unshift(historyItem);
    
    // Keep only last 20 items
    if (appState.searchHistory.length > 20) {
        appState.searchHistory.pop();
    }
    
    saveUserData();
}

function displayHistory() {
    const historyList = document.getElementById('historyList');
    const emptyHistory = document.getElementById('emptyHistory');
    
    if (appState.searchHistory.length === 0) {
        historyList.style.display = 'none';
        emptyHistory.style.display = 'block';
    } else {
        historyList.style.display = 'block';
        emptyHistory.style.display = 'none';
        
        historyList.innerHTML = appState.searchHistory.map(item => {
            const medicine = getMedicineById(item.id);
            return `
                <div class="history-item" onclick="showMedicineModal(${item.id})">
                    <div class="history-info">
                        <h3>${medicine.name}</h3>
                        <div class="history-date">${item.timestamp}</div>
                    </div>
                    <button class="btn btn-secondary" onclick="event.stopPropagation(); removeFr omHistory(${item.id})">Remove</button>
                </div>
            `;
        }).join('');
    }
}

function removeFromHistory(medicineId) {
    appState.searchHistory = appState.searchHistory.filter(item => item.id !== medicineId);
    saveUserData();
    displayHistory();
}

// ============= LOCAL STORAGE =============
function saveUserData() {
    const userData = {
        currentUser: appState.currentUser,
        searchHistory: appState.searchHistory
    };
    
    if (appState.currentUser) {
        localStorage.setItem(`${appState.currentUser.email}_appdata`, JSON.stringify(userData));
    }
}

function loadUserData() {
    // Check for logged-in user in sessionStorage (temporary)
    const savedSession = sessionStorage.getItem('mediinfo_session');
    
    if (savedSession) {
        const user = JSON.parse(savedSession);
        appState.currentUser = user;
        
        // Load user-specific data
        const userData = localStorage.getItem(`${user.email}_appdata`);
        if (userData) {
            const data = JSON.parse(userData);
            appState.searchHistory = data.searchHistory || [];
        }
    } else {
        // Try to load from localStorage for persistence
        const allKeys = Object.keys(localStorage);
        for (let key of allKeys) {
            if (key.includes('_appdata')) {
                const userData = JSON.parse(localStorage.getItem(key));
                if (userData.currentUser) {
                    appState.currentUser = userData.currentUser;
                    appState.searchHistory = userData.searchHistory || [];
                    break;
                }
            }
        }
    }
}

function searchMedicines(query) {
    query = query.toLowerCase();

    return medicinesDatabase.filter(medicine =>
        medicine.name.toLowerCase().includes(query)
    );
}