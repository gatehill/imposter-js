Imposter Mock Engine
====================

Bindings for using the [Imposter mock engine](https://github.com/outofcoffee/imposter/) in JavaScript/Node.js.

Embed live HTTP mocks within your tests, based on OpenAPI specification files or plain REST APIs.

## Usage

```js
const {mocks} = require('@imposter-js/imposter');

// build a mock of an OpenAPI spec
const mock = mocks.builder()
    .withPort(8080)
    .withOpenApiSpec('/path/to/openapi_spec.yaml')
    .build();

await mock.start();

// call the mock
const response = await axios.get('http://localhost:8080/products');

// print products
console.log(response.data);

// stop the mock
mocks.stopAll();
```

> See the [sample](https://github.com/gatehill/imposter-js/tree/main/sample) directory for a working Node.js project.

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

1. Install [Imposter CLI](https://github.com/gatehill/imposter-cli/blob/main/docs/install.md)
2. Ensure you have _either_ [Docker installed](https://docs.docker.com/get-docker/) and running, or a [JVM installed](https://github.com/gatehill/imposter-cli/blob/main/docs/jvm_engine.md).

## Example with Jest

Here's an example using Jest:

```js
const {mocks} = require('@imposter-js/imposter');

jest.setTimeout(30000);

beforeAll(async () => {
    // path to Imposter config
    const configDir = `${process.cwd()}/order-api`;

    // start the mocks (returns a Promise) using an existing
    // Imposter config file in the 'order-api' directory
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

> See the [sample](https://github.com/gatehill/imposter-js/tree/main/sample) directory for a working Node.js project.

## Documentation

- [Mock engine configuration](https://github.com/gatehill/imposter-js/blob/main/docs/config.md)
- [Imposter user documentation](https://outofcoffee.github.io/imposter)

## Features

* run standalone mocks in place of real systems
* turn an OpenAPI/Swagger file into a mock API for testing or QA (even before the real API is built)
* decouple your integration tests from the cloud/various back-end systems and take control of your dependencies
* validate your API requests against an OpenAPI specification

Send dynamic responses:

- Provide mock responses using static files or customise behaviour based on characteristics of the request.
- Power users can control mock responses with JavaScript.

## Acknowledgements

This project is only possible thanks to the following:

- [Imposter](https://github.com/outofcoffee/imposter)
- [Jest](https://jestjs.io/)
