import axios from "axios";

class PetNameService {
    baseUrl;

    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async suggestNames() {
        const response = await axios.get(`${this.baseUrl}/names`);
        console.log(`names: ${JSON.stringify(response.data)}`);
        return response.data;
    }
}

module.exports = (baseUrl) => {
    return new PetNameService(baseUrl);
}
