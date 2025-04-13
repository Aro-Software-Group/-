// Import from other modules
import { currentProject, selectedClip } from './app.js';
import { updateTimeline } from './timeline.js';
import { config } from './timeline.js';

// Apply an effect to the selected clip
function applyEffect(effectType, value) {
    if (!selectedClip) {
        console.error('No clip selected');
        alert('エフェクトを適用するクリップを選択してください。');
        return false;
    }
    
    const clipId = selectedClip.dataset.id;
    
    // Find the clip in the project data
    let clip = null;
    let trackName = '';
    
    for (const tName of ['videoTrack', 'audioTrack', 'effectsTrack']) {
        const track = currentProject.timeline[tName];
        const foundClip = track.find(c => c.id === clipId);
        if (foundClip) {
            clip = foundClip;
            trackName = tName;
            break;
        }
    }
    
    if (!clip) {
        console.error(`Clip with ID ${clipId} not found in project data`);
        return false;
    }
    
    // Add or update effect
    if (!clip.effects) {
        clip.effects = {};
    }
    
    clip.effects[effectType] = value;
    
    console.log(`Applied ${effectType} effect with value ${value} to clip ${clipId}`);
    
    // In a real application, we would apply the effect to the preview
    // For this demo, we'll just add a visual indicator to the clip
    
    // Add effect indicator to the clip element
    if (!selectedClip.querySelector(`.effect-indicator.${effectType}`)) {
        const indicator = document.createElement('div');
        indicator.className = `effect-indicator ${effectType}`;
        indicator.title = `${effectType}: ${value}`;
        indicator.style.position = 'absolute';
        indicator.style.top = '2px';
        indicator.style.right = '2px';
        indicator.style.width = '8px';
        indicator.style.height = '8px';
        indicator.style.borderRadius = '50%';
        indicator.style.backgroundColor = getEffectColor(effectType);
        
        selectedClip.appendChild(indicator);
    } else {
        const indicator = selectedClip.querySelector(`.effect-indicator.${effectType}`);
        indicator.title = `${effectType}: ${value}`;
    }
    
    // Create an effect clip in the effects track
    createEffectClip(clip, effectType, value);
    
    return true;
}

// Apply a filter to the selected clip
function applyFilter(filterType) {
    if (!selectedClip) {
        console.error('No clip selected');
        alert('フィルターを適用するクリップを選択してください。');
        return false;
    }
    
    const clipId = selectedClip.dataset.id;
    
    // Find the clip in the project data
    let clip = null;
    let trackName = '';
    
    for (const tName of ['videoTrack', 'audioTrack']) {
        const track = currentProject.timeline[tName];
        const foundClip = track.find(c => c.id === clipId);
        if (foundClip) {
            clip = foundClip;
            trackName = tName;
            break;
        }
    }
    
    if (!clip) {
        console.error(`Clip with ID ${clipId} not found in project data`);
        return false;
    }
    
    // Set filter
    clip.filter = filterType;
    
    console.log(`Applied ${filterType} filter to clip ${clipId}`);
    
    // In a real application, we would apply the filter to the preview
    // For this demo, we'll just add a visual indicator to the clip
    
    // Remove any existing filter indicators
    const existingIndicators = selectedClip.querySelectorAll('.filter-indicator');
    existingIndicators.forEach(indicator => {
        selectedClip.removeChild(indicator);
    });
    
    // Add filter indicator to the clip element
    const indicator = document.createElement('div');
    indicator.className = `filter-indicator ${filterType}`;
    indicator.title = `Filter: ${filterType}`;
    indicator.style.position = 'absolute';
    indicator.style.bottom = '2px';
    indicator.style.right = '2px';
    indicator.style.width = '8px';
    indicator.style.height = '8px';
    indicator.style.borderRadius = '50%';
    indicator.style.backgroundColor = getFilterColor(filterType);
    
    selectedClip.appendChild(indicator);
    
    // Create an effect clip in the effects track
    createEffectClip(clip, 'filter', filterType);
    
    return true;
}

// Create an effect clip in the effects track
function createEffectClip(sourceClip, effectType, value) {
    // Create a new effect clip in the effects track
    const effectsTrack = document.getElementById('effectsTrack');
    
    // Check if there's already an effect clip for this source clip and effect type
    const existingEffectClip = Array.from(effectsTrack.children).find(clip => {
        return clip.dataset.sourceClipId === sourceClip.id && 
               clip.dataset.effectType === effectType;
    });
    
    if (existingEffectClip) {
        // Update existing effect clip
        existingEffectClip.title = `${effectType}: ${value}`;
        
        // Update in project data
        const effectClipData = currentProject.timeline.effectsTrack.find(
            c => c.id === existingEffectClip.dataset.id
        );
        
        if (effectClipData) {
            effectClipData.effectValue = value;
        }
        
        return;
    }
    
    // Create new effect clip
    const effectClip = document.createElement('div');
    effectClip.className = 'clip effect';
    effectClip.dataset.id = `effect_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    effectClip.dataset.sourceClipId = sourceClip.id;
    effectClip.dataset.effectType = effectType;
    effectClip.dataset.startTime = sourceClip.startTime;
    effectClip.dataset.duration = sourceClip.duration;
    
    // Set position and size
    effectClip.style.left = `${sourceClip.startTime * config.secondWidth}px`;
    effectClip.style.width = `${sourceClip.duration * config.secondWidth}px`;
    
    // Set content and style
    effectClip.textContent = effectType;
    effectClip.title = `${effectType}: ${value}`;
    effectClip.style.backgroundColor = getEffectColor(effectType);
    
    // Add to track
    effectsTrack.appendChild(effectClip);
    
    // Add to project data
    const effectClipData = {
        id: effectClip.dataset.id,
        sourceClipId: sourceClip.id,
        effectType: effectType,
        effectValue: value,
        startTime: sourceClip.startTime,
        duration: sourceClip.duration,
        trackId: 'effectsTrack'
    };
    
    currentProject.timeline.effectsTrack.push(effectClipData);
    
    console.log(`Created effect clip for ${effectType} on clip ${sourceClip.id}`);
}

// Get color for effect indicator
function getEffectColor(effectType) {
    switch (effectType) {
        case 'brightness':
            return '#f39c12'; // Yellow
        case 'contrast':
            return '#3498db'; // Blue
        case 'saturation':
            return '#2ecc71'; // Green
        case 'blur':
            return '#9b59b6'; // Purple
        default:
            return '#e74c3c'; // Red
    }
}

// Get color for filter indicator
function getFilterColor(filterType) {
    switch (filterType) {
        case 'grayscale':
            return '#7f8c8d'; // Gray
        case 'sepia':
            return '#d35400'; // Orange
        case 'invert':
            return '#8e44ad'; // Purple
        case 'vintage':
            return '#c0392b'; // Dark Red
        default:
            return '#16a085'; // Teal
    }
}

// Export functions
export {
    applyEffect,
    applyFilter
};
