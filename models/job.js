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
   * Throws BadRequestError if companyHandle is not in database.
   * */

  static async create({ title, salary, equity, companyHandle }) {

    const companyResult = await db.query(`
                SELECT handle
                FROM companies
                WHERE handle = $1`, [companyHandle]
    );

    const company = companyResult.rows[0];

    if (!company) throw new NotFoundError("CompanyHandle does not exist!");

    const result = await db.query(`
                INSERT INTO jobs (title,
                                  salary,
                                  equity,
                                  company_handle)
                VALUES ($1, $2, $3, $4)
                RETURNING
                    id,
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"`, [
      title,
      salary,
      equity,
      companyHandle]
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

  static async findAll(filters = {}) {

   const { whereParams, values } = this._sqlForJobFilter(filters);

   console.log("WHEREPARAMS: ", whereParams);

    const jobsRes = await db.query(`
        SELECT id,
               title,
               salary,
               equity,
               company_handle AS "companyHandle"
        FROM jobs
        ${whereParams}
        ORDER BY title`, [...values]);

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

  static _sqlForJobFilter(filterParams = {}) {

    let filters = [];
    let where = "WHERE "
    let whereParams = "";
    let idx = 1;

    const titleSearch = filterParams.title;
    if(filterParams.title) filterParams.title = `%${titleSearch}%`;

    for (let param in filterParams) {
      if (param === "title") {
        filters.push(`"title" ILIKE $${idx}`);
      }
      else if (param === "minSalary") {
        filters.push(`"salary" >= $${idx}`);
      }
      else if (param === "hasEquity" && filterParams.hasEquity === "true") {
        filters.push(`"equity" <> 0`);
        delete filterParams.hasEquity;
        idx--;
      }

      idx++;
    }

    if (filters.length > 0) {
      whereParams = where.concat(filters.join(" AND "));
    }

    console.log("filters: ", filters)
    console.log("filterParams: ", filterParams);

    return {
      whereParams: whereParams,
      values: Object.values(filterParams),
    };
  }


  /** Given an id, return data about job.
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(`
        SELECT id,
               title,
               salary,
               equity,
               company_handle AS "companyHandle"
        FROM jobs
        WHERE id = $1`, [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
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
            id,
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
        FROM jobs
        WHERE id = $1
        RETURNING id`, [id]);

    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}


module.exports = Job;
