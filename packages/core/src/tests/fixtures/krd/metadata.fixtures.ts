import { faker } from "@faker-js/faker";
import { Factory } from "rosie";

import type { KRDMetadata } from "../../../domain/schemas/krd";
import { FAKER_SERIAL_NUMBER_DIGITS } from "../../../test-utils/tolerance-constants";

export const buildKRDMetadata = new Factory<KRDMetadata>()
  .attr("created", () => faker.date.recent().toISOString())
  .attr("manufacturer", () =>
    faker.helpers.arrayElement(["garmin", "wahoo", "polar", "suunto"])
  )
  .attr("product", () =>
    faker.helpers.arrayElement(["fenix7", "edge530", "forerunner945", "elemnt"])
  )
  .attr("serialNumber", () => faker.string.numeric(FAKER_SERIAL_NUMBER_DIGITS))
  .attr("sport", () =>
    faker.helpers.arrayElement(["running", "cycling", "swimming"])
  )
  .attr("subSport", () =>
    faker.helpers.arrayElement(["trail", "road", "track", "indoor"])
  );
