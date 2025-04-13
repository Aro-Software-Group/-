// Import from other modules
import { currentProject, selectedClip } from './app.js';
import { updateTimeline } from './timeline.js';

// Trim video function - removes parts of the clip outside the specified range
function trimVideo(clipId, startTrim, endTrim) {
    // Find the clip in the project data
    let clip = null;
    let trackData = null;
    
    for (const trackName of ['videoTrack', 'audioTrack', 'effectsTrack']) {
        const track = currentProject.timeline[trackName];
        const foundClip = track.find(c => c.id === clipId);
        if (foundClip) {
            clip = foundClip;
            trackData = track;
            break;
        }
    }
    
    if (!clip) {
        console.error(`Clip with ID ${clipId} not found`);
        return false;
    }
    
    // Calculate new duration
    const originalDuration = clip.duration;
    const newDuration = originalDuration - startTrim - endTrim;
    
    if (newDuration <= 0) {
        console.error('Invalid trim values: resulting clip would have zero or negative duration');
        return false;
    }
    
    // Update clip data
    clip.startTime += startTrim;
    clip.duration = newDuration;
    
    // In a real application, we would also need to update the actual media file
    // For this demo, we'll just update the project data
    
    console.log(`Trimmed clip ${clipId}: removed ${startTrim}s from start and ${endTrim}s from end`);
    
    // Update the timeline display
    updateTimeline();
    
    return true;
}

// Cut video function - splits a clip into two at the specified time
function cutVideo(clipId, cutTime) {
    // Find the clip in the project data
    let clip = null;
    let trackName = '';
    let trackIndex = -1;
    
    for (const tName of ['videoTrack', 'audioTrack', 'effectsTrack']) {
        const track = currentProject.timeline[tName];
        const index = track.findIndex(c => c.id === clipId);
        if (index !== -1) {
            clip = track[index];
            trackName = tName;
            trackIndex = index;
            break;
        }
    }
    
    if (!clip) {
        console.error(`Clip with ID ${clipId} not found`);
        return false;
    }
    
    // Calculate relative cut position
    const clipStart = clip.startTime;
    const clipDuration = clip.duration;
    const relativeCutTime = cutTime - clipStart;
    
    if (relativeCutTime <= 0 || relativeCutTime >= clipDuration) {
        console.error('Invalid cut position: must be within the clip duration');
        return false;
    }
    
    // Create two new clips
    const firstClip = {
        ...clip,
        id: `clip_${Date.now()}_1`,
        duration: relativeCutTime
    };
    
    const secondClip = {
        ...clip,
        id: `clip_${Date.now()}_2`,
        startTime: cutTime,
        duration: clipDuration - relativeCutTime
    };
    
    // Replace the original clip with the two new clips
    currentProject.timeline[trackName].splice(trackIndex, 1, firstClip, secondClip);
    
    console.log(`Cut clip ${clipId} at ${cutTime}s into two clips: ${firstClip.id} and ${secondClip.id}`);
    
    // Update the timeline display
    updateTimeline();
    
    return [firstClip.id, secondClip.id];
}

// Merge videos function - combines two clips into one
function mergeVideos(clipId1, clipId2) {
    // Find both clips
    let clip1 = null;
    let clip2 = null;
    let trackName = '';
    let track = null;
    let index1 = -1;
    let index2 = -1;
    
    for (const tName of ['videoTrack', 'audioTrack', 'effectsTrack']) {
        track = currentProject.timeline[tName];
        index1 = track.findIndex(c => c.id === clipId1);
        index2 = track.findIndex(c => c.id === clipId2);
        
        if (index1 !== -1 && index2 !== -1) {
            clip1 = track[index1];
            clip2 = track[index2];
            trackName = tName;
            break;
        }
    }
    
    if (!clip1 || !clip2) {
        console.error('Both clips must be on the same track and must exist');
        return false;
    }
    
    // Ensure clips are adjacent
    const clip1End = clip1.startTime + clip1.duration;
    const clip2Start = clip2.startTime;
    
    if (Math.abs(clip1End - clip2Start) > 0.1) { // Allow small tolerance
        console.error('Clips must be adjacent to merge');
        return false;
    }
    
    // Create merged clip
    const mergedClip = {
        id: `clip_${Date.now()}_merged`,
        mediaId: clip1.mediaId, // In a real app, we'd need to create a new merged media file
        startTime: Math.min(clip1.startTime, clip2.startTime),
        duration: clip1.duration + clip2.duration,
        trackId: clip1.trackId
    };
    
    // Replace the two clips with the merged clip
    const minIndex = Math.min(index1, index2);
    const maxIndex = Math.max(index1, index2);
    
    currentProject.timeline[trackName].splice(minIndex, 2, mergedClip);
    
    console.log(`Merged clips ${clipId1} and ${clipId2} into new clip ${mergedClip.id}`);
    
    // Update the timeline display
    updateTimeline();
    
    return mergedClip.id;
}

// Split video function - removes a section from the middle of a clip
function splitVideo(clipId, startTime, endTime) {
    // Find the clip in the project data
    let clip = null;
    let trackName = '';
    let trackIndex = -1;
    
    for (const tName of ['videoTrack', 'audioTrack', 'effectsTrack']) {
        const track = currentProject.timeline[tName];
        const index = track.findIndex(c => c.id === clipId);
        if (index !== -1) {
            clip = track[index];
            trackName = tName;
            trackIndex = index;
            break;
        }
    }
    
    if (!clip) {
        console.error(`Clip with ID ${clipId} not found`);
        return false;
    }
    
    // Calculate relative split positions
    const clipStart = clip.startTime;
    const clipEnd = clipStart + clip.duration;
    
    if (startTime < clipStart || endTime > clipEnd || startTime >= endTime) {
        console.error('Invalid split range: must be within the clip and have positive duration');
        return false;
    }
    
    // Create two new clips (before and after the split)
    const firstClip = {
        ...clip,
        id: `clip_${Date.now()}_1`,
        duration: startTime - clipStart
    };
    
    const secondClip = {
        ...clip,
        id: `clip_${Date.now()}_2`,
        startTime: endTime,
        duration: clipEnd - endTime
    };
    
    // Replace the original clip with the two new clips
    currentProject.timeline[trackName].splice(trackIndex, 1, firstClip, secondClip);
    
    console.log(`Split clip ${clipId} removing section from ${startTime}s to ${endTime}s`);
    
    // Update the timeline display
    updateTimeline();
    
    return [firstClip.id, secondClip.id];
}

// Export functions
export {
    trimVideo,
    cutVideo,
    mergeVideos,
    splitVideo
};
