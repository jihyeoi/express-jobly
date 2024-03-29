"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Company = require("../models/company");
const Job = require("../models/job");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");
const companyFiltersSchema = require("../schemas/companyFilters.json");
const jobNewSchema = require("../schemas/jobNew.json");

const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: login & isAdmin
 */

router.post("/", ensureAdmin, async function (req, res, next) {
  const validator = jsonschema.validate(
    req.body,
    jobNewSchema,
    { required: true }
  );
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const job = await Job.create(req.body);
  return res.status(201).json({ job });
});

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {

  // must make a copy of req.query to convert between types
  // const query = Number(req.query.id);

  // if (query.minEmployees !== undefined) query.minEmployees = +query.minEmployees
  // if (query.maxEmployees !== undefined) query.maxEmployees = +query.maxEmployees

  // const validator = jsonschema.validate(
  //   query,
  //   companyFiltersSchema,
  //   { required: true }
  // );

  // if (!validator.valid) {
  //   const errs = validator.errors.map(e => e.stack);
  //   throw new BadRequestError(errs);
  // }

  const jobs = await Job.findAll();
  return res.json({ jobs });
});

/** GET /[id]  =>  { job }
 *
 *   job is { id, title, salary, equity, companyHandle }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  if (!Number.isInteger(Number(req.params.id)))
    throw new BadRequestError("ID must be an integer!");

  const job = await Job.get(req.params.id);
  return res.json({ job });
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: login & isAdmin
 */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
  const validator = jsonschema.validate(
    req.body,
    companyUpdateSchema,
    { required: true }
  );
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const company = await Company.update(req.params.handle, req.body);
  return res.json({ company });
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: logged in & isAdmin
 */

router.delete("/:id", ensureAdmin, async function (req, res, next) {
  if (!Number.isInteger(Number(req.params.id)))
    throw new BadRequestError("ID must be an integer!");

  await Job.remove(req.params.id);
  return res.json({ deleted: req.params.id });
});


module.exports = router;
