import axios from "axios";

/**
 * Calls the Pet Name API to suggest pet names.
 */
class PetNameService {
    baseUrl;

    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    /**
     * Suggest names.
     *
     * @returns {Promise<string[]>}
     */
    async suggestNames() {
        const response = await axios.get(`${this.baseUrl}/names`);
        console.log(`names:`, response.data);
        return response.data;
    }
}

module.exports = (baseUrl) => {
    return new PetNameService(baseUrl);
}
