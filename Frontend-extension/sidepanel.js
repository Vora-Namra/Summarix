document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
    
    // Load saved notes
    loadSavedNotes();
    
    // Event Listeners
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('summarizeBtn').addEventListener('click', summarizeText);
    document.getElementById('saveNotesBtn').addEventListener('click', saveNotes);
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', (e) => switchTab(e.target.closest('.tab-btn').dataset.tab));
    });
});

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('themeToggle');
    if (theme === 'light') {
        themeToggle.innerHTML = '<span class="material-icons">dark_mode</span>';
    } else {
        themeToggle.innerHTML = '<span class="material-icons">light_mode</span>';
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabId}Section`).classList.add('active');
}

async function summarizeText() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        showResult(`
            <div class="loading">
                Summarizing your text...
            </div>
        `);
        
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => window.getSelection().toString()
        });

        if (!result) {
            showResult('Please select some text first');
            return;
        }

        const response = await fetch('http://localhost:8080/api/research/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: result, operation: 'summarize' })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const text = await response.text();
        showResult(`
            <div class="result-content">
                ${text.replace(/\n/g, '<br>')}
                <button id="saveSummaryBtn" class="save-summary-btn">Save Summary</button>
            </div>
        `);

        // Add event listener for saving summary
        document.getElementById('saveSummaryBtn').addEventListener('click', () => {
            saveSummaryAsNote(text);
        });

    } catch (error) {
        showResult(`
            <div class="error-message">
                <span class="material-icons">error</span>
                Error: ${error.message}
            </div>
        `);
    }
}

function saveSummaryAsNote(summaryText) {
    const timestamp = new Date().toISOString();
    const newNote = {
        text: `[Summary] ${summaryText}`,
        timestamp,
        id: Date.now(),
        type: 'summary'
    };

    chrome.storage.local.get(['notes'], function(result) {
        const notes = result.notes || [];
        notes.unshift(newNote);
        chrome.storage.local.set({ 'notes': notes }, function() {
            showNotification('Summary saved successfully!');
            loadSavedNotes();
            switchTab('notes'); // Switch to notes tab after saving
        });
    });
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

async function saveNotes() {
    const noteText = document.getElementById('notes').value.trim();
    if (!noteText) return;

    const timestamp = new Date().toISOString();
    const newNote = { text: noteText, timestamp, id: Date.now() };

    chrome.storage.local.get(['notes'], function(result) {
        const notes = result.notes || [];
        notes.unshift(newNote);
        chrome.storage.local.set({ 'notes': notes }, function() {
            document.getElementById('notes').value = '';
            loadSavedNotes();
        });
    });
}

function loadSavedNotes() {
    chrome.storage.local.get(['notes'], function(result) {
        const notes = result.notes || [];
        const savedNotesContainer = document.getElementById('savedNotes');
        savedNotesContainer.innerHTML = notes.map(note => createNoteCard(note)).join('');
        
        // Add click listeners to toggle expansion
        document.querySelectorAll('.note-card').forEach(card => {
            card.addEventListener('click', () => toggleNoteExpansion(card));
        });
    });
}

function createNoteCard(note) {
    const date = new Date(note.timestamp).toLocaleDateString();
    const isNoteSummary = note.type === 'summary';
    return `
        <div class="note-card ${isNoteSummary ? 'summary-note' : ''}" data-id="${note.id}">
            <div class="note-preview">
                <span class="material-icons">${isNoteSummary ? 'auto_awesome' : 'note'}</span>
                ${note.text.substring(0, 100)}${note.text.length > 100 ? '...' : ''}
            </div>
            <div class="note-full">${note.text}</div>
            <small>
                <span class="material-icons">schedule</span>
                ${date}
            </small>
        </div>
    `;
}

function toggleNoteExpansion(card) {
    card.classList.toggle('expanded');
    const fullNote = card.querySelector('.note-full');
    fullNote.classList.toggle('visible');
}

function showResult(content) {
    document.getElementById('results').innerHTML = `
        <div class="result-item">
            <div class="result-content">${content}</div>
        </div>
    `;
}
