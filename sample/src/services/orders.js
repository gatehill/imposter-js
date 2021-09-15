import axios from "axios";

class OrderService {
    baseUrl;

    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async placeOrder(orderItems) {
        if (!orderItems || orderItems.length === 0) {
            throw new Error('Must provide at least one order item');
        }
        const response = await axios.post(`${this.baseUrl}/orders`, orderItems);
        console.log(`returned: ${response.status} ${response.statusText}`);
        return response.data;
    }
}

module.exports = (baseUrl) => {
    return new OrderService(baseUrl)
};
