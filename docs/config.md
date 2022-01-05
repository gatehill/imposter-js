# Engine configuration

Imposter supports different mock engine types: Docker (default) and JVM. For more information about configuring the engine type see:

- [Docker engine](https://github.com/gatehill/imposter-cli/blob/main/docs/docker_engine.md) (default)
- [JVM engine](https://github.com/gatehill/imposter-cli/blob/main/docs/jvm_engine.md)

## User defaults

Default mock engine configuration can be set in your home directory, under the following path:

    $HOME/.imposter/config.yaml

See [configuration options](https://github.com/gatehill/imposter-cli/blob/main/docs/config.md) for this file.

## Project-specific configuration

You can add a file named `imposter.config.json` to the root of your project, to configure the mock engine.

This will cause any user defaults to be ignored and the project configuration will be used instead.

Example 1:

```json
{
  "engine": "docker",
  "version": "2.4.12"
}
```

> In this example, we use the Docker engine (the default) and version 1.23.0 of Imposter.

Example 2:

```json
{
  "engine": "jvm",
  "version": "2.4.12"
}
```

> In this example, we use the JVM engine and version 1.22.0 of Imposter.
