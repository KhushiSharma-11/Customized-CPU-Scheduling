import axios from 'axios';

// If package.json has "proxy": "http://localhost:5000", axios('/simulate') works.
// For safety, allow an env override.
const baseURL = process.env.REACT_APP_API_BASE || '';

const api = axios.create({ baseURL });

export default api;
