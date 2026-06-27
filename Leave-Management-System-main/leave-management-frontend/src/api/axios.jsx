import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000",
    withCredentials: true,
    withXSRFToken: true,
    
});

export default api;

// import axios from "axios";


// const api = axios.create({
//     baseURL: "https://hrmanage.infinityfreeapp.com",
// });

// export default api;