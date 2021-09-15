import stock from "./services/stock";
import orders from "./services/orders";

class App {
    stockService;
    orderService;

    constructor(config) {
        this.stockService = stock(config.stockBaseUrl);
        this.orderService = orders(config.ordersBaseUrl);
    }

    orderItemInStock = async () => {
        const products = await this.stockService.listStock();

        // order the first item in stock
        const orderItems = [
            {sku: products[0].sku}
        ];
        const confirmation = await this.orderService.placeOrder(orderItems);
        console.log(`order confirmation: ${confirmation}`);
        return confirmation;
    };
}

module.exports = (config) => {
    return new App(config);
}
