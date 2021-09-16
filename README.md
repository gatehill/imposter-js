Imposter JavaScript Bindings
============================

Bindings for using the [Imposter mock engine](https://github.com/outofcoffee/imposter/) in JavaScript/Node.js.

## Usage

```js
const imposter = require('@imposter-js/imposter');
const mocks = imposter();

// start mock
const mock = mocks.start('/path/to/config', 8080);

// call the mock
const response = await axios.get('http://localhost:8080/products');

// print products
console.log(response.data);

// stop the mock
mocks.stopAll();
```

## Quickstart

Imposter is available as an [npm package](https://www.npmjs.com/package/@imposter-js/imposter).

Install with npm:

    npm install --save-dev @imposter-js/imposter

Or add to your `package.json` as a dev dependency:

```json
"devDependencies": {
  "@imposter-js/imposter": "*"
}
```

> See available versions on the [npm registry](https://www.npmjs.com/package/@imposter-js/imposter?activeTab=versions)

## Prerequisites

Install [Imposter CLI](https://github.com/gatehill/imposter-cli):

If you have Homebrew installed:

```shell
brew tap gatehill/imposter
brew install imposter
```

Or, use this one liner (macOS and Linux only):

```shell
curl -L https://raw.githubusercontent.com/gatehill/imposter-cli/main/install/install_imposter.sh | bash -
```

## Example with Jest

Here's an example using Jest:

```js
const imposter = require('@imposter-js/imposter');
const mocks = imposter();

jest.setTimeout(30000);

beforeAll(async () => {
    // path to Imposter config
    const configDir = `${process.cwd()}/order-api`;

    // start the mocks (returns a Promise)
    return mocks.start(configDir, 8080);
});

afterAll(async () => {
    return mocks.stopAll();
})

it('places an order', async () => {
    // configure the unit under test
    const orderService = new OrderService('http://localhost:8080/orders');

    // call your unit under test, which invokes the mock
    const confirmation = await orderService.placeOrder('product-05');

    // assert values returned to the unit under test by the mock
    expect(confirmation.total).toEqual(18.00);
});
```

> See the [sample](./sample) directory for a working Node.js project.

## Acknowledgements

- [Imposter](https://github.com/outofcoffee/imposter)
- [Jest](https://jestjs.io/)
