import axios from "axios";

class StockService {
    baseUrl;

    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async listStock() {
        const response = await axios.get(`${this.baseUrl}/products`);
        console.log(`products:`, response.data);
        return response.data;
    }
}

module.exports = (baseUrl) => {
    return new StockService(baseUrl);
}
