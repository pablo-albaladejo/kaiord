# Kaiord

Kaiord gathers an athlete's training and health data from the platforms where it is scattered and lets them plan, convert and move it between those platforms. It keeps no accounts and stores no user data on its own infrastructure.

## Language

### Product

**Kaiord SDK**:
The published libraries and tools that read, validate and convert training and health data: the core, the format adapters, the CLI and the MCP server.
_Avoid_: Framework, platform, toolkit

**Kaiord App**:
The browser application an athlete uses to see, plan and move their data, together with the bridges it relies on.
_Avoid_: Cockpit, editor, SPA, platform

**Athlete**:
The person whose training and health data Kaiord handles; any athlete whose data is scattered across several platforms.
_Avoid_: User, customer, client, profile

**Day**:
The single place everything in the Kaiord App hangs from: for one calendar date, what the coach prescribed, what the athlete plans to do, what they did, and their health that date.
_Avoid_: Today page, daily view, dashboard

**Capability**:
A part of the Kaiord App beyond the core path from Coaching Activity to Workout on the watch, which stays off and out of sight until the athlete activates it.
_Avoid_: Feature flag, module, plugin, add-on

### Training

**Coaching Activity**:
What a coach prescribes for a given day, as the coach wrote it, before it has any structure.
_Avoid_: Session, training, plan, raw workout

**Workout**:
A training prescription structured into steps with durations and targets, ready to be executed on a device.
_Avoid_: Session, training, structured workout, plan

**Activity**:
The record of what the athlete actually did.
_Avoid_: Session, completed workout, recorded activity

**Template**:
A Workout kept to be reused on other Days.
_Avoid_: Library item, saved workout

### What the athlete reads

A Workout shows exactly one of three states, and nothing else about its internals:

**To prepare**:
There is a Coaching Activity or a draft for the Day, and no Workout that a device could execute yet.
_Avoid_: Raw, pending, unstructured

**Ready**:
The Workout is complete and can be sent to the watch.
_Avoid_: Structured, planned

**On the watch**:
The Workout has been sent and the Platform holds it for that Day. If it was edited afterwards, the athlete sees one notice: it changed since it was sent.
_Avoid_: Pushed, synced, scheduled, stale, modified

A Connection either works, in which case no notice is shown, or shows one of four fixes, each with a single wording shared by the Kaiord App and the extensions: **Install**, **Update**, **Sign in to** the Platform, **Try again**. A cause that was not verified is never stated: when it is not known, the notice says the Platform is not answering and the fix is Try again.

One verb per goal:

**Create**: start a new Workout. _Avoid_: Add, new
**Schedule**: place a Workout or a Template on a Day. _Avoid_: Plan, set
**Send**: put a Workout on the watch. _Avoid_: Push, upload, export
**Save as template**: keep a Workout as a Template. _Avoid_: Save to library
**Match**: pair a Coaching Activity with a Workout or an Activity. _Avoid_: Link
**Connect**: authorise a Connection to a Platform. _Avoid_: Link, pair

### Data

**KRD**:
The canonical representation every piece of training and health data is converted into and exported from inside the Kaiord SDK. It is an internal model, not a standard offered to third parties.
_Avoid_: Kaiord format, open standard, interchange format

**Round-trip**:
Converting data from a format into KRD and back with every value preserved within the declared tolerances.
_Avoid_: Lossless, zero data loss

### External services

Connection, Connector, Tool, Trace and Authority are shared words: they mean here what they mean in every other project of the same author, and are defined once for all of them. The definitions below restate them in Kaiord's terms.

**Platform**:
An external service that holds an athlete's data, such as Garmin Connect, WHOOP, TrainingPeaks, Train2Go or Tanita.
_Avoid_: Integration, provider, service

**Provider**:
The language-model service an athlete configures in the Kaiord App with their own key. Never used for a Platform.
_Avoid_: AI vendor, model service

**Session**:
The athlete's authenticated login on a Platform, in their own browser.
_Avoid_: Using "session" for a Coaching Activity or a chat conversation

**Connection**:
An athlete's authorised link to one Platform. It belongs to one athlete and is never shared.
_Avoid_: Integration, account link, credential, token

**Connector**:
What reads and writes an athlete's data on one kind of Platform, through a Connection. There is one per Platform.
_Avoid_: Integration, plugin, sync, client

**Bridge**:
A browser extension that lends a Connector the athlete's Session on one Platform. The athlete never reads this word: each one is called "Kaiord for" its Platform, and "extension" when a noun is needed.
_Avoid_: Integration, connector, plugin, "the Kaiord extension" (there are five)

**Authority**:
The Platform that decides the value of a kind of data when more than one reports it.
_Avoid_: Routing, source policy, source of truth, master

### Assistant

**Tool**:
One read or action the assistant may take, with its limits. A Tool that changes anything waits for the athlete to confirm it.
_Avoid_: Skill, plugin, function

**Trace**:
The record the Kaiord App keeps, on the athlete's device, of what a run of the assistant did: what, when, with what result and at what cost.
The athlete reads "Trace" in English and "Traza" in Spanish.
_Avoid_: Log, usage event, telemetry, "registro"
