# Imposter Mock Engine [![CI](https://github.com/gatehill/imposter-js/actions/workflows/ci.yaml/badge.svg)](https://github.com/gatehill/imposter-js/actions/workflows/ci.yaml)

Bindings for using the [Imposter mock engine](https://github.com/outofcoffee/imposter/) in JavaScript/Node.js.

Embed live HTTP mocks within your tests, based on OpenAPI specification files or plain REST APIs.

## Usage

```js
const {mocks} = require('@imposter-js/imposter');

// start a mock from an OpenAPI spec file on a specific port
await mocks.builder()
    .withPort(8080)
    .withOpenApiSpec('/path/to/openapi_spec.yaml')
    .start();

// call one of the endpoints defined in the OpenAPI spec
const response = await axios.get('http://localhost:8080/products');

// print JSON returned from the mock
console.log(response.data);
```

This is just a simple example. Your mocks can have dynamic responses, request validation against an OpenAPI schema, data capture, performance delays etc...

> See the [sample](https://github.com/gatehill/imposter-js/tree/main/sample) directory for a Node.js project with many examples.

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

- Install **[Imposter CLI](https://github.com/gatehill/imposter-cli/blob/main/docs/install.md)**. Supports macOS, Linux, Windows.
- Ensure you satisfy the CLI requirements (either [Docker installed](https://docs.docker.com/get-docker/) and running, or a [JVM installed](https://github.com/gatehill/imposter-cli/blob/main/docs/jvm_engine.md)).

## Examples

> See the [sample](https://github.com/gatehill/imposter-js/tree/main/sample) directory for a Node.js project with many examples.

### Example with Jest

Here's an example using Jest:

```js
const {mocks} = require('@imposter-js/imposter');

jest.setTimeout(30000);

beforeAll(async () => {
    // path to Imposter config directory
    const configDir = `/path/to/order-api`;

    // start a mock on a specific port
    await mocks.start(configDir, 8080);
});

afterAll(async () => {
    mocks.stopAll();
});

it('places an order', async () => {
    // configure the unit under test
    const orderService = new OrderService('http://localhost:8080/orders');

    // call your unit under test, which invokes the mock
    const confirmation = await orderService.placeOrder('product-05');

    // assert values returned by the mock
    expect(confirmation.total).toEqual(18.00);
});
```

### Example using just an OpenAPI file

Here's an example mock that just uses an OpenAPI file:

```js
// start a mock from a bare OpenAPI spec file
// requests are validated against the spec
const mock = await mocks.builder()
    .withOpenApiSpec('/path/to/pet-names-api.yaml')
    .withRequestValidation()
    .start();

// call the mock
const response = await axios.get(`${mock.baseUrl()}/names`);

// Output: [ 'Fluffy', 'Paws' ]
// This is driven by either the 'examples' property
// in the OpenAPI spec, or the schema of the response.
console.log(response.data);
```

### Example with no config file

Here's an example mock that doesn't require any configuration file:

```js
const builder = mocks.builder().withPlugin('rest');

// add a POST resource with a path parameter
const resource = builder.addResource('/users/{userName}', 'POST');

// capture the userName path parameter from the request
// for later use in the response
resource.captures().fromPath('userName');

// respond with a templated message indicating the user
// was created by name
resource.responds(201)
    .withTemplateData('${request.userName} registered')
    .withHeader('Content-Type', 'text/plain');

// spin it up
const mock = await builder.start();

// call the mock
const response = await axios.post(`${mock.baseUrl()}/users/alice`);

// Output: alice registered
// This will vary dynamically, based on the request.
console.log(response.data);
```

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
