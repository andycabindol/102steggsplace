// Egg count will be loaded from API
let eggCount = 55; // Temporary default, will be replaced by API call
let pollInterval = null;
let isUpdating = false; // Prevent concurrent updates

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
const photoPreviewContainer = document.getElementById('photoPreviewContainer');
const photoPreview = document.getElementById('photoPreview');
const removePreviewBtn = document.getElementById('removePreview');
const uploadLabel = document.getElementById('uploadLabel');

// Save egg count to API
async function saveEggCount() {
    if (isUpdating) return; // Prevent concurrent saves
    
    isUpdating = true;
    try {
        const response = await fetch('/api/egg-count', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ count: eggCount }),
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('Failed to save egg count:', data.error);
            // Fallback: could show error message to user
        }
    } catch (error) {
        console.error('Error saving egg count:', error);
    } finally {
        isUpdating = false;
    }
}

// Fetch egg count from API
async function fetchEggCount() {
    try {
        const response = await fetch('/api/egg-count');
        
        if (response.status === 404) {
            // API not available, use default
            console.log('Egg count API not available, using default');
            return 55;
        }
        
        const data = await response.json();
        
        if (data.success && typeof data.count === 'number') {
            return data.count;
        }
        
        return 55; // Fallback to default
    } catch (error) {
        console.error('Error fetching egg count:', error);
        return 55; // Fallback to default
    }
}

// Poll for egg count updates (real-time sync via polling)
async function pollEggCount() {
    if (isUpdating) return; // Don't poll while updating
    
    try {
        const serverCount = await fetchEggCount();
        
        // Only update if server count differs from local count
        // This prevents unnecessary UI updates when user is actively changing the count
        if (serverCount !== eggCount) {
            const oldCount = eggCount;
            eggCount = serverCount;
            
            // Update display if count changed
            if (oldCount !== eggCount) {
                // Clear thresholds when syncing from server so messages can appear again
                // if count crosses thresholds from another device
                shownThresholds.clear();
                updateEggDisplay();
            }
        }
    } catch (error) {
        console.error('Error polling egg count:', error);
    }
}

// Start polling for real-time updates
function startPolling() {
    // Poll every 1.5 seconds for near real-time updates
    if (pollInterval) {
        clearInterval(pollInterval);
    }
    pollInterval = setInterval(pollEggCount, 1500);
}

// Stop polling (useful if needed)
function stopPolling() {
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
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
    
    // Save to API (async, don't wait)
    saveEggCount();
}

// Update egg display (used when syncing from server)
function updateEggDisplay() {
    // Update the number display
    eggCountDisplay.textContent = eggCount;
    
    // Recreate eggs to match count
    eggsGrid.innerHTML = '';
    const columnsPerRow = 6;
    for (let i = 0; i < eggCount; i++) {
        const egg = createEgg();
        const reversedIndex = eggCount - 1 - i;
        const rowFromTop = Math.floor(reversedIndex / columnsPerRow);
        egg.style.animationDelay = `${rowFromTop * 0.1}s`;
        eggsGrid.appendChild(egg);
    }
    
    // Check for threshold messages
    checkEggThresholds();
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
    // Calculate delay based on visual row position (top to bottom)
    const columnsPerRow = 6; // Based on your grid setup
    for (let i = 0; i < eggCount; i++) {
        const egg = createEgg();
        // Calculate which visual row this egg is in (from top)
        // Last eggs in DOM are visually at top, first eggs are at bottom
        const reversedIndex = eggCount - 1 - i;
        const rowFromTop = Math.floor(reversedIndex / columnsPerRow);
        // Top row animates first (delay 0), bottom row animates last
        egg.style.animationDelay = `${rowFromTop * 0.1}s`;
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

// Image compression function
function compressImage(file, maxSizeMB = 5, maxWidth = 1920, maxHeight = 1920, quality = 0.8) {
    return new Promise((resolve, reject) => {
        // If file is already under the limit, return as-is
        if (file.size <= maxSizeMB * 1024 * 1024) {
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                // Calculate new dimensions
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = width * ratio;
                    height = height * ratio;
                }

                // Create canvas and compress
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to blob with compression
                canvas.toBlob(function(blob) {
                    if (!blob) {
                        reject(new Error('Compression failed'));
                        return;
                    }
                    
                    // If still too large, reduce quality further
                    if (blob.size > maxSizeMB * 1024 * 1024 && quality > 0.5) {
                        canvas.toBlob(function(blob2) {
                            if (blob2) {
                                resolve(blob2);
                            } else {
                                resolve(blob); // Fallback to previous compression
                            }
                        }, file.type, quality * 0.7);
                    } else {
                        resolve(blob);
                    }
                }, file.type, quality);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Gallery functions
async function uploadImage() {
    const file = imageInput.files[0];
    const caption = captionInput.value.trim();

    if (!file) {
        showStatus('Please select an image first!', 'error');
        return;
    }

    uploadBtn.disabled = true;
    showStatus('Processing image...', 'loading');

    try {
        // Compress if over 5MB
        let fileToUpload = file;
        if (file.size > 5 * 1024 * 1024) {
            showStatus('Compressing image...', 'loading');
            fileToUpload = await compressImage(file);
            const originalSize = (file.size / (1024 * 1024)).toFixed(2);
            const newSize = (fileToUpload.size / (1024 * 1024)).toFixed(2);
            console.log(`Compressed image from ${originalSize}MB to ${newSize}MB`);
        }

        showStatus('Uploading...', 'loading');

        const formData = new FormData();
        formData.append('image', fileToUpload, file.name);
        formData.append('caption', caption || '');

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
        
        // Remove preview and show choose photo button again
        removePhotoPreview();
        
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

        console.log('Gallery data received:', data);
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

// Lightbox functionality
let currentLightboxImage = null;
let currentLightboxCaption = null;

function showLightbox(imageUrl, caption) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxCaption = document.getElementById('lightbox-caption');
    
    // Store current image data for download
    currentLightboxImage = imageUrl;
    currentLightboxCaption = caption || '';
    
    // Set image source
    lightboxImage.src = imageUrl;
    lightboxImage.alt = caption || 'Egg meal';
    
    // Set caption
    if (caption && caption.trim()) {
        lightboxCaption.textContent = caption;
        lightboxCaption.style.display = 'flex';
    } else {
        lightboxCaption.textContent = '';
        lightboxCaption.style.display = 'none';
    }
    
    // Show lightbox
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.style.display = 'none';
    document.body.style.overflow = ''; // Restore scrolling
    
    // Clear stored data
    currentLightboxImage = null;
    currentLightboxCaption = null;
}

function downloadFromLightbox() {
    if (currentLightboxImage) {
        downloadImage(currentLightboxImage, currentLightboxCaption);
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

// Make functions available globally for onclick handlers
window.showLightbox = showLightbox;
window.closeLightbox = closeLightbox;
window.downloadFromLightbox = downloadFromLightbox;
window.downloadImage = downloadImage;

function displayGallery(images) {
    if (images.length === 0) {
        galleryGrid.innerHTML = '<div class="gallery-empty">No egg meals yet! Upload your first one above 🍳</div>';
        return;
    }

    galleryGrid.innerHTML = images.map((image, index) => {
        const safeCaption = escapeHtml(image.caption || '').replace(/'/g, "&#39;").replace(/"/g, "&quot;");
        const safeUrl = image.url.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
        const safeId = escapeHtml(image.id).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
        const hasCaption = image.caption && image.caption.trim() !== '';
        return `
        <div class="gallery-item" style="animation-delay: ${index * 0.1}s" data-image-id="${safeId}">
            <div class="gallery-item-header">
                <button class="gallery-menu-btn" onclick="toggleGalleryMenu('${safeId}')" title="Options">⋯</button>
                <div class="gallery-menu" id="menu-${safeId}" style="display: none;">
                    <button class="gallery-menu-item" onclick="editCaption('${safeId}', '${safeCaption}')">Edit Caption</button>
                    <button class="gallery-menu-item" onclick="deleteImage('${safeId}')">Delete</button>
                </div>
            </div>
            <img src="${safeUrl}" alt="${image.caption || 'Egg meal'}" class="gallery-item-image" loading="lazy" 
                 onclick="showLightbox('${safeUrl}', '${safeCaption}')"
                 title="Click to view full size">
            ${hasCaption ? `<div class="gallery-item-caption" id="caption-${safeId}">${escapeHtml(image.caption)}</div>` : '<div class="gallery-item-caption-empty" id="caption-' + safeId + '"></div>'}
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

// Gallery menu functions
function toggleGalleryMenu(imageId) {
    // Close all other menus
    document.querySelectorAll('.gallery-menu').forEach(menu => {
        if (menu.id !== `menu-${imageId}`) {
            menu.style.display = 'none';
        }
    });
    
    // Toggle current menu
    const menu = document.getElementById(`menu-${imageId}`);
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

// Close menus when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.gallery-item-header')) {
        document.querySelectorAll('.gallery-menu').forEach(menu => {
            menu.style.display = 'none';
        });
    }
});

async function editCaption(imageId, currentCaption) {
    const newCaption = prompt('Edit caption:', currentCaption || '');
    if (newCaption === null) return; // User cancelled
    
    try {
        const response = await fetch('/api/gallery/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: imageId,
                caption: newCaption.trim(),
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to update caption');
        }

        // Update the caption display
        const captionElement = document.getElementById(`caption-${imageId}`);
        if (captionElement) {
            if (newCaption.trim()) {
                captionElement.textContent = newCaption.trim();
                captionElement.className = 'gallery-item-caption';
            } else {
                captionElement.textContent = '';
                captionElement.className = 'gallery-item-caption-empty';
            }
        }

        // Close menu
        const menu = document.getElementById(`menu-${imageId}`);
        if (menu) menu.style.display = 'none';
        
        showStatus('Caption updated!', 'success');
        setTimeout(() => {
            uploadStatus.textContent = '';
            uploadStatus.className = 'upload-status';
        }, 2000);
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
    }
}

async function deleteImage(imageId) {
    if (!confirm('Are you sure you want to delete this image?')) {
        return;
    }

    try {
        const response = await fetch('/api/gallery/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: imageId }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete image');
        }

        // Remove the gallery item
        const galleryItem = document.querySelector(`[data-image-id="${imageId}"]`);
        if (galleryItem) {
            galleryItem.style.animation = 'eggDisappear 0.3s ease forwards';
            setTimeout(() => {
                galleryItem.remove();
                // Reload gallery to ensure sync
                loadGallery();
            }, 300);
        }

        showStatus('Image deleted!', 'success');
        setTimeout(() => {
            uploadStatus.textContent = '';
            uploadStatus.className = 'upload-status';
        }, 2000);
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
    }
}

// Make functions available globally
window.toggleGalleryMenu = toggleGalleryMenu;
window.editCaption = editCaption;
window.deleteImage = deleteImage;

// Photo preview functions
function showPhotoPreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        photoPreview.src = e.target.result;
        photoPreviewContainer.style.display = 'block';
        uploadLabel.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function removePhotoPreview() {
    photoPreviewContainer.style.display = 'none';
    uploadLabel.style.display = 'flex';
    imageInput.value = '';
    photoPreview.src = '';
}

// Event listeners
increaseBtn.addEventListener('click', increaseEggs);
decreaseBtn.addEventListener('click', decreaseEggs);
uploadBtn.addEventListener('click', uploadImage);
imageInput.addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
        showPhotoPreview(e.target.files[0]);
    }
});
removePreviewBtn.addEventListener('click', removePhotoPreview);

// Initialize when DOM is ready
async function initializeApp() {
    // Fetch initial egg count from API
    eggCount = await fetchEggCount();
    
    // Initialize display with fetched count
    initializeEggDisplay();
    
    // Load gallery
    loadGallery();
    
    // Start polling for real-time updates
    startPolling();
    
    // Verify after a short delay
    setTimeout(syncEggCount, 100);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Clean up polling when page unloads
window.addEventListener('beforeunload', () => {
    stopPolling();
});

// Close lightbox with ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const lightbox = document.getElementById('lightbox');
        if (lightbox && lightbox.style.display !== 'none') {
            closeLightbox();
        }
    }
});

