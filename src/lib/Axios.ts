import axios from 'axios';
const env = import.meta.env
const API_BASE_URL = env.VITE_API_URL ?? 'http://localhost:3000/api';

const Axios = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

export default Axios