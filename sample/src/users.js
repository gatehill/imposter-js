import axios from "axios";

/**
 * Calls the
 */
class UserService {
    baseUrl;

    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async addUser(userName) {
        const response = await axios.post(`${this.baseUrl}/users/${userName}`);
        console.log(`add user response:`, response.data);
        return response.data;
    }
}

module.exports = (baseUrl) => {
    return new UserService(baseUrl);
}
