"use strict";

const { set } = require("../app");
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws BadRequestError if job is already in database.
   * */

  static async create({ title, salary, equity, companyHandle }) {

    const result = await db.query(`
                INSERT INTO jobs (title,
                                  salary,
                                  equity,
                                  company_handle)
                VALUES ($1, $2, $3, $4)
                RETURNING
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"`, [
      title,
      salary,
      equity,
      companyHandle],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   *
   *  * Can filter on provided search filters:
   * - title (will find case-insensitive, partial matches)
   * - minSalary
   * - hasEquity (true/false)
   * */

  //TODO: FINISH THIS!
  //TODO: make schema

  static async findAll(filters = {}) {

   // const { whereParams, values } = this._sqlForGetCompanyFilter(filters);

    const jobsRes = await db.query(`
        SELECT handle,
               name,
               description,
               num_employees AS "numEmployees",
               logo_url      AS "logoUrl"
        FROM companies

        ORDER BY name`, );

    return jobsRes.rows;
  }

  /** Accepts object with GET companies search parameters, and returns valid
   *  SQL where statements and values.
   *
   * Only accepts parameters of nameLike, minEmployees, maxEmployees.
   * Returns relevant combination of:
   *    nameLike => name ILIKE $1
   *    minEmployees => num_employees >= $2
   *    maxEmployees => num_employees <= $3
   *
   * Accepts {nameLike: "value1", minEmployees: "value2", ...}
   * Returns {
   *    whereParams: [name ILIKE $1, num_employees >= $2, ...],
   *    values: [value1, value2, ]
   * }
   */

  // static _sqlForGetCompanyFilter(filterParams = {}) {

  //   let filters = [];
  //   let where = "WHERE "
  //   let whereParams = "";

  //   const nameSearch = filterParams.nameLike;
  //   if(filterParams.nameLike) filterParams.nameLike = `%${nameSearch}%`;

  //   for (let param in filterParams) {
  //     if (param === "nameLike") {
  //       filters.push(`"name" ILIKE $${filters.length + 1}`);
  //     }
  //     else if (param === "minEmployees") {
  //       filters.push(`"num_employees" >= $${filters.length + 1}`);
  //     }
  //     else if (param === "maxEmployees") {
  //       filters.push(`"num_employees" <= $${filters.length + 1}`);
  //     }
  //   }

  //   if (filters.length > 0) {
  //     whereParams = where.concat(filters.join(" AND "));
  //   }

  //   return {
  //     whereParams: whereParams,
  //     values: Object.values(filterParams),
  //   };
  // }


  /** Given an id, return data about job.
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(`
        SELECT title,
               salary,
               equity,
               company_handle AS "companyHandle",
        FROM jobs
        WHERE id = $1`, [id]);

    const company = jobRes.rows[0];

    if (!company) throw new NotFoundError(`No job: ${id}`);

    return company;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data);

    const idVarIdx = "$" + (values.length + 1);

    const querySql = `
        UPDATE jobs
        SET ${setCols}
        WHERE id = ${idVarIdx}
        RETURNING
            title,
            salary,
            equity,
            company_handle AS "companyHandle"`;

    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(`
        DELETE
        FROM id
        WHERE id = $1
        RETURNING id`, [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}


module.exports = Job;
