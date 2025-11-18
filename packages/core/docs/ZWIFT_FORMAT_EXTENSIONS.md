# Zwift Format Extensions for Kaiord

## Overview

Kaiord extends the standard Zwift workout format (.zwo) to support additional workout data that is not natively supported by Zwift but is necessary for round-trip conversions with other formats (FIT, TCX, PWX).

## Standard Zwift Format Limitations

The official Zwift workout format has the following limitations:

1. **No Heart Rate Targets**: Zwift does not support heart rate-based targets in workout steps
2. **Time-Only Durations**: Zwift only supports time-based durations (seconds), not distance-based
3. **Limited Duration Types**: Zwift does not support conditional durations (e.g., heart_rate_less_than, power_greater_than)
4. **Power as FTP Factor Only**: Zwift stores power as a factor of FTP (0.0-3.0), not absolute watts

## Kaiord Extensions

To enable lossless round-trip conversions (FIT → Zwift → FIT), Kaiord includes additional data in the Zwift XML that is ignored by Zwift but preserved for conversion back to other formats.

### 1. Heart Rate Targets (Planned)

**Problem**: FIT and TCX files can have heart rate targets, but Zwift does not support them.

**Solution**: Store heart rate target information in XML comments or custom attributes that Zwift ignores but Kaiord can read.

**Example**:

```xml
<SteadyState Duration="300">
  <!-- kaiord:hr_target_low="140" -->
  <!-- kaiord:hr_target_high="160" -->
</SteadyState>
```

**Status**: 🚧 Not yet implemented - currently HR targets are lost in conversion

### 2. Original Duration Type

**Problem**: When converting distance-based durations to time, the original duration type is lost.

**Solution**: Store original duration information in comments.

**Example**:

```xml
<Ramp Duration="500" PowerLow="1.2" PowerHigh="1.3">
  <!-- kaiord:original_duration_type="distance" -->
  <!-- kaiord:original_duration_meters="500" -->
</Ramp>
```

**Status**: 🚧 Not yet implemented - currently logged as warning

### 3. Absolute Watts with FTP Context

**Problem**: Zwift stores power as FTP factor, but original FIT files may have absolute watts.

**Solution**: Store original watts and FTP used for conversion in comments.

**Example**:

```xml
<Ramp Duration="500" PowerLow="1.2" PowerHigh="1.24">
  <!-- kaiord:original_watts_low="300" -->
  <!-- kaiord:original_watts_high="310" -->
  <!-- kaiord:assumed_ftp="250" -->
</Ramp>
```

**Status**: 🚧 Not yet implemented - currently logged as warning

## Lossy Conversions

When converting from FIT/TCX to Zwift, the following conversions are **lossy** (information is lost):

### 1. Distance Durations → Time Durations

**Conversion**: Distance in meters is used directly as seconds

- 500 meters → Duration="500" (500 seconds)

**Warning Logged**:

```
Lossy conversion: distance duration converted to time
{ originalMeters: 500, convertedSeconds: 500, stepIndex: 1 }
```

**Impact**: The workout will have a different duration when executed

### 2. Conditional Durations → Fixed Time

**Conversion**: Unsupported duration types use a fallback of 300 seconds

- heart_rate_less_than → Duration="300"
- power_greater_than → Duration="300"

**Warning Logged**:

```
Lossy conversion: unsupported duration type
{ originalType: "heart_rate_less_than", fallbackSeconds: 300, stepIndex: 3 }
```

**Impact**: The workout step will have a fixed duration instead of being conditional

### 3. Absolute Watts → Percent FTP

**Conversion**: Watts are converted to percent FTP using an assumed FTP of 250W

- 300W → 120% FTP (with FTP=250W) → PowerLow="1.2"

**Warning Logged**:

```
Lossy conversion: watts converted to percent FTP
{ originalWatts: {low: 300, high: 310}, assumedFtp: 250,
  convertedPercentFtp: {low: 120, high: 124}, stepIndex: 1 }
```

**Impact**: The workout intensity will be different for users with FTP ≠ 250W

### 4. Heart Rate Targets → Removed

**Conversion**: Heart rate targets are completely removed

- HR target 140-160 bpm → No target in Zwift

**Warning Logged**: (Not yet implemented)

**Impact**: The workout will have no heart rate guidance

## Future Enhancements

### 1. XML Comments for Metadata

Implement storing of original values in XML comments:

```xml
<workout_file>
  <!-- kaiord:version="1.0" -->
  <!-- kaiord:source_format="fit" -->
  <!-- kaiord:conversion_date="2025-01-15T10:30:00Z" -->
  <name>Example Workout</name>
  <sportType>bike</sportType>
  <workout>
    <SteadyState Duration="300" Power="1.2">
      <!-- kaiord:hr_target_low="140" -->
      <!-- kaiord:hr_target_high="160" -->
    </SteadyState>
  </workout>
</workout_file>
```

### 2. Custom XML Namespace

Use a custom XML namespace for Kaiord-specific attributes:

```xml
<workout_file xmlns:kaiord="http://kaiord.dev/zwift-extensions/1.0">
  <name>Example Workout</name>
  <sportType>bike</sportType>
  <workout>
    <SteadyState Duration="300" Power="1.2"
                 kaiord:hrLow="140"
                 kaiord:hrHigh="160">
    </SteadyState>
  </workout>
</workout_file>
```

### 3. FTP Parameter

Add optional FTP parameter to Zwift writer:

```typescript
type ZwiftWriterOptions = {
  ftp?: number; // User's FTP in watts for accurate conversion
};

const zwiftWriter = createFastXmlZwiftWriterWithOptions(logger, validator);
const xml = await zwiftWriter(krd, { ftp: 250 });
```

## Compatibility

### Zwift Application

- ✅ Standard Zwift attributes are fully compatible
- ✅ XML comments are ignored by Zwift (safe to include)
- ⚠️ Custom namespaces may cause issues (needs testing)

### Round-Trip Conversion

- ✅ Zwift → KRD → Zwift: Fully supported (no data loss)
- ⚠️ FIT → Zwift → FIT: Lossy (HR targets, exact durations, absolute watts)
- ⚠️ TCX → Zwift → TCX: Lossy (HR targets, exact durations)

## References

- [Zwift Workout Format](https://zwift.com)
- [Garmin FIT SDK](https://developer.garmin.com/fit/)
- [TCX Schema](https://www8.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd)
- [Kaiord KRD Format](./KRD_FORMAT.md)

## Version History

- **v1.0** (2025-01-15): Initial documentation
  - Documented lossy conversions
  - Defined extension strategy
  - Planned future enhancements
