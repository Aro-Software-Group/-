// Import modules
import { initializeTimeline, addClipToTimeline, updateTimeline } from './timeline.js';
import { applyEffect, applyFilter } from './effects.js';
import { trimVideo, cutVideo, mergeVideos, splitVideo } from './editor.js';

// Export shared variables and functions for other modules
export { currentProject, selectedClip, formatTime };

// Global variables
let currentProject = {
    name: 'Untitled Project',
    mediaItems: [],
    timeline: {
        videoTrack: [],
        audioTrack: [],
        effectsTrack: []
    },
    duration: 0
};

let isPlaying = false;
let currentTime = 0;
let selectedClip = null;
let selectedTool = null;

// DOM Elements
const previewVideo = document.getElementById('preview');
const playPauseBtn = document.getElementById('playPause');
const stopBtn = document.getElementById('stop');
const timeDisplay = document.querySelector('.time-display');
const uploadBtn = document.getElementById('uploadBtn');
const uploadInput = document.getElementById('uploadMedia');
const mediaList = document.getElementById('mediaList');
const exportBtn = document.getElementById('exportVideo');
const newProjectBtn = document.getElementById('newProject');
const saveProjectBtn = document.getElementById('saveProject');
const openProjectBtn = document.getElementById('openProject');

// Tool buttons
const cutToolBtn = document.getElementById('cutTool');
const trimToolBtn = document.getElementById('trimTool');
const mergeToolBtn = document.getElementById('mergeTool');
const splitToolBtn = document.getElementById('splitTool');

// Effect buttons
const brightnessEffectBtn = document.getElementById('brightnessEffect');
const contrastEffectBtn = document.getElementById('contrastEffect');
const saturationEffectBtn = document.getElementById('saturationEffect');
const blurEffectBtn = document.getElementById('blurEffect');

// Filter buttons
const grayscaleFilterBtn = document.getElementById('grayscaleFilter');
const sepiaFilterBtn = document.getElementById('sepiaFilter');
const invertFilterBtn = document.getElementById('invertFilter');
const vintageFilterBtn = document.getElementById('vintageFilter');

// Modals
const effectsModal = document.getElementById('effectsModal');
const exportModal = document.getElementById('exportModal');
const modalCloseButtons = document.querySelectorAll('.close');
const applyEffectBtn = document.getElementById('applyEffect');
const cancelEffectBtn = document.getElementById('cancelEffect');
const startExportBtn = document.getElementById('startExport');
const cancelExportBtn = document.getElementById('cancelExport');

// Initialize the application
function init() {
    // Initialize timeline
    initializeTimeline();
    
    // Set up event listeners
    setupEventListeners();
    
    // Create a new empty project
    createNewProject();
    
    console.log('Reel Spark initialized');
}

// Set up event listeners
function setupEventListeners() {
    // Upload media
    uploadBtn.addEventListener('click', () => uploadInput.click());
    uploadInput.addEventListener('change', handleMediaUpload);
    
    // Playback controls
    playPauseBtn.addEventListener('click', togglePlayPause);
    stopBtn.addEventListener('click', stopPlayback);
    
    // Project controls
    newProjectBtn.addEventListener('click', createNewProject);
    saveProjectBtn.addEventListener('click', saveProject);
    openProjectBtn.addEventListener('click', openProject);
    exportBtn.addEventListener('click', showExportModal);
    
    // Tool buttons
    cutToolBtn.addEventListener('click', () => selectTool('cut'));
    trimToolBtn.addEventListener('click', () => selectTool('trim'));
    mergeToolBtn.addEventListener('click', () => selectTool('merge'));
    splitToolBtn.addEventListener('click', () => selectTool('split'));
    
    // Effect buttons
    brightnessEffectBtn.addEventListener('click', () => showEffectsModal('brightness'));
    contrastEffectBtn.addEventListener('click', () => showEffectsModal('contrast'));
    saturationEffectBtn.addEventListener('click', () => showEffectsModal('saturation'));
    blurEffectBtn.addEventListener('click', () => showEffectsModal('blur'));
    
    // Filter buttons
    grayscaleFilterBtn.addEventListener('click', () => applyFilter('grayscale'));
    sepiaFilterBtn.addEventListener('click', () => applyFilter('sepia'));
    invertFilterBtn.addEventListener('click', () => applyFilter('invert'));
    vintageFilterBtn.addEventListener('click', () => applyFilter('vintage'));
    
    // Modal buttons
    modalCloseButtons.forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    applyEffectBtn.addEventListener('click', handleApplyEffect);
    cancelEffectBtn.addEventListener('click', closeAllModals);
    
    startExportBtn.addEventListener('click', exportVideo);
    cancelExportBtn.addEventListener('click', closeAllModals);
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === effectsModal || e.target === exportModal) {
            closeAllModals();
        }
    });
    
    // Update timeline playhead on video timeupdate
    previewVideo.addEventListener('timeupdate', updatePlayhead);
}

// Handle media upload
function handleMediaUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach(file => {
        // Create a unique ID for the media item
        const id = 'media_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        
        // Determine media type
        let type = 'unknown';
        if (file.type.startsWith('video/')) type = 'video';
        else if (file.type.startsWith('audio/')) type = 'audio';
        else if (file.type.startsWith('image/')) type = 'image';
        
        // Create media item object
        const mediaItem = {
            id,
            name: file.name,
            type,
            file,
            url: URL.createObjectURL(file),
            duration: 0
        };
        
        // Add to project media items
        currentProject.mediaItems.push(mediaItem);
        
        // Create media item element
        createMediaItemElement(mediaItem);
        
        // If it's a video or audio, get its duration
        if (type === 'video' || type === 'audio') {
            const tempMedia = type === 'video' ? document.createElement('video') : document.createElement('audio');
            tempMedia.src = mediaItem.url;
            tempMedia.onloadedmetadata = () => {
                mediaItem.duration = tempMedia.duration;
                // Update the UI if needed
                const mediaItemElement = document.getElementById(id);
                if (mediaItemElement) {
                    const durationElement = mediaItemElement.querySelector('.media-duration');
                    if (durationElement) {
                        durationElement.textContent = formatTime(tempMedia.duration);
                    }
                }
            };
        }
    });
    
    // Reset the input
    uploadInput.value = '';
}

// Create media item element in the media library
function createMediaItemElement(mediaItem) {
    const mediaItemElement = document.createElement('div');
    mediaItemElement.className = 'media-item';
    mediaItemElement.id = mediaItem.id;
    mediaItemElement.draggable = true;
    
    const thumbnailElement = document.createElement('div');
    thumbnailElement.className = 'media-thumbnail';
    
    // Create thumbnail based on media type
    if (mediaItem.type === 'video') {
        const videoElement = document.createElement('video');
        videoElement.src = mediaItem.url;
        videoElement.muted = true;
        videoElement.preload = 'metadata';
        thumbnailElement.appendChild(videoElement);
        
        // Generate thumbnail from video
        videoElement.onloadeddata = () => {
            videoElement.currentTime = 1; // Set to 1 second to get a good thumbnail
        };
    } else if (mediaItem.type === 'image') {
        const imgElement = document.createElement('img');
        imgElement.src = mediaItem.url;
        thumbnailElement.appendChild(imgElement);
    } else if (mediaItem.type === 'audio') {
        // For audio, just show an icon
        const iconElement = document.createElement('i');
        iconElement.className = 'fas fa-music';
        iconElement.style.fontSize = '24px';
        iconElement.style.color = '#666';
        thumbnailElement.appendChild(iconElement);
    }
    
    const infoElement = document.createElement('div');
    infoElement.className = 'media-info';
    
    const nameElement = document.createElement('div');
    nameElement.className = 'media-name';
    nameElement.textContent = mediaItem.name.length > 15 ? 
        mediaItem.name.substring(0, 12) + '...' : 
        mediaItem.name;
    nameElement.title = mediaItem.name;
    
    const durationElement = document.createElement('div');
    durationElement.className = 'media-duration';
    durationElement.textContent = mediaItem.duration ? formatTime(mediaItem.duration) : '';
    
    infoElement.appendChild(nameElement);
    infoElement.appendChild(durationElement);
    
    mediaItemElement.appendChild(thumbnailElement);
    mediaItemElement.appendChild(infoElement);
    
    // Add event listeners for drag and drop
    mediaItemElement.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', mediaItem.id);
    });
    
    // Add event listener for double click to preview
    mediaItemElement.addEventListener('dblclick', () => {
        previewMedia(mediaItem);
    });
    
    mediaList.appendChild(mediaItemElement);
}

// Preview media in the preview panel
function previewMedia(mediaItem) {
    if (mediaItem.type === 'video') {
        previewVideo.src = mediaItem.url;
        previewVideo.style.display = 'block';
        previewVideo.play();
        isPlaying = true;
        updatePlayPauseButton();
    } else if (mediaItem.type === 'audio') {
        previewVideo.src = '';
        previewVideo.style.display = 'none';
        const audio = new Audio(mediaItem.url);
        audio.play();
    } else if (mediaItem.type === 'image') {
        // For images, we could show them in the video element or create a separate image preview
        previewVideo.style.display = 'none';
        // Create a temporary image element
        const imgPreview = document.createElement('img');
        imgPreview.src = mediaItem.url;
        imgPreview.style.maxWidth = '100%';
        imgPreview.style.maxHeight = '100%';
        
        const videoContainer = document.querySelector('.video-container');
        // Remove any existing image preview
        const existingImg = videoContainer.querySelector('img');
        if (existingImg) {
            videoContainer.removeChild(existingImg);
        }
        
        videoContainer.appendChild(imgPreview);
    }
}

// Toggle play/pause
function togglePlayPause() {
    if (previewVideo.src) {
        if (isPlaying) {
            previewVideo.pause();
        } else {
            previewVideo.play();
        }
        isPlaying = !isPlaying;
        updatePlayPauseButton();
    }
}

// Update play/pause button icon
function updatePlayPauseButton() {
    const icon = playPauseBtn.querySelector('i');
    if (isPlaying) {
        icon.className = 'fas fa-pause';
    } else {
        icon.className = 'fas fa-play';
    }
}

// Stop playback
function stopPlayback() {
    if (previewVideo.src) {
        previewVideo.pause();
        previewVideo.currentTime = 0;
        isPlaying = false;
        updatePlayPauseButton();
    }
}

// Update playhead position
function updatePlayhead() {
    currentTime = previewVideo.currentTime;
    
    // Update time display
    timeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(previewVideo.duration)}`;
    
    // Update timeline playhead
    const playhead = document.querySelector('.timeline-playhead');
    const timelineWidth = document.querySelector('.timeline').offsetWidth - 100; // Subtract track label width
    const position = (currentTime / previewVideo.duration) * timelineWidth;
    playhead.style.left = `${position + 100}px`; // Add track label width
}

// Format time in seconds to MM:SS format
function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00:00';
    
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Select a tool
function selectTool(tool) {
    // Deselect previous tool
    if (selectedTool) {
        document.getElementById(`${selectedTool}Tool`).classList.remove('active');
    }
    
    // Select new tool
    selectedTool = tool;
    document.getElementById(`${tool}Tool`).classList.add('active');
    
    console.log(`Selected tool: ${tool}`);
}

// Show effects modal
function showEffectsModal(effectType) {
    // Clear previous controls
    const effectControls = document.querySelector('.effect-controls');
    effectControls.innerHTML = '';
    
    // Create controls based on effect type
    if (effectType === 'brightness' || effectType === 'contrast' || effectType === 'saturation') {
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'slider-container';
        
        const label = document.createElement('label');
        label.innerHTML = `${effectType.charAt(0).toUpperCase() + effectType.slice(1)}: <span class="slider-value">0</span>`;
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = effectType === 'brightness' ? '-100' : effectType === 'contrast' ? '-100' : '-100';
        slider.max = effectType === 'brightness' ? '100' : effectType === 'contrast' ? '100' : '100';
        slider.value = '0';
        slider.step = '1';
        slider.id = `${effectType}Slider`;
        
        slider.addEventListener('input', () => {
            label.querySelector('.slider-value').textContent = slider.value;
        });
        
        sliderContainer.appendChild(label);
        sliderContainer.appendChild(slider);
        effectControls.appendChild(sliderContainer);
    } else if (effectType === 'blur') {
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'slider-container';
        
        const label = document.createElement('label');
        label.innerHTML = `Blur: <span class="slider-value">0</span>px`;
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '20';
        slider.value = '0';
        slider.step = '1';
        slider.id = 'blurSlider';
        
        slider.addEventListener('input', () => {
            label.querySelector('.slider-value').textContent = slider.value;
        });
        
        sliderContainer.appendChild(label);
        sliderContainer.appendChild(slider);
        effectControls.appendChild(sliderContainer);
    }
    
    // Store the effect type
    effectsModal.dataset.effectType = effectType;
    
    // Show the modal
    effectsModal.style.display = 'block';
}

// Handle apply effect button click
function handleApplyEffect() {
    const effectType = effectsModal.dataset.effectType;
    let value;
    
    if (effectType === 'brightness' || effectType === 'contrast' || effectType === 'saturation' || effectType === 'blur') {
        value = document.getElementById(`${effectType}Slider`).value;
    }
    
    // Apply the effect
    applyEffect(effectType, value);
    
    // Close the modal
    closeAllModals();
}

// Show export modal
function showExportModal() {
    exportModal.style.display = 'block';
}

// Export video
function exportVideo() {
    const format = document.getElementById('exportFormat').value;
    const quality = document.getElementById('exportQuality').value;
    const resolution = document.getElementById('exportResolution').value;
    
    console.log(`Exporting video in ${format} format with ${quality} quality at ${resolution} resolution`);
    
    // In a real application, this would handle the actual export process
    // For this demo, we'll just show an alert
    alert('エクスポート機能はデモバージョンでは利用できません。実際のアプリケーションでは、ここで動画のエクスポート処理が行われます。');
    
    // Close the modal
    closeAllModals();
}

// Close all modals
function closeAllModals() {
    effectsModal.style.display = 'none';
    exportModal.style.display = 'none';
}

// Create a new project
function createNewProject() {
    // Confirm if there are unsaved changes
    if (currentProject.mediaItems.length > 0 && !confirm('未保存の変更があります。新しいプロジェクトを作成しますか？')) {
        return;
    }
    
    // Reset project data
    currentProject = {
        name: 'Untitled Project',
        mediaItems: [],
        timeline: {
            videoTrack: [],
            audioTrack: [],
            effectsTrack: []
        },
        duration: 0
    };
    
    // Clear media library
    mediaList.innerHTML = '';
    
    // Clear timeline
    document.getElementById('videoTrack').innerHTML = '';
    document.getElementById('audioTrack').innerHTML = '';
    document.getElementById('effectsTrack').innerHTML = '';
    
    // Clear preview
    previewVideo.src = '';
    previewVideo.style.display = 'block';
    const videoContainer = document.querySelector('.video-container');
    const existingImg = videoContainer.querySelector('img');
    if (existingImg) {
        videoContainer.removeChild(existingImg);
    }
    
    // Reset time display
    timeDisplay.textContent = '00:00:00 / 00:00:00';
    
    console.log('New project created');
}

// Save project
function saveProject() {
    // In a real application, this would save the project to a file
    // For this demo, we'll just create a JSON representation and log it
    const projectData = JSON.stringify(currentProject, (key, value) => {
        // Skip file objects and URLs as they can't be serialized
        if (key === 'file' || key === 'url') return undefined;
        return value;
    }, 2);
    
    console.log('Project saved:', projectData);
    
    // In a real application, we would save this to a file
    // For this demo, we'll just show an alert
    alert('プロジェクトの保存機能はデモバージョンでは利用できません。実際のアプリケーションでは、ここでプロジェクトファイルの保存処理が行われます。');
}

// Open project
function openProject() {
    // In a real application, this would open a file dialog
    // For this demo, we'll just show an alert
    alert('プロジェクトを開く機能はデモバージョンでは利用できません。実際のアプリケーションでは、ここでプロジェクトファイルを開く処理が行われます。');
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
