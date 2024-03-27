"use strict";

const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate", function () {
  test("works: data included", function () {
    const dataToUpdate = {
      "name": "Updated test Name",
      "numEmployees": 99,
      "description": "Updated test description"
    }

    const jsToSql = {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    }

    const { setCols, values} = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(setCols).toEqual(
      `"name"=$1, "num_employees"=$2, "description"=$3`);

    expect(values).toEqual([
      "Updated test Name",
      99,
      "Updated test description"]);
  });


  test("error: no data", function () {
    const dataToUpdate = {}

    const jsToSql = {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    }

    try {
      const { setCols, values} = sqlForPartialUpdate(dataToUpdate, jsToSql);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});
