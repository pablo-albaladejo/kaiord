# @kaiord/cli

Command-line interface for Kaiord workout file conversion. Convert workout files between FIT, KRD, TCX, and ZWO formats with ease.

## Installation

Install globally using npm or pnpm:

```bash
npm install -g @kaiord/cli
```

or

```bash
pnpm add -g @kaiord/cli
```

After installation, the `kaiord` command will be available globally.

## Usage

### Convert Command

Convert workout files between different formats.

#### Basic Usage

```bash
kaiord convert --input workout.fit --output workout.krd
```

#### FIT to KRD

```bash
kaiord convert --input workout.fit --output workout.krd
```

#### KRD to FIT

```bash
kaiord convert --input workout.krd --output workout.fit
```

#### Batch Conversion

Convert multiple files using glob patterns:

```bash
kaiord convert --input "workouts/*.fit" --output-dir converted/
```

#### Format Override

Override automatic format detection:

```bash
kaiord convert --input data.bin --input-format fit --output workout.krd
```

### Validate Command

Perform round-trip validation to verify data integrity.

#### Basic Validation

```bash
kaiord validate --input workout.fit
```

#### Custom Tolerances

Use a custom tolerance configuration file:

```bash
kaiord validate --input workout.fit --tolerance-config tolerance.json
```

Example `tolerance.json`:

```json
{
  "time": { "absolute": 1, "unit": "seconds" },
  "power": { "absolute": 1, "percentage": 1, "unit": "watts" },
  "heartRate": { "absolute": 1, "unit": "bpm" },
  "cadence": { "absolute": 1, "unit": "rpm" }
}
```

## Configuration File

You can create a `.kaiordrc.json` file to set default options. The CLI will search for this file in:

1. Current working directory
2. User home directory (`~/.kaiordrc.json`)

CLI options always take precedence over config file defaults.

### Example Configuration

Create `.kaiordrc.json` in your project or home directory:

```json
{
  "defaultInputFormat": "fit",
  "defaultOutputFormat": "krd",
  "defaultOutputDir": "./converted",
  "defaultToleranceConfig": "./tolerance.json",
  "verbose": false,
  "quiet": false,
  "json": false,
  "logFormat": "pretty"
}
```

### Configuration Options

- **defaultInputFormat**: Default input format (`fit`, `krd`, `tcx`, `zwo`)
- **defaultOutputFormat**: Default output format (`fit`, `krd`, `tcx`, `zwo`)
- **defaultOutputDir**: Default output directory for batch conversions
- **defaultToleranceConfig**: Path to default tolerance configuration file
- **verbose**: Enable verbose logging by default
- **quiet**: Enable quiet mode by default
- **json**: Enable JSON output by default
- **logFormat**: Default log format (`pretty` or `structured`)

### Usage with Config File

With a config file, you can simplify your commands:

```bash
# Without config file
kaiord convert --input workout.fit --output workout.krd --output-format krd

# With config file (defaultOutputFormat: "krd")
kaiord convert --input workout.fit --output workout.krd
```

CLI options override config defaults:

```bash
# Config has verbose: true, but --quiet overrides it
kaiord convert --input workout.fit --output workout.krd --quiet
```

## Global Options

### Verbosity Control

```bash
# Verbose output (detailed logging)
kaiord convert --input workout.fit --output workout.krd --verbose

# Quiet mode (errors only)
kaiord convert --input workout.fit --output workout.krd --quiet
```

### Output Format

```bash
# JSON output (machine-readable)
kaiord convert --input workout.fit --output workout.krd --json

# Force pretty terminal output
kaiord convert --input workout.fit --output workout.krd --log-format pretty

# Force structured JSON logs
kaiord convert --input workout.fit --output workout.krd --log-format json
```

## Supported Formats

- **FIT** (.fit) - Garmin's binary workout file format
- **KRD** (.krd) - Kaiord's canonical JSON format
- **TCX** (.tcx) - Training Center XML format
- **ZWO** (.zwo) - Zwift workout XML format

### Plugin System (Future Enhancement)

The CLI is designed with a plugin architecture that will allow third-party developers to add support for custom workout file formats without modifying the core library. See [Plugin Architecture Documentation](./docs/plugin-architecture.md) for details on the design.

**Planned Features:**

- Dynamic plugin discovery and loading
- Type-safe plugin interface
- Automatic format detection for plugin formats
- Plugin configuration via `.kaiordrc.json`
- Plugin management commands (`kaiord plugins list`, `install`, etc.)

**Example Plugin Usage (Future):**

```bash
# Install a plugin
npm install -g @kaiord/plugin-gpx

# Use plugin format
kaiord convert --input workout.gpx --output workout.krd
```

See [Example GPX Plugin](./docs/example-plugin-gpx.md) for a complete plugin implementation example.

## Exit Codes

- **0**: Success
- **1**: Error (invalid arguments, file not found, parsing error, validation error)

## Documentation

### Main Documentation

- **[Getting Started](../../docs/getting-started.md)** - Installation and basic usage
- **[KRD Format Specification](../../docs/krd-format.md)** - Complete format documentation
- **[Deployment Guide](../../docs/deployment.md)** - CI/CD and npm publishing

### Package-Specific Documentation

- **[npm Publish Verification](./docs/npm-publish-verification.md)** - Publishing checklist and verification

## Development

```bash
# Install dependencies
pnpm install

# Build the CLI
pnpm build

# Run in development mode
pnpm dev -- convert --input workout.fit --output workout.krd

# Link for local testing
npm link
kaiord --version
npm unlink -g
```

## Testing

Run the test suites:

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run integration tests
pnpm test:integration

# Run smoke tests
pnpm test:smoke

# Run tests in watch mode
pnpm test:watch
```

## License

MIT - See [LICENSE](../../LICENSE) file for details.
