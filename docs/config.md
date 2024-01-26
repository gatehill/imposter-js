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
  "version": "3.33.4"
}
```

> In this example, we use the Docker engine (the default) and version 1.23.0 of Imposter.

Example 2:

```json
{
  "engine": "jvm",
  "version": "3.33.4"
}
```

> In this example, we use the JVM engine and version 1.22.0 of Imposter.

## SELinux and Docker user permissions

By default, the Imposter container runs with a lower permissioned user, with uid/gid of 2048.

If SELinux is enabled, this user may not be able to read configuration written by this library.

To fix this, you can change the container user, using:

    export IMPOSTER_DOCKER_CONTAINERUSER="$(id -u)"

This aligns the container user uid to that of your local environment.
