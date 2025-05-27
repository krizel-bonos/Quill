// tasks.js
// Task Management Functions

// Function to show the add task modal
function showAddTaskModal() {
    const modal = document.getElementById('addTaskModal');
    const select = document.getElementById('taskAssigneeSelect');
    select.innerHTML = '<option value="">Select team member...</option>';
    
    // Get current project ID
    const projectId = getCurrentProjectId() || document.getElementById('projectDetailView').getAttribute('data-project-id');
    
    // Fetch team members for this project
    firebase.database().ref('projects/admin-user/' + projectId + '/teamMembers').once('value').then(snapshot => {
        snapshot.forEach(memberSnap => {
            const member = memberSnap.val();
            if (member && member.email) {
                const option = document.createElement('option');
                option.value = member.email.trim().toLowerCase(); // Store normalized email
                option.textContent = member.email; // Display original email
                select.appendChild(option);
            }
        });
    });
    
    modal.style.display = 'flex';
}

// Function to close the add task modal
function closeAddTaskModal() {
    document.getElementById('addTaskModal').style.display = 'none';
    // Clear form
    document.getElementById('taskTitleInput').value = '';
    document.getElementById('taskDescriptionInput').value = '';
    document.getElementById('taskAssigneeSelect').value = '';
    document.getElementById('taskDueDateInput').value = '';
}

// Function to add a new task
function addTask() {
    const title = document.getElementById('taskTitleInput').value;
    const description = document.getElementById('taskDescriptionInput').value;
    let assignee = document.getElementById('taskAssigneeSelect').value;
    const dueDate = document.getElementById('taskDueDateInput').value;
    const priority = document.getElementById('taskPrioritySelect').value;
    
    if (!title || !assignee || !dueDate) {
        alert('Please fill in all required fields');
        return;
    }
    
    const projectId = getCurrentProjectId() || document.getElementById('projectDetailView').getAttribute('data-project-id');
    
    // Ensure assignee email is properly formatted
    assignee = assignee.trim().toLowerCase();
    
    console.log('Adding task:', { title, assignee, projectId }); // Debug log
    
    // Store the task under /projects/admin-user/{projectId}/tasks/
    firebase.database().ref('projects/admin-user/' + projectId + '/tasks').push({
        title: title,
        description: description,
        assignee: assignee,
        dueDate: dueDate,
        priority: priority,
        status: 'pending',
        createdAt: Date.now()
    }).then(() => {
        console.log('Task added successfully'); // Debug log
        closeAddTaskModal();
        loadTasks(projectId);
        loadUserTasks(); // Refresh dashboard tasks
        document.getElementById('taskTitleInput').value = '';
        document.getElementById('taskDescriptionInput').value = '';
        document.getElementById('taskAssigneeSelect').value = '';
        document.getElementById('taskDueDateInput').value = '';
        document.getElementById('taskPrioritySelect').value = 'low';
    }).catch(error => {
        console.error('Error adding task:', error);
        alert('Error adding task. Please try again.');
    });
}

// Function to load tasks for a project
function loadTasks(projectId) {
    projectId = projectId || getCurrentProjectId() || document.getElementById('projectDetailView').getAttribute('data-project-id');
    
    // Get current user email
    let currentUserEmail = firebase.auth().currentUser?.email || localStorage.getItem('userEmail') || '';
    currentUserEmail = currentUserEmail.trim().toLowerCase();
    
    // Get tasks list div
    const tasksListDiv = document.getElementById('pvTasksList');
    if (!tasksListDiv) return;
    
    // Show loading state
    tasksListDiv.innerHTML = '<div style="text-align: center; padding: 20px;">Loading tasks...</div>';
    
    // First check if user is team leader
    firebase.database().ref('projects/admin-user/' + projectId).once('value').then(projectSnap => {
        const project = projectSnap.val();
        const isTeamLeader = project && project.leader && project.leader.trim().toLowerCase() === currentUserEmail;
        
        // Then load tasks
        firebase.database().ref('projects/admin-user/' + projectId + '/tasks').once('value').then(snapshot => {
            let html = '<div style="display: flex; flex-direction: column; gap: 16px;">';
            let hasTasks = false;
            
            snapshot.forEach(taskSnap => {
                const task = taskSnap.val();
                const assigneeEmail = (task.assignee || '').trim().toLowerCase();
                const isAssignedToCurrentUser = assigneeEmail === currentUserEmail;
                
                // Team leader sees ALL tasks, team member sees only their tasks
                if (isTeamLeader) {
                    hasTasks = true;
                    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                    const isOverdue = dueDate && dueDate < new Date() && task.status !== 'completed';
                    const formattedDueDate = dueDate ? dueDate.toLocaleDateString() : 'No due date';
                    
                    html += `
                        <div class="task-item ${task.status === 'completed' ? 'completed' : ''}" 
                             style="background: #f8f9fa; border-radius: 8px; padding: 16px; border: 1px solid #ddd; 
                                    ${task.status === 'completed' ? 'opacity: 0.7; background-color: #f0f8f0;' : ''}">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                                <div style="font-weight: 600; font-size: 16px;">${task.title}</div>
                                <div style="font-size: 14px; color: #666;">
                                    ${task.status === 'completed' ? 
                                        '<span style="color: #388e3c;"><i class="fas fa-check-circle"></i> Completed</span>' : 
                                        `<span style="color: ${isOverdue ? '#d32f2f' : '#666'}">Due: ${formattedDueDate}</span>`
                                    }
                                </div>
                            </div>
                            <div style="color: #666; margin-bottom: 8px;">${task.description || 'No description provided'}</div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="font-size: 14px; color: #666;">
                                    Assigned to: ${assigneeEmail}
                                    <span style="margin-left: 12px; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; 
                                        ${task.priority === 'high' ? 'background-color: #ffebee; color: #d32f2f;' : 
                                          task.priority === 'medium' ? 'background-color: #fff3e0; color: #f57c00;' : 
                                          'background-color: #e8f5e9; color: #388e3c;'}">
                                        ${task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Low'} Priority
                                    </span>
                                </div>
                                <div style="display: flex; gap: 8px;">
                                    ${(assigneeEmail === currentUserEmail && task.status !== 'completed') ? `
                                        <button class="mark-done-btn-leader" onclick="updateTaskStatus('${projectId}', '${taskSnap.key}', 'completed')" 
                                                style="padding: 6px 12px; border-radius: 4px; border: 1.5px solid #388e3c; background: #fff; color: #388e3c; cursor: pointer; font-size: 14px; transition: all 0.2s;">
                                            <i class="fas fa-check"></i> Mark as Done
                                        </button>
                                    ` : ''}
                                    <button onclick="deleteTask('${projectId}', '${taskSnap.key}')" 
                                            style="padding: 6px 12px; border-radius: 4px; border: none; background: #d32f2f; color: #fff; cursor: pointer; font-size: 14px;">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                } else if (isAssignedToCurrentUser) {
                    hasTasks = true;
                    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                    const isOverdue = dueDate && dueDate < new Date() && task.status !== 'completed';
                    const formattedDueDate = dueDate ? dueDate.toLocaleDateString() : 'No due date';
                    
                    html += `
                        <div class="task-item ${task.status === 'completed' ? 'completed' : ''}" 
                             style="background: #f8f9fa; border-radius: 8px; padding: 16px; border: 1px solid #ddd; 
                                    ${task.status === 'completed' ? 'opacity: 0.7; background-color: #f0f8f0;' : ''}">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                                <div style="font-weight: 600; font-size: 16px;">${task.title}</div>
                                <div style="font-size: 14px; color: #666;">
                                    ${task.status === 'completed' ? 
                                        '<span style="color: #388e3c;"><i class="fas fa-check-circle"></i> Completed</span>' : 
                                        `<span style="color: ${isOverdue ? '#d32f2f' : '#666'}">Due: ${formattedDueDate}</span>`
                                    }
                                </div>
                            </div>
                            <div style="color: #666; margin-bottom: 8px;">${task.description || 'No description provided'}</div>
                            <div style="display: flex; justify-content: flex-end; align-items: center;">
                                ${task.status !== 'completed' ? `
                                    <button onclick="updateTaskStatus('${projectId}', '${taskSnap.key}', 'completed')" 
                                            style="padding: 6px 12px; border-radius: 4px; border: none; background: #388e3c; color: #fff; cursor: pointer; font-size: 14px;">
                                        <i class="fas fa-check"></i> Mark as Done
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }
            });
            
            html += '</div>';
            tasksListDiv.innerHTML = hasTasks ? html : 'No tasks assigned to you.';
            
            // Update project progress after loading tasks
            updateProjectProgress(projectId);

            // After rendering tasks, add this JS to enable hover effect for the leader's Mark as Done buttons
            setTimeout(() => {
                const leaderMarkDoneBtns = document.querySelectorAll('.mark-done-btn-leader');
                leaderMarkDoneBtns.forEach(btn => {
                    btn.addEventListener('mouseover', function() {
                        this.style.background = '#388e3c';
                        this.style.color = '#fff';
                    });
                    btn.addEventListener('mouseout', function() {
                        this.style.background = '#fff';
                        this.style.color = '#388e3c';
                    });
                });
            }, 0);
        });
    });
}

// Function to update task status
function updateTaskStatus(projectId, taskId, newStatus) {
    let currentUserEmail = firebase.auth().currentUser?.email || localStorage.getItem('userEmail') || '';
    currentUserEmail = currentUserEmail.trim().toLowerCase();

    firebase.database().ref(`projects/admin-user/${projectId}/tasks/${taskId}`).once('value').then(snapshot => {
        const task = snapshot.val();
        const assigneeEmail = (task.assignee || '').trim().toLowerCase();

        if (assigneeEmail === currentUserEmail || isTeamLeader(projectId)) {
            firebase.database().ref(`projects/admin-user/${projectId}/tasks/${taskId}`).update({
                status: newStatus,
                completedAt: newStatus === 'completed' ? Date.now() : null
            }).then(() => {
                updateProjectProgress(projectId);
                loadUserTasks();
                loadTasks(projectId);
            });
        } else {
            alert('You are not authorized to update this task.');
        }
    });
}

// Function to delete a task
function deleteTask(projectId, taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        firebase.database().ref('projects/admin-user/' + projectId + '/tasks/' + taskId).remove()
            .then(() => {
                loadTasks(projectId);
                loadUserTasks(); // Refresh dashboard tasks
            });
    }
}

// Function to load user's tasks for dashboard
function loadUserTasks() {
    // Get current user's email
    let currentUserEmail = '';
    if (window.firebase && firebase.auth && firebase.auth().currentUser) {
        currentUserEmail = firebase.auth().currentUser.email || '';
    }
    if (!currentUserEmail) {
        currentUserEmail = localStorage.getItem('tempEmail') || localStorage.getItem('userEmail') || '';
    }
    currentUserEmail = currentUserEmail.trim().toLowerCase();

    if (!currentUserEmail) {
        console.log('No user email found');
        return;
    }

    console.log('Loading tasks for user:', currentUserEmail); // Debug log

    // Fetch all projects where user is a member
    firebase.database().ref('projects/admin-user').once('value').then(snapshot => {
        const tasks = [];
        const promises = [];
        
        if (snapshot.exists()) {
            snapshot.forEach(projectSnapshot => {
                const projectId = projectSnapshot.key;
                const projectData = projectSnapshot.val();
                
                // Check if user is a team member or leader
                const isLeader = projectData.leader && projectData.leader.toLowerCase().trim() === currentUserEmail;
                const isTeamMember = projectData.teamMembers && Object.values(projectData.teamMembers).some(member => 
                    member.email && member.email.toLowerCase().trim() === currentUserEmail
                );
                
                if (isLeader || isTeamMember) {
                    // Fetch tasks for this project
                    const promise = firebase.database().ref('projects/admin-user/' + projectId + '/tasks').once('value')
                        .then(taskSnapshot => {
                            if (taskSnapshot.exists()) {
                                taskSnapshot.forEach(taskSnap => {
                                    const task = taskSnap.val();
                                    const assigneeEmail = (task.assignee || '').trim().toLowerCase();
                                    
                                    console.log('Task found:', task.title, 'Assignee:', assigneeEmail); // Debug log
                                    
                                    if (assigneeEmail === currentUserEmail) {
                                        tasks.push({
                                            ...task,
                                            projectId: projectId,
                                            projectName: projectData.name || 'Untitled Project',
                                            taskId: taskSnap.key
                                        });
                                    }
                                });
                            }
                        });
                    promises.push(promise);
                }
            });
        }
        
        // Wait for all task fetching to complete
        Promise.all(promises).then(() => {
            console.log('All tasks loaded:', tasks.length); // Debug log
            displayUserTasks(tasks);
        });
    }).catch(error => {
        console.error('Error loading tasks:', error);
    });
}

// Function to display user's tasks in dashboard
function displayUserTasks(tasks) {
    const activitiesDiv = document.getElementById('dashboard-activities');
    if (!activitiesDiv) {
        console.error('Dashboard activities div not found');
        return;
    }

    if (tasks.length === 0) {
        activitiesDiv.innerHTML = 'No tasks assigned to you.';
        return;
    }

    // Sort by due date (soonest first)
    tasks.sort((a, b) => {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return dateA - dateB;
    });

    // Display up to 5 tasks
    const html = tasks.slice(0, 5).map(task => {
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const isOverdue = dueDate && dueDate < new Date() && task.status !== 'completed';
        const priority = task.priority || 'low';
        let priorityColor = '';
        let priorityBg = '';
        if (priority === 'high') {
            priorityColor = '#d32f2f'; priorityBg = '#ffebee';
        } else if (priority === 'medium') {
            priorityColor = '#f57c00'; priorityBg = '#fff3e0';
        } else {
            priorityColor = '#388e3c'; priorityBg = '#e8f5e9';
        }
        return `
            <div style="margin-bottom: 12px; padding: 12px; background: #f8f9fa; border-radius: 6px;">
                <div style="font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                    ${task.title}
                    <span style="padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; background: ${priorityBg}; color: ${priorityColor};">
                        ${priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </span>
                </div>
                <div style="font-size: 14px; color: #666; margin-bottom: 4px;">
                    Project: ${task.projectName}
                </div>
                <div style="font-size: 14px; color: #666; margin-bottom: 4px;">
                    ${task.description || 'No description'}
                </div>
                <div style="font-size: 14px; color: ${isOverdue ? '#d32f2f' : '#666'};">
                    ${dueDate ? `Due: ${dueDate.toLocaleDateString()}` : 'No due date'}
                </div>
                ${task.status === 'completed' ? `
                    <div style="color: #388e3c; margin-top: 4px; font-size: 14px;">
                        <i class="fas fa-check-circle"></i> Completed
                    </div>
                ` : `
                    <button onclick="updateTaskStatus('${task.projectId}', '${task.taskId}', 'completed')"
                            style="margin-top: 8px; padding: 4px 12px; border-radius: 4px; border: none; background: #388e3c; color: #fff; cursor: pointer; font-size: 14px;">
                        Mark as Done
                    </button>
                `}
            </div>
        `;
    }).join('');

    activitiesDiv.innerHTML = html;
}

// Helper function to check if user is team leader
function isTeamLeader(projectId) {
    return firebase.database().ref(`projects/admin-user/${projectId}`).once('value').then(snap => {
        const data = snap.val();
        return data?.leader?.trim().toLowerCase() === (firebase.auth().currentUser?.email || localStorage.getItem('userEmail')).trim().toLowerCase();
    });
}

// Function to mark project as done and move to archive
function markProjectAsDone(projectId) {
    // Get current user email
    let currentUserEmail = firebase.auth().currentUser?.email || localStorage.getItem('userEmail') || '';
    currentUserEmail = currentUserEmail.trim().toLowerCase();

    // First check if user is authorized to mark project as done
    firebase.database().ref(`projects/admin-user/${projectId}`).once('value').then(projectSnap => {
        const project = projectSnap.val();
        const isTeamLeader = project && project.leader && project.leader.trim().toLowerCase() === currentUserEmail;

        if (isTeamLeader) {
            // Update project status and move to archive
            firebase.database().ref(`projects/admin-user/${projectId}`).update({
                status: 'completed',
                completedAt: Date.now(),
                archived: true
            }).then(() => {
                // Show success message
                const doneMsg = document.getElementById('projectDoneMsg');
                doneMsg.innerHTML = `
                    <div style="color: #388e3c; margin-top: 12px;">
                        <i class="fas fa-check-circle"></i> Project marked as completed!
                    </div>
                    <div style="color: #666; margin-top: 8px; font-size: 14px;">
                        Congratulations on completing this project! 🎉<br>
                        The project has been moved to the archive section.
                    </div>
                `;

                // Remove the "Mark as Done" button section
                const doneButtonSection = document.querySelector('#projectDoneBtn').parentElement.parentElement;
                if (doneButtonSection) {
                    doneButtonSection.remove();
                }

                // Remove project from projects section
                const projectCards = document.querySelectorAll('.view-project-btn');
                projectCards.forEach(card => {
                    if (card.getAttribute('data-project-id') === projectId) {
                        const projectCard = card.closest('div[style*="width: 270px"]');
                        if (projectCard) {
                            projectCard.remove();
                        }
                    }
                });

                // Check if there are any remaining projects
                const remainingProjects = document.querySelectorAll('.view-project-btn');
                if (remainingProjects.length === 0) {
                    document.getElementById('projectsEmpty').textContent = 'No projects found.';
                    document.getElementById('projectsEmpty').style.display = 'block';
                }

                // Update project counts in dashboard
                updateProjectCounts();

                // Load archived projects
                loadArchivedProjects();

                // Redirect to archive section after 2 seconds
                setTimeout(() => {
                    document.getElementById('archiveNav').click();
                }, 2000);
            }).catch(error => {
                console.error('Error updating project status:', error);
                alert('Failed to mark project as done. Please try again.');
            });
        } else {
            alert('Only the team leader can mark a project as done.');
        }
    });
}

// Helper function to update project counts in dashboard
function updateProjectCounts() {
    firebase.database().ref('projects/admin-user').once('value').then(snapshot => {
        const projects = [];
        snapshot.forEach(projectSnap => {
            const project = projectSnap.val();
            if (!project.archived) {
                projects.push(project);
            }
        });

        // Update counts
        const totalProjects = projects.length;
        const inProgressProjects = projects.filter(p => p.status === 'active' || p.status === 'working').length;
        const completedProjects = projects.filter(p => p.status === 'completed').length;

        document.getElementById('summary-total').textContent = totalProjects;
        document.getElementById('summary-inprogress').textContent = inProgressProjects;
        document.getElementById('summary-completed').textContent = completedProjects;
    });
}

// Add function to load archived projects
function loadArchivedProjects() {
    const archivedProjectsList = document.getElementById('archivedProjectsList');
    const archiveEmpty = document.getElementById('archiveEmpty');
    archivedProjectsList.innerHTML = '';
    archiveEmpty.style.display = 'none';

    // Get current user's email
    let currentUserEmail = '';
    if (window.firebase && firebase.auth && firebase.auth().currentUser) {
        currentUserEmail = firebase.auth().currentUser.email || '';
    }
    if (!currentUserEmail) {
        currentUserEmail = localStorage.getItem('tempEmail') || localStorage.getItem('userEmail') || '';
    }

    // Fetch archived projects
    firebase.database().ref('projects/admin-user').once('value')
        .then(snapshot => {
            const projects = [];
            snapshot.forEach(projectSnapshot => {
                const project = projectSnapshot.val();
                const projectId = projectSnapshot.key;

                // Check if project is archived and user has access
                if (project.archived && (
                    project.leader === currentUserEmail ||
                    (project.teamMembers && Object.values(project.teamMembers).some(member => 
                        member.email === currentUserEmail
                    ))
                )) {
                    projects.push({
                        id: projectId,
                        ...project
                    });
                }
            });

            if (projects.length === 0) {
                archiveEmpty.style.display = 'block';
                return;
            }

            // Sort projects by completion date (newest first)
            projects.sort((a, b) => {
                const dateA = a.completedAt || 0;
                const dateB = b.completedAt || 0;
                return dateB - dateA;
            });

            // Display projects
            projects.forEach(project => {
                const card = document.createElement('div');
                card.style.background = '#fff';
                card.style.border = '1px solid #ddd';
                card.style.borderRadius = '8px';
                card.style.padding = '20px';
                card.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

                // Get file count
                const fileCount = project.files ? Object.keys(project.files).length : 0;

                card.innerHTML = `
                    <div style="margin-bottom: 16px;">
                        <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">${project.name || 'Untitled Project'}</h3>
                        <p style="color: #666; font-size: 14px; margin-bottom: 12px;">${project.description || 'No description'}</p>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <div style="color: #666; font-size: 14px; margin-bottom: 4px;">
                            <strong>Type:</strong> ${project.type || 'Not specified'}
                        </div>
                        <div style="color: #666; font-size: 14px; margin-bottom: 4px;">
                            <strong>Duration:</strong> ${project.duration || 'Not specified'}
                        </div>
                        <div style="color: #666; font-size: 14px; margin-bottom: 4px;">
                            <strong>Budget:</strong> ${project.budget ? '₱' + project.budget : 'Not specified'}
                        </div>
                        <div style="color: #666; font-size: 14px; margin-bottom: 4px;">
                            <strong>Location:</strong> ${project.location || 'Not specified'}
                        </div>
                        <div style="color: #666; font-size: 14px; margin-bottom: 4px;">
                            <strong>Team Leader:</strong> ${project.leader || 'Not specified'}
                        </div>
                        <div style="color: #666; font-size: 14px; margin-bottom: 4px;">
                            <strong>Files Uploaded:</strong> ${fileCount} file${fileCount !== 1 ? 's' : ''}
                        </div>
                        <div style="color: #666; font-size: 14px; margin-bottom: 4px;">
                            <strong>Completed:</strong> ${project.completedAt ? new Date(project.completedAt).toLocaleDateString() : 'Not specified'}
                        </div>
                    </div>
                    <button onclick="openArchiveProjectViewModal('${project.id}')" 
                            style="background: #fff; border: 1px solid #000; border-radius: 4px; padding: 8px 16px; 
                                   cursor: pointer; font-size: 14px; transition: all 0.2s ease;"
                            onmouseover="this.style.background='#000'; this.style.color='#fff';"
                            onmouseout="this.style.background='#fff'; this.style.color='#000';">
                        View Details
                    </button>
                `;
                archivedProjectsList.appendChild(card);
            });
        })
        .catch(error => {
            console.error('Error loading archived projects:', error);
            archiveEmpty.textContent = 'Error loading archived projects. Please try again.';
            archiveEmpty.style.display = 'block';
        });
}

// Function to calculate and update project progress based on completed tasks
function updateProjectProgress(projectId) {
    firebase.database().ref('projects/admin-user/' + projectId + '/tasks').once('value').then(snapshot => {
        let totalTasks = 0;
        let completedTasks = 0;

        snapshot.forEach(taskSnap => {
            const task = taskSnap.val();
            totalTasks++;
            if (task.status === 'completed') {
                completedTasks++;
            }
        });

        // Calculate progress percentage
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Update project progress in Firebase
        firebase.database().ref('projects/admin-user/' + projectId).update({
            progress: progress
        }).then(() => {
            // Update progress bar in UI if it exists
            const progressBar = document.getElementById('projectDetailProgressBar');
            const progressLabel = document.getElementById('projectDetailProgressLabel');
            if (progressBar) progressBar.style.width = progress + '%';
            if (progressLabel) progressLabel.innerHTML = `<b>Progress:</b> ${progress}%`;
        });
    });
}