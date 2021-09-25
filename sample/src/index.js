import {StockService} from "./stock";
import {OrderService} from "./orders";

/**
 * A simple pet store application that chains calls for some of the services.
 */
class PetStore {
    stockService;
    orderService;

    /**
     * @param config {{stock: string, order: string}}
     */
    constructor(config) {
        this.stockService = new StockService(config.stock);
        this.orderService = new OrderService(config.order);
    }

    /**
     * Retrieve the products in stock, then order the first one.
     *
     * @returns {Promise<Object>}
     */
    orderFirstItemInStock = async () => {
        const products = await this.stockService.listStock();

        // order the first item in stock
        const orderItems = [
            {sku: products[0].sku}
        ];
        const confirmation = await this.orderService.placeOrder(orderItems);
        console.log(`order confirmation:`, confirmation);
        return confirmation;
    };
}

export {PetStore};
