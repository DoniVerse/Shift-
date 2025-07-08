document.addEventListener('DOMContentLoaded', function() {
    // Job categories based on year of study
    const jobCategories = {
        2: [
            {
                id: 1,
                title: "Summarizing Legal Documents",
                icon: "📄",
                rating: 4.2,
                description: "Review and summarize legal documents",
                category: "summarizing"
            },
            {
                id: 2,
                title: "Document Review Assistant",
                icon: "📋",
                rating: 4.0,
                description: "Assist with document review processes",
                category: "summarizing"
            }
        ],
        3: [
            {
                id: 3,
                title: "Legal Research Assistance",
                icon: "🔍",
                rating: 4.5,
                description: "Conduct legal research and analysis",
                category: "research"
            },
            {
                id: 4,
                title: "Case Law Research",
                icon: "⚖️",
                rating: 4.3,
                description: "Research case law and precedents",
                category: "research"
            },
            {
                id: 5,
                title: "Legal Database Research",
                icon: "💻",
                rating: 4.1,
                description: "Navigate legal databases for research",
                category: "research"
            }
        ],
        4: [
            {
                id: 6,
                title: "Preparing Legal Filings & Case Documents",
                icon: "📁",
                rating: 4.4,
                description: "Prepare and organize legal filings",
                category: "filing"
            },
            {
                id: 7,
                title: "Court Document Preparation",
                icon: "📝",
                rating: 4.2,
                description: "Assist with court document preparation",
                category: "filing"
            },
            {
                id: 8,
                title: "Legal Filing Assistant",
                icon: "📤",
                rating: 4.0,
                description: "Support legal filing processes",
                category: "filing"
            }
        ],
        5: [
            {
                id: 9,
                title: "Corporate Legal Advisory Support",
                icon: "🤝",
                rating: 4.6,
                description: "Support corporate legal advisory services",
                category: "corporate"
            },
            {
                id: 10,
                title: "Contract Review Assistant",
                icon: "📋",
                rating: 4.3,
                description: "Assist with contract review and analysis",
                category: "corporate"
            },
            {
                id: 11,
                title: "Corporate Compliance Support",
                icon: "✅",
                rating: 4.1,
                description: "Support corporate compliance initiatives",
                category: "corporate"
            }
        ]
    };

    // Get user data from localStorage or URL params
    function getUserData() {
        // Try to get from localStorage first (from signup/login)
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            return JSON.parse(userData);
        }
        
        // Fallback to URL params or default
        const urlParams = new URLSearchParams(window.location.search);
        return {
            name: urlParams.get('name') || 'Student',
            yearOfStudy: parseInt(urlParams.get('year')) || 2
        };
    }

    // Display user info
    function displayUserInfo() {
        const userData = getUserData();
        const userName = document.getElementById('userName');
        const yearBadge = document.getElementById('yearBadge');
        
        userName.textContent = userData.name.split(' ')[0]; // First name only
        yearBadge.textContent = `Year ${userData.yearOfStudy}`;
    }

    // Create star rating HTML
    function createStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let starsHTML = '';
        
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                starsHTML += '<span class="star filled">★</span>';
            } else if (i === fullStars && hasHalfStar) {
                starsHTML += '<span class="star filled">★</span>';
            } else {
                starsHTML += '<span class="star">☆</span>';
            }
        }
        
        return starsHTML;
    }

    // Display jobs based on year
    function displayJobs() {
        const userData = getUserData();
        const jobsGrid = document.getElementById('jobsGrid');
        const noJobsMessage = document.getElementById('noJobsMessage');
        const jobs = jobCategories[userData.yearOfStudy] || [];

        if (jobs.length === 0) {
            jobsGrid.style.display = 'none';
            noJobsMessage.style.display = 'block';
            return;
        }

        jobsGrid.innerHTML = '';
        noJobsMessage.style.display = 'none';

        jobs.forEach(job => {
            const jobCard = document.createElement('div');
            jobCard.className = 'job-card';
            jobCard.innerHTML = `
                <div class="job-icon">${job.icon}</div>
                <div class="job-title">${job.title}</div>
                <div class="job-rating">${createStarRating(job.rating)}</div>
                <div class="job-details">${job.description}</div>
            `;
            
            jobCard.addEventListener('click', () => {
                // Handle job card click
                console.log('Job clicked:', job);
                alert(`You clicked on: ${job.title}\nRating: ${job.rating}/5\n${job.description}`);
                // Here you would typically navigate to job details page
                // window.location.href = `job-details.html?id=${job.id}`;
            });
            
            jobsGrid.appendChild(jobCard);
        });
    }

    // Search functionality
    function setupSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');

        function performSearch() {
            const searchTerm = searchInput.value.toLowerCase().trim();
            const jobCards = document.querySelectorAll('.job-card');
            
            jobCards.forEach(card => {
                const title = card.querySelector('.job-title').textContent.toLowerCase();
                const description = card.querySelector('.job-details').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || description.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = searchTerm === '' ? 'block' : 'none';
                }
            });
        }

        searchInput.addEventListener('input', performSearch);
        searchBtn.addEventListener('click', performSearch);
    }

    // Filter functionality
    function setupFilter() {
        const filterBtn = document.getElementById('filterBtn');
        
        filterBtn.addEventListener('click', () => {
            // Simple filter toggle - you can expand this
            alert('Filter options:\n- By Rating\n- By Category\n- By Date Posted\n\nThis would open a filter modal.');
        });
    }

    // Bottom navigation
    function setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                // Remove active class from all items
                navItems.forEach(nav => nav.classList.remove('active'));
                
                // Add active class to clicked item
                this.classList.add('active');
                
                // Handle navigation
                const label = this.querySelector('.nav-label').textContent;
                console.log('Navigation clicked:', label);
                
                switch(label) {
                    case 'Home':
                        // Already on home/job listing
                        break;
                    case 'Search':
                        document.getElementById('searchInput').focus();
                        break;
                    case 'Messages':
                        alert('Messages feature coming soon!');
                        break;
                    case 'Profile':
                        alert('Profile page coming soon!');
                        // window.location.href = 'profile.html';
                        break;
                }
            });
        });
    }

    // Initialize the page
    displayUserInfo();
    displayJobs();
    setupSearch();
    setupFilter();
    setupNavigation();

    // For demo purposes, let's simulate user data
    if (!localStorage.getItem('currentUser')) {
        localStorage.setItem('currentUser', JSON.stringify({
            name: 'John Doe',
            yearOfStudy: 3,
            email: 'john.doe@university.edu'
        }));
        // Refresh to show the demo data
        location.reload();
    }
});