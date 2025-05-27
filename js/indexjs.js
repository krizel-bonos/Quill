 // Interactive elements
 const loginBtn = document.getElementById('loginBtn');
 const startBtn = document.getElementById('startBtn');
 const loginModal = document.getElementById('loginModal');
 const closeModal = document.getElementById('closeModal');
 const loginForm = document.getElementById('loginForm');
 const themeToggle = document.getElementById('themeToggle');
 const featureCards = document.querySelectorAll('.feature-card');
 const heroImage = document.getElementById('heroImage');
 
 // Login modal functionality
 loginBtn.addEventListener('click', () => {
     loginModal.style.display = 'flex';
     document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
 });
 
 closeModal.addEventListener('click', () => {
     loginModal.style.display = 'none';
     document.body.style.overflow = 'auto'; // Re-enable scrolling
 });
 
 // Close modal when clicking outside
 loginModal.addEventListener('click', (e) => {
     if (e.target === loginModal) {
         loginModal.style.display = 'none';
         document.body.style.overflow = 'auto';
     }
 });
 
 // Form submission (prevent default for demo)
 loginForm.addEventListener('submit', (e) => {
     e.preventDefault();
     const email = document.getElementById('email').value;
     alert(`Login attempt with email: ${email}\nThis is just a demo. No actual login occurs.`);
     loginModal.style.display = 'none';
     document.body.style.overflow = 'auto';
 });
 
 // Start button animation and action
 startBtn.addEventListener('click', () => {
     startBtn.style.transform = 'scale(0.95)';
     setTimeout(() => {
         startBtn.style.transform = '';
         alert('Getting started with Quill! This would typically lead to a registration or product tour page.');
     }, 200);
 });
 
 // Dark mode toggle
 themeToggle.addEventListener('click', () => {
     document.body.classList.toggle('dark-mode');
     themeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
 });
 
 // Feature card interactions
 featureCards.forEach(card => {
     card.addEventListener('mouseenter', () => {
         card.style.backgroundColor = document.body.classList.contains('dark-mode') ? '#3d3d3d' : '#f9f9f9';
     });
     
     card.addEventListener('mouseleave', () => {
         card.style.backgroundColor = document.body.classList.contains('dark-mode') ? '#2d2d2d' : '#fff';
     });
     
     card.addEventListener('click', () => {
         const feature = card.getAttribute('data-feature');
         alert(`You clicked on the "${feature}" feature. This would typically show more details about this feature.`);
     });
 });
 
 // Dynamic hero image with canvas - black and white particles
 const canvas = document.createElement('canvas');
 canvas.width = heroImage.offsetWidth;
 canvas.height = heroImage.offsetHeight;
 heroImage.appendChild(canvas);
 
 const ctx = canvas.getContext('2d');
 const particles = [];
 
 // Create particles - only black and white
 for (let i = 0; i < 50; i++) {
     particles.push({
         x: Math.random() * canvas.width,
         y: Math.random() * canvas.height,
         radius: Math.random() * 3 + 1,
         color: document.body.classList.contains('dark-mode') ? '#ffffff' : '#000000', // Black in light mode, white in dark mode
         speedX: Math.random() * 2 - 1,
         speedY: Math.random() * 2 - 1
     });
 }
 
 // Animation function
 function animate() {
     ctx.clearRect(0, 0, canvas.width, canvas.height);
     ctx.fillStyle = '#ffffff';
     ctx.fillRect(0, 0, canvas.width, canvas.height);

     
     // Draw and update particles
     particles.forEach(particle => {
         ctx.beginPath();
         ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
         ctx.fillStyle ='#000000'; // White in dark mode
         ctx.fill();
         
         // Update position
         particle.x += particle.speedX;
         particle.y += particle.speedY;
         
         // Bounce off walls
         if (particle.x < 0 || particle.x > canvas.width) {
             particle.speedX *= -1;
         }
         
         if (particle.y < 0 || particle.y > canvas.height) {
             particle.speedY *= -1;
         }
     });
     
     // Draw connecting lines between nearby particles
     particles.forEach((particle, i) => {
         particles.slice(i + 1).forEach(otherParticle => {
             const dx = particle.x - otherParticle.x;
             const dy = particle.y - otherParticle.y;
             const distance = Math.sqrt(dx * dx + dy * dy);
             
             if (distance < 100) {
                 ctx.beginPath();
                 ctx.moveTo(particle.x, particle.y);
                 ctx.lineTo(otherParticle.x, otherParticle.y);
                 ctx.strokeStyle = document.body.classList.contains('dark-mode') 
                     ? `rgba(255, 255, 255, ${0.2 - distance/500})` // White in dark mode
                     : `rgba(0, 0, 0, ${0.2 - distance/500})`; // Black in light mode
                 ctx.stroke();
             }
         });
     });
     
     requestAnimationFrame(animate);
 }
 
 // Start animation
 animate();
 
 // Update particle colors when theme changes
 themeToggle.addEventListener('click', () => {
     const isDarkMode = document.body.classList.contains('dark-mode');
     particles.forEach(particle => {
         particle.color = isDarkMode ? '#ffffff' : '#000000';
     });
 });
 
 // Resize canvas when window resizes
 window.addEventListener('resize', () => {
     canvas.width = heroImage.offsetWidth;
     canvas.height = heroImage.offsetHeight;
 });
 
 // Parallax effect on scroll
 window.addEventListener('scroll', () => {
     const scrollPosition = window.scrollY;
     const heroSection = document.querySelector('.hero');
     const heroOffset = heroSection.offsetTop;
     const heroHeight = heroSection.offsetHeight;
     
     if (scrollPosition > heroOffset && scrollPosition < heroOffset + heroHeight) {
         const parallaxValue = (scrollPosition - heroOffset) * 0.4;
         document.querySelector('.hero-content').style.transform = `translateY(${parallaxValue}px)`;
         document.querySelector('.hero-image').style.transform = `translateY(-${parallaxValue}px)`;
     }
 });

 document.addEventListener("DOMContentLoaded", function() {
    const startBtn = document.getElementById("startBtn");
    startBtn.addEventListener("click", function() {
        window.location.href = "index2.html";
    });
});

function togglePassword() {
    const passwordField = document.getElementById("password");
    if (passwordField.type === "password") {
      passwordField.type = "text";
    } else {
      passwordField.type = "password";
    }
  }

  function togglePassword() {
    const passwordField = document.getElementById("password");
    const eyeOpen = document.getElementById("eyeOpen");
    const eyeClosed = document.getElementById("eyeClosed");
  
    const isVisible = passwordField.type === "text";
    passwordField.type = isVisible ? "password" : "text";
  
    eyeOpen.classList.toggle("hidden", !isVisible);
    eyeClosed.classList.toggle("hidden", isVisible);
  }
  
  