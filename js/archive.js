// Function to open archive project view modal
function openArchiveProjectViewModal(projectId) {
    const modal = document.getElementById('archiveProjectViewModal');
    const content = document.getElementById('archiveProjectViewContent');
    
    // Show loading state
    content.innerHTML = '<div style="text-align: center; padding: 20px;"><div class="loading-spinner"></div><p>Loading project details...</p></div>';
    modal.style.display = 'block';
    
    // Fetch project data
    firebase.database().ref('projects/admin-user/' + projectId).once('value')
        .then(snapshot => {
            const project = snapshot.val();
            if (!project) {
                content.innerHTML = '<div style="color: #d32f2f; text-align: center; padding: 20px;">Project not found.</div>';
                return;
            }
            
            // Get file count and list
            const files = project.files || {};
            const fileCount = Object.keys(files).length;
            let filesHtml = '';
            
            if (fileCount > 0) {
                filesHtml = '<div style="margin-top: 20px;"><h3 style="font-size: 18px; margin-bottom: 12px;">Uploaded Files</h3>';
                filesHtml += '<div style="display: grid; gap: 12px;">';
                
                Object.entries(files).forEach(([fileId, file]) => {
                    const fileSize = formatFileSize(file.size);
                    const uploadDate = new Date(file.uploadedAt).toLocaleString();
                    
                    filesHtml += `
                        <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; border: 1px solid #ddd;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <div style="font-weight: 600; font-size: 16px;">
                                    <i class="fas ${getFileIcon(file.type)}"></i> ${file.name}
                                </div>
                                <a href="${file.data}" download="${file.name}" 
                                   style="padding: 6px 12px; border-radius: 4px; border: 1px solid #1976d2; 
                                          background: #fff; color: #1976d2; text-decoration: none; 
                                          font-size: 14px; cursor: pointer;">
                                    <i class="fas fa-download"></i> Download
                                </a>
                            </div>
                            <div style="color: #666; font-size: 14px;">
                                <div>Size: ${fileSize}</div>
                                <div>Uploaded by: ${file.uploadedBy || 'Unknown'}</div>
                                <div>Date: ${uploadDate}</div>
                            </div>
                        </div>
                    `;
                });
                
                filesHtml += '</div></div>';
            }

            // Build the modal content
            content.innerHTML = `
                <div style="margin-bottom: 24px;">
                    <h2 style="font-size: 24px; margin-bottom: 16px;">${project.name || 'Untitled Project'}</h2>
                    <p style="color: #666; font-size: 16px; margin-bottom: 16px;">${project.description || 'No description'}</p>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 24px;">
                    <div>
                        <h3 style="font-size: 18px; margin-bottom: 12px;">Project Details</h3>
                        <div style="color: #666; font-size: 14px;">
                            <div style="margin-bottom: 8px;"><strong>Type:</strong> ${project.type || 'Not specified'}</div>
                            <div style="margin-bottom: 8px;"><strong>Duration:</strong> ${project.duration || 'Not specified'}</div>
                            <div style="margin-bottom: 8px;"><strong>Budget:</strong> ${project.budget ? '₱' + project.budget : 'Not specified'}</div>
                            <div style="margin-bottom: 8px;"><strong>Location:</strong> ${project.location || 'Not specified'}</div>
                            <div style="margin-bottom: 8px;"><strong>Team Leader:</strong> ${project.leader || 'Not specified'}</div>
                            <div style="margin-bottom: 8px;"><strong>Completed:</strong> ${project.completedAt ? new Date(project.completedAt).toLocaleDateString() : 'Not specified'}</div>
                        </div>
                    </div>
                    
                    <div>
                        <h3 style="font-size: 18px; margin-bottom: 12px;">Team Members</h3>
                        <div style="color: #666; font-size: 14px;">
                            ${project.teamMembers ? Object.values(project.teamMembers).map(member => 
                                `<div style="margin-bottom: 4px;">${member.email}</div>`
                            ).join('') : 'No team members'}
                        </div>
                    </div>
                </div>
                
                ${filesHtml}
            `;
        })
        .catch(error => {
            console.error('Error loading project details:', error);
            content.innerHTML = '<div style="color: #d32f2f; text-align: center; padding: 20px;">Error loading project details. Please try again.</div>';
        });
}

// Function to close archive project view modal
function closeArchiveProjectViewModal() {
    document.getElementById('archiveProjectViewModal').style.display = 'none';
}

function formatFileSize(bytes) {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(fileType) {
    if (!fileType) return 'fa-file';
    
    const type = fileType.toLowerCase();
    if (type.includes('image')) return 'fa-file-image';
    if (type.includes('pdf')) return 'fa-file-pdf';
    if (type.includes('word') || type.includes('doc')) return 'fa-file-word';
    if (type.includes('excel') || type.includes('sheet')) return 'fa-file-excel';
    if (type.includes('powerpoint') || type.includes('presentation')) return 'fa-file-powerpoint';
    if (type.includes('zip') || type.includes('archive')) return 'fa-file-archive';
    if (type.includes('text')) return 'fa-file-alt';
    if (type.includes('video')) return 'fa-file-video';
    if (type.includes('audio')) return 'fa-file-audio';
    return 'fa-file';
} 