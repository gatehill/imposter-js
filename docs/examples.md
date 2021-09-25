
## Examples

> See the [sample](https://github.com/gatehill/imposter-js/tree/main/sample) directory for a Node.js project with many examples.

### Example with Jest

Here's an example using Jest:

```js
const {mocks} = require('@imposter-js/imposter');

jest.setTimeout(30000);

beforeAll(async () => {
    // path to Imposter config directory, relative to the test file
    const configDir = `${__dirname}/../order-api`;

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

### Example using just an OpenAPI file

Here's an example mock that just uses an OpenAPI file:

```js
// build a mock from a bare OpenAPI spec file
// requests are validated against the spec
var mock = mocks.builder()
    .withPort(8082)
    .withOpenApiSpec('/path/to/pet-names-api.yaml')
    .withRequestValidation()
    .build();

// spin it up
await mock.start();

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
const builder = mocks.builder().withPort(8083).withPlugin('rest');

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

const mock = builder.build();

// spin it up
await mock.start();

// call the mock
const response = await axios.post(`${mock.baseUrl()}/users/alice`);

// Output: alice registered
// This will vary dynamically, based on the request.
console.log(response.data);
```
