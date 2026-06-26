const BASE_URL = window.location.protocol === 'file:' 
    ? 'http://127.0.0.1:3000/api' 
    : '/api';

const api = {
    post: async (endpoint, data) => {
        try {
            const res = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'API Error');
            return result;
        } catch (err) {
            alert(err.message);
            throw err;
        }
    },
    get: async (endpoint) => {
        try {
            const res = await fetch(`${BASE_URL}${endpoint}`);
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'API Error');
            return result;
        } catch (err) {
            console.error(err);
            throw err;
        }
    },
    delete: async (endpoint) => {
        try {
            const res = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'DELETE'
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'API Error');
            return result;
        } catch (err) {
            console.error(err);
            throw err;
        }
    }
};

// User management helpers
function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}
