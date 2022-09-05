import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false }
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()) //add CORS support to each following route handler

const client = new Client('pasteBinDb');
client.connect();

app.get("/pastes/", async (req, res) => {
  const text = "select * from paste_list order by date desc limit 10";
  const dbres = await client.query(text);
  res.status(200).json(dbres.rows);
});

app.post("/pastes/", async (req, res) => {
  const { content, title } = req.body;
  if (typeof content === "string"  && typeof title  === "string") {
    const values =  [title, content];
    const text = "insert into paste_list (title, content) values ($1,$2) returning *";
    const newPost = await client.query(text, values);
    res.status(200).json({ 
      status: "success",
      data : newPost
});
  }
  else if (typeof content === "string" ) {
    const values =  [content];
    const text = "insert into paste_list (content) values ($1) returning *";
    const newPost = await client.query(text, values);
    res.status(200).json({ 
      status: "success",
      data : newPost.rows
});
  }
  else {
    res.status(400).json ({
      status: "Fail",
      message: "The content of paste has to be a string"
    })
  }
});


//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw 'Missing PORT environment variable.  Set it in .env file.';
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
