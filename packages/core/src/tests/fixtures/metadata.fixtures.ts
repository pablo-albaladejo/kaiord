import { faker } from "@faker-js/faker";
import { Factory } from "rosie";

import { FAKER_SERIAL_NUMBER_DIGITS } from "../../test-utils/tolerance-constants";

export const buildMetadata = new Factory()
  .attr("created", () => faker.date.recent().toISOString())
  .attr("manufacturer", () => faker.company.name().toLowerCase())
  .attr("product", () => faker.commerce.productName())
  .attr("serialNumber", () => faker.string.numeric(FAKER_SERIAL_NUMBER_DIGITS))
  .attr("sport", () =>
    faker.helpers.arrayElement(["running", "cycling", "swimming"])
  )
  .attr("subSport", () =>
    faker.helpers.arrayElement(["trail", "road", "track", "indoor"])
  );
