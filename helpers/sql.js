"use strict";

const { BadRequestError } = require("../expressError");

/**
 * Takes data to update (object) & a javascript POJO
 *
 * the POJO contains {jsName: sql_name, ... }
 * which allows us to use SQL names in the query
 *
 * returns all columns with SQL names/indexed arguments as keys,
 * and data values as variables:
 *
 * { setCols: ['"first_name"=$1', '"age"=$2'],
 *   values: "Aliya", "32"] };
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql={}) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
