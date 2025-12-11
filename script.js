const STORAGE_KEY = 'eggPartyCount';

// Load egg count from localStorage, default to 55 if not found
let eggCount = parseInt(localStorage.getItem(STORAGE_KEY)) || 55;

const eggCountDisplay = document.getElementById('eggCount');
const eggsGrid = document.getElementById('eggsGrid');
const increaseBtn = document.getElementById('increaseBtn');
const decreaseBtn = document.getElementById('decreaseBtn');
const eggMessage = document.getElementById('eggMessage');

// Track which thresholds have been shown
let shownThresholds = new Set();

// Gallery elements
const imageInput = document.getElementById('imageInput');
const captionInput = document.getElementById('captionInput');
const uploadBtn = document.getElementById('uploadBtn');
const uploadStatus = document.getElementById('uploadStatus');
const galleryGrid = document.getElementById('galleryGrid');

function saveEggCount() {
    localStorage.setItem(STORAGE_KEY, eggCount.toString());
}

function createEgg() {
    const egg = document.createElement('div');
    egg.className = 'egg';
    egg.style.animationDelay = '0s';
    
    // Add click listener to remove this specific egg
    egg.addEventListener('click', () => {
        removeSpecificEgg(egg);
    });
    
    return egg;
}

let messageTimeout = null;

function showEggMessage(message) {
    // Clear any existing timeout
    if (messageTimeout) {
        clearTimeout(messageTimeout);
    }
    
    eggMessage.textContent = message;
    eggMessage.classList.add('show');
    
    // Hide after 4 seconds
    messageTimeout = setTimeout(() => {
        eggMessage.classList.remove('show');
        messageTimeout = null;
    }, 4000);
}

function checkEggThresholds() {
    const thresholds = [
        { count: 15, message: "Running low on eggs! 🥚" },
        { count: 10, message: "Only 10 eggs left! Better make them count! 🍳" },
        { count: 5, message: "Down to 5 eggs! The end is near! 😱" },
        { count: 3, message: "Just 3 eggs remaining! Choose wisely! 🎯" },
        { count: 2, message: "Only 2 eggs left! The suspense! 😰" },
        { count: 1, message: "LAST EGG! Make it count! 🥚💥" }
    ];
    
    // Check if we've hit an exact threshold
    thresholds.forEach(threshold => {
        if (eggCount === threshold.count && !shownThresholds.has(threshold.count)) {
            shownThresholds.add(threshold.count);
            showEggMessage(threshold.message);
        }
    });
    
    // Clear thresholds if count goes back up above 15
    if (eggCount > 15) {
        shownThresholds.clear();
        eggMessage.classList.remove('show');
        if (messageTimeout) {
            clearTimeout(messageTimeout);
            messageTimeout = null;
        }
    }
}

function updateNumberDisplay() {
    // Update the number display
    eggCountDisplay.textContent = eggCount;
    eggCountDisplay.classList.add('updated');
    setTimeout(() => {
        eggCountDisplay.classList.remove('updated');
    }, 300);
    
    // Check for threshold messages
    checkEggThresholds();
    
    // Save to localStorage
    saveEggCount();
}

function initializeEggDisplay() {
    // Update the number display first
    eggCountDisplay.textContent = eggCount;
    
    // Check thresholds on initial load
    checkEggThresholds();
    
    // Clear and create all eggs for initial load
    eggsGrid.innerHTML = '';
    
    // Add exactly eggCount eggs in normal order
    // With flex-wrap: wrap-reverse, they'll fill bottom-left to top-right
    // First item = bottom-left, last item = top-right
    for (let i = 0; i < eggCount; i++) {
        const egg = createEgg();
        egg.style.animationDelay = `${(i % 20) * 0.05}s`;
        eggsGrid.appendChild(egg);
    }
    
    // Save to localStorage
    saveEggCount();
}

function addEgg() {
    const egg = createEgg();
    // Append to end so it appears at top-right (newest at top-right)
    // With wrap-reverse, new rows appear above existing rows
    eggsGrid.appendChild(egg);
    // Trigger animation
    requestAnimationFrame(() => {
        egg.style.animation = 'eggAppear 0.5s ease';
    });
}

function removeSpecificEgg(eggElement) {
    // Check if egg is already being removed
    if (eggElement.hasAttribute('data-removing')) {
        return;
    }
    
    // Mark as removing
    eggElement.setAttribute('data-removing', 'true');
    
    // Decrease count and update display
    eggCount--;
    updateNumberDisplay();
    
    // Disable pointer events immediately
    eggElement.style.pointerEvents = 'none';
    
    // Get all remaining eggs (excluding the one being removed)
    const remainingEggs = Array.from(eggsGrid.querySelectorAll('.egg:not([data-removing])'))
        .filter(egg => egg !== eggElement);
    
    // Store initial positions of remaining eggs
    const initialPositions = remainingEggs.map(egg => ({
        element: egg,
        rect: egg.getBoundingClientRect()
    }));
    
    // Start fade out animation on the removed egg
    eggElement.style.opacity = '0';
    eggElement.style.animation = 'eggDisappear 0.3s ease forwards';
    
    // Remove from DOM immediately so layout recalculates
    eggElement.remove();
    
    // Force a reflow to ensure layout has updated
    eggsGrid.offsetHeight;
    
    // Animate remaining eggs to their new positions
    requestAnimationFrame(() => {
        remainingEggs.forEach((egg, index) => {
            const initialPos = initialPositions.find(pos => pos.element === egg);
            if (initialPos) {
                const finalRect = egg.getBoundingClientRect();
                const deltaX = initialPos.rect.left - finalRect.left;
                const deltaY = initialPos.rect.top - finalRect.top;
                
                if (deltaX !== 0 || deltaY !== 0) {
                    // Set initial position using transform
                    egg.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                    egg.style.transition = 'none';
                    
                    // Force reflow
                    egg.offsetHeight;
                    
                    // Animate to final position
                    requestAnimationFrame(() => {
                        egg.style.transition = 'transform 0.3s ease';
                        egg.style.transform = 'translate(0, 0)';
                        
                        // Clean up after animation
                        setTimeout(() => {
                            egg.style.transition = '';
                            egg.style.transform = '';
                        }, 300);
                    });
                }
            }
        });
    });
}

function removeEgg() {
    // Only get eggs that aren't already being removed
    const eggs = eggsGrid.querySelectorAll('.egg:not([data-removing])');
    if (eggs.length > 0) {
        // Remove the last egg in DOM (which is at top-right)
        const lastEgg = eggs[eggs.length - 1];
        removeSpecificEgg(lastEgg);
    }
}

function increaseEggs() {
    eggCount++;
    updateNumberDisplay();
    addEgg();
}

function decreaseEggs() {
    if (eggCount > 0) {
        // removeEgg() -> removeSpecificEgg() will handle decreasing the count
        removeEgg();
    }
}

// Gallery functions
async function uploadImage() {
    const file = imageInput.files[0];
    const caption = captionInput.value.trim();

    if (!file) {
        showStatus('Please select an image first!', 'error');
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showStatus('Image size must be less than 5MB', 'error');
        return;
    }

    uploadBtn.disabled = true;
    showStatus('Uploading...', 'loading');

    try {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('caption', caption || 'No caption');

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
        }

        showStatus('Upload successful! 🎉', 'success');
        imageInput.value = '';
        captionInput.value = '';
        
        // Reload gallery
        await loadGallery();
        
        setTimeout(() => {
            uploadStatus.textContent = '';
            uploadStatus.className = 'upload-status';
        }, 3000);
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
    } finally {
        uploadBtn.disabled = false;
    }
}

async function loadGallery() {
    try {
        const response = await fetch('/api/gallery');
        
        // Check if API route exists (404 means not deployed/running with vercel dev)
        if (response.status === 404) {
            galleryGrid.innerHTML = '<div class="gallery-empty">Gallery requires Vercel deployment or <code>vercel dev</code> to work. The egg counter works fine without it! 🥚</div>';
            return;
        }
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            galleryGrid.innerHTML = '<div class="gallery-empty">Gallery requires Vercel deployment or <code>vercel dev</code> to work. The egg counter works fine without it! 🥚</div>';
            return;
        }
        
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to load gallery');
        }

        displayGallery(data.images || []);
    } catch (error) {
        console.error('Error loading gallery:', error);
        // Check if it's a network/CORS error (likely not running with vercel dev)
        if (error.message.includes('Failed to fetch') || error.message.includes('CORS') || error.name === 'TypeError') {
            galleryGrid.innerHTML = '<div class="gallery-empty">Gallery requires Vercel deployment or <code>vercel dev</code> to work. The egg counter works fine without it! 🥚</div>';
        } else {
            galleryGrid.innerHTML = '<div class="gallery-empty">Failed to load gallery. Please refresh the page.</div>';
        }
    }
}

function downloadImage(imageUrl, caption) {
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = imageUrl;
    // Use caption as filename, sanitize it
    const filename = (caption || 'egg-meal').replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.jpg';
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Make downloadImage available globally for onclick handlers
window.downloadImage = downloadImage;

function displayGallery(images) {
    if (images.length === 0) {
        galleryGrid.innerHTML = '<div class="gallery-empty">No egg meals yet! Upload your first one above 🍳</div>';
        return;
    }

    galleryGrid.innerHTML = images.map((image, index) => {
        const safeCaption = escapeHtml(image.caption).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
        const safeUrl = image.url.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
        return `
        <div class="gallery-item" style="animation-delay: ${index * 0.1}s">
            <img src="${safeUrl}" alt="${image.caption}" class="gallery-item-image" loading="lazy" 
                 onclick="window.downloadImage('${safeUrl}', '${safeCaption}')"
                 title="Click to download full quality">
            <div class="gallery-item-caption">${escapeHtml(image.caption)}</div>
        </div>
    `;
    }).join('');
}

function showStatus(message, type) {
    uploadStatus.textContent = message;
    uploadStatus.className = `upload-status ${type}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Sync function to ensure display matches actual eggs
function syncEggCount() {
    const actualEggCount = eggsGrid.querySelectorAll('.egg:not([data-removing])').length;
    if (actualEggCount !== eggCount) {
        console.log(`Fixing mismatch: display shows ${eggCount}, DOM has ${actualEggCount} eggs`);
        // Recreate eggs to match eggCount
        eggsGrid.innerHTML = '';
        for (let i = 0; i < eggCount; i++) {
            const egg = createEgg();
            egg.style.animationDelay = `${(i % 20) * 0.05}s`;
            eggsGrid.appendChild(egg);
        }
    }
}

// Make downloadImage available globally for onclick handlers
window.downloadImage = downloadImage;

// Event listeners
increaseBtn.addEventListener('click', increaseEggs);
decreaseBtn.addEventListener('click', decreaseEggs);
uploadBtn.addEventListener('click', uploadImage);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeEggDisplay();
        loadGallery();
        // Verify after a short delay
        setTimeout(syncEggCount, 100);
    });
} else {
    initializeEggDisplay();
    loadGallery();
    // Verify after a short delay
    setTimeout(syncEggCount, 100);
}

