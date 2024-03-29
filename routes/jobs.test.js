"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  uAdminToken
} = require("./_testCommon");
const { NotFoundError } = require("../expressError");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "new",
    salary: 100,
    equity: "0",
    companyHandle: "c1",
  };

  test("not ok for non-admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("ok for admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${uAdminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        ...newJob
      }
    });
  });

  test("bad request with missing data for admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new"
      })
      .set("authorization", `Bearer ${uAdminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("unauth with missing data for non-admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new"
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with invalid company for admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new",
        salary: 100,
        equity: "0",
        companyHandle: "c99",
      })
      .set("authorization", `Bearer ${uAdminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("unauth with invalid company for non-admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new",
        salary: 100,
        equity: "0",
        companyHandle: "c99",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});

// /************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
      [
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
      ],
    });
  });

  test("ok for title filter", async function () {
    const resp = (await request(app).get("/jobs").query({title:"J1"}));
    expect(resp.statusCode).toEqual(200);
    console.log("resp.body: ", resp.body)
    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: 1,
            title: "J1",
            salary: 100,
            equity: "0",
            companyHandle: "c1",
          }
        ]
    });
  });

  test("ok for minSalary filter", async function () {
    const resp = await request(app).get("/jobs").query({minSalary:200});
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs:
        [
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
          }
        ]
    });
  });

  test("ok for equities = true filter", async function () {
    const resp = await request(app).get("/jobs").query({hasEquity:"true"});
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs:
        [
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
          }
        ]
    });
  });

  test("fail for non-integer minSalary", async function () {
    const resp = await request(app).get("/jobs").query({minSalary:3.5});
    expect(resp.statusCode).toEqual(400);
  });

  test("ok for hasEquity & minSalary filter", async function () {
    const resp = await request(app).get("/jobs").query({hasEquity:"true", minSalary:200});
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs:
        [
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
          }
        ]
    });
  });

  test("not ok for minSalary < 0 filter", async function () {
    const resp = await request(app).get("/jobs").query({minSalary:-2});
    expect(resp.statusCode).toEqual(400);
  });

  test("no search results yields empty array", async function () {
    const resp = await request(app).get("/jobs").query({title:"poppyseed"});
    expect(resp.body).toEqual({ jobs: [] });
  });

  test("not ok for invalid query parameter 'apple = 1'", async function () {
    const resp = await request(app).get("/jobs").query({apple:1});
    expect(resp.statusCode).toEqual(400);
  });

});

// /************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/1`);
    expect(resp.body).toEqual({
      job: {
        id: 1,
        title: "J1",
        salary: 100,
        equity: "0",
        companyHandle: "c1"
      },
    });
  });

  test("not found for no such company", async function () {
    const resp = await request(app).get(`/jobs/99999999`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request for non-integer id", async function () {
    const resp = await request(app).get(`/jobs/nope`);
    expect(resp.statusCode).toEqual(400);
  });
});

// /************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:handle", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        title: "New",
      })
      .set("authorization", `Bearer ${uAdminToken}`);
    expect(resp.body).toEqual({
      job: {
        id: 1,
        title: "New",
        salary: 100,
        equity: "0",
        companyHandle: "c1"
      },
    });
  });

  test("unauth if non-admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        name: "C1-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401)
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/jobs/c1`)
      .send({
        name: "C1-new",
      });
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth on no such job", async function () {
    const resp = await request(app)
      .patch(`/jobs/nope`)
      .send({
        name: "new nope",
      })
      .set("authorization", `Bearer ${uAdminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on handle change attempt for admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        handle: "c1-new",
      })
      .set("authorization", `Bearer ${uAdminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data for admin ", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        logoUrl: "not-a-url",
      })
      .set("authorization", `Bearer ${uAdminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

// /************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .delete(`/jobs/1`)
      .set("authorization", `Bearer ${uAdminToken}`);
    expect(resp.body).toEqual({ deleted: "1" });
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
      .delete(`/jobs/1`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/jobs/1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company for admin", async function () {
    const resp = await request(app)
      .delete(`/jobs/99999999`)
      .set("authorization", `Bearer ${uAdminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request for non-integer id for admin", async function () {
    const resp = await request(app)
      .delete(`/jobs/nope`)
      .set("authorization", `Bearer ${uAdminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("unauth for non-integer id for non-admin", async function () {
    const resp = await request(app)
      .delete(`/jobs/nope`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});
