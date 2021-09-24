Sample project for Imposter with Jest
=====================================

## Prerequisites

- Node.js 12+
- [Imposter CLI](https://github.com/gatehill/imposter-cli)

## Instructions

Run tests as follows:

	npm install
    npm test

## API details

The following third party services are mocked:

### order-service

Defined using OpenAPI specifications under the `third-party/order-service` directory.

The directory also contains Imposter configuration files, as well as dynamic scripts to synthesise an order confirmation.

### pet-name-service

A bare directory under `third-party/pet-name-service` containing only an OpenAPI file, with the Imposter configuration generated when the mock starts.

### stock-service

Defined using OpenAPI specifications under the `third-party/stock-service` directory.

The directory also contains Imposter configuration files, but no dynamic scripts.

### user-service

A mock defined entirely within the [Jest test](./src/users.test.js) - no OpenAPI specification, no Imposter configuration - all done when Jest executes the test.

## Application details

A simple application is defined in `index.js` that chains calls for some of the above services.
