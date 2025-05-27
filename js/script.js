;(() => {
  emailjs.init("8Q_RdR_D69A5myL7E") // Replace with your actual User ID
})()

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCsk99-24TWqPARmr6UWBBKh_3AE8ibJVo",
  authDomain: "project-management-acde3.firebaseapp.com",
  databaseURL: "https://project-management-acde3-default-rtdb.firebaseio.com",
  projectId: "project-management-acde3",
  storageBucket: "project-management-acde3.firebasestorage.app",
  messagingSenderId: "223881271649",
  appId: "1:223881271649:web:de625e09b8f39388df4d20",
  measurementId: "G-924JZR3M0H",
}
firebase.initializeApp(firebaseConfig)
const auth = firebase.auth()
const db = firebase.database()

// Function to get user key by email
function getUserKeyByEmail(email, callback) {
  db.ref("users")
    .orderByChild("email")
    .equalTo(email)
    .once("value", (snapshot) => {
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const userKey = childSnapshot.key
          callback(userKey)
        })
      } else {
        callback(null) // User not found
      }
    })
    .catch((error) => {
      console.error("Error fetching user key:", error)
      callback(null) // Error occurred
    })
}

function toggleLoginMethod(method) {
  document.getElementById("emailSection").style.display = method === "email" ? "block" : "none"
  document.getElementById("phoneSection").style.display = method === "phone" ? "block" : "none"
}

function checkAndSendOTP() {
  const email = document.getElementById("emailInput").value.trim().toLowerCase()
  const alertBox = document.getElementById("alertBox")
  alertBox.innerText = ""

  // Email format validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email) {
    alertBox.innerText = "Please enter an email."
    return
  }
  if (!emailPattern.test(email)) {
    alertBox.innerText = "Please enter a valid email address."
    return
  }

  // Show loading overlay
  document.getElementById("loadingOverlay").style.display = "flex"

  // Store email in multiple places for redundancy
  localStorage.setItem("tempEmail", email)
  localStorage.setItem("userEmail", email)

  // Check if email exists
  db.ref("users")
    .once("value")
    .then((snapshot) => {
      let emailExists = false
      let existingUserId = null

      snapshot.forEach((child) => {
        const userData = child.val()
        if (userData.email && userData.email.toLowerCase() === email) {
          emailExists = true
          existingUserId = child.key
        }
      })

      if (emailExists) {
        // If user exists, store the user ID for later use
        if (existingUserId) {
          localStorage.setItem("userId", existingUserId)
        }
        window.location.href = "dashboard.html"
      } else {
        const otp = Math.floor(1000 + Math.random() * 9000).toString() // Generate 4-digit OTP

        // Save OTP and email
        localStorage.setItem("tempOTP", otp)

        emailjs
          .send("service_vg8h6wn", "template_hxanjp8", {
            to_email: email,
            otp_code: otp,
          })
          .then(() => {
            document.getElementById("emailSection").style.display = "none"
            document.getElementById("otpSection").style.display = "block"
            document.getElementById("loadingOverlay").style.display = "none"
          })
          .catch((err) => {
            alertBox.innerText = "Failed to send OTP: " + err.text
            document.getElementById("loadingOverlay").style.display = "none"
          })
      }
    })
    .catch((error) => {
      alertBox.innerText = error.message
      document.getElementById("loadingOverlay").style.display = "none"
    })
}

function moveNext(input, index) {
  if (input.value.length === 1 && index < 3) {
    input.nextElementSibling.focus()
  }
}
function verifyOTP() {
  const codeInputs = document.querySelectorAll(".otp-box input")
  const code = Array.from(codeInputs)
    .map((input) => input.value)
    .join("")
  const storedOTP = localStorage.getItem("tempOTP")
  const email = localStorage.getItem("tempEmail")

  if (code.length !== 4) {
    document.getElementById("alertBoxOtp").innerText = "Please enter all 4 digits."
    return
  }

  if (!email || !storedOTP) {
    document.getElementById("alertBoxOtp").innerText = "Session expired. Please try again."
    return
  }

  if (code !== storedOTP) {
    document.getElementById("alertBoxOtp").innerText = "Invalid OTP. Please try again."
    return
  }

  // Show loading overlay
  document.getElementById("loadingOverlay").style.display = "flex"

  // Store email in multiple places for redundancy
  localStorage.setItem("userEmail", email)

  // Generate a unique ID if not using Firebase Auth
  const uid = Date.now().toString()
  localStorage.setItem("userId", uid)

  db.ref("users/" + uid)
    .set({
      email: email,
      registeredAt: new Date().toISOString(),
    })
    .then(() => {
      window.location.href = "dashboard.html"
    })
    .catch((error) => {
      document.getElementById("alertBoxOtp").innerText = error.message
      document.getElementById("loadingOverlay").style.display = "none"
    })
}

function goBack() {
  document.getElementById("otpSection").style.display = "none"
  document.getElementById("emailSection").style.display = "block"
}

function sendPhoneOTP() {
  const phoneNumber = document.getElementById("phoneInput").value.trim()
  const alertBoxPhone = document.getElementById("alertBoxPhone")
  alertBoxPhone.innerText = ""

  if (!phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
    alertBoxPhone.innerText = "Enter phone in E.164 format (e.g. +1234567890)"
    return
  }

  // Show loading overlay
  document.getElementById("loadingOverlay").style.display = "flex"

  // Setup reCAPTCHA if not already done
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier("recaptcha-container", {
      size: "invisible",
      callback: (response) => {
        console.log("reCAPTCHA solved")
      },
      "expired-callback": () => {
        alertBoxPhone.innerText = "reCAPTCHA expired, try again."
        document.getElementById("loadingOverlay").style.display = "none"
      },
    })
  }

  firebase
    .auth()
    .signInWithPhoneNumber(phoneNumber, window.recaptchaVerifier)
    .then((confirmationResult) => {
      window.confirmationResult = confirmationResult
      localStorage.setItem("tempPhone", phoneNumber)
      document.getElementById("phoneSection").style.display = "none"
      document.getElementById("otpSection").style.display = "block"
      document.getElementById("loadingOverlay").style.display = "none"
    })
    .catch((error) => {
      alertBoxPhone.innerText = error.message
      document.getElementById("loadingOverlay").style.display = "none"
    })
}

function toggleAdminLogin() {
  const emailSection = document.getElementById("emailSection")
  const phoneSection = document.getElementById("phoneSection")
  const adminSection = document.getElementById("adminSection")
  const adminToggle = document.querySelector(".admin-toggle")

  if (adminSection.style.display === "none") {
    emailSection.style.display = "none"
    phoneSection.style.display = "none"
    adminSection.style.display = "block"
    adminToggle.classList.add("active")
  } else {
    adminSection.style.display = "none"
    emailSection.style.display = "block"
    adminToggle.classList.remove("active")
  }
}

function adminLogin() {
  const username = document.getElementById("adminUsername").value.trim()
  const password = document.getElementById("adminPassword").value
  const adminAlertBox = document.getElementById("adminAlertBox")

  if (!username || !password) {
    adminAlertBox.innerText = "Please enter both username and password."
    return
  }

  // Show loading overlay
  document.getElementById("loadingOverlay").style.display = "flex"

  // Check against fixed admin credentials
  if (username === "admin_bdo" && password === "adminbdo123456") {
    // Store admin status in localStorage
    localStorage.setItem("isAdmin", "true")
    window.location.href = "admin-dashboard.html"
  } else {
    adminAlertBox.innerText = "Invalid admin credentials."
    document.getElementById("loadingOverlay").style.display = "none"
  }
}

function googleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider()
  document.getElementById("loadingOverlay").style.display = "flex"
  auth
    .signInWithPopup(provider)
    .then((result) => {
      const user = result.user
      if (!user) {
        document.getElementById("loadingOverlay").style.display = "none"
        document.getElementById("alertBox").innerText = "Google login failed."
        return
      }

      // Store email in localStorage for redundancy
      if (user.email) {
        localStorage.setItem("userEmail", user.email)
      }

      // Check if user exists in database
      db.ref("users")
        .orderByChild("email")
        .equalTo(user.email)
        .once("value", (snapshot) => {
          if (!snapshot.exists()) {
            // Add new user
            db.ref("users/" + user.uid).set({
              email: user.email,
              name: user.displayName || "",
              registeredAt: new Date().toISOString(),
              provider: "google",
            })
          }
          window.location.href = "dashboard.html"
        })
    })
    .catch((error) => {
      document.getElementById("loadingOverlay").style.display = "none"
      document.getElementById("alertBox").innerText = error.message
    })
}

// Function to get Firebase ID token
async function getFirebaseToken() {
  const user = firebase.auth().currentUser
  if (!user) {
    throw new Error("No user logged in")
  }
  return await user.getIdToken()
}

// Function to make authenticated API calls
async function apiCall(endpoint, method = "GET", data = null) {
  const token = await getFirebaseToken()
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }

  if (data) {
    options.body = JSON.stringify(data)
  }

  const response = await fetch(`http://localhost:3000/api${endpoint}`, options)
  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`)
  }
  return response.json()
}

// Update fetchAndRenderProjects function
async function fetchAndRenderProjects(filterPriority = "all", searchTerm = "", statusFilter = "all") {
  const cardsContainer = document.getElementById("projectsCardsContainer")
  const projectsEmpty = document.getElementById("projectsEmpty")
  cardsContainer.innerHTML = ""
  projectsEmpty.style.display = "none"

  try {
    const projects = await apiCall("/projects")

    // Filter by priority
    let filtered =
      filterPriority === "all" ? projects : projects.filter((p) => (p.priority || "low") === filterPriority)
    // Filter by status
    filtered = statusFilter === "all" ? filtered : filtered.filter((p) => (p.status || "active") === statusFilter)
    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter((p) => (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()))
    }

    if (filtered.length === 0) {
      projectsEmpty.textContent = "No projects found."
      projectsEmpty.style.display = "block"
      return
    }

    filtered.forEach((project) => {
      const card = createProjectCard(project)
      cardsContainer.appendChild(card)
    })
  } catch (error) {
    console.error("Error fetching projects:", error)
    projectsEmpty.textContent = "Error loading projects."
    projectsEmpty.style.display = "block"
  }
}

// Function to create project card
function createProjectCard(project) {
  const card = document.createElement("div")
  card.className = "project-card"
  card.innerHTML = `
    <div class="project-header">
      <h3>${project.name}</h3>
      <span class="project-status ${project.status}">${project.status}</span>
    </div>
    <div class="project-details">
      <p><strong>Type:</strong> ${project.type}</p>
      <p><strong>Description:</strong> ${project.description}</p>
      <p><strong>Duration:</strong> ${project.duration}</p>
      <p><strong>Start Date:</strong> ${new Date(project.start_date).toLocaleDateString()}</p>
      <p><strong>Budget:</strong> $${project.budget}</p>
      <p><strong>Location:</strong> ${project.location}</p>
      <p><strong>Leader:</strong> ${project.leader}</p>
    </div>
    <div class="project-progress">
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${project.progress}%"></div>
      </div>
      <span class="progress-text">${project.progress}% Complete</span>
    </div>
    <div class="project-actions">
      <button onclick="editProject(${project.id})" class="edit-btn">
        <i class="fas fa-edit"></i> Edit
      </button>
      <button onclick="deleteProject(${project.id})" class="delete-btn">
        <i class="fas fa-trash"></i> Delete
      </button>
    </div>
  `
  return card
}

// Function to edit project
async function editProject(projectId) {
  try {
    const project = await apiCall(`/projects/${projectId}`)
    // Populate the edit form with project data
    document.getElementById("npName").value = project.name
    document.getElementById("npType").value = project.type
    document.getElementById("npDesc").value = project.description
    document.getElementById("npDuration").value = project.duration
    document.getElementById("npDate").value = project.start_date
    document.getElementById("npBudget").value = project.budget
    document.getElementById("npLocation").value = project.location
    document.getElementById("npLeader").value = project.leader

    // Show the modal
    document.getElementById("newProjectModal").style.display = "flex"
    // Store the project ID for update
    document.getElementById("newProjectModal").dataset.projectId = projectId
  } catch (error) {
    console.error("Error fetching project:", error)
    alert("Error loading project details")
  }
}

// Function to delete project
async function deleteProject(projectId) {
  if (confirm("Are you sure you want to delete this project?")) {
    try {
      await apiCall(`/projects/${projectId}`, "DELETE")
      fetchAndRenderProjects()
      updateDashboardSummary()
    } catch (error) {
      console.error("Error deleting project:", error)
      alert("Error deleting project")
    }
  }
}

// Update submitNewProject function to use SQL backend
async function submitNewProject() {
  const name = document.getElementById("npName").value.trim()
  const type = document.getElementById("npType").value.trim()
  const description = document.getElementById("npDesc").value.trim()
  const duration = document.getElementById("npDuration").value.trim()
  const date = document.getElementById("npDate").value
  const budget = document.getElementById("npBudget").value.trim()
  const location = document.getElementById("npLocation").value.trim()
  const leader = document.getElementById("npLeader").value.trim()

  if (!name || !type || !description || !duration || !date || !budget || !location || !leader) {
    document.getElementById("newProjectError").textContent = "All fields are required."
    return
  }

  try {
    const projectData = {
      name,
      type,
      description,
      duration,
      start_date: date,
      budget: Number.parseFloat(budget),
      location,
      leader,
      status: "active",
      progress: 0,
    }

    const modal = document.getElementById("newProjectModal")
    const projectId = modal.dataset.projectId

    if (projectId) {
      // Update existing project
      await apiCall(`/projects/${projectId}`, "PUT", projectData)
      delete modal.dataset.projectId // Clear the project ID
    } else {
      // Create new project
      await apiCall("/projects", "POST", projectData)
    }

    closeNewProjectModal()
    fetchAndRenderProjects()
    updateDashboardSummary()
  } catch (error) {
    console.error("Error saving project:", error)
    document.getElementById("newProjectError").textContent = "Error saving project. Please try again."
  }
}

// Function to close the new project modal
function closeNewProjectModal() {
  const modal = document.getElementById("newProjectModal")
  modal.style.display = "none"
  // Clear form
  document.getElementById("npName").value = ""
  document.getElementById("npType").value = ""
  document.getElementById("npDesc").value = ""
  document.getElementById("npDuration").value = ""
  document.getElementById("npDate").value = ""
  document.getElementById("npBudget").value = ""
  document.getElementById("npLocation").value = ""
  document.getElementById("npLeader").value = ""
  document.getElementById("newProjectError").textContent = ""
  delete modal.dataset.projectId
}

// Update updateDashboardSummary function
async function updateDashboardSummary() {
  try {
    const projects = await apiCall("/projects")

    const total = projects.length
    const inprogress = projects.filter((p) => p.status === "active").length
    const completed = projects.filter((p) => p.status === "completed").length

    document.getElementById("summary-total").textContent = total
    document.getElementById("summary-inprogress").textContent = inprogress
    document.getElementById("summary-completed").textContent = completed

    // Update activities
    const activities = projects
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map((p) => ({
        name: p.name || "Untitled Project",
        status: p.status || "In Progress",
        date: p.start_date || "",
        createdAt: p.created_at,
      }))

    const actDiv = document.getElementById("dashboard-activities")
    actDiv.innerHTML = activities.length ? "" : "No projects yet."
    activities.forEach((activity) => {
      const actItem = document.createElement("div")
      actItem.className = "activity-item"
      actItem.innerHTML = `
        <div class="activity-name">${activity.name}</div>
        <div class="activity-status">${activity.status}</div>
        <div class="activity-date">${new Date(activity.date).toLocaleDateString()}</div>
      `
      actDiv.appendChild(actItem)
    })

    // Update progress
    const progressList = projects.map((p) => ({
      name: p.name || "Untitled Project",
      progress: p.progress || 0,
    }))

    const progressDiv = document.getElementById("dashboard-progress")
    progressDiv.innerHTML = progressList.length ? "" : "No projects yet."
    progressList.forEach((progress) => {
      const progressItem = document.createElement("div")
      progressItem.className = "progress-item"
      progressItem.innerHTML = `
        <div class="progress-name">${progress.name}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress.progress}%"></div>
        </div>
        <div class="progress-value">${progress.progress}%</div>
      `
      progressDiv.appendChild(progressItem)
    })
  } catch (error) {
    console.error("Error updating dashboard:", error)
  }
}

function loadProjectsForCurrentUser() {
  if (window.firebase && firebase.auth && firebase.auth().currentUser) {
    const user = firebase.auth().currentUser
    const uid = user.uid

    // Get the user data from Firebase to ensure we have the correct email
    firebase
      .database()
      .ref("users/" + uid)
      .once("value")
      .then((snapshot) => {
        const userData = snapshot.val()
        const email = userData && userData.email ? userData.email : user.email || ""

        // Update the sidebar email display
        document.getElementById("sidebarUserEmail").textContent = email

        // Now fetch projects using this email
        getUserKeyByEmail(email, (userKey) => {
          fetchAndRenderProjects(userKey)
          updateDashboardSummary()
        })
      })
      .catch((error) => {
        console.error("Error fetching user data:", error)
        // Fallback to auth email
        const email = user.email || ""
        document.getElementById("sidebarUserEmail").textContent = email

        getUserKeyByEmail(email, (userKey) => {
          fetchAndRenderProjects(userKey)
          updateDashboardSummary()
        })
      })
  } else {
    // Try to use email from localStorage as fallback
    const email = localStorage.getItem("tempEmail") || ""
    document.getElementById("sidebarUserEmail").textContent = email

    if (email) {
      getUserKeyByEmail(email, (userKey) => {
        fetchAndRenderProjects(userKey)
        updateDashboardSummary()
      })
    }
  }
}
