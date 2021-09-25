import axios from "axios";

/**
 * Calls the Order API to place orders.
 */
class OrderService {
    baseUrl;

    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    /**
     * Place an order for a given SKU.
     *
     * @param orderItems
     * @returns {Promise<object>}
     */
    async placeOrder(orderItems) {
        if (!orderItems || orderItems.length === 0) {
            throw new Error('Must provide at least one order item');
        }
        const response = await axios.post(`${this.baseUrl}/orders`, orderItems);
        console.log(`returned: ${response.status} ${response.statusText}`);
        return response.data;
    }
}

const buildService = (baseUrl) => {
    return new OrderService(baseUrl);
};

export {buildService};
