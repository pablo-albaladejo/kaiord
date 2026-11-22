---
status: accepted
---

# The Day is the only mental model of the Kaiord App

Every area of the Kaiord App had been redesigned between four and ten times, and it had grown to eleven navigation destinations with everything switched on from first load. We decided on one last redesign around a single model: the Day. For one date it shows what the coach prescribed, what the athlete plans to do, what they did, and their health. Everything else is a tool that acts on a Day or a Capability the athlete activates.

What that fixes:

- **Two destinations**: Day, where the athlete lands, and Calendar, the week and month of Days. The assistant is a panel over the open Day. Athlete, Connections and Settings are one settings place.
- **Capabilities off by default**: only the core path from Coaching Activity to Workout on the watch is present at first. Labs, nutrition, trends, templates, the assistant and every Platform beyond the core path stay out of navigation and settings until activated.
- **First result with nothing set up**: an athlete drops a file or creates a Workout and sees it on their Day, ready for the watch, before installing or configuring anything.
- **One primary action per screen**: on Day, take today's Workout to the watch (or prepare it); on Calendar, send the week. One primary style; red is only for destroying.
- **Three states and no jargon**: a Workout is To prepare, Ready or On the watch. KRD never appears; file formats appear only as file types on import and export.
- **Decide and offer undo**: the App asks first only before something irreversible outside the device, and the first time health data goes to a Provider.
- **One setup guide driven by real state**, showing only the next step.
- **The phone is a companion for looking**, and says so wherever a Bridge would be needed.

## Considered Options

- **Conversation first**, with the assistant as the main interface: rejected, because the App must be useful end to end with no Provider key.
- **Subtractive changes only**, hiding and merging without redrawing: rejected in favour of one final redesign, drawn first.

## Consequences

- The base pieces of the design system are consolidated before any screen is drawn; screens are drawn before they are built.
- After it ships, a screen changes only when a measure fails: a new athlete reaches the first Workout on the watch in ten minutes, and daily use takes three touches. Both are automated tests.
- Adding a navigation destination, a visible state or a confirmation dialog requires changing this record, and a guard enforces it.
- The redesign is not finished until one person who has never seen Kaiord reaches the first result without help.
