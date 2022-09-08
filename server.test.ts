import supertest from "supertest"
import app from "./server";

test("GET /pastes/ returns with status success", async () => {
    const response = await supertest(app).get("/pastes/")

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
})
