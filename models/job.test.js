"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError.js");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new",
    salary: 100,
    equity: "0",
    companyHandle: "c3",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual(
      {
        id: expect.any(Number),
        ...newJob
      }
    );

    const result = await db.query(
      `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'new'`)
    expect(result.rows).toEqual([
      {
        title: "new",
        salary: 100,
        equity: "0",
        company_handle: "c3"
      },
    ]);
  });

  test("not found if no such company handle", async function () {
    const jobNoCompany = {
      title: "new",
      salary: 100,
      equity: "0",
      companyHandle: "nope",
    }

    try {
      await Job.create(jobNoCompany);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: 1,
        title: "J1",
        salary: 100,
        equity: "0",
        companyHandle: "c1"
      },
      {
        id: 2,
        title: "J2",
        salary: 200,
        equity: "0.050",
        companyHandle: "c2"
      },
      {
        id: 3,
        title: "J3",
        salary: 300,
        equity: "0.005",
        companyHandle: "c3"
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(1);
    expect(job).toEqual({
      id: 1,
      title: "J1",
      salary: 100,
      equity: "0",
      companyHandle: "c1"
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(99999);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** findFiltered */

// describe("findFiltered", function () {
//   test("works: filter with nameLike", async function () {
// let companies = await Job.findAll({nameLike: "c1"});
//     expect(companies).toEqual([
//       {
//         handle: "c1",
//         name: "C1",
//         description: "Desc1",
//         numEmployees: 1,
//         logoUrl: "http://c1.img",
//       }
//     ]);
//   });

//   test("works: filter with minEmployees", async function () {
// let companies = await Job.findAll({minEmployees: 3});
//     expect(companies).toEqual([
//       {
//         handle: "c3",
//         name: "C3",
//         description: "Desc3",
//         numEmployees: 3,
//         logoUrl: "http://c3.img",
//       }
//     ]);
//   });

//   test("works: filter with maxEmployees", async function () {
// let companies = await Job.findAll({maxEmployees: 1});
//     expect(companies).toEqual([
//       {
//         handle: "c1",
//         name: "C1",
//         description: "Desc1",
//         numEmployees: 1,
//         logoUrl: "http://c1.img",
//       }
//     ]);
//   });

// test("works: filter with min & maxEmployees", async function () {
//   let companies = await Job.findAll({
//         minEmployees: 1,
//         maxEmployees: 2 });
//     expect(companies).toEqual([
//       {
//         handle: "c1",
//         name: "C1",
//         description: "Desc1",
//         numEmployees: 1,
//         logoUrl: "http://c1.img",
//       },
//       {
//         handle: "c2",
//         name: "C2",
//         description: "Desc2",
//         numEmployees: 2,
//         logoUrl: "http://c2.img",
//       }
//     ]);
//   });

// test("no results", async function () {
//     const result = await Job.findAll({minEmployees: 10});
//     expect(result).toEqual([]);
//   });
// });

/************************************** sql builder */

// describe("_sqlForGetCompanyFilter", function () {
//   test("works: nameLike included", function () {
//     const filterParams = {
//       "nameLike": "c1",
//     }

//     const result = Job._sqlForGetCompanyFilter(filterParams);

//     expect(result).toEqual(
//       {
//         whereParams: `WHERE "name" ILIKE $1`,
//         values: ["%c1%"]
//       }
//     );
//   });

//   test("works: min & max employees included", function () {
//     const filterParams = {
//       "minEmployees": 1,
//       "maxEmployees": 2
//     }

//     const result = Job._sqlForGetCompanyFilter(filterParams);

//     expect(result).toEqual(
//       {
//         "whereParams": `WHERE "num_employees" >= $1 AND "num_employees" <= $2`,
//         "values": [1, 2]
//       }
//     );
//   });

//   test("no data", function () {
//     const result = Job._sqlForGetCompanyFilter();

//     expect(result).toEqual({
//       "values": [],
//       "whereParams": ""
//     });
//   });

//   test("works: max employees included", function () {
//     const filterParams = {
//       "maxEmployees": 2
//     }

//     const result = Job._sqlForGetCompanyFilter(filterParams);

//     expect(result).toEqual(
//       {
//         "whereParams": `WHERE "num_employees" <= $1`,
//         "values": [2]
//       }
//     );
//   });
// });


/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New",
    salary: 10000,
    equity: "0.999"
  };

  test("works", async function () {
    let job = await Job.update(1, updateData);
    expect(job).toEqual({
      id: 1,
      ...updateData,
      companyHandle: "c1"
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = '1'`);
    expect(result.rows).toEqual([{
      id: 1,
      title: "New",
      salary: 10000,
      equity: "0.999",
      company_handle: "c1"
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "New",
      salary: null,
      equity: null
    };

    let job = await Job.update(1, updateDataSetNulls);
    expect(job).toEqual({
      id: 1,
      ...updateDataSetNulls,
      companyHandle: 'c1'
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = '1'`);
    expect(result.rows).toEqual([{
      id: 1,
      title: "New",
      salary: null,
      equity: null,
      company_handle: "c1"
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(99999, updateData);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(1, {});
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(1);
    const res = await db.query(
      "SELECT id FROM jobs WHERE id=1");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(99999);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
