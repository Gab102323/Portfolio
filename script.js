// Initialize the database
let db;
const dbName = "ResumeDB";
const storeName = "resumes";
const dbVersion = 1;

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onerror = (event) => {
            reject("Error opening database");
        };
    });
}

// Save resume data
function saveResume(data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        
        const request = store.add(data);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = (event) => {
            reject("Error saving data");
        };
    });
}

// Get all resumes sorted by newest first
function getAllResumes() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = (event) => {
            const resumes = event.target.result;
            // Sort by timestamp (newest first)
            resumes.sort((a, b) => b.timestamp - a.timestamp);
            resolve(resumes);
        };

        request.onerror = (event) => {
            reject("Error retrieving data");
        };
    });
}

// Handle form submission
document.addEventListener('DOMContentLoaded', async () => {
    await initDB();

    // If we're on the form page
    if (document.getElementById('resumeForm')) {
        const form = document.getElementById('resumeForm');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const resumeData = {
                name: document.getElementById('name').value,
                age: document.getElementById('age').value,
                section: document.getElementById('section').value,
                timestamp: new Date().getTime()
            };
            
            try {
                await saveResume(resumeData);
                window.location.href = 'preview.html';
            } catch (error) {
                alert('Error saving your resume. Please try again.');
                console.error(error);
            }
        });
    }

    // If we're on the preview page
    if (document.getElementById('resumePreview')) {
        try {
            const resumes = await getAllResumes();
            const previewDiv = document.getElementById('resumePreview');
            
            if (resumes.length > 0) {
                // Display most recent resume prominently
                const latest = resumes[0];
                previewDiv.innerHTML = `
                    <h2>Your Most Recent Resume</h2>
                    <div class="resume-card featured">
                        <div class="resume-item"><strong>Name:</strong> ${latest.name}</div>
                        <div class="resume-item"><strong>Age:</strong> ${latest.age}</div>
                        <div class="resume-item"><strong>Section:</strong> ${latest.section}</div>
                        <div class="resume-item"><strong>Created:</strong> ${new Date(latest.timestamp).toLocaleString()}</div>
                    </div>
                `;
                
                // Display previous resumes if they exist
                if (resumes.length > 1) {
                    previewDiv.innerHTML += `
                        <h2>Previous Resumes</h2>
                        <div class="resume-list">
                            ${resumes.slice(1).map(resume => `
                                <div class="resume-card">
                                    <div class="resume-item"><strong>Name:</strong> ${resume.name}</div>
                                    <div class="resume-item"><strong>Section:</strong> ${resume.section}</div>
                                    <div class="resume-item"><strong>Created:</strong> ${new Date(resume.timestamp).toLocaleDateString()}</div>
                                    <button class="view-btn" data-id="${resume.id}">View Details</button>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }
            } else {
                previewDiv.innerHTML = 
                    '<p>No resume data found. Please create one first.</p>';
            }
        } catch (error) {
            console.error(error);
            previewDiv.innerHTML = 
                '<p>Error loading resume data.</p>';
        }
    }
});