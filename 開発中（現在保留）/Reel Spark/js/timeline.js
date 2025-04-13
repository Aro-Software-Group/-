// Import from other modules
import { currentProject, formatTime } from './app.js';

// Export config for other modules
export { config };

// Timeline configuration
const config = {
    secondWidth: 100, // Width in pixels for 1 second of media
    minZoom: 50,      // Minimum zoom level (pixels per second)
    maxZoom: 200,     // Maximum zoom level (pixels per second)
    currentZoom: 100  // Current zoom level
};

// Initialize the timeline
function initializeTimeline() {
    createTimeMarkers();
    setupTrackEventListeners();
    setupTimelineZoom();
    
    console.log('Timeline initialized');
}

// Create time markers in the timeline header
function createTimeMarkers() {
    const timeMarkers = document.querySelector('.time-markers');
    timeMarkers.innerHTML = '';
    
    // Default to 60 seconds timeline
    const duration = 60;
    const markerInterval = 1; // 1 second interval
    
    for (let i = 0; i <= duration; i += markerInterval) {
        const marker = document.createElement('div');
        marker.className = 'time-marker';
        marker.style.left = `${i * config.secondWidth}px`;
        marker.textContent = formatTime(i);
        timeMarkers.appendChild(marker);
    }
}

// Set up event listeners for tracks
function setupTrackEventListeners() {
    const tracks = document.querySelectorAll('.track-content');
    
    tracks.forEach(track => {
        // Handle drag and drop of media items
        track.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        
        track.addEventListener('drop', (e) => {
            e.preventDefault();
            const mediaId = e.dataTransfer.getData('text/plain');
            if (!mediaId) return;
            
            const mediaItem = currentProject.mediaItems.find(item => item.id === mediaId);
            if (!mediaItem) return;
            
            // Calculate drop position in the timeline
            const trackRect = track.getBoundingClientRect();
            const offsetX = e.clientX - trackRect.left;
            const startTime = offsetX / config.secondWidth;
            
            // Add clip to timeline
            addClipToTimeline(mediaItem, track.id, startTime);
        });
        
        // Handle click on track to set playhead position
        track.addEventListener('click', (e) => {
            if (e.target === track) {
                const trackRect = track.getBoundingClientRect();
                const offsetX = e.clientX - trackRect.left;
                const clickTime = offsetX / config.secondWidth;
                
                // Set playhead position
                const playhead = document.querySelector('.timeline-playhead');
                playhead.style.left = `${offsetX + 100}px`; // Add track label width
                
                // Set video current time if a video is loaded
                const previewVideo = document.getElementById('preview');
                if (previewVideo.src) {
                    previewVideo.currentTime = clickTime;
                }
            }
        });
    });
}

// Set up timeline zoom functionality
function setupTimelineZoom() {
    // This could be implemented with a zoom slider or mouse wheel events
    // For simplicity, we'll just use the current default zoom level
    
    // Example of how to update zoom:
    // updateTimelineZoom(config.currentZoom);
}

// Update timeline zoom level
function updateTimelineZoom(zoomLevel) {
    // Clamp zoom level to min/max
    zoomLevel = Math.max(config.minZoom, Math.min(config.maxZoom, zoomLevel));
    
    // Update current zoom
    config.currentZoom = zoomLevel;
    config.secondWidth = zoomLevel;
    
    // Update time markers
    createTimeMarkers();
    
    // Update clip positions
    updateClipPositions();
    
    console.log(`Timeline zoom updated to ${zoomLevel}`);
}

// Update clip positions based on current zoom
function updateClipPositions() {
    const clips = document.querySelectorAll('.clip');
    
    clips.forEach(clip => {
        const startTime = parseFloat(clip.dataset.startTime);
        const duration = parseFloat(clip.dataset.duration);
        
        clip.style.left = `${startTime * config.secondWidth}px`;
        clip.style.width = `${duration * config.secondWidth}px`;
    });
}

// Add a clip to the timeline
function addClipToTimeline(mediaItem, trackId, startTime) {
    const track = document.getElementById(trackId);
    if (!track) return;
    
    // Create clip element
    const clip = document.createElement('div');
    clip.className = 'clip';
    clip.dataset.id = `clip_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    clip.dataset.mediaId = mediaItem.id;
    clip.dataset.startTime = startTime;
    clip.dataset.duration = mediaItem.duration || 5; // Default to 5 seconds for images
    
    // Set clip position and size
    clip.style.left = `${startTime * config.secondWidth}px`;
    clip.style.width = `${(mediaItem.duration || 5) * config.secondWidth}px`;
    
    // Add class based on media type
    if (mediaItem.type === 'video') {
        clip.classList.add('video');
    } else if (mediaItem.type === 'audio') {
        clip.classList.add('audio');
    } else if (mediaItem.type === 'image') {
        clip.classList.add('image');
    }
    
    // Add clip label
    clip.textContent = mediaItem.name.length > 15 ? 
        mediaItem.name.substring(0, 12) + '...' : 
        mediaItem.name;
    clip.title = mediaItem.name;
    
    // Add resize handles
    const leftHandle = document.createElement('div');
    leftHandle.className = 'clip-handle left';
    
    const rightHandle = document.createElement('div');
    rightHandle.className = 'clip-handle right';
    
    clip.appendChild(leftHandle);
    clip.appendChild(rightHandle);
    
    // Add event listeners for clip interaction
    setupClipEventListeners(clip, leftHandle, rightHandle);
    
    // Add to track
    track.appendChild(clip);
    
    // Add to project data
    const clipData = {
        id: clip.dataset.id,
        mediaId: mediaItem.id,
        startTime: startTime,
        duration: mediaItem.duration || 5,
        trackId: trackId
    };
    
    if (trackId === 'videoTrack') {
        currentProject.timeline.videoTrack.push(clipData);
    } else if (trackId === 'audioTrack') {
        currentProject.timeline.audioTrack.push(clipData);
    } else if (trackId === 'effectsTrack') {
        currentProject.timeline.effectsTrack.push(clipData);
    }
    
    // Update project duration if needed
    const clipEndTime = startTime + (mediaItem.duration || 5);
    if (clipEndTime > currentProject.duration) {
        currentProject.duration = clipEndTime;
    }
    
    console.log(`Clip added to timeline: ${mediaItem.name} at ${formatTime(startTime)}`);
    
    return clip;
}

// Set up event listeners for clip interaction
function setupClipEventListeners(clip, leftHandle, rightHandle) {
    let isDragging = false;
    let isResizingLeft = false;
    let isResizingRight = false;
    let startX = 0;
    let startLeft = 0;
    let startWidth = 0;
    
    // Click to select clip
    clip.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Deselect all clips
        document.querySelectorAll('.clip').forEach(c => {
            c.classList.remove('selected');
        });
        
        // Select this clip
        clip.classList.add('selected');
        
        // Set as selected clip in the app
        // Use the exported selectedClip variable from app.js
        window.selectedClip = clip; // For backward compatibility
        selectedClip = clip;
        
        console.log(`Selected clip: ${clip.textContent}`);
    });
    
    // Double click to preview
    clip.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        
        const mediaId = clip.dataset.mediaId;
        const mediaItem = currentProject.mediaItems.find(item => item.id === mediaId);
        
        if (mediaItem) {
            // Preview the media
            const previewVideo = document.getElementById('preview');
            
            if (mediaItem.type === 'video') {
                previewVideo.src = mediaItem.url;
                previewVideo.style.display = 'block';
                previewVideo.currentTime = 0;
                previewVideo.play();
            } else if (mediaItem.type === 'audio') {
                // For audio, just play it
                const audio = new Audio(mediaItem.url);
                audio.play();
            } else if (mediaItem.type === 'image') {
                // For images, show in the preview area
                previewVideo.style.display = 'none';
                
                const videoContainer = document.querySelector('.video-container');
                // Remove any existing image preview
                const existingImg = videoContainer.querySelector('img');
                if (existingImg) {
                    videoContainer.removeChild(existingImg);
                }
                
                const imgPreview = document.createElement('img');
                imgPreview.src = mediaItem.url;
                imgPreview.style.maxWidth = '100%';
                imgPreview.style.maxHeight = '100%';
                
                videoContainer.appendChild(imgPreview);
            }
        }
    });
    
    // Drag to move clip
    clip.addEventListener('mousedown', (e) => {
        if (e.target === leftHandle || e.target === rightHandle) return;
        
        isDragging = true;
        startX = e.clientX;
        startLeft = parseInt(clip.style.left);
        
        e.preventDefault();
    });
    
    // Resize from left handle
    leftHandle.addEventListener('mousedown', (e) => {
        isResizingLeft = true;
        startX = e.clientX;
        startLeft = parseInt(clip.style.left);
        startWidth = parseInt(clip.style.width);
        
        e.preventDefault();
        e.stopPropagation();
    });
    
    // Resize from right handle
    rightHandle.addEventListener('mousedown', (e) => {
        isResizingRight = true;
        startX = e.clientX;
        startWidth = parseInt(clip.style.width);
        
        e.preventDefault();
        e.stopPropagation();
    });
    
    // Handle mouse move for drag and resize
    document.addEventListener('mousemove', (e) => {
        if (!isDragging && !isResizingLeft && !isResizingRight) return;
        
        const deltaX = e.clientX - startX;
        
        if (isDragging) {
            // Move the clip
            let newLeft = startLeft + deltaX;
            newLeft = Math.max(0, newLeft); // Prevent moving before 0
            
            clip.style.left = `${newLeft}px`;
            
            // Update data attribute
            clip.dataset.startTime = newLeft / config.secondWidth;
        } else if (isResizingLeft) {
            // Resize from left (changes both position and width)
            let newLeft = startLeft + deltaX;
            let newWidth = startWidth - deltaX;
            
            // Enforce minimum width
            const minWidth = 20;
            if (newWidth < minWidth) {
                newWidth = minWidth;
                newLeft = startLeft + startWidth - minWidth;
            }
            
            // Prevent moving before 0
            if (newLeft < 0) {
                newWidth = startWidth + startLeft;
                newLeft = 0;
            }
            
            clip.style.left = `${newLeft}px`;
            clip.style.width = `${newWidth}px`;
            
            // Update data attributes
            clip.dataset.startTime = newLeft / config.secondWidth;
            clip.dataset.duration = newWidth / config.secondWidth;
        } else if (isResizingRight) {
            // Resize from right (changes only width)
            let newWidth = startWidth + deltaX;
            
            // Enforce minimum width
            const minWidth = 20;
            newWidth = Math.max(minWidth, newWidth);
            
            clip.style.width = `${newWidth}px`;
            
            // Update data attribute
            clip.dataset.duration = newWidth / config.secondWidth;
        }
    });
    
    // Handle mouse up to end drag/resize
    document.addEventListener('mouseup', () => {
        if (isDragging || isResizingLeft || isResizingRight) {
            // Update project data
            const clipId = clip.dataset.id;
            const trackId = clip.parentElement.id;
            const startTime = parseFloat(clip.dataset.startTime);
            const duration = parseFloat(clip.dataset.duration);
            
            let trackData;
            if (trackId === 'videoTrack') {
                trackData = currentProject.timeline.videoTrack;
            } else if (trackId === 'audioTrack') {
                trackData = currentProject.timeline.audioTrack;
            } else if (trackId === 'effectsTrack') {
                trackData = currentProject.timeline.effectsTrack;
            }
            
            const clipData = trackData.find(c => c.id === clipId);
            if (clipData) {
                clipData.startTime = startTime;
                clipData.duration = duration;
            }
            
            // Update project duration if needed
            const clipEndTime = startTime + duration;
            if (clipEndTime > currentProject.duration) {
                currentProject.duration = clipEndTime;
            }
            
            console.log(`Clip updated: ${clip.textContent} at ${formatTime(startTime)} with duration ${formatTime(duration)}`);
        }
        
        isDragging = false;
        isResizingLeft = false;
        isResizingRight = false;
    });
}

// Update the timeline display
function updateTimeline() {
    // This function would be called when the project data changes
    // to update the visual representation of the timeline
    
    // Clear existing clips
    document.getElementById('videoTrack').innerHTML = '';
    document.getElementById('audioTrack').innerHTML = '';
    document.getElementById('effectsTrack').innerHTML = '';
    
    // Add video track clips
    currentProject.timeline.videoTrack.forEach(clipData => {
        const mediaItem = currentProject.mediaItems.find(item => item.id === clipData.mediaId);
        if (mediaItem) {
            const clip = addClipToTimeline(mediaItem, 'videoTrack', clipData.startTime);
            clip.dataset.id = clipData.id;
            clip.style.width = `${clipData.duration * config.secondWidth}px`;
            clip.dataset.duration = clipData.duration;
        }
    });
    
    // Add audio track clips
    currentProject.timeline.audioTrack.forEach(clipData => {
        const mediaItem = currentProject.mediaItems.find(item => item.id === clipData.mediaId);
        if (mediaItem) {
            const clip = addClipToTimeline(mediaItem, 'audioTrack', clipData.startTime);
            clip.dataset.id = clipData.id;
            clip.style.width = `${clipData.duration * config.secondWidth}px`;
            clip.dataset.duration = clipData.duration;
        }
    });
    
    // Add effects track clips
    currentProject.timeline.effectsTrack.forEach(clipData => {
        const mediaItem = currentProject.mediaItems.find(item => item.id === clipData.mediaId);
        if (mediaItem) {
            const clip = addClipToTimeline(mediaItem, 'effectsTrack', clipData.startTime);
            clip.dataset.id = clipData.id;
            clip.style.width = `${clipData.duration * config.secondWidth}px`;
            clip.dataset.duration = clipData.duration;
        }
    });
}

// Export functions
export {
    initializeTimeline,
    addClipToTimeline,
    updateTimeline,
    updateTimelineZoom
};
