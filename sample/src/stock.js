import axios from "axios";

/**
 * Calls the Stock API to fetch available products.
 */
class StockService {
    baseUrl;

    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    /**
     * Fetch available products.
     *
     * @returns {Promise<any>}
     */
    async listStock() {
        const response = await axios.get(`${this.baseUrl}/products`);
        console.log(`products:`, response.data);
        return response.data;
    }
}

module.exports = (baseUrl) => {
    return new StockService(baseUrl);
}
